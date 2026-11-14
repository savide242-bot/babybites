import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CACHE_KEY = 'babybites_favorite_recipes_cache';

const getInitialFavorites = (): Set<string> => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Set<string>>(getInitialFavorites);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return;
      }

      const { data, error } = await supabase
        .from('favorite_recipes')
        .select('recipe_id')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const favoriteIds = new Set(data?.map(f => f.recipe_id) || []);
      setFavorites(favoriteIds);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(favoriteIds)));
      } catch {}
    } catch (error) {
      console.warn('Notice: Using cached favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (recipeId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const isFav = favorites.has(recipeId);
      const newSet = new Set(favorites);

      if (isFav) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }

      // Optimistic update
      setFavorites(newSet);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(newSet)));
      } catch {}

      if (isFav) {
        toast.success('Removed from favorites');
      } else {
        toast.success('Saved to your favorites box! 💕');
      }

      if (user) {
        if (isFav) {
          await supabase
            .from('favorite_recipes')
            .delete()
            .eq('user_id', user.id)
            .eq('recipe_id', recipeId);
        } else {
          await supabase
            .from('favorite_recipes')
            .insert({
              user_id: user.id,
              recipe_id: recipeId,
            });
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isFavorite = (recipeId: string) => favorites.has(recipeId);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
};
