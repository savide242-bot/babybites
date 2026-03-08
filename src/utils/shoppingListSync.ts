import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import { getWeekStartDate } from "@/utils/mealPlanGenerator";

const extractIngredientName = (ingredient: string): string => {
  let cleaned = ingredient
    .replace(/^\d+\/?\d*\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|pound|pounds|g|gram|grams|ml|piece|pieces|small|medium|large|pinch|dash|to taste|optional|finely|roughly|chopped|diced|minced|sliced|grated|peeled|mashed|cooked|raw|fresh|dried|ripe|very|about)\s*/gi, '')
    .replace(/^\d+\s*-\s*\d+\s*/g, '')
    .replace(/^\d+\s*/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const categorizeIngredient = (ingredient: string): string => {
  const lower = ingredient.toLowerCase();
  if (lower.includes('apple') || lower.includes('banana') || lower.includes('berry') || 
      lower.includes('mango') || lower.includes('avocado') || lower.includes('pear') ||
      lower.includes('orange') || lower.includes('blueberry') || lower.includes('peach')) return 'Fruits';
  if (lower.includes('carrot') || lower.includes('broccoli') || lower.includes('spinach') || 
      lower.includes('pea') || lower.includes('potato') || lower.includes('zucchini') ||
      lower.includes('tomato') || lower.includes('onion') || lower.includes('garlic')) return 'Vegetables';
  if (lower.includes('chicken') || lower.includes('beef') || lower.includes('turkey') || 
      lower.includes('salmon') || lower.includes('fish') || lower.includes('egg')) return 'Proteins';
  if (lower.includes('rice') || lower.includes('oat') || lower.includes('quinoa') || 
      lower.includes('pasta') || lower.includes('flour') || lower.includes('bread')) return 'Cereals & Grains';
  if (lower.includes('milk') || lower.includes('cheese') || lower.includes('yogurt') ||
      lower.includes('butter') || lower.includes('cream')) return 'Dairy';
  if (lower.includes('oil') || lower.includes('salt') || lower.includes('pepper') ||
      lower.includes('cinnamon') || lower.includes('cumin') || lower.includes('herb')) return 'Pantry Essentials';
  return 'Other';
};

/**
 * Syncs shopping list items from the current week's meal plans.
 * Fetches meal_plans for the current week, maps recipe IDs to ingredients,
 * preserves checked state of existing items, and updates the DB.
 * Returns the final list of shopping items.
 */
export const syncShoppingListFromMealPlans = async (userId: string) => {
  const weekStart = getWeekStartDate();

  // Fetch current week's meal plans
  const { data: mealPlans, error: mpError } = await supabase
    .from('meal_plans')
    .select('recipe_id, day_of_week, meal_type')
    .eq('user_id', userId)
    .eq('week_start_date', weekStart);

  if (mpError) {
    console.error('Error fetching meal plans for sync:', mpError);
    return null;
  }

  if (!mealPlans || mealPlans.length === 0) {
    return []; // No meal plans = empty shopping list is valid
  }

  // Build ingredients map from meal plans
  const ingredientsMap = new Map<string, { ingredient: string; category: string; fromRecipes: string[] }>();

  mealPlans.forEach((mp) => {
    const recipe = recipes.find((r) => r.id === mp.recipe_id);
    if (recipe) {
      recipe.ingredients.forEach((ing) => {
        const cleanName = extractIngredientName(ing);
        const category = categorizeIngredient(cleanName);
        const key = cleanName.toLowerCase();
        if (ingredientsMap.has(key)) {
          const existing = ingredientsMap.get(key)!;
          if (!existing.fromRecipes.includes(recipe.title)) {
            existing.fromRecipes.push(recipe.title);
          }
        } else {
          ingredientsMap.set(key, { ingredient: cleanName, category, fromRecipes: [recipe.title] });
        }
      });
    }
  });

  // Fetch existing shopping list to preserve checked state
  const { data: existingItems } = await supabase
    .from('shopping_list_items')
    .select('ingredient, checked')
    .eq('user_id', userId);

  const checkedMap = new Map<string, boolean>();
  existingItems?.forEach((item) => {
    checkedMap.set(item.ingredient.toLowerCase(), item.checked || false);
  });

  // Delete old items and insert new ones
  await supabase.from('shopping_list_items').delete().eq('user_id', userId);

  if (ingredientsMap.size > 0) {
    const items = Array.from(ingredientsMap.values()).map((item) => ({
      user_id: userId,
      ingredient: item.ingredient,
      category: item.category,
      from_recipe: item.fromRecipes.join(', '),
      checked: checkedMap.get(item.ingredient.toLowerCase()) || false,
    }));
    await supabase.from('shopping_list_items').insert(items);
    return items;
  }

  return [];
};
