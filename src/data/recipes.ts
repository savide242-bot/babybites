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

export const recipes: Recipe[] = [
  {
    id: "1",
    title: "Creamy Avocado & Banana Puree",
    description: "A smooth, nutrient-rich first food packed with healthy fats and potassium",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "5 minutes",
    servings: "2-3 servings",
    image: "/placeholder.svg",
    ingredients: [
      "1 ripe avocado, peeled and pitted",
      "1 ripe banana, peeled",
      "2-3 tablespoons breast milk or formula (optional)",
    ],
    instructions: [
      "Cut the avocado and banana into small chunks.",
      "Place both fruits in a blender or food processor.",
      "Blend until completely smooth, adding breast milk or formula if needed to reach desired consistency.",
      "Serve immediately or store in an airtight container in the refrigerator.",
    ],
    nutrition: {
      calories: "160 per serving",
      protein: "2g",
      carbs: "17g",
      fat: "11g",
      fiber: "5g",
      vitamins: ["Vitamin C", "Vitamin E", "Folate", "Potassium"],
    },
    allergens: [],
    storage: "Refrigerate in airtight container for up to 24 hours. Not suitable for freezing due to avocado texture changes.",
  },
  {
    id: "2",
    title: "Sweet Potato & Carrot Mash",
    description: "Vitamin A-rich vegetables with natural sweetness babies love",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "25 minutes",
    servings: "4-5 servings",
    image: "/placeholder.svg",
    ingredients: [
      "1 medium sweet potato, peeled and cubed",
      "2 medium carrots, peeled and sliced",
      "1/4 cup water or breast milk",
    ],
    instructions: [
      "Steam sweet potato and carrot pieces until very tender, about 15-20 minutes.",
      "Transfer cooked vegetables to a blender or food processor.",
      "Add water or breast milk and blend until smooth.",
      "Check consistency - add more liquid if needed for younger babies.",
      "Let cool before serving.",
    ],
    nutrition: {
      calories: "70 per serving",
      protein: "1g",
      carbs: "16g",
      fat: "0g",
      fiber: "3g",
      vitamins: ["Vitamin A", "Vitamin C", "Beta-carotene"],
    },
    allergens: [],
    storage: "Refrigerate for up to 3 days or freeze in ice cube trays for up to 3 months.",
  },
  {
    id: "3",
    title: "Apple & Pear Compote",
    description: "Gentle on the tummy with natural fiber for healthy digestion",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "20 minutes",
    servings: "3-4 servings",
    image: "/placeholder.svg",
    ingredients: [
      "2 apples, peeled, cored, and chopped",
      "2 pears, peeled, cored, and chopped",
      "1/2 cup water",
      "Pinch of cinnamon (optional, for babies 8+ months)",
    ],
    instructions: [
      "Combine apples, pears, and water in a saucepan.",
      "Bring to a boil, then reduce heat and simmer for 15 minutes until fruit is very soft.",
      "Remove from heat and let cool slightly.",
      "Mash with a fork for chunkier texture or blend smooth for younger babies.",
      "Add a tiny pinch of cinnamon if desired and baby is 8+ months.",
    ],
    nutrition: {
      calories: "65 per serving",
      protein: "0g",
      carbs: "17g",
      fat: "0g",
      fiber: "3g",
      vitamins: ["Vitamin C", "Potassium"],
    },
    allergens: [],
    storage: "Refrigerate for up to 4 days or freeze for up to 3 months.",
  },
  {
    id: "4",
    title: "Mini Veggie Egg Muffins",
    description: "Protein-packed finger food perfect for self-feeding practice",
    ageGroup: "9-12 months",
    category: "Finger Food",
    prepTime: "30 minutes",
    servings: "12 mini muffins",
    image: "/placeholder.svg",
    ingredients: [
      "4 large eggs",
      "1/4 cup finely chopped spinach",
      "1/4 cup finely diced bell pepper",
      "1/4 cup shredded cheese (mild cheddar)",
      "2 tablespoons milk",
      "Pinch of black pepper",
    ],
    instructions: [
      "Preheat oven to 350°F (175°C). Grease a mini muffin tin.",
      "Whisk eggs and milk together in a bowl.",
      "Stir in spinach, bell pepper, cheese, and pepper.",
      "Pour mixture evenly into 12 mini muffin cups.",
      "Bake for 15-18 minutes until eggs are set and lightly golden.",
      "Let cool completely before serving to baby.",
    ],
    nutrition: {
      calories: "45 per muffin",
      protein: "4g",
      carbs: "1g",
      fat: "3g",
      fiber: "0g",
      vitamins: ["Vitamin A", "Vitamin D", "Iron", "Calcium"],
    },
    allergens: ["Eggs", "Dairy"],
    storage: "Refrigerate for up to 3 days or freeze for up to 1 month.",
  },
  {
    id: "5",
    title: "Blueberry Oatmeal Bites",
    description: "Soft, chewy breakfast bites loaded with antioxidants and whole grains",
    ageGroup: "9-12 months",
    category: "Breakfast",
    prepTime: "25 minutes",
    servings: "16 bites",
    image: "/placeholder.svg",
    ingredients: [
      "1 cup old-fashioned oats",
      "1 ripe banana, mashed",
      "1/2 cup fresh or frozen blueberries",
      "1/4 cup unsweetened applesauce",
      "1/2 teaspoon cinnamon",
    ],
    instructions: [
      "Preheat oven to 350°F (175°C). Line a baking sheet with parchment paper.",
      "Mix mashed banana, applesauce, and cinnamon in a bowl.",
      "Stir in oats until well combined.",
      "Gently fold in blueberries.",
      "Drop spoonfuls of mixture onto baking sheet, forming small bites.",
      "Bake for 15 minutes until firm and lightly golden.",
      "Cool completely before serving.",
    ],
    nutrition: {
      calories: "35 per bite",
      protein: "1g",
      carbs: "7g",
      fat: "0.5g",
      fiber: "1g",
      vitamins: ["Vitamin C", "Manganese", "Fiber"],
    },
    allergens: [],
    storage: "Store in airtight container for 3 days or freeze for up to 2 months.",
  },
  {
    id: "6",
    title: "Chicken & Vegetable Mini Patties",
    description: "Iron-rich protein with hidden veggies for balanced nutrition",
    ageGroup: "12-18 months",
    category: "Lunch",
    prepTime: "35 minutes",
    servings: "10 patties",
    image: "/placeholder.svg",
    ingredients: [
      "1/2 pound ground chicken",
      "1/4 cup finely grated zucchini (squeezed dry)",
      "1/4 cup finely grated carrot",
      "2 tablespoons breadcrumbs",
      "1 egg, beaten",
      "1/4 teaspoon garlic powder",
    ],
    instructions: [
      "Mix all ingredients in a large bowl until well combined.",
      "Form mixture into small, toddler-sized patties (about 2 inches wide).",
      "Heat a non-stick skillet over medium heat with a little olive oil.",
      "Cook patties for 4-5 minutes per side until golden and cooked through (internal temp 165°F).",
      "Let cool slightly before serving.",
      "Can be served alone or in a small whole wheat bun.",
    ],
    nutrition: {
      calories: "60 per patty",
      protein: "7g",
      carbs: "3g",
      fat: "2g",
      fiber: "0.5g",
      vitamins: ["Iron", "Vitamin A", "B vitamins"],
    },
    allergens: ["Eggs", "Gluten (from breadcrumbs)"],
    storage: "Refrigerate for up to 3 days or freeze for up to 2 months.",
  },
];

export const ageGroups = ["All Ages", "6-9 months", "9-12 months", "12-18 months", "18-24 months"];
export const categories = ["All Categories", "Puree", "Finger Food", "Breakfast", "Lunch", "Dinner", "Snack"];
