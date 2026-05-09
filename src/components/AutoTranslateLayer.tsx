import { useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';

/**
 * Runtime DOM auto-translation layer.
 * When language === 'es', walks the DOM, finds English text nodes + key
 * attributes, batches them to the translate-content edge function, and swaps
 * the content in place. Caches translations in localStorage so subsequent
 * visits are instant.
 *
 * Reads from TWO caches:
 *   - auto_tx_es_v1   : raw text → translation (DOM observer)
 *   - i18n_cache_v1_es: pre-translated UI dictionary (from useLanguage)
 *     Mapped by english source text so it can be applied to ANY DOM text node.
 */

const CACHE_KEY = 'auto_tx_es_v1';
const UI_CACHE_KEY = 'i18n_cache_v1_es';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'SVG', 'PATH']);
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'] as const;
const MAX_CACHE_ENTRIES = 8000;
const FLUSH_DELAY_MS = 350;
const FLUSH_THRESHOLD = 60;
const SCAN_DEBOUNCE_MS = 250;

// Lightweight idle scheduler — keeps main thread free on low-end phones
const ric: (cb: () => void) => number = (cb) => {
  const w = window as any;
  if (typeof w.requestIdleCallback === 'function') {
    return w.requestIdleCallback(cb, { timeout: 800 });
  }
  return window.setTimeout(cb, 1);
};

const isMostlyAlpha = (s: string) => /[a-zA-Z]{2,}/.test(s);
const looksLikeUrl = (s: string) => /^https?:\/\//i.test(s) || /^[\w.-]+@[\w.-]+/.test(s);
const isSkippable = (s: string) => {
  const t = s.trim();
  if (t.length < 1) return true;
  if (!isMostlyAlpha(t)) return true;
  if (looksLikeUrl(t)) return true;
  if (/^\d[\d\s.,:%/-]*$/.test(t)) return true;
  return false;
};

const loadCache = (key: string): Map<string, string> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw);
    return new Map(Object.entries(parsed));
  } catch { return new Map(); }
};
const saveCache = (cache: Map<string, string>) => {
  try {
    if (cache.size > MAX_CACHE_ENTRIES) {
      const arr = Array.from(cache.entries()).slice(-MAX_CACHE_ENTRIES);
      cache = new Map(arr);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(cache)));
  } catch { /* quota */ }
};

// Build a reverse map (english source text → spanish) from the UI dictionary cache,
// which is keyed by translation key. We need the originals from useLanguage's enTranslations.
// To keep this layer decoupled, we read a sibling cache `i18n_source_es` that useLanguage
// writes containing { englishText: spanishText } for cross-application.
const SOURCE_MAP_KEY = 'i18n_source_map_es';
const loadSourceMap = (): Map<string, string> => loadCache(SOURCE_MAP_KEY);

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

interface PendingNode { type: 'text'; node: Text; original: string; }
interface PendingAttr { type: 'attr'; el: Element; attr: string; original: string; }
type Pending = PendingNode | PendingAttr;

const AutoTranslateLayer = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage();
  const location = useLocation();
  const cacheRef = useRef<Map<string, string>>(new Map());
  const sourceMapRef = useRef<Map<string, string>>(new Map());
  const inflightRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<Pending[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const scanFnRef = useRef<((root: Node) => void) | null>(null);

  useEffect(() => {
    if (language !== 'es') {
      observerRef.current?.disconnect();
      observerRef.current = null;
      return;
    }

    cacheRef.current = loadCache(CACHE_KEY);
    sourceMapRef.current = loadSourceMap();

    // Listen for UI dictionary updates so newly-translated strings get applied immediately
    const onStorage = (e: StorageEvent) => {
      if (e.key === SOURCE_MAP_KEY) {
        sourceMapRef.current = loadSourceMap();
        scanFnRef.current?.(document.body);
      }
    };
    window.addEventListener('storage', onStorage);
    // Same-tab notifications (custom event)
    const onLocalUpdate = () => {
      sourceMapRef.current = loadSourceMap();
      scanFnRef.current?.(document.body);
    };
    window.addEventListener('i18n-source-updated', onLocalUpdate);

    const lookup = (text: string): string | undefined => {
      const key = text.trim();
      return cacheRef.current.get(key) ?? sourceMapRef.current.get(key);
    };

    const applyFromCache = (text: string): string | null => {
      const tx = lookup(text);
      if (!tx) return null;
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
      if (queueRef.current.length >= FLUSH_THRESHOLD) {
        if (flushTimerRef.current != null) {
          window.clearTimeout(flushTimerRef.current);
          flushTimerRef.current = null;
        }
        flush();
      }
    };

    const flush = async () => {
      flushTimerRef.current = null;
      const items = queueRef.current;
      queueRef.current = [];
      if (items.length === 0) return;

      const uniq = new Map<string, string>();
      items.forEach(i => uniq.set(i.original.trim(), i.original.trim()));
      const payload = Array.from(uniq.keys()).map(k => ({ key: `auto:${k.slice(0, 200)}`, text: k }));

      try {
        const { data, error } = await supabase.functions.invoke('translate-content', {
          body: { items: payload, targetLanguage: 'es' },
        });
        if (error) throw error;
        const translations: Record<string, string> = data?.translations ?? {};
        const txByOriginal = new Map<string, string>();
        payload.forEach(p => {
          const tx = translations[p.key];
          if (tx) {
            txByOriginal.set(p.text, tx);
            cacheRef.current.set(p.text, tx);
          }
        });
        saveCache(cacheRef.current);

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
      flushTimerRef.current = window.setTimeout(flush, FLUSH_DELAY_MS);
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
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n: Node | null = walker.nextNode();
      while (n) {
        processTextNode(n as Text);
        n = walker.nextNode();
      }
      if (root instanceof Element) {
        for (const attr of ATTRS) {
          if (root.hasAttribute(attr)) processAttr(root, attr);
          root.querySelectorAll(`[${attr}]`).forEach(el => processAttr(el, attr));
        }
      } else {
        for (const attr of ATTRS) {
          document.querySelectorAll(`[${attr}]`).forEach(el => processAttr(el, attr));
        }
      }
    };
    scanFnRef.current = scan;

    const initial = window.setTimeout(() => scan(document.body), 50);

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
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('i18n-source-updated', onLocalUpdate);
    };
  }, [language]);

  // Re-scan on route change (catch new page content quickly)
  useEffect(() => {
    if (language !== 'es') return;
    const t1 = window.setTimeout(() => scanFnRef.current?.(document.body), 100);
    const t2 = window.setTimeout(() => scanFnRef.current?.(document.body), 600);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [location.pathname, language]);

  return <>{children}</>;
};

export default AutoTranslateLayer;
