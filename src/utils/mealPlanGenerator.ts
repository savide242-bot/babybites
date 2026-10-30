import { supabase } from "@/integrations/supabase/client";
import { recipes, Recipe } from "@/data/recipes";
import { startOfWeek, format } from "date-fns";

export const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

export interface MealSlot {
  recipeId: string;
  prepared: boolean;
  dbId?: string;
}

export interface MealPlan {
  [day: string]: {
    [mealType: string]: MealSlot;
  };
}

/**
 * Normalizes and checks if a recipe is appropriate for the baby's age in months.
 * Includes gentle earlier stage recipes (e.g., a 9m baby can still enjoy 6m smooth purees or mashes).
 */
export const isRecipeAppropriateForAge = (recipeAgeGroup: string, babyAgeMonths: number): boolean => {
  const ageStr = (recipeAgeGroup || "").toLowerCase();

  // Baby 6-8 months (or younger starting solids)
  if (babyAgeMonths <= 8) {
    return ageStr.includes("6-8") || ageStr.includes("6-9") || ageStr === "6-8 months";
  }

  // Baby 9-11 months (mashes, soft lumps, finger foods)
  if (babyAgeMonths <= 11) {
    return (
      ageStr.includes("9-11") ||
      ageStr.includes("9-12") ||
      ageStr.includes("6-8") ||
      ageStr.includes("6-9")
    );
  }

  // Toddler 12-23 months (table foods, hearty meals, toddler snacks)
  if (babyAgeMonths <= 23) {
    return (
      ageStr.includes("12-18") ||
      ageStr.includes("18-24") ||
      ageStr.includes("12-23") ||
      ageStr.includes("9-11") ||
      ageStr.includes("9-12")
    );
  }

  // 24+ months (full toddler / family meals)
  return true;
};

/**
 * Filter recipes by age and prioritize based on pediatric meal timing
 */
export const getRecipesForAge = (
  ageMonths: number,
  recipeList: Recipe[] = recipes
): Recipe[] => {
  // Safe default: if age is unknown or 0, default to 6-8 months introduction
  const targetMonths = ageMonths <= 0 ? 6 : ageMonths;
  const filtered = recipeList.filter((r) => isRecipeAppropriateForAge(r.ageGroup, targetMonths));
  return filtered.length > 0 ? filtered : recipeList;
};

/**
 * Get recipes relevant for each meal type
 */
export const getRecipesByMealType = (
  mealType: string,
  ageMonths: number,
  recipeList: Recipe[] = recipes
): Recipe[] => {
  const ageRecipes = getRecipesForAge(ageMonths, recipeList);

  const mealTypeKeywords: Record<string, string[]> = {
    breakfast: ["breakfast", "porridge", "pancake", "oat", "smoothie", "egg", "waffle", "toast", "fruit", "puree"],
    lunch: ["lunch", "dinner", "main", "chicken", "salmon", "fish", "beef", "turkey", "pasta", "soup", "stew", "mash", "bowl"],
    dinner: ["dinner", "lunch", "main", "soup", "stew", "pasta", "rice", "mash", "vegetable", "lentil", "puree"],
    snack: ["snack", "bites", "smoothie", "puree", "fruit", "yogurt", "cookie", "finger food", "muffin"],
  };

  const keywords = mealTypeKeywords[mealType] || ["main"];

  return ageRecipes
    .map((recipe) => {
      let score = 0;
      const title = recipe.title.toLowerCase();
      const category = (recipe.category || "").toLowerCase();
      const mealTime = (recipe.mealTime || "").toLowerCase();

      if (mealTime === mealType) score += 10;

      keywords.forEach((kw, idx) => {
        if (title.includes(kw) || category.includes(kw)) {
          score += 5 - Math.min(4, idx);
        }
      });

      return { recipe, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.recipe);
};

/**
 * Get the start of the current week (Monday)
 */
export const getWeekStartDate = (date: Date = new Date()): string => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  return format(weekStart, "yyyy-MM-dd");
};

/**
 * Generates an automatic 7-day meal plan.
 * GUARANTEED to NEVER return an empty plan for any day or meal slot.
 */
export const generateAutoPlan = (
  ageMonths: number,
  dietaryPrefs: string[] = [],
  recentlyUsedRecipeIds: string[] = [],
  seed: number = Date.now(),
  availableRecipes: Recipe[] = recipes
): MealPlan => {
  // Use safe age: if baby is under 6 months, generate gentle 6-8m starter purees so mother can preview
  const effectiveAge = ageMonths < 6 ? 6 : ageMonths;
  const usedRecipeIds = new Set<string>(recentlyUsedRecipeIds);
  const plan: MealPlan = {};

  const filterByDiet = (list: Recipe[]): Recipe[] => {
    if (dietaryPrefs.length === 0) return list;
    return list.filter((r) => {
      return dietaryPrefs.every((pref) => {
        const p = pref.toLowerCase();
        const allergens = (r.allergens || []).map((a) => a.toLowerCase());
        if (p.includes("dairy")) return !allergens.some((a) => a.includes("dairy") || a.includes("milk"));
        if (p.includes("gluten")) return !allergens.some((a) => a.includes("gluten") || a.includes("wheat"));
        if (p.includes("nut")) return !allergens.some((a) => a.includes("nut"));
        if (p.includes("egg")) return !allergens.some((a) => a.includes("egg"));
        return true;
      });
    });
  };

  let pseudoRandomCounter = seed;

  daysOfWeek.forEach((day, dayIdx) => {
    plan[day] = {};

    mealTypes.forEach((mealType, mealIdx) => {
      // 1. Get recipes suited for this meal and age
      const candidates = getRecipesByMealType(mealType, effectiveAge, availableRecipes);
      // 2. Filter by dietary restrictions
      const dietaryFiltered = filterByDiet(candidates);
      const safeList = dietaryFiltered.length > 0 ? dietaryFiltered : candidates;

      // 3. Prioritize unused recipes to avoid repetitions
      const unused = safeList.filter((r) => !usedRecipeIds.has(r.id));
      const pool = unused.length > 0 ? unused : safeList;

      pseudoRandomCounter += (dayIdx + 1) * 7 + (mealIdx + 1) * 3;
      const pickIndex = Math.abs(pseudoRandomCounter) % pool.length;
      const selected = pool[pickIndex] || safeList[0] || availableRecipes[0];

      if (selected) {
        plan[day][mealType] = {
          recipeId: selected.id,
          prepared: false,
        };
        usedRecipeIds.add(selected.id);
      }
    });
  });

  return plan;
};

/**
 * Generates and saves a weekly meal plan for a user
 */
export const generateInitialMealPlan = async (
  userId: string,
  birthDate: Date | undefined,
  dietaryPreferences: string[] = []
): Promise<boolean> => {
  try {
    const ageMonths = birthDate
      ? Math.max(0, Math.floor((Date.now() - birthDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)))
      : 6;

    const plan = generateAutoPlan(ageMonths, dietaryPreferences);
    const weekStartDate = getWeekStartDate();

    const inserts: Array<{
      user_id: string;
      day_of_week: string;
      meal_type: string;
      recipe_id: string;
      prepared: boolean;
      week_start_date: string;
      plan_type: string;
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
            plan_type: "personalized",
          });
        }
      });
    });

    const { data: existingPlan } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("week_start_date", weekStartDate)
      .limit(1);

    if (!existingPlan || existingPlan.length === 0) {
      const { error } = await supabase.from("meal_plans").insert(inserts);
      if (error) {
        console.error("Error saving meal plan:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error generating initial meal plan:", error);
    return false;
  }
};
