import { DietaryTag } from '@/hooks/useDietaryPreferences';

// Dietary tags for each recipe
export const recipeDietaryTags: Record<string, DietaryTag[]> = {
  // Purees (typically suitable for most restrictions)
  '2': ['vegetarian', 'vegan', 'dairy-free', 'nut-free', 'gluten-free'], // Sweet Potato & Carrot Puree
  '9': ['vegetarian', 'vegan', 'dairy-free', 'nut-free', 'gluten-free'], // Butternut Squash Puree
  '11': ['vegetarian', 'vegan', 'dairy-free', 'nut-free', 'gluten-free'], // Avocado Puree
  '13': ['vegetarian', 'vegan', 'dairy-free', 'nut-free', 'gluten-free'], // Pea Puree
  '15': ['vegetarian', 'vegan', 'dairy-free', 'nut-free', 'gluten-free'], // Apple Sauce
  '17': ['vegetarian', 'vegan', 'dairy-free', 'nut-free', 'gluten-free'], // Mango Puree

  // Breakfast items
  '1': ['vegetarian', 'nut-free'], // Banana Pancakes (contains egg, milk, flour)
  '3': ['vegetarian', 'dairy-free', 'nut-free'], // Blueberry Oatmeal
  '8': ['vegetarian', 'dairy-free', 'nut-free', 'gluten-free'], // Rice & Banana
  '10': ['vegetarian', 'nut-free'], // Egg Muffins (contains eggs, cheese)
  '18': ['vegetarian', 'nut-free'], // Yogurt with Berries (contains dairy)

  // Lunch/Dinner with meat
  '4': ['dairy-free', 'nut-free', 'gluten-free'], // Chicken Patties
  '6': ['dairy-free', 'nut-free', 'gluten-free'], // Turkey Meatballs
  '7': ['dairy-free', 'nut-free', 'gluten-free'], // Salmon & Sweet Potato
  '19': ['dairy-free', 'nut-free'], // Beef Stew (contains flour for thickening)

  // Vegetarian Lunch/Dinner
  '5': ['vegetarian', 'nut-free'], // Pasta with Tomato Sauce (contains cheese)
  '12': ['vegetarian', 'dairy-free', 'nut-free', 'gluten-free'], // Quinoa with Veggies
  '14': ['vegetarian', 'dairy-free', 'nut-free', 'gluten-free'], // Lentil Soup
  '16': ['vegetarian', 'nut-free'], // Broccoli Tots (contains cheese, breadcrumbs)
  '20': ['vegetarian', 'nut-free'], // Spinach Quesadilla (contains cheese, flour tortilla)
};

// Function to get dietary tags for a recipe
export const getRecipeDietaryTags = (recipeId: string): DietaryTag[] => {
  return recipeDietaryTags[recipeId] || [];
};

// Function to check if recipe matches dietary preferences
export const isRecipeCompatible = (recipeId: string, userPreferences: DietaryTag[]): boolean => {
  if (userPreferences.length === 0) return true;
  const recipeTags = getRecipeDietaryTags(recipeId);
  return userPreferences.every(pref => recipeTags.includes(pref));
};
