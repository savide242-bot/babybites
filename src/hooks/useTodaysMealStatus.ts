import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface MealPlanEntry {
  id: string;
  meal_type: string;
  recipe_id: string;
  prepared: boolean;
}

export const useTodaysMealStatus = (recipeId: string | undefined) => {
  const [mealPlanEntry, setMealPlanEntry] = useState<MealPlanEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todayMeals, setTodayMeals] = useState<MealPlanEntry[]>([]);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDayName = dayNames[new Date().getDay()];

  useEffect(() => {
    const fetchMealStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || !recipeId) {
          setIsLoading(false);
          return;
        }

        // Fetch all today's meals
        const { data: allMeals, error: allError } = await supabase
          .from('meal_plans')
          .select('id, meal_type, recipe_id, prepared')
          .eq('user_id', session.user.id)
          .eq('day_of_week', todayDayName);

        if (allError) throw allError;
        
        if (allMeals) {
          setTodayMeals(allMeals);
          const thisRecipe = allMeals.find(m => m.recipe_id === recipeId);
          setMealPlanEntry(thisRecipe || null);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching meal status:', error);
        setIsLoading(false);
      }
    };

    fetchMealStatus();
  }, [recipeId, todayDayName]);

  const markAsPrepared = useCallback(async () => {
    if (!mealPlanEntry) return false;

    try {
      const { error } = await supabase
        .from('meal_plans')
        .update({ prepared: true })
        .eq('id', mealPlanEntry.id);

      if (error) throw error;

      // Update local state
      setMealPlanEntry(prev => prev ? { ...prev, prepared: true } : null);
      const updatedMeals = todayMeals.map(m => 
        m.id === mealPlanEntry.id ? { ...m, prepared: true } : m
      );
      setTodayMeals(updatedMeals);

      // Celebrate
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });

      // Check remaining meals
      const preparedCount = updatedMeals.filter(m => m.prepared).length;
      const totalMeals = updatedMeals.length;
      const remainingMeals = totalMeals - preparedCount;

      if (remainingMeals === 0) {
        toast.success("🎉 Congratulations! All of today's meals completed!", {
          duration: 5000,
        });
      } else {
        const mealTypeLabels: { [key: string]: string } = {
          breakfast: "breakfast",
          lunch: "lunch",
          dinner: "dinner",
          snack: "snack"
        };
        
        const remaining = updatedMeals
          .filter(m => !m.prepared)
          .map(m => mealTypeLabels[m.meal_type] || m.meal_type);
        
        const message = remainingMeals === 1 
          ? `Just ${remaining[0]} left! 💪`
          : `${remainingMeals} meals left: ${remaining.join(", ")} 💪`;
        
        toast.success(`Meal prepared! ${message}`, {
          duration: 4000,
        });
      }

      return true;
    } catch (error) {
      console.error('Error marking meal as prepared:', error);
      toast.error("Error updating. Please try again.");
      return false;
    }
  }, [mealPlanEntry, todayMeals]);

  const getRemainingMealsMessage = useCallback(() => {
    const preparedCount = todayMeals.filter(m => m.prepared).length;
    const totalMeals = todayMeals.length;
    const remainingMeals = totalMeals - preparedCount;

    if (totalMeals === 0) return null;
    if (remainingMeals === 0) return "All meals completed! 🎉";
    if (remainingMeals === 1) {
      const remaining = todayMeals.find(m => !m.prepared);
      const mealTypeLabels: { [key: string]: string } = {
        breakfast: "breakfast",
        lunch: "lunch", 
        dinner: "dinner",
        snack: "snack"
      };
      return `Just ${mealTypeLabels[remaining?.meal_type || ''] || 'meal'} left!`;
    }
    return `${preparedCount}/${totalMeals} meals prepared`;
  }, [todayMeals]);

  return {
    isInTodaysPlan: !!mealPlanEntry,
    isPrepared: mealPlanEntry?.prepared || false,
    mealType: mealPlanEntry?.meal_type,
    isLoading,
    markAsPrepared,
    todayMeals,
    getRemainingMealsMessage
  };
};
