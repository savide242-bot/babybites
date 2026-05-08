import { useEffect, useRef } from 'react';
import { useLanguage } from './useLanguage';
import { recipes } from '@/data/recipes';
import { supabase } from '@/integrations/supabase/client';

/**
 * One-shot background pre-warmer: when the user picks Spanish, translate ALL
 * recipe titles + descriptions in the background and persist to the
 * content_translations DB cache (via the edge function). After this completes
 * once per language, every recipe screen renders instantly in Spanish.
 *
 * Idempotent: marks completion in localStorage, skips if already done.
 */
const PREWARM_KEY = 'recipes_prewarm_es_v1';
const BATCH = 50;

export const useRecipePrewarmTranslations = () => {
  const { language } = useLanguage();
  const startedRef = useRef(false);

  useEffect(() => {
    if (language !== 'es') return;
    if (startedRef.current) return;
    if (localStorage.getItem(PREWARM_KEY) === 'done') return;
    startedRef.current = true;

    const items: { key: string; text: string }[] = [];
    for (const r of recipes) {
      if (r.title) items.push({ key: `recipe:${r.id}:title`, text: r.title });
      if (r.description) items.push({ key: `recipe:${r.id}:description`, text: r.description });
    }

    let cancelled = false;

    (async () => {
      try {
        for (let i = 0; i < items.length; i += BATCH) {
          if (cancelled) return;
          const chunk = items.slice(i, i + BATCH);
          await supabase.functions.invoke('translate-content', {
            body: { items: chunk, targetLanguage: 'es' },
          });
          // gentle pacing — avoid hammering rate limits
          await new Promise(r => setTimeout(r, 400));
        }
        localStorage.setItem(PREWARM_KEY, 'done');
        console.log('[recipes prewarm] complete');
      } catch (e) {
        console.warn('[recipes prewarm] failed', e);
      }
    })();

    return () => { cancelled = true; };
  }, [language]);
};
