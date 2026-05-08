import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from './useLanguage';

/**
 * Translates a list of {key, text} items to the active language.
 * - In English, returns the originals immediately.
 * - In Spanish, returns originals first, then swaps to translations once they arrive.
 *
 * Use stable `key` strings (e.g. `recipe:42:title`) so caching works.
 */
export function useTranslatedContent(items: { key: string; text: string }[] | null | undefined) {
  const { language, translateMany } = useLanguage();
  const safeItems = items ?? [];

  // Stable signature for dependency
  const signature = useMemo(
    () => safeItems.map(i => i.key).join('|') + ':' + language,
    [safeItems, language]
  );

  const initial = useMemo(() => {
    const map: Record<string, string> = {};
    safeItems.forEach(i => map[i.key] = i.text);
    return map;
  }, [signature]);

  const [map, setMap] = useState<Record<string, string>>(initial);
  const [loading, setLoading] = useState(language !== 'en' && safeItems.length > 0);

  useEffect(() => {
    setMap(initial);
    if (language === 'en' || safeItems.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    translateMany(safeItems).then(res => {
      if (cancelled) return;
      setMap(prev => ({ ...prev, ...res }));
      setLoading(false);
      // Also feed the DOM auto-translate source map so identical strings
      // appearing anywhere else (and in any future render) translate instantly.
      try {
        const raw = localStorage.getItem('i18n_source_map_es');
        const existing = raw ? JSON.parse(raw) : {};
        let changed = false;
        safeItems.forEach(it => {
          const tx = res[it.key];
          if (tx && it.text && existing[it.text] !== tx) {
            existing[it.text] = tx;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('i18n_source_map_es', JSON.stringify(existing));
          window.dispatchEvent(new Event('i18n-source-updated'));
        }
      } catch {}
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { map, loading, get: (key: string) => map[key] ?? '' };
}
