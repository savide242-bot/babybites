import { useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * LIGHTWEIGHT runtime DOM translator.
 *
 * Previous version used a MutationObserver scanning the entire DOM on every
 * change — that caused jank on low-end phones. This version is much lighter:
 *
 * - No MutationObserver
 * - Runs only on route change, inside requestIdleCallback
 * - Only swaps text/attributes that already have a translation in localStorage
 *   (filled by the background recipe pre-warmer + UI dictionary)
 * - Never calls the network here. New translations are produced in the
 *   background by `useRecipePrewarmTranslations` and `useLanguage`.
 */

const CACHE_KEY = 'auto_tx_es_v1';
const SOURCE_MAP_KEY = 'i18n_source_map_es';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'SVG', 'PATH']);
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'] as const;

const ric: (cb: () => void) => number = (cb) => {
  const w = window as any;
  if (typeof w.requestIdleCallback === 'function') {
    return w.requestIdleCallback(cb, { timeout: 1500 });
  }
  return window.setTimeout(cb, 1);
};

const loadMap = (key: string): Map<string, string> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    return new Map(Object.entries(JSON.parse(raw)));
  } catch { return new Map(); }
};

const hasSkippableAncestor = (node: Node): boolean => {
  let p: Node | null = node.parentNode;
  while (p && p instanceof Element) {
    if (SKIP_TAGS.has(p.tagName)) return true;
    if (p.hasAttribute('data-no-translate')) return true;
    p = p.parentNode;
  }
  return false;
};

const isMostlyAlpha = (s: string) => /[a-zA-Z]{2,}/.test(s);

const AutoTranslateLayer = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage();
  const location = useLocation();
  const cacheRef = useRef<Map<string, string>>(new Map());

  // Reload caches whenever language flips or background prewarm fires
  useEffect(() => {
    if (language !== 'es') return;
    const reload = () => {
      const dom = loadMap(CACHE_KEY);
      const ui = loadMap(SOURCE_MAP_KEY);
      // merge (DOM cache takes precedence, but UI map fills gaps)
      ui.forEach((v, k) => { if (!dom.has(k)) dom.set(k, v); });
      cacheRef.current = dom;
    };
    reload();
    const onUpdate = () => reload();
    window.addEventListener('i18n-source-updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('i18n-source-updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [language]);

  // Apply cached translations on each route change (idle)
  useEffect(() => {
    if (language !== 'es') return;
    const cache = cacheRef.current;
    if (cache.size === 0) return;

    const apply = () => {
      try {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n: Node | null = walker.nextNode();
        let count = 0;
        while (n && count < 5000) {
          const text = n.textContent;
          if (text) {
            const trimmed = text.trim();
            if (trimmed.length > 0 && isMostlyAlpha(trimmed) && !hasSkippableAncestor(n)) {
              const tx = cache.get(trimmed);
              if (tx) {
                const lead = text.match(/^\s*/)?.[0] ?? '';
                const trail = text.match(/\s*$/)?.[0] ?? '';
                const final = lead + tx + trail;
                if (n.textContent !== final) n.textContent = final;
              }
            }
          }
          n = walker.nextNode();
          count++;
        }
        for (const attr of ATTRS) {
          document.querySelectorAll(`[${attr}]`).forEach(el => {
            if (el.hasAttribute('data-no-translate')) return;
            const v = el.getAttribute(attr);
            if (!v) return;
            const tx = cache.get(v.trim());
            if (tx && el.getAttribute(attr) !== tx) el.setAttribute(attr, tx);
          });
        }
      } catch {}
    };

    const t1 = window.setTimeout(() => ric(apply), 200);
    const t2 = window.setTimeout(() => ric(apply), 1200);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [location.pathname, language]);

  return <>{children}</>;
};

export default AutoTranslateLayer;
