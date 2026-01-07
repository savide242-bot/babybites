import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import { differenceInMonths, startOfWeek, format } from "date-fns";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

interface MealSlot {
  recipeId: string;
  prepared: boolean;
}

interface MealPlan {
  [day: string]: {
    [mealType: string]: MealSlot;
  };
}

// Get baby age group from months
const getAgeGroup = (months: number): string => {
  if (months < 9) return "6-9 months";
  if (months < 12) return "9-12 months";
  if (months < 18) return "12-18 months";
  return "18-24 months";
};

// Filter recipes by age group
const getRecipesForAge = (ageMonths: number) => {
  const ageGroup = getAgeGroup(ageMonths);
  // Include current age group and simpler recipes for younger ages
  return recipes.filter(r => {
    if (r.ageGroup === ageGroup) return true;
    if (ageMonths >= 9 && r.ageGroup === "6-9 months") return true;
    if (ageMonths >= 12 && r.ageGroup === "9-12 months") return true;
    return false;
  });
};

// Get recipes by meal type preference
const getRecipesByMealType = (mealType: string, ageMonths: number) => {
  const ageRecipes = getRecipesForAge(ageMonths);
  
  const mealTypeMapping: { [key: string]: string[] } = {
    breakfast: ["Breakfast", "Puree", "Snack"],
    lunch: ["Lunch", "Dinner", "Finger Food"],
    dinner: ["Dinner", "Lunch", "Finger Food"],
    snack: ["Snack", "Puree", "Breakfast"],
  };
  
  const preferredCategories = mealTypeMapping[mealType] || ["Lunch"];
  
  // Score recipes by relevance
  return ageRecipes
    .map(recipe => {
      let score = 0;
      const title = recipe.title.toLowerCase();
      const category = recipe.category;
      
      // Category matching
      preferredCategories.forEach((cat, idx) => {
        if (category === cat) {
          score += (4 - idx) * 2;
        }
      });
      
      // Meal type specific boosts
      if (mealType === "breakfast") {
        if (title.includes("pancake") || title.includes("oatmeal") || title.includes("egg") || title.includes("porridge")) score += 3;
      } else if (mealType === "lunch" || mealType === "dinner") {
        if (title.includes("chicken") || title.includes("salmon") || title.includes("beef") || 
            title.includes("turkey") || title.includes("pasta") || title.includes("rice")) score += 3;
      } else if (mealType === "snack") {
        if (title.includes("puree") || title.includes("fruit") || title.includes("yogurt") || title.includes("banana")) score += 3;
      }
      
      return { recipe, score };
    })
    .sort((a, b) => b.score - a.score);
};

/**
 * Get the start of the current week (Monday) in a timezone-safe way.
 * Uses local date formatting to avoid UTC conversion issues.
 */
export const getWeekStartDate = (date: Date = new Date()): string => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  return format(weekStart, 'yyyy-MM-dd');
};

// Generate an automatic meal plan
const generateAutoPlan = (
  ageMonths: number, 
  dietaryPrefs: string[] = []
): MealPlan => {
  const usedRecipeIds = new Set<string>();
  const plan: MealPlan = {};
  
  // Filter by dietary preferences
  const filterByDiet = (recipeList: typeof recipes) => {
    if (dietaryPrefs.length === 0) return recipeList;
    return recipeList.filter(r => {
      const allergenFree = dietaryPrefs.every(pref => {
        if (pref === 'dairy-free') return !r.allergens?.includes('Dairy');
        if (pref === 'gluten-free') return !r.allergens?.includes('Gluten');
        if (pref === 'nut-free') return !r.allergens?.includes('Nuts') && !r.allergens?.includes('Tree nuts');
        if (pref === 'vegetarian') return !r.allergens?.includes('Meat');
        if (pref === 'vegan') return !r.allergens?.includes('Dairy') && !r.allergens?.includes('Eggs') && !r.allergens?.includes('Meat');
        return true;
      });
      return allergenFree;
    });
  };
  
  daysOfWeek.forEach(day => {
    plan[day] = {};
    
    mealTypes.forEach(mealType => {
      const candidates = getRecipesByMealType(mealType, ageMonths);
      const filtered = filterByDiet(candidates.map(c => c.recipe));
      
      // Find unused recipe
      const available = filtered.filter(r => !usedRecipeIds.has(r.id));
      
      if (available.length > 0) {
        // Pick randomly from top 5 candidates for variety
        const topCandidates = available.slice(0, Math.min(5, available.length));
        const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
        
        plan[day][mealType] = {
          recipeId: selected.id,
          prepared: false,
        };
        
        usedRecipeIds.add(selected.id);
      } else if (filtered.length > 0) {
        // All used, pick any
        const selected = filtered[Math.floor(Math.random() * filtered.length)];
        plan[day][mealType] = {
          recipeId: selected.id,
          prepared: false,
        };
      }
    });
  });
  
  return plan;
};

/**
 * Generates and saves a weekly meal plan for a new user after onboarding.
 * @param userId - The user's ID
 * @param birthDate - The baby's birth date
 * @param dietaryPreferences - Array of dietary preference tags
 */
export const generateInitialMealPlan = async (
  userId: string,
  birthDate: Date | undefined,
  dietaryPreferences: string[] = []
): Promise<boolean> => {
  try {
    // Calculate baby's age in months
    const ageMonths = birthDate 
      ? Math.max(0, differenceInMonths(new Date(), birthDate))
      : 6; // Default to 6 months if no birth date

    // Generate the meal plan
    const plan = generateAutoPlan(ageMonths, dietaryPreferences);
    const weekStartDate = getWeekStartDate();

    // Prepare database inserts
    const inserts: Array<{
      user_id: string;
      day_of_week: string;
      meal_type: string;
      recipe_id: string;
      prepared: boolean;
      week_start_date: string;
    }> = [];

    Object.entries(plan).forEach(([day, meals]) => {
      Object.entries(meals).forEach(([mealType, slot]) => {
        if (slot.recipeId) {
          inserts.push({
            user_id: userId,
            day_of_week: day,
            meal_type: mealType,
            recipe_id: slot.recipeId,
            prepared: false,
            week_start_date: weekStartDate,
          });
        }
      });
    });

    // Check if user already has a meal plan for this week
    const { data: existingPlan } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .limit(1);

    // Only insert if no existing plan
    if (!existingPlan || existingPlan.length === 0) {
      const { error } = await supabase
        .from('meal_plans')
        .insert(inserts);

      if (error) {
        console.error('Error saving meal plan:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error generating initial meal plan:', error);
    return false;
  }
};
