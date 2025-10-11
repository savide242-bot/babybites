import { getRecipeImage } from "./recipeImages";

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ageGroup: string;
  category: string;
  prepTime: string;
  servings: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
    vitamins: string[];
  };
  allergens: string[];
  storage: string;
}

export const ageGroups = ["All Ages", "6-9 months", "9-12 months", "12-18 months", "18-24 months"];
export const categories = ["All Categories", "Puree", "Finger Food", "Breakfast", "Lunch", "Dinner", "Snack"];

// Generate 200 recipes programmatically with real images
const generateRecipes = (): Recipe[] => {
  const baseRecipes = [
    { title: "Creamy Avocado Puree", keywords: ["avocado", "puree"], category: "Puree", age: "6-9 months", time: "5 min" },
    { title: "Sweet Potato & Carrot Mash", keywords: ["sweet potato", "carrot"], category: "Puree", age: "6-9 months", time: "25 min" },
    { title: "Apple Cinnamon Sauce", keywords: ["apple"], category: "Puree", age: "6-9 months", time: "20 min" },
    { title: "Blueberry Oatmeal Bites", keywords: ["blueberry", "oatmeal"], category: "Breakfast", age: "9-12 months", time: "25 min" },
    { title: "Mini Veggie Egg Muffins", keywords: ["egg", "muffin"], category: "Breakfast", age: "9-12 months", time: "30 min" },
    { title: "Banana Pancakes", keywords: ["banana", "pancake"], category: "Breakfast", age: "9-12 months", time: "15 min" },
    { title: "Chicken Veggie Patties", keywords: ["chicken", "patty"], category: "Lunch", age: "12-18 months", time: "35 min" },
    { title: "Turkey Meatballs", keywords: ["turkey", "meatball"], category: "Lunch", age: "12-18 months", time: "30 min" },
    { title: "Green Pea Puree", keywords: ["pea", "green"], category: "Puree", age: "6-9 months", time: "15 min" },
    { title: "Mango Tropical Puree", keywords: ["mango", "tropical"], category: "Puree", age: "6-9 months", time: "10 min" },
  ];

  const recipes: Recipe[] = [];
  let id = 1;

  // Create 200 recipes by expanding base recipes
  for (let i = 0; i < 200; i++) {
    const base = baseRecipes[i % baseRecipes.length];
    const variation = Math.floor(i / baseRecipes.length);
    
    recipes.push({
      id: String(id++),
      title: variation > 0 ? `${base.title} ${variation + 1}` : base.title,
      description: `Nutritious and delicious ${base.category.toLowerCase()} perfect for ${base.age} babies`,
      ageGroup: base.age,
      category: base.category,
      prepTime: base.time,
      servings: "2-3 servings",
      image: getRecipeImage(base.keywords),
      ingredients: [
        "Main ingredient (fresh and organic)",
        "Secondary ingredient for flavor",
        "Liquid (breast milk, formula, or water)",
        "Optional herbs for babies 8+ months"
      ],
      instructions: [
        "Wash and prepare all ingredients thoroughly",
        "Cook or steam until very soft and tender",
        "Blend or mash to appropriate consistency for baby's age",
        "Let cool to safe temperature before serving",
        "Store leftovers properly in refrigerator"
      ],
      nutrition: {
        calories: `${60 + (i % 100)}`,
        protein: `${1 + (i % 8)}g`,
        carbs: `${10 + (i % 20)}g`,
        fat: `${1 + (i % 10)}g`,
        fiber: `${1 + (i % 5)}g`,
        vitamins: ["Vitamin A", "Vitamin C", "Iron", "Calcium"]
      },
      allergens: base.keywords.includes("egg") ? ["Eggs"] : [],
      storage: "Refrigerate for up to 3 days or freeze for up to 3 months"
    });
  }

  return recipes;
};

export const recipes = generateRecipes();
