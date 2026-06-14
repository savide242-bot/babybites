import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VideoRecipe {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  ageLabel: string;
  minAgeMonths: number;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: string;
  difficulty: string;
  videoUrl: string;
  posterUrl: string;
  videoDuration: string;
  ingredients: string[];
  steps: string[];
  storage: string;
  expertTip: string;
  nutritionHighlights: string[];
  allergenNote?: string | null;
}

const mapRow = (r: any): VideoRecipe => ({
  id: r.id,
  title: r.title,
  shortTitle: r.short_title,
  description: r.description,
  ageLabel: r.age_label,
  minAgeMonths: r.min_age_months,
  prepTime: r.prep_time,
  cookTime: r.cook_time,
  totalTime: r.total_time,
  servings: r.servings,
  difficulty: r.difficulty,
  videoUrl: r.video_url,
  posterUrl: r.poster_url,
  videoDuration: r.video_duration,
  ingredients: r.ingredients || [],
  steps: r.steps || [],
  storage: r.storage,
  expertTip: r.expert_tip,
  nutritionHighlights: r.nutrition_highlights || [],
  allergenNote: r.allergen_note,
});

export const useVideoRecipes = () => {
  const [videoRecipes, setVideoRecipes] = useState<VideoRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('video_recipes')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (!mounted) return;
      if (!error && data) setVideoRecipes(data.map(mapRow));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return { videoRecipes, loading };
};

export const useVideoRecipe = (id: string | undefined) => {
  const [recipe, setRecipe] = useState<VideoRecipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('video_recipes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!mounted) return;
      if (!error && data) {
        setRecipe(mapRow(data));
        // Fire-and-forget view count increment
        supabase.from('video_recipes').update({ views_count: (data.views_count || 0) + 1 }).eq('id', id).then();
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id]);

  return { recipe, loading };
};
