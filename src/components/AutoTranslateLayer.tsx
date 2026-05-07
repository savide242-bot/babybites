import { useEffect, useRef, ReactNode } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';

/**
 * Runtime DOM auto-translation layer.
 * When language === 'es', walks the DOM, finds English text nodes + key
 * attributes, batches them to the translate-content edge function, and swaps
 * the content in place. Caches translations in localStorage so subsequent
 * visits are instant.
 *
 * Designed to be invisible at runtime: zero overhead in English, no flicker
 * once cached, and resilient to React re-renders (uses MutationObserver).
 */

const CACHE_KEY = 'auto_tx_es_v1';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'SVG', 'PATH']);
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'] as const;
const MAX_CACHE_ENTRIES = 5000;

const isMostlyAlpha = (s: string) => /[a-zA-Z]{2,}/.test(s);
const looksLikeUrl = (s: string) => /^https?:\/\//i.test(s) || /^[\w.-]+@[\w.-]+/.test(s);
const isSkippable = (s: string) => {
  const t = s.trim();
  if (t.length < 2) return true;
  if (!isMostlyAlpha(t)) return true;
  if (looksLikeUrl(t)) return true;
  if (/^\d[\d\s.,:%/-]*$/.test(t)) return true;
  return false;
};

const loadCache = (): Map<string, string> => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return new Map();
    return new Map(Object.entries(JSON.parse(raw)));
  } catch { return new Map(); }
};
const saveCache = (cache: Map<string, string>) => {
  try {
    // LRU-trim
    if (cache.size > MAX_CACHE_ENTRIES) {
      const arr = Array.from(cache.entries()).slice(-MAX_CACHE_ENTRIES);
      cache = new Map(arr);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(cache)));
  } catch { /* quota */ }
};

const hasSkippableAncestor = (node: Node): boolean => {
  let p: Node | null = node.parentNode;
  while (p && p instanceof Element) {
    if (SKIP_TAGS.has(p.tagName)) return true;
    if (p.hasAttribute('data-no-translate')) return true;
    if (p.getAttribute('contenteditable') === 'true') return true;
    p = p.parentNode;
  }
  return false;
};

interface PendingNode {
  type: 'text';
  node: Text;
  original: string;
}
interface PendingAttr {
  type: 'attr';
  el: Element;
  attr: string;
  original: string;
}
type Pending = PendingNode | PendingAttr;

const AutoTranslateLayer = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage();
  const cacheRef = useRef<Map<string, string>>(new Map());
  const inflightRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<Pending[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (language !== 'es') {
      observerRef.current?.disconnect();
      observerRef.current = null;
      return;
    }

    cacheRef.current = loadCache();

    const applyFromCache = (text: string): string | null => {
      const key = text.trim();
      const tx = cacheRef.current.get(key);
      if (!tx) return null;
      // preserve leading/trailing whitespace
      const lead = text.match(/^\s*/)?.[0] ?? '';
      const trail = text.match(/\s*$/)?.[0] ?? '';
      return lead + tx + trail;
    };

    const queue = (item: Pending) => {
      const key = item.original.trim();
      if (!key) return;
      if (inflightRef.current.has(key)) return;
      queueRef.current.push(item);
      inflightRef.current.add(key);
    };

    const flush = async () => {
      flushTimerRef.current = null;
      const items = queueRef.current;
      queueRef.current = [];
      if (items.length === 0) return;

      // Dedup by trimmed key
      const uniq = new Map<string, string>();
      items.forEach(i => uniq.set(i.original.trim(), i.original.trim()));
      const payload = Array.from(uniq.keys()).map(k => ({ key: `auto:${k.slice(0, 200)}`, text: k }));

      try {
        const { data, error } = await supabase.functions.invoke('translate-content', {
          body: { items: payload, targetLanguage: 'es' },
        });
        if (error) throw error;
        const translations: Record<string, string> = data?.translations ?? {};
        // Map back: payload key -> original text
        const txByOriginal = new Map<string, string>();
        payload.forEach(p => {
          const tx = translations[p.key];
          if (tx) {
            txByOriginal.set(p.text, tx);
            cacheRef.current.set(p.text, tx);
          }
        });
        saveCache(cacheRef.current);

        // Apply
        items.forEach(item => {
          const key = item.original.trim();
          const tx = txByOriginal.get(key) ?? cacheRef.current.get(key);
          if (!tx) return;
          const lead = item.original.match(/^\s*/)?.[0] ?? '';
          const trail = item.original.match(/\s*$/)?.[0] ?? '';
          const final = lead + tx + trail;
          if (item.type === 'text') {
            if (item.node.textContent === item.original) item.node.textContent = final;
          } else {
            if (item.el.getAttribute(item.attr) === item.original) item.el.setAttribute(item.attr, final);
          }
        });
      } catch (e) {
        console.warn('[auto-translate] batch failed', e);
      } finally {
        items.forEach(i => inflightRef.current.delete(i.original.trim()));
      }
    };

    const scheduleFlush = () => {
      if (flushTimerRef.current != null) return;
      flushTimerRef.current = window.setTimeout(flush, 250);
    };

    const processTextNode = (node: Text) => {
      const text = node.textContent;
      if (!text || isSkippable(text)) return;
      if (hasSkippableAncestor(node)) return;
      const cached = applyFromCache(text);
      if (cached !== null) {
        if (node.textContent !== cached) node.textContent = cached;
        return;
      }
      queue({ type: 'text', node, original: text });
      scheduleFlush();
    };

    const processAttr = (el: Element, attr: string) => {
      const val = el.getAttribute(attr);
      if (!val || isSkippable(val)) return;
      if (el.hasAttribute('data-no-translate')) return;
      const cached = applyFromCache(val);
      if (cached !== null) {
        if (el.getAttribute(attr) !== cached) el.setAttribute(attr, cached);
        return;
      }
      queue({ type: 'attr', el, attr, original: val });
      scheduleFlush();
    };

    const scan = (root: Node) => {
      // Text nodes
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n: Node | null = walker.nextNode();
      while (n) {
        processTextNode(n as Text);
        n = walker.nextNode();
      }
      // Attributes
      if (root instanceof Element) {
        for (const attr of ATTRS) {
          if (root.hasAttribute(attr)) processAttr(root, attr);
          root.querySelectorAll(`[${attr}]`).forEach(el => processAttr(el, attr));
        }
      } else if (root instanceof Document || root === document.body) {
        for (const attr of ATTRS) {
          document.querySelectorAll(`[${attr}]`).forEach(el => processAttr(el, attr));
        }
      }
    };

    // Initial scan (let DOM settle a tick)
    const initial = window.setTimeout(() => scan(document.body), 100);

    // Observe future mutations
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
          processTextNode(m.target as Text);
        } else if (m.type === 'attributes' && m.target instanceof Element && m.attributeName) {
          if ((ATTRS as readonly string[]).includes(m.attributeName)) {
            processAttr(m.target, m.attributeName);
          }
        } else if (m.type === 'childList') {
          m.addedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) processTextNode(node as Text);
            else if (node.nodeType === Node.ELEMENT_NODE) scan(node);
          });
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS as unknown as string[],
    });
    observerRef.current = observer;

    return () => {
      window.clearTimeout(initial);
      if (flushTimerRef.current != null) window.clearTimeout(flushTimerRef.current);
      observer.disconnect();
      observerRef.current = null;
    };
  }, [language]);

  return <>{children}</>;
};

export default AutoTranslateLayer;
