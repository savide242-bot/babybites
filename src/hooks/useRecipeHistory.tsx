import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { recipes } from '@/data/recipes';

export interface RecipeView {
  recipe_id: string;
  viewed_at: string;
  view_count: number;
}

export const useRecipeHistory = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecipeView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentlyViewed = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get unique recipe views with their latest timestamp and count
      const { data, error } = await supabase
        .from('recipe_views')
        .select('recipe_id, viewed_at')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group by recipe_id and get the most recent view + count
      const viewMap = new Map<string, { viewed_at: string; count: number }>();
      
      data?.forEach(view => {
        const existing = viewMap.get(view.recipe_id);
        if (!existing) {
          viewMap.set(view.recipe_id, { viewed_at: view.viewed_at, count: 1 });
        } else {
          existing.count += 1;
        }
      });

      // Convert to array and sort by most recent view
      const recentViews: RecipeView[] = Array.from(viewMap.entries())
        .map(([recipe_id, info]) => ({
          recipe_id,
          viewed_at: info.viewed_at,
          view_count: info.count,
        }))
        .sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime())
        .slice(0, 6); // Show only 6 most recent

      setRecentlyViewed(recentViews);
    } catch (error) {
      console.error('Error fetching recipe history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  const trackRecipeView = useCallback(async (recipeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('recipe_views')
        .insert({
          user_id: user.id,
          recipe_id: recipeId,
        });

      if (error) throw error;

      // Refresh the recently viewed list
      fetchRecentlyViewed();
    } catch (error) {
      console.error('Error tracking recipe view:', error);
    }
  }, [fetchRecentlyViewed]);

  const getMostViewed = useCallback(() => {
    return [...recentlyViewed]
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 3);
  }, [recentlyViewed]);

  const getRecentRecipes = useCallback(() => {
    return recentlyViewed
      .map(view => recipes.find(r => r.id === view.recipe_id))
      .filter(Boolean);
  }, [recentlyViewed]);

  return {
    recentlyViewed,
    loading,
    trackRecipeView,
    getMostViewed,
    getRecentRecipes,
    refetch: fetchRecentlyViewed,
  };
};
