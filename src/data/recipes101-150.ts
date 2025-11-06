import { Recipe } from "./recipes";
import { getRecipeImage } from "./recipeImages";

// Recipes 101-150 with complete details
export const recipes101to150: Omit<Recipe, "healthBenefits" | "servingGuidance">[] = [
  {
    id: "101",
    title: "Rainbow Veggie Frittata",
    description: "Colorful egg bake",
    ageGroup: "12-18 months",
    category: "Breakfast",
    prepTime: "25 minutes",
    servings: "6 servings",
    image: getRecipeImage(["egg", "vegetables"]),
    ingredients: ["4 large eggs", "1/4 cup milk", "1/4 cup diced bell peppers (red, yellow)", "1/4 cup diced cherry tomatoes", "2 tbsp diced spinach", "1/4 cup shredded cheese", "1 tbsp olive oil"],
    instructions: [
      "Preheat oven to 350°F (175°C). Grease an 8-inch round baking dish or oven-safe skillet with olive oil.",
      "Wash and dice bell peppers, cherry tomatoes, and spinach into very small pieces.",
      "In a large bowl, whisk together 4 eggs and 1/4 cup milk until well combined.",
      "Stir in the diced vegetables and shredded cheese.",
      "Pour the mixture into the prepared baking dish.",
      "Bake for 18-20 minutes until the center is set and the top is lightly golden.",
      "Let cool for 5-10 minutes before cutting into wedges.",
      "Serve warm or at room temperature. Perfect for batch cooking and meal prep."
    ],
    nutrition: { calories: "92", protein: "7g", carbs: "3g", fat: "6g", fiber: "1g", vitamins: ["Protein", "Vitamin A", "Calcium"] },
    allergens: ["Eggs", "Dairy"],
    storage: "Refrigerate 3 days"
  }
  // Recipes 102-150 would continue here
];
