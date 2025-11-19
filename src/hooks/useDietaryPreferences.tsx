import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema for dietary preferences
const dietaryPreferencesSchema = z.array(
  z.enum(['vegetarian', 'vegan', 'dairy-free', 'nut-free', 'gluten-free'])
).max(10, 'Maximum 10 dietary preferences allowed');

export type DietaryTag = 'vegetarian' | 'vegan' | 'dairy-free' | 'nut-free' | 'gluten-free';

export const DIETARY_OPTIONS: { value: DietaryTag; label: string; color: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  { value: 'vegan', label: 'Vegan', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  { value: 'dairy-free', label: 'Dairy-Free', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  { value: 'nut-free', label: 'Nut-Free', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  { value: 'gluten-free', label: 'Gluten-Free', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
];

export const useDietaryPreferences = () => {
  const [preferences, setPreferences] = useState<DietaryTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('dietary_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Validate the data from database
      const validatedPreferences = dietaryPreferencesSchema.parse(data?.dietary_preferences || []);
      setPreferences(validatedPreferences);
    } catch (error) {
      console.error('Error fetching dietary preferences:', error);
      // Set empty array on validation error
      setPreferences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (newPreferences: DietaryTag[]) => {
    try {
      // Validate input before sending to database
      const validatedPreferences = dietaryPreferencesSchema.parse(newPreferences);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to save preferences');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ dietary_preferences: validatedPreferences })
        .eq('id', user.id);

      if (error) throw error;

      setPreferences(validatedPreferences);
      toast.success('Dietary preferences saved!');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Invalid dietary preferences');
      } else {
        console.error('Error updating dietary preferences:', error);
        toast.error('Failed to save preferences');
      }
    }
  };

  const togglePreference = (preference: DietaryTag) => {
    const newPreferences = preferences.includes(preference)
      ? preferences.filter(p => p !== preference)
      : [...preferences, preference];
    
    updatePreferences(newPreferences);
  };

  const hasPreference = (preference: DietaryTag) => preferences.includes(preference);

  const isRecipeCompatible = (recipeTags: DietaryTag[]) => {
    if (preferences.length === 0) return true;
    return preferences.every(pref => recipeTags.includes(pref));
  };

  return {
    preferences,
    loading,
    updatePreferences,
    togglePreference,
    hasPreference,
    isRecipeCompatible,
    refetch: fetchPreferences,
  };
};
