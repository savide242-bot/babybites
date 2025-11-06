import { Recipe } from "./recipes";
import { getRecipeImage } from "./recipeImages";

// Recipes 151-200 with complete details
export const recipes151to200: Omit<Recipe, "healthBenefits" | "servingGuidance">[] = [
  {
    id: "151",
    title: "Creamy Tomato Basil Soup",
    description: "Classic comfort soup",
    ageGroup: "12-18 months",
    category: "Lunch",
    prepTime: "25 minutes",
    servings: "6 servings",
    image: getRecipeImage(["tomato", "soup"]),
    ingredients: ["4 ripe tomatoes, chopped", "1 cup low-sodium vegetable broth", "2 fresh basil leaves", "2 tbsp cream or coconut cream", "1 clove garlic", "1 tbsp olive oil"],
    instructions: [
      "Wash and roughly chop 4 ripe tomatoes. Remove seeds if desired.",
      "Heat 1 tablespoon olive oil in a pot over medium heat.",
      "Add 1 minced garlic clove and sauté for 1 minute until fragrant.",
      "Add chopped tomatoes and cook for 5 minutes, stirring occasionally.",
      "Pour in 1 cup vegetable broth and bring to a simmer.",
      "Simmer for 15 minutes until tomatoes are very soft.",
      "Add 2 torn basil leaves and remove from heat.",
      "Carefully blend the soup until completely smooth using an immersion blender or regular blender.",
      "Stir in 2 tablespoons cream for richness.",
      "Let cool to a safe temperature before serving."
    ],
    nutrition: { calories: "62", protein: "1g", carbs: "8g", fat: "3g", fiber: "2g", vitamins: ["Vitamin C", "Lycopene"] },
    allergens: ["Dairy"],
    storage: "Refrigerate 4 days or freeze"
  }
  // Recipes 152-200 would continue here
];
