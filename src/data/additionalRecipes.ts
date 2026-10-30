import { Recipe } from "./recipes";
import { getRecipeImageById } from "./recipeImages";

// Recipes 41-46 with complete details
export const additionalRecipes: Omit<Recipe, "healthBenefits" | "servingGuidance">[] = [
  {
    id: "41",
    title: "Yogurt & Berry Parfait",
    description: "Layered probiotic breakfast",
    ageGroup: "9-12 months",
    category: "Breakfast",
    prepTime: "5 minutes",
    servings: "1 serving",
    image: getRecipeImageById("41"),
    ingredients: ["1/2 cup plain full-fat yogurt", "1/4 cup mixed berries (blueberries, strawberries)", "1 tbsp crushed graham crackers"],
    instructions: [
      "Wash the berries thoroughly under cold running water. Pat them dry with a clean towel.",
      "If using strawberries, remove the green tops and dice into very small pieces. Blueberries can be left whole if your baby handles them well, or cut in half.",
      "Crush 2-3 graham crackers in a sealed plastic bag using a rolling pin until they form small crumbs.",
      "In a small clear cup or bowl, spoon 2 tablespoons of plain full-fat yogurt as the first layer.",
      "Add half of the berries on top of the yogurt layer.",
      "Sprinkle half of the graham cracker crumbs over the berries.",
      "Repeat layers: remaining yogurt, remaining berries, and remaining cracker crumbs on top.",
      "Serve immediately with a small spoon. The layers make eating fun and engaging for babies."
    ],
    nutrition: { calories: "95", protein: "5g", carbs: "14g", fat: "3g", fiber: "2g", vitamins: ["Probiotics", "Vitamin C", "Calcium"] },
    allergens: ["Dairy", "Gluten"],
    storage: "Best served fresh"
  },
  {
    id: "42",
    title: "Baked Cod Fingers",
    description: "Mild white fish strips",
    ageGroup: "12-18 months",
    category: "Lunch",
    prepTime: "20 minutes",
    servings: "6 fingers",
    image: getRecipeImageById("42"),
    ingredients: ["6 oz cod fillet, skinless and boneless", "1/4 cup panko breadcrumbs", "1 egg, beaten", "1/4 cup all-purpose flour", "1 tbsp olive oil", "Lemon wedge for serving"],
    instructions: [
      "Preheat oven to 400°F (200°C) and line a baking sheet with parchment paper.",
      "Check the cod fillet carefully for any remaining bones by running your fingers over it. Remove any you find.",
      "Pat the cod very dry with paper towels. Cut it into 6 finger-shaped strips about 1 inch wide and 3 inches long.",
      "Set up three shallow bowls: one with 1/4 cup flour, one with beaten egg, and one with panko breadcrumbs mixed with 1 tablespoon olive oil.",
      "Take each cod strip and coat it first in flour, shaking off excess.",
      "Dip the floured strip into the beaten egg, letting excess drip off.",
      "Finally, press the strip into the breadcrumb mixture, coating all sides evenly.",
      "Place the breaded fish fingers on the prepared baking sheet, spacing them apart.",
      "Bake for 12-15 minutes, flipping halfway through, until golden brown and the fish flakes easily with a fork.",
      "Let cool for 5 minutes. Squeeze a tiny bit of fresh lemon juice over them before serving if desired."
    ],
    nutrition: { calories: "85", protein: "9g", carbs: "6g", fat: "3g", fiber: "0g", vitamins: ["Protein", "Omega-3", "Vitamin D"] },
    allergens: ["Fish", "Gluten", "Eggs"],
    storage: "Refrigerate 2 days"
  },
  {
    id: "43",
    title: "Creamy Butternut Squash & Red Lentil Soup",
    description: "Velvety warming soup rich in plant protein, iron, and beta-carotene",
    ageGroup: "9-12 months",
    category: "Lunch",
    prepTime: "20 minutes",
    servings: "4 servings",
    image: getRecipeImageById("43"),
    ingredients: [
      "1 cup butternut squash, peeled and diced",
      "1/4 cup red lentils, rinsed thoroughly",
      "1 1/2 cups low-sodium vegetable broth",
      "1 tsp olive oil",
      "Pinch of ground cumin"
    ],
    instructions: [
      "Heat olive oil in a saucepan over medium heat; add cumin and toast for 30 seconds.",
      "Add diced butternut squash, rinsed red lentils, and vegetable broth.",
      "Bring to a boil, then reduce heat to low and cover.",
      "Simmer for 15-18 minutes until squash and lentils are completely soft.",
      "Blend with an immersion blender until velvety and smooth.",
      "Cool to lukewarm temperature before feeding baby."
    ],
    nutrition: { calories: "75", protein: "4g", carbs: "13g", fat: "1.5g", fiber: "3.5g", vitamins: ["Vitamin A", "Iron", "Fiber", "Potassium"] },
    allergens: [],
    storage: "Refrigerate for up to 3 days or freeze for up to 2 months."
  },
  {
    id: "44",
    title: "Carrot & Ginger Puree",
    description: "Warming root vegetable blend",
    ageGroup: "9-12 months",
    category: "Puree",
    prepTime: "20 minutes",
    servings: "4 servings",
    image: getRecipeImageById("44"),
    ingredients: ["4 large carrots, peeled and sliced", "1/4 inch piece fresh ginger, peeled", "1 cup water", "1 tbsp butter"],
    instructions: [
      "Wash and peel 4 large carrots. Cut them into 1/4 inch thick slices for quick cooking.",
      "Peel a 1/4 inch piece of fresh ginger using a spoon (it peels easier this way).",
      "Place carrots, ginger, and 1 cup water in a medium pot. Bring to a boil.",
      "Reduce heat to medium-low, cover, and simmer for 15 minutes until carrots are very soft.",
      "Remove from heat. Discard the ginger piece (it's added flavor but shouldn't be eaten).",
      "Transfer carrots and cooking liquid to a blender. Add 1 tablespoon butter.",
      "Blend on high until silky smooth, adding more water if needed for desired consistency.",
      "Let cool before serving. The ginger adds a subtle warming flavor that aids digestion."
    ],
    nutrition: { calories: "48", protein: "1g", carbs: "8g", fat: "2g", fiber: "2g", vitamins: ["Vitamin A", "Beta-carotene", "Vitamin K"] },
    allergens: ["Dairy"],
    storage: "Refrigerate 4 days or freeze 3 months"
  },
  {
    id: "45",
    title: "Whole Wheat Mini Pizzas",
    description: "Homemade finger food pizza",
    ageGroup: "18-24 months",
    category: "Lunch",
    prepTime: "20 minutes",
    servings: "4 mini pizzas",
    image: getRecipeImageById("45"),
    ingredients: ["2 whole wheat English muffins", "1/4 cup marinara sauce", "1/2 cup shredded mozzarella", "2 tbsp finely diced bell peppers", "2 tbsp diced tomatoes"],
    instructions: [
      "Preheat oven to 375°F (190°C) and line a baking sheet with parchment paper.",
      "Split each English muffin in half to create 4 mini pizza bases.",
      "Place the muffin halves cut-side up on the prepared baking sheet.",
      "Spread 1 tablespoon of marinara sauce evenly on each muffin half.",
      "Sprinkle 2 tablespoons of shredded mozzarella on each pizza.",
      "Top with tiny pieces of diced bell pepper and tomato.",
      "Bake for 10-12 minutes until cheese is melted and bubbly.",
      "Let cool for 5 minutes - the cheese gets very hot! Cut into quarters for easy handling."
    ],
    nutrition: { calories: "112", protein: "6g", carbs: "14g", fat: "4g", fiber: "2g", vitamins: ["Calcium", "Vitamin C"] },
    allergens: ["Dairy", "Gluten"],
    storage: "Best served fresh"
  },
  {
    id: "46",
    title: "Mango Coconut Rice Pudding",
    description: "Tropical creamy dessert",
    ageGroup: "12-18 months",
    category: "Snack",
    prepTime: "25 minutes",
    servings: "4 servings",
    image: getRecipeImageById("46"),
    ingredients: ["1/2 cup jasmine rice", "1 cup coconut milk", "1/2 cup water", "1 ripe mango, diced", "1 tbsp pure maple syrup (optional)"],
    instructions: [
      "Rinse jasmine rice under cold water until water runs clear.",
      "In a small pot, combine rice, coconut milk, and water.",
      "Bring to a boil over medium heat, stirring occasionally.",
      "Reduce heat to low, cover, and simmer for 18-20 minutes until rice is very tender and creamy.",
      "While rice cooks, peel and dice a ripe mango into small cubes.",
      "Remove rice from heat and let stand covered for 5 minutes.",
      "Fluff with a fork and stir in diced mango.",
      "Add pure maple syrup if desired for extra sweetness.",
      "Serve warm or chilled. The coconut milk makes it naturally creamy and delicious."
    ],
    nutrition: { calories: "145", protein: "2g", carbs: "28g", fat: "4g", fiber: "2g", vitamins: ["Vitamin C", "Vitamin A", "Manganese"] },
    allergens: [],
    storage: "Refrigerate 3 days"
  }
];
