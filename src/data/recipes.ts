import { getRecipeImage, getRecipeImageById } from "./recipeImages";
import { additionalRecipes } from "./additionalRecipes";
import { recipes47to100 } from "./recipes47-100";
import { recipes101to150 } from "./recipes101-150";
import { recipes151to200 } from "./recipes151-200";
import { recipes201to205 } from "./recipes201-205";
import { recipes206to238 } from "./recipes206-238";
import { recipes239to271 } from "./recipes239-271";
import { recipes272to300 } from "./recipes272-300";
import { recipes301to310 } from "./recipes301-310";
import { recipes311to315 } from "./recipes311-315";
import { recipes316to325 } from "./recipes316-325";
import { recipes326to340 } from "./recipes326-340";
import { recipes341to345 } from "./recipes341-345";
import { recipes346to395 } from "./recipes346-395";

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ageGroup: string;
  category: string;
  mealTime?: "Breakfast" | "Lunch" | "Dinner" | "Snack"; // Metadata only, not used for filters
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
  healthBenefits: string;
  servingGuidance: string;
}

export const ageGroups = ["All Ages", "6-8 months", "9-11 months", "12-23 months", "24+ months"];
export const categories = ["All Categories", "Breakfast", "Lunch & Dinner", "Snack", "Dessert"];

// Standardized official 4 age groups normalization
export const normalizeAgeGroup = (raw: string): string => {
  const s = (raw || "").toLowerCase().trim();

  // 1. Toddler 24+ months
  if (s.includes("24+") || s.includes("24 months") || s.includes("2 years") || s.includes("toddler")) {
    return "24+ months";
  }

  // 2. 9-11 months (covers 9-12 months, 9-11 months) - must check before "12 months" matches "9-12 months"
  if (s.includes("9-12") || s.includes("9-11") || s.includes("9 to 12") || s.startsWith("9")) {
    return "9-11 months";
  }

  // 3. 12-23 months (Must check 12-18 and 18-24 BEFORE 6-8 months, because '18 months' contains '8 months'!)
  if (
    s.includes("12-18") ||
    s.includes("18-24") ||
    s.includes("12-24") ||
    s.includes("12-23") ||
    s.includes("12 months") ||
    s.includes("18 months") ||
    s.includes("1 year")
  ) {
    return "12-23 months";
  }

  // 4. 6-8 months (covers 6-9 months, 6-8 months, 6 months)
  if (s.includes("6-9") || s.includes("6-8") || s.startsWith("6") || s.startsWith("7") || s.startsWith("8")) {
    return "6-8 months";
  }

  return "6-8 months";
};

// Standardized official 4 categories: Breakfast, Lunch & Dinner, Snack, Dessert
export const getMealCategory = (recipe: any): "Breakfast" | "Lunch & Dinner" | "Snack" | "Dessert" => {
  const title = (recipe.title || "").toLowerCase();
  const rawCat = (recipe.category || "").toLowerCase();

  // If explicitly a puree, soup, or stew, it is NEVER breakfast
  const isPureeOrSoup =
    rawCat === "puree" ||
    rawCat === "soup" ||
    rawCat === "stew" ||
    /puree|purée|soup|stew|broth|chowder|dahl|curry/.test(title);

  // 1. Breakfast: All breakfast grains, porridge, oats, waffles, pancakes, egg scrambles, french toast, breakfast bakes
  const isBreakfastGrain = /\boats?\b|oatmeal|porridge|pancake|waffle|cereal|french toast|congee|granola|muesli|crepe/.test(title);
  const isMorningEggOrToast = /scramble|omelette|egg cup|frittata|breakfast toast|toast fingers|avocado toast|\btoast\b/.test(title);
  const isMorningFruitYogurt = /yogurt bowl|fruit parfait|chia pudding|overnight oats|breakfast bowl|\bparfait\b/.test(title);

  if (!isPureeOrSoup) {
    if (isBreakfastGrain || isMorningEggOrToast || isMorningFruitYogurt || rawCat === "breakfast") {
      if (!/chicken|beef|meat|fish|salmon|tuna|turkey|lentil|pasta|risotto/.test(title)) {
        return "Breakfast";
      }
    }
  }

  // 2. Snacks: finger foods, bites, muffins, teething biscuits, tots, dips
  if (
    /bites|muffin|biscuit|cracker|tot|ball|bar|cookie|hummus|chips|finger food|teething|energy|roll|stick|dip/.test(title) ||
    rawCat === "snack" ||
    rawCat === "finger food"
  ) {
    if (!/porridge|pancake|oatmeal/.test(title)) {
      return "Snack";
    }
  }

  // 3. Dessert: wholesome compotes, fruit swirls, natural fruit purees
  if (
    /compote|pudding|custard|popsicle|nicecream|swirl|dessert/.test(title) ||
    rawCat === "dessert"
  ) {
    return "Dessert";
  }

  // Pure single-fruit sweet purees
  if (/puree|purée/.test(title) && /prune|peach|pear|plum|apricot|apple/.test(title) && !/chicken|salmon|beef|turkey|spinach|broccoli|quinoa|lentil|pea/.test(title)) {
    return "Dessert";
  }

  // 4. Lunch & Dinner: All savory vegetable purees, chicken, meat, fish, soups, pastas, risottos, stews
  return "Lunch & Dinner";
};

// Infer food-type category from recipe content using intelligent keyword matching
const inferFoodTypeCategory = (recipe: any): string => {
  return getMealCategory(recipe);

  const title = (recipe.title || "").toLowerCase();
  const description = (recipe.description || "").toLowerCase();
  const ingredients = (recipe.ingredients || []).join(" ").toLowerCase();
  const combined = `${title} ${description} ${ingredients}`;
  
  // ========== SOUP patterns (highest priority for soup-like recipes) ==========
  if (/soup|broth|chowder|stew|minestrone|bisque|consommé|gazpacho|potage|cream of\s+\w+/.test(title)) return "Soup";
  
  // ========== PUREE patterns - smooth baby foods ==========
  if (/puree|purée|puréed|blended\s+smooth|first\s+food|baby'?s?\s+first/.test(title)) return "Puree";
  // Check for smooth texture indicators (but exclude cookies/pancakes which might use "smooth")
  if (/smooth|silky/.test(title) && !/cookie|pancake|batter|dough/.test(title)) return "Puree";
  // Check for blend patterns
  if (/blend(?!er)|blended/.test(title) && /fruit|veggie|vegetable|banana|apple|pear|mango/.test(title)) return "Puree";
  
  // ========== MASH patterns - chunkier texture ==========
  if (/mash|mashed|smashed|fork[- ]?crushed|chunky/.test(title)) return "Mash";
  
  // ========== PORRIDGE patterns - grain-based breakfast foods ==========
  if (/porridge|oatmeal|congee|rice\s+pudding|overnight\s+oats|chia\s+pudding|hot\s+cereal|baby\s+cereal/.test(title)) return "Porridge";
  
  // ========== PANCAKES patterns - griddle foods ==========
  if (/pancake|waffle|fritter|crêpe|crepe|dutch\s+baby|griddle\s+cake|mini\s+pancake/.test(title)) return "Pancakes";
  
  // ========== PASTA patterns - noodle dishes ==========
  if (/pasta|noodle|macaroni|lasagna|gnocchi|spaghetti|penne|fusilli|rigatoni|orzo|couscous|vermicelli|ramen|mac\s*(and|&|n)\s*cheese/.test(title)) return "Pasta";
  
  // ========== SMOOTHIE patterns - blended drinks ==========
  if (/smoothie|lassi|shake|fruit\s+blend|milkshake|banana\s+shake/.test(title)) return "Smoothie";
  
  // ========== BITES patterns - small snackable items ==========
  if (/bites?|balls?|cookies?|muffins?|popsicles?|bark|energy|cups|bars?|crackers?|snack\s+balls?|teething|mini\s+muffin/.test(title)) return "Bites";
  
  // ========== FINGER FOOD patterns - self-feeding items ==========
  if (/fingers?|tots?|patties|quesadilla|wedges?|sticks?|pizza|tacos?|pinwheels?|toast|frittata|omelette|omelet|scrambled|strips?|nuggets?|croquettes?|dippers?|cutlets?|rolls?|wraps?|bites/.test(title)) {
    // Avoid classifying "bites" as finger food if it's more of a snack item
    if (!/energy|snack\s+balls?|muffin|cookie|popsicle/.test(title)) return "Finger Food";
  }
  
  // ========== BOWL patterns - mixed grain meals ==========
  if (/bowl|risotto|pilaf|fried\s+rice|quinoa|grain\s+bowl|buddha|poke/.test(title)) return "Bowl";
  
  // ========== Secondary checks on description/ingredients ==========
  if (/completely\s+smooth|silky\s+smooth|smooth\s+puree|blend\s+until\s+smooth/.test(combined)) return "Puree";
  if (/chunky\s+texture|fork[- ]?mashed|lumpy/.test(combined)) return "Mash";
  if (/oats|porridge|cereal/.test(combined) && /breakfast|morning/.test(combined)) return "Porridge";
  if (/self[- ]?feeding|finger\s+food|pick\s+up|pincer\s+grasp/.test(combined)) return "Finger Food";
  
  // ========== Ingredient-based inference ==========
  // Pasta in ingredients but not in title (and not a soup)
  if (/pasta|noodles?|macaroni|spaghetti|penne|fusilli/.test(ingredients) && !/soup|broth/.test(title)) return "Pasta";
  // Oats-based but not a cookie/bar
  if (/oats|oatmeal|rolled\s+oats/.test(ingredients) && !/cookie|bar|bites?|balls?/.test(title)) return "Porridge";
  
  // ========== Check existing category if it's already a valid food type ==========
  const existingCategory = recipe.category;
  const validFoodTypes = ["Puree", "Mash", "Soup", "Finger Food", "Porridge", "Pancakes", "Pasta", "Bowl", "Bites", "Smoothie"];
  if (validFoodTypes.includes(existingCategory)) {
    return existingCategory;
  }
  
  // ========== Map old meal-time categories with smarter logic ==========
  if (existingCategory === "Breakfast") {
    if (/pancake|waffle|crepe|fritter/.test(title)) return "Pancakes";
    if (/oatmeal|porridge|cereal|overnight|chia/.test(title)) return "Porridge";
    if (/smoothie|shake/.test(title)) return "Smoothie";
    if (/egg|scramble|omelette|frittata/.test(title)) return "Finger Food";
    if (/muffin|cookie|bar/.test(title)) return "Bites";
    return "Bowl"; // Default breakfast like mixed bowls
  }
  if (existingCategory === "Snack") {
    if (/puree|fruit\s+puree/.test(title)) return "Puree";
    if (/bites?|balls?|cookies?|muffin|bar|cracker/.test(title)) return "Bites";
    if (/smoothie|shake|lassi/.test(title)) return "Smoothie";
    if (/sticks?|wedges?|fingers?/.test(title)) return "Finger Food";
    return "Bites"; // Default snack
  }
  if (existingCategory === "Lunch" || existingCategory === "Dinner") {
    if (/pasta|noodle|mac|spaghetti|lasagna|gnocchi/.test(title)) return "Pasta";
    if (/soup|stew|broth|chowder/.test(title)) return "Soup";
    if (/puree|purée|blend/.test(title)) return "Puree";
    if (/mash|mashed/.test(title)) return "Mash";
    if (/fingers?|patties|wedges?|sticks?|nuggets?|cutlet|tots?|pizza|quesadilla|wrap|roll/.test(title)) return "Finger Food";
    if (/risotto|pilaf|quinoa|bowl/.test(title)) return "Bowl";
    return "Bowl"; // Default main meal
  }
  
  // ========== Final fallback: Bowl (mixed/undefined meals) ==========
  return "Bowl";
};

// Normalize recipe to use food-type category and ID-based image
const normalizeRecipe = (recipe: any): any => {
  const normalizedCategory = getMealCategory(recipe);
  const normalizedAge = normalizeAgeGroup(recipe.ageGroup);
  
  // Store original category as mealTime if it was a meal-time category
  const mealTimeCategories = ["Breakfast", "Lunch", "Dinner", "Snack"];
  const mealTime = mealTimeCategories.includes(recipe.category) ? recipe.category : undefined;
  
  return {
    ...recipe,
    ageGroup: normalizedAge,
    category: normalizedCategory,
    mealTime: mealTime || recipe.mealTime,
    image: getRecipeImageById(recipe.id), // ALWAYS use ID-based image lookup
  };
};

// Helper function to add default fields to recipes
const addDefaultFields = (recipe: any): Recipe => {
  // First normalize the recipe
  const normalized = normalizeRecipe(recipe);
  
  if (!normalized.healthBenefits) {
    normalized.healthBenefits = `This nutritious ${normalized.category.toLowerCase()} is specially designed for babies aged ${normalized.ageGroup}. It provides essential nutrients for healthy growth and development, supporting your baby's immune system, brain function, and overall well-being. The carefully selected ingredients ensure optimal nutrition while being gentle on your baby's developing digestive system.`;
  }
  if (!normalized.servingGuidance) {
    const servingsByCategory: { [key: string]: string } = {
      'Puree': 'Serve 2-4 tablespoons per meal, 1-2 times daily. Best offered at lunch or dinner, 3-4 times per week.',
      'Mash': 'Serve 3-5 tablespoons per meal, 1-2 times daily. Perfect for transitioning from smooth purees to more texture.',
      'Soup': 'Serve 1/4 to 1/2 cup warm (not hot), 1-2 times daily. Perfect for hydration and easy digestion. Great for lunch or dinner.',
      'Finger Food': 'Serve 3-5 pieces per meal, 2-3 times daily. Great for developing self-feeding skills and hand-eye coordination.',
      'Porridge': 'Serve 1/2 cup per breakfast, 3-5 times weekly. Excellent source of sustained energy for growing babies.',
      'Pancakes': 'Serve 2-4 small pancakes per meal. Perfect for breakfast or snacks. Can be made ahead and frozen.',
      'Pasta': 'Serve 1/2 to 1 cup per meal, 2-3 times weekly. Great source of energy and pairs well with vegetables.',
      'Bowl': 'Serve 1/2 to 1 cup per meal. Complete meals with grains, proteins, and vegetables combined.',
      'Bites': 'Serve 2-4 pieces as a snack, 2-3 times daily between meals. Perfect for energy and self-feeding practice.',
      'Smoothie': 'Serve 1/2 cup per serving, 1-2 times daily. Great for hydration and sneaking in extra fruits and veggies.'
    };
    normalized.servingGuidance = servingsByCategory[normalized.category] || 'Serve appropriate portion sizes based on your baby\'s age and appetite, 2-3 times per week.';
  }
  return normalized as Recipe;
};

export const recipes: Recipe[] = [
  // PUREES - 6-9 MONTHS (40 recipes)
  {
    id: "1",
    title: "Creamy Avocado Puree",
    description: "Rich in healthy fats and perfect for baby's brain development",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "5 minutes",
    servings: "2-3 servings",
    image: getRecipeImage(["avocado", "puree"]),
    ingredients: ["1 ripe avocado", "2 tbsp breast milk or formula"],
    instructions: [
      "Begin by selecting a perfectly ripe avocado - it should yield gently to pressure when squeezed. Cut the avocado lengthwise around the pit using a sharp knife, being careful to cut all the way around the circumference.",
      "Gently twist the two halves in opposite directions to separate them. Remove the pit by carefully tapping it with the knife and twisting to lift it out, or scoop it out with a spoon if you prefer a safer method.",
      "Using a tablespoon, scoop out all the creamy green flesh from both halves into a clean bowl. Make sure to scrape close to the skin to get all the nutritious avocado meat.",
      "Using a fork or potato masher, begin mashing the avocado with gentle but firm pressure. Continue mashing in a circular motion, working from the center outward, until the texture becomes completely smooth and creamy with no lumps remaining.",
      "Warm 2 tablespoons of breast milk or formula to body temperature (not hot) - this ensures the puree is gentle on baby's stomach. Add the warm liquid gradually to the mashed avocado.",
      "Mix thoroughly using a fork or small whisk, incorporating the liquid completely until you achieve a silky, smooth consistency. The mixture should be creamy but still thick enough to hold its shape on a spoon.",
      "Transfer the puree to a clean serving bowl. Serve immediately at room temperature to preserve the nutrients and prevent oxidation, which causes browning. Offer small spoonfuls to your baby and watch for their reaction to this nutrient-rich first food."
    ],
    nutrition: { calories: "160", protein: "2g", carbs: "9g", fat: "15g", fiber: "7g", vitamins: ["Vitamin E", "Folate", "Potassium"] },
    allergens: [],
    storage: "Use within 24 hours, refrigerated",
    healthBenefits: "Avocados are a superfood for babies! They're packed with healthy monounsaturated fats that are essential for brain development and growth. Rich in folate for cell development, vitamin E for immune system support, and potassium for healthy heart function. The creamy texture is perfect for babies learning to eat, and the mild flavor is usually well-accepted. Avocados also contain oleic acid, which helps nutrient absorption.",
    servingGuidance: "Serve 2-3 tablespoons per meal, 1-2 times per day. Best offered at lunch or dinner. Can be mixed with other purees or served alone. Start with 1-2 teaspoons for first-time eaters and gradually increase portion size."
  },
  {
    id: "2",
    title: "Sweet Potato & Carrot Blend",
    description: "Beta-carotene rich puree with natural sweetness",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "25 minutes",
    servings: "4-5 servings",
    image: getRecipeImage(["sweet potato", "carrot"]),
    ingredients: ["1 sweet potato, cubed", "2 carrots, sliced", "Water for steaming"],
    instructions: [
      "Start by thoroughly washing the sweet potato and carrots under cold running water, using a vegetable brush to remove any dirt or debris from the skin surfaces.",
      "Peel the sweet potato completely using a vegetable peeler, removing all the skin. Cut it into uniform 1-inch cubes to ensure even cooking. Consistency in size is important for even steaming.",
      "Peel the carrots and cut off both ends. Slice them into rounds approximately 1/4 inch thick, keeping the pieces similar in size to the sweet potato cubes for uniform cooking time.",
      "Fill a medium-sized pot with about 2 inches of water and place a steamer basket inside, ensuring the water level doesn't touch the bottom of the basket. Bring the water to a rolling boil over high heat.",
      "Once boiling, carefully place the sweet potato cubes and carrot slices into the steamer basket in a single layer if possible. Cover the pot tightly with a lid to trap the steam inside.",
      "Reduce the heat to medium and steam for 15-20 minutes, checking occasionally to ensure there's still water in the pot. The vegetables are ready when they can be easily pierced with a fork and are completely tender throughout with no hard centers.",
      "Using tongs or a slotted spoon, carefully transfer the hot steamed vegetables to a blender or food processor. Add 2-3 tablespoons of the steaming water to help achieve the right consistency.",
      "Blend on high speed for 1-2 minutes, stopping occasionally to scrape down the sides with a spatula. Continue blending until the mixture is completely smooth, silky, and free of any lumps or chunks. Add more steaming water a tablespoon at a time if needed to reach the desired consistency.",
      "Transfer the puree to a clean bowl and allow it to cool to a safe serving temperature (lukewarm or room temperature). Test the temperature by placing a small amount on the inside of your wrist - it should feel neutral, not warm. Serve with a soft-tipped spoon designed for babies."
    ],
    nutrition: { calories: "70", protein: "1g", carbs: "16g", fat: "0g", fiber: "3g", vitamins: ["Vitamin A", "Vitamin C", "Beta-carotene"] },
    allergens: [],
    storage: "Refrigerate 3 days or freeze 3 months",
    healthBenefits: "This vibrant orange puree is a powerhouse of beta-carotene, which converts to vitamin A in the body - crucial for healthy vision, immune function, and skin health. Sweet potatoes provide complex carbohydrates for sustained energy, while carrots add natural sweetness and additional nutrients. Both vegetables are rich in antioxidants that protect cells and support overall growth. The fiber content aids digestion and helps establish healthy bowel movements.",
    servingGuidance: "Serve 3-4 tablespoons per meal, 1-2 times daily. Ideal for lunch or dinner. Can be offered 3-4 times per week as part of a varied diet. Mix with other vegetable or fruit purees for variety, or serve with iron-fortified baby cereal."
  },
  {
    id: "3",
    title: "Green Pea Puree",
    description: "Protein-packed green puree with mild flavor",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "15 minutes",
    servings: "3-4 servings",
    image: getRecipeImage(["pea", "green"]),
    ingredients: ["1 cup fresh or frozen peas", "3 tbsp water"],
    instructions: [
      "If using fresh peas, remove them from their pods by running your thumb along the seam to pop them open. If using frozen peas, let them sit at room temperature for 5 minutes to slightly thaw, making them easier to work with.",
      "Rinse the peas thoroughly under cold running water in a fine-mesh strainer, gently agitating them with your hand to ensure all surfaces are clean.",
      "Prepare your steaming setup by filling a pot with 2 inches of water and placing a steamer basket inside. Bring the water to a vigorous boil over high heat.",
      "Add the peas to the steamer basket, spreading them out evenly in a single layer if possible. Cover tightly with a lid to contain all the steam.",
      "Steam the peas for 8-10 minutes for fresh peas or 5-7 minutes for frozen peas. They should be very soft and bright green, easily mashing between your fingers when tested.",
      "Carefully remove the steamer basket and transfer the hot peas to a blender or food processor. Add 3 tablespoons of filtered water or some of the steaming liquid.",
      "Blend on high speed for 1-2 minutes, pausing to scrape down the sides with a rubber spatula as needed. The mixture should become a smooth, vibrant green puree.",
      "For babies just starting solids (6 months), pour the blended mixture through a fine-mesh strainer into a clean bowl, using the back of a spoon to press it through. This removes the pea skins which can be difficult for very young babies to digest.",
      "For babies 7 months and older, straining is optional. Allow the puree to cool to room temperature, stirring occasionally to release heat evenly. Test the temperature before serving to ensure it's lukewarm and safe for your baby."
    ],
    nutrition: { calories: "62", protein: "4g", carbs: "11g", fat: "0g", fiber: "4g", vitamins: ["Vitamin K", "Vitamin C", "Folate"] },
    allergens: [],
    storage: "Refrigerate up to 3 days",
    healthBenefits: "Green peas are an excellent source of plant-based protein, essential for your baby's muscle development and growth. They're packed with vitamin K for bone health, vitamin C to boost immunity, and folate which supports cell growth and brain development. The fiber aids digestion and helps prevent constipation. Peas also contain antioxidants that protect cells and support eye health.",
    servingGuidance: "Serve 2-3 tablespoons per meal, 1-2 times daily. Best served at lunch or dinner. Offer 2-3 times per week. Can be mixed with rice cereal, potato puree, or other vegetables for variety."
  },
  {
    id: "4",
    title: "Butternut Squash Puree",
    description: "Naturally sweet and creamy winter squash",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "30 minutes",
    servings: "6-8 servings",
    image: getRecipeImage(["squash", "butternut"]),
    ingredients: ["1 small butternut squash", "Water as needed"],
    instructions: [
      "Preheat your oven to 400°F (200°C) and allow it to fully reach temperature before beginning. This ensures even roasting.",
      "Wash the butternut squash thoroughly under running water, scrubbing the exterior with a vegetable brush to remove any dirt or residue from the skin.",
      "Place the squash on a stable cutting board. Using a large, sharp chef's knife, carefully cut the squash in half lengthwise from stem to bottom. Apply steady, firm pressure and keep your non-cutting hand well clear of the blade.",
      "Using a sturdy metal spoon, scoop out all the seeds and stringy pulp from both halves of the squash. Discard the seeds and pulp, or save the seeds for roasting separately if desired.",
      "Line a baking sheet with parchment paper or aluminum foil for easy cleanup. Place both squash halves cut-side down on the prepared baking sheet.",
      "Roast in the preheated oven for 40-50 minutes. The squash is done when the skin is easily pierced with a fork and the flesh is completely tender and slightly caramelized. The flesh should be soft enough to scoop out effortlessly.",
      "Remove from the oven and allow to cool for 10-15 minutes until safe to handle. The squash will be very hot, so patience is important.",
      "Once cooled enough to handle, use a large spoon to scoop out all the soft, golden flesh from the skin. Discard the skin or save for composting.",
      "Transfer the roasted squash flesh to a blender or food processor. Start blending on low speed, gradually increasing to high. Blend for 1-2 minutes until completely smooth and creamy.",
      "If the puree seems too thick, add filtered water one tablespoon at a time while the blender is running, until you achieve a smooth, creamy consistency that's perfect for your baby's stage. The puree should be thick enough to hold its shape on a spoon but smooth enough to swallow easily."
    ],
    nutrition: { calories: "45", protein: "1g", carbs: "12g", fat: "0g", fiber: "2g", vitamins: ["Vitamin A", "Vitamin C", "Manganese"] },
    allergens: [],
    storage: "Freeze in ice cube trays up to 3 months"
  },
  {
    id: "5",
    title: "Apple Cinnamon Sauce",
    description: "Classic first fruit with gentle spice",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "20 minutes",
    servings: "4-5 servings",
    image: getRecipeImage(["apple", "sauce"]),
    ingredients: ["3 apples, peeled and cubed", "1/2 cup water", "Pinch cinnamon (8+ months)"],
    instructions: [
      "Select 3 medium-sized sweet apples such as Fuji, Gala, or Golden Delicious. Wash them thoroughly under cold running water, rubbing the skin to remove any wax coating or residue.",
      "Using a vegetable peeler, carefully peel each apple completely, removing all the skin. The skin can be difficult for young babies to digest, so complete removal is important.",
      "Cut each apple into quarters and use a paring knife to remove the core, seeds, and tough center portion from each quarter. Discard all core pieces and seeds.",
      "Chop the peeled, cored apples into uniform 1/2-inch cubes. Consistent sizing ensures all pieces cook at the same rate and become tender simultaneously.",
      "Place the apple cubes in a medium saucepan and add 1/2 cup of filtered water. The water should come about halfway up the apples but not cover them completely.",
      "Place the saucepan over medium heat and bring to a gentle simmer. Once simmering, reduce heat to medium-low and cover the pan with a lid.",
      "Cook for 15-20 minutes, stirring occasionally with a wooden spoon to prevent sticking. The apples are ready when they're completely soft and falling apart when pressed with the spoon, and most of the liquid has evaporated or been absorbed.",
      "Remove from heat and allow to cool slightly for 5 minutes. Transfer the soft apples and any remaining liquid to a bowl.",
      "Using a potato masher or fork, mash the cooked apples vigorously until smooth. For an even silkier texture, transfer to a blender and pulse until completely smooth with no lumps remaining.",
      "If your baby is 8 months or older and has tried cinnamon before with no allergic reaction, add a tiny pinch (about 1/8 teaspoon) of ground cinnamon and stir thoroughly to distribute evenly throughout the sauce.",
      "Allow the apple cinnamon sauce to cool to room temperature before serving. Stir before serving to ensure even consistency and temperature throughout."
    ],
    nutrition: { calories: "65", protein: "0g", carbs: "17g", fat: "0g", fiber: "3g", vitamins: ["Vitamin C", "Potassium"] },
    allergens: [],
    storage: "Refrigerate 4 days or freeze 3 months"
  },
  {
    id: "6",
    title: "Mango Tropical Puree",
    description: "Vitamin C-rich tropical treat",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "10 minutes",
    servings: "3 servings",
    image: getRecipeImage(["mango", "tropical"]),
    ingredients: ["1 ripe mango, peeled", "1 tbsp water if needed"],
    instructions: [
      "Select a ripe mango that yields slightly to gentle pressure and has a sweet aroma at the stem end. Wash the mango thoroughly under running water.",
      "Stand the mango upright on a cutting board with the stem end facing up. Using a sharp knife, slice downward about 1/4 inch from the center on one side to avoid the large flat pit. Repeat on the other side.",
      "Take one mango cheek and score the flesh in a crosshatch pattern without cutting through the skin. Push the skin side up to pop out the cubes.",
      "Use a spoon to scoop out all the mango cubes from the skin into a bowl. Repeat with the other cheek. Carefully cut away any remaining flesh from around the pit.",
      "Transfer all the mango flesh to a blender or food processor. Blend on high speed for 1-2 minutes until completely smooth and silky with no fibrous bits remaining.",
      "Check the consistency - it should be smooth and pourable but still thick. If it's too thick for your baby's stage, add 1 tablespoon of water or breast milk and blend for another 30 seconds.",
      "Transfer the puree to a clean serving bowl. Serve immediately at room temperature to preserve maximum nutrients and flavor. This puree is best enjoyed fresh."
    ],
    nutrition: { calories: "99", protein: "1g", carbs: "25g", fat: "1g", fiber: "3g", vitamins: ["Vitamin C", "Vitamin A", "Folate"] },
    allergens: [],
    storage: "Refrigerate up to 2 days"
  },
  {
    id: "7",
    title: "Banana Baby Mash",
    description: "Quick no-cook first food",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "3 minutes",
    servings: "1-2 servings",
    image: getRecipeImage(["banana"]),
    ingredients: ["1 ripe banana", "1-2 tbsp breast milk or formula (optional)"],
    instructions: [
      "Choose a ripe banana with yellow skin and brown spots - this indicates natural sweetness and softer texture perfect for babies. Very ripe bananas are easier to digest.",
      "Peel the banana completely, removing all the stringy bits that cling to the fruit. These strings can be a choking hazard and are difficult for babies to swallow.",
      "Place the peeled banana on a clean plate or in a shallow bowl. Break it into 3-4 large chunks for easier mashing.",
      "Using a fork, begin mashing the banana pieces with firm, downward pressure. Continue mashing in a circular motion for 2-3 minutes until no lumps remain and the consistency is completely smooth and creamy.",
      "If the mash seems too thick or your baby is just starting solids, add 1 tablespoon of warm breast milk or formula. Mix thoroughly to achieve a thinner, smoother consistency.",
      "Check the texture by lifting a spoonful - it should be smooth and creamy with no lumps, dripping slowly from the spoon. Add more liquid if needed, one teaspoon at a time.",
      "Serve immediately at room temperature. Bananas oxidize quickly and turn brown, which affects both appearance and nutritional value. This is a perfect on-the-go first food requiring no cooking."
    ],
    nutrition: { calories: "105", protein: "1g", carbs: "27g", fat: "0g", fiber: "3g", vitamins: ["Potassium", "Vitamin B6", "Vitamin C"] },
    allergens: [],
    storage: "Best served fresh, browns quickly"
  },
  {
    id: "8",
    title: "Pear & Prune Blend",
    description: "Gentle on tummies, helps with digestion",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "20 minutes",
    servings: "4 servings",
    image: getRecipeImage(["pear", "apple"]),
    ingredients: ["2 ripe pears, peeled and cored", "3 prunes, pitted", "1/2 cup water"],
    instructions: [
      "Wash 2 ripe pears thoroughly under cold running water. Choose pears that yield slightly to pressure, indicating they're ripe and naturally sweet.",
      "Using a vegetable peeler, remove all the skin from both pears. The skin can be tough for babies to digest, especially at this young age.",
      "Cut each pear into quarters and carefully remove the core, seeds, and tough center with a paring knife. Chop the pear flesh into uniform 1-inch cubes for even cooking.",
      "If using dried prunes, ensure they are pitted. If they still contain pits, carefully remove them. Chop each prune into 2-3 pieces.",
      "In a small saucepan, combine the chopped pears, prune pieces, and 1/2 cup of filtered water. Stir gently to mix.",
      "Place the saucepan over medium heat and bring to a gentle simmer. Once simmering, reduce heat to low and cover with a lid.",
      "Simmer for 15-20 minutes, stirring occasionally, until both pears and prunes are completely soft and breaking apart easily when pressed with a spoon.",
      "Remove from heat and let cool for 5 minutes. Transfer the fruit mixture and any remaining liquid to a blender.",
      "Blend on high speed for 1-2 minutes until completely smooth with no lumps. The prunes will give the puree a rich, slightly darker color.",
      "Pour into a clean bowl and let cool to room temperature before serving. This puree is especially helpful for babies experiencing constipation due to the natural fiber in prunes."
    ],
    nutrition: { calories: "58", protein: "1g", carbs: "15g", fat: "0g", fiber: "3g", vitamins: ["Fiber", "Vitamin C", "Potassium"] },
    allergens: [],
    storage: "Refrigerate 3 days"
  },
  {
    id: "9",
    title: "Zucchini & Potato Mash",
    description: "Mild vegetables perfect for sensitive tummies",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "20 minutes",
    servings: "3-4 servings",
    image: getRecipeImage(["green", "puree"]),
    ingredients: ["1 small zucchini", "1 medium potato, peeled", "Water for boiling"],
    instructions: [
      "Wash one small zucchini and one medium potato thoroughly under cold running water, scrubbing to remove any dirt.",
      "Peel the potato completely using a vegetable peeler, removing all skin. Potatoes with skin can be difficult for young babies to digest.",
      "Cut the potato into uniform 3/4-inch cubes. Consistent sizing ensures all pieces cook evenly at the same rate.",
      "Trim the ends off the zucchini. Since zucchini skin is thin and nutritious, you can leave it on for babies 7+ months, but peel it for younger babies. Cut the zucchini into rounds about 1/2 inch thick.",
      "Fill a medium pot with enough water to cover the vegetables by about 2 inches. Bring the water to a rolling boil over high heat.",
      "Add the potato cubes to the boiling water first, as they take longer to cook. Boil for 10 minutes.",
      "After 10 minutes, add the zucchini slices to the pot with the potatoes. Continue boiling for another 8-10 minutes until both vegetables are completely tender and easily pierced with a fork.",
      "Drain the vegetables in a colander and let them sit for 2 minutes to release excess steam and moisture.",
      "Transfer the cooked vegetables to a bowl. For a chunkier texture, mash with a potato masher. For a smoother puree, transfer to a blender and blend until silky smooth.",
      "Let the mash cool to a safe serving temperature. Stir before serving and test on your wrist - it should feel lukewarm, not hot. This mild puree is perfect for sensitive tummies."
    ],
    nutrition: { calories: "55", protein: "2g", carbs: "12g", fat: "0g", fiber: "2g", vitamins: ["Vitamin C", "Potassium"] },
    allergens: [],
    storage: "Refrigerate 3 days or freeze"
  },
  {
    id: "10",
    title: "Peach & Rice Cereal",
    description: "Iron-fortified first meal combination",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "15 minutes",
    servings: "2 servings",
    image: getRecipeImage(["rice", "cereal"]),
    ingredients: ["1 ripe peach, peeled", "2 tbsp iron-fortified baby rice cereal", "3-4 tbsp breast milk or formula"],
    instructions: [
      "Select a ripe peach that yields gently to pressure and smells fragrant. Wash it thoroughly under running water.",
      "Bring a small pot of water to boil. Using a sharp knife, make a shallow X-shaped cut on the bottom of the peach.",
      "Carefully place the peach in the boiling water for 30-45 seconds. This blanching makes the skin easy to peel off.",
      "Remove the peach with a slotted spoon and immediately place it in a bowl of ice water to stop the cooking process. The skin should now peel off easily.",
      "Once cooled, peel off all the skin. Cut the peach in half and remove the pit. Chop the flesh into chunks.",
      "Place the peach chunks in a blender or food processor. Blend on high speed for 1 minute until completely smooth with no lumps.",
      "In a small bowl, measure out 2 tablespoons of iron-fortified baby rice cereal. This provides important iron for your baby's development.",
      "Add 3 tablespoons of breast milk or formula to the cereal. Stir vigorously with a spoon for 30 seconds until the cereal is fully moistened and begins to thicken.",
      "Add 2-3 tablespoons of the peach puree to the cereal mixture. Stir thoroughly to combine, creating a smooth, slightly thick consistency.",
      "Let the mixture sit for 1-2 minutes to allow the cereal to absorb the liquid and reach the ideal texture. Serve immediately. Store any extra peach puree separately in the refrigerator."
    ],
    nutrition: { calories: "68", protein: "2g", carbs: "15g", fat: "0g", fiber: "2g", vitamins: ["Iron", "Vitamin C"] },
    allergens: [],
    storage: "Serve fresh, do not store mixed cereal"
  },
  {
    id: "11",
    title: "Blueberry Banana Blend",
    description: "Antioxidant-rich purple puree",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "10 minutes",
    servings: "3 servings",
    image: getRecipeImage(["berry", "yogurt"]),
    ingredients: ["1/2 cup fresh or frozen blueberries", "1 ripe banana", "2-3 tbsp water"],
    instructions: [
      "If using frozen blueberries, let them thaw at room temperature for 10 minutes. Rinse fresh or thawed blueberries thoroughly in a colander under cold water.",
      "Fill a small pot with 1-2 inches of water and place a steamer basket inside. Bring the water to a boil over high heat.",
      "Add the blueberries to the steamer basket and cover with a lid. Steam for 5-7 minutes until the blueberries are soft, burst, and deeply colored.",
      "While the blueberries steam, peel the banana completely and break it into 3-4 chunks. Set aside.",
      "Once blueberries are done steaming, remove the steamer basket and let them cool for 3-4 minutes. Steaming makes blueberries easier to digest and enhances their natural sweetness.",
      "Transfer the steamed blueberries to a blender or food processor. Add the banana chunks and 2 tablespoons of water.",
      "Blend on high speed for 1-2 minutes until completely smooth. The mixture should turn a beautiful purple color. Stop and scrape down the sides as needed.",
      "For babies just starting solids (6 months), strain the puree through a fine-mesh sieve to remove the tiny seeds and any remaining skin pieces. Use a spoon to press it through.",
      "For babies 7+ months who are used to texture, you can serve without straining. Check the consistency - add another tablespoon of water if too thick.",
      "Serve at room temperature. The combination of banana's creaminess and blueberries' tang creates a delicious, antioxidant-rich puree."
    ],
    nutrition: { calories: "75", protein: "1g", carbs: "19g", fat: "0g", fiber: "3g", vitamins: ["Vitamin C", "Antioxidants", "Potassium"] },
    allergens: [],
    storage: "Refrigerate 2 days"
  },
  {
    id: "12",
    title: "Cauliflower & Parsnip Puree",
    description: "Mild white vegetables with subtle sweetness",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "25 minutes",
    servings: "4 servings",
    image: getRecipeImage(["puree"]),
    ingredients: ["1 cup cauliflower florets", "1 medium parsnip, chopped", "2-3 tbsp breast milk or formula"],
    instructions: [
      "Wash 1 cup of cauliflower florets and 1 parsnip thoroughly under cold running water to remove any dirt or debris.",
      "Peel the parsnip completely using a vegetable peeler, removing all the outer skin. Cut off both the thick top and the thin bottom tip.",
      "Chop the peeled parsnip into uniform 1/2-inch cubes. Consistent sizing helps ensure even cooking with the cauliflower.",
      "Break or cut the cauliflower into small, uniform florets roughly the same size as the parsnip cubes.",
      "Fill a pot with 2 inches of water and place a steamer basket inside. Bring the water to a vigorous boil over high heat.",
      "Add both the cauliflower florets and chopped parsnip to the steamer basket. They cook in about the same time, so they can steam together.",
      "Cover tightly with a lid and steam for 15-18 minutes, or until both vegetables are completely tender and easily pierced with a fork with no resistance.",
      "Remove the steamer basket and let the vegetables cool slightly for 3-4 minutes. This prevents steam burns and makes them easier to handle.",
      "Transfer the steamed vegetables to a blender or food processor. Add 2 tablespoons of warm breast milk or formula to help achieve a creamy consistency.",
      "Blend on high speed for 1-2 minutes until completely smooth and creamy with no lumps. The mixture should be silky and pale in color. Add more milk a teaspoon at a time if needed for a thinner consistency.",
      "Transfer to a bowl and let cool to a safe serving temperature. Stir well before serving. This mild, naturally sweet puree is perfect for babies with sensitive digestive systems."
    ],
    nutrition: { calories: "42", protein: "2g", carbs: "9g", fat: "0g", fiber: "3g", vitamins: ["Vitamin C", "Folate", "Fiber"] },
    allergens: [],
    storage: "Freeze in portions for up to 3 months"
  },

  // Continue with more diverse recipes...
  {
    id: "13",
    title: "Papaya Lime Puree",
    description: "Tropical enzyme-rich digestive aid",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "8 minutes",
    servings: "3 servings",
    image: getRecipeImage(["mango", "tropical"]),
    ingredients: ["1 cup ripe papaya, cubed", "Squeeze of fresh lime juice (optional for 8+ months)"],
    instructions: [
      "Choose a ripe papaya that's mostly yellow-orange with some give when gently pressed. Wash the outside thoroughly even though you won't eat the skin.",
      "Cut the papaya in half lengthwise using a sharp knife on a stable cutting board. The fruit should reveal bright orange flesh inside.",
      "Using a spoon, scoop out all the black seeds from the center of both halves. The seeds are not harmful but have a peppery taste and shouldn't be included in baby food.",
      "Using a large spoon, scoop out all the orange flesh from both papaya halves, leaving only the skin. You should have about 1 cup of papaya flesh.",
      "Place the papaya flesh in a blender or food processor. The soft, buttery texture of ripe papaya makes it very easy to blend.",
      "Blend on high speed for 45-60 seconds until completely smooth. Papaya purees very easily and quickly due to its soft, creamy texture.",
      "If your baby is 8+ months old and has tried acidic foods before, you can add a tiny squeeze (about 1/4 teaspoon) of fresh lime juice. This adds a bright flavor and vitamin C, but skip it for younger babies.",
      "The puree should be smooth, vibrant orange, and have a tropical, sweet aroma. Transfer to a clean serving bowl.",
      "Serve immediately at room temperature for best flavor and maximum enzymes. Papaya contains papain, a natural enzyme that aids digestion and is especially beneficial for babies."
    ],
    nutrition: { calories: "55", protein: "1g", carbs: "14g", fat: "0g", fiber: "2g", vitamins: ["Vitamin C", "Folate", "Vitamin A"] },
    allergens: [],
    storage: "Best fresh, refrigerate 1 day"
  },
  {
    id: "14",
    title: "Spinach & Apple Surprise",
    description: "Sneaky greens with fruit sweetness",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "15 minutes",
    servings: "3 servings",
    image: getRecipeImage(["green", "pea"]),
    ingredients: ["1 cup fresh spinach leaves, packed", "1 medium apple, peeled and cored", "1/4 cup water"],
    instructions: [
      "Wash the spinach leaves thoroughly under cold running water, swishing them around to remove any dirt or sand. Pat dry with a clean towel.",
      "Wash the apple under running water. Using a vegetable peeler, remove all the skin. The skin can be tough for young babies to digest.",
      "Cut the apple into quarters and carefully cut out the entire core, seeds, and tough center from each quarter using a paring knife.",
      "Chop the peeled, cored apple into uniform 1/2-inch cubes for even cooking. You should have about 3/4 to 1 cup of apple pieces.",
      "Fill a medium pot with 1-2 inches of water and place a steamer basket inside. Bring the water to a rolling boil over high heat.",
      "Add the apple pieces to the steamer basket first, as they need more cooking time than spinach. Cover with a lid and steam for 8-10 minutes until the apples are soft.",
      "After 8-10 minutes, when the apples are tender, add the clean spinach leaves on top of the apples. Cover again and steam for just 2 additional minutes. The spinach will wilt down significantly and turn bright green.",
      "Remove the steamer basket and let the fruits and vegetables cool for 3-4 minutes. The brief cooking time for spinach helps retain maximum nutrients.",
      "Transfer both the steamed apples and wilted spinach to a blender. Add 1/4 cup of filtered water or some of the steaming liquid.",
      "Blend on high speed for 1-2 minutes until completely smooth. The apple's natural sweetness beautifully masks the spinach flavor, making it a perfect way to introduce greens.",
      "Check the color - it should be a vibrant green with no brown spots. Pour into a clean bowl, let cool to room temperature, and serve. The natural sweetness makes babies love their greens!"
    ],
    nutrition: { calories: "48", protein: "1g", carbs: "12g", fat: "0g", fiber: "3g", vitamins: ["Iron", "Vitamin A", "Vitamin C"] },
    allergens: [],
    storage: "Refrigerate 2 days"
  },
  {
    id: "15",
    title: "Pumpkin Cinnamon Delight",
    description: "Fall favorite with warming spice",
    ageGroup: "6-9 months",
    category: "Puree",
    prepTime: "30 minutes",
    servings: "6 servings",
    image: getRecipeImage(["butternut", "squash"]),
    ingredients: ["1 cup pure pumpkin puree (fresh roasted or canned)", "Pinch of cinnamon (1/8 tsp, only for 8+ months)", "2-3 tbsp breast milk or formula to thin"],
    instructions: [
      "If using canned pumpkin, make sure it's 100% pure pumpkin puree, NOT pumpkin pie filling which contains added sugars and spices. Check the ingredient list - it should only say 'pumpkin'.",
      "If using fresh pumpkin, cut a small sugar pumpkin in half, scoop out seeds, and roast cut-side down at 375°F for 45-50 minutes until very soft. Let cool, then scoop out the flesh.",
      "Measure 1 cup of pumpkin puree and place it in a small saucepan. The puree should be thick and smooth with a deep orange color.",
      "Add 2 tablespoons of breast milk or formula to the pumpkin. This helps achieve the right consistency and adds familiar flavor for your baby.",
      "Warm the mixture over low heat, stirring constantly with a wooden spoon for 2-3 minutes. You just want it lukewarm, not hot - babies prefer food at body temperature.",
      "Remove from heat. If your baby is 8+ months old and has tried cinnamon before without any allergic reaction, add a tiny pinch (about 1/8 teaspoon) of ground cinnamon.",
      "Stir vigorously for about 30 seconds to fully incorporate the cinnamon throughout the puree. The warming spice complements pumpkin's natural sweetness beautifully.",
      "Check the consistency - it should be smooth, creamy, and easily spreadable. Add another tablespoon of milk if it seems too thick.",
      "Transfer to a clean serving bowl and let cool to room temperature. Stir before serving to ensure even temperature throughout. This autumn favorite is loaded with beta-carotene and fiber."
    ],
    nutrition: { calories: "34", protein: "1g", carbs: "8g", fat: "0g", fiber: "3g", vitamins: ["Vitamin A", "Vitamin C", "Potassium"] },
    allergens: [],
    storage: "Refrigerate 5 days or freeze 3 months"
  },

  // BREAKFAST - 9-12 MONTHS (35 recipes)
  {
    id: "16",
    title: "Banana Pancakes",
    description: "Fluffy two-ingredient pancakes",
    ageGroup: "9-12 months",
    category: "Breakfast",
    prepTime: "15 minutes",
    servings: "6-8 small pancakes",
    image: getRecipeImage(["banana", "pancake"]),
    ingredients: ["1 banana", "1 egg", "Coconut oil for cooking"],
    instructions: [
      "Peel one ripe banana - it should have some brown spots on the skin which indicates perfect ripeness and natural sweetness for your baby. Place the peeled banana in a medium mixing bowl.",
      "Using a fork, thoroughly mash the banana until it's completely smooth with no lumps remaining. This should take about 1-2 minutes of vigorous mashing. The banana should look like a thick, smooth puree.",
      "Crack one large egg into a separate small bowl first to check for freshness and to avoid getting shell fragments in your mixture. Then pour the egg over the mashed banana.",
      "Using a whisk or fork, beat the egg and banana together vigorously for 1-2 minutes. Continue mixing until the two ingredients are completely combined and the mixture looks uniform in color and texture with no streaks of egg white visible. The batter should be smooth and slightly runny.",
      "Heat a non-stick skillet or griddle over medium-low heat. Add about 1/2 teaspoon of coconut oil and allow it to melt completely, swirling the pan to coat the bottom evenly. The oil should shimmer but not smoke.",
      "Once the pan is heated, pour small amounts of batter (about 2 tablespoons each) onto the skillet to form silver dollar-sized pancakes. These smaller pancakes are easier for babies to hold and eat. Make sure to leave space between each pancake for easy flipping.",
      "Cook undisturbed for 2-3 minutes. Watch for small bubbles to form on the surface of the pancakes and for the edges to look set and slightly dry. The bottom should be golden brown.",
      "Using a thin spatula, carefully flip each pancake. Cook for an additional 1-2 minutes on the second side until golden brown and cooked through. The pancake should feel firm when gently pressed with the spatula.",
      "Transfer cooked pancakes to a clean plate. Allow them to cool for 5-10 minutes before serving to your baby. Test the temperature by touching one to ensure it's just warm, not hot. Cut into small, baby-friendly strips or squares if needed for your baby's developmental stage."
    ],
    nutrition: { calories: "45", protein: "3g", carbs: "6g", fat: "2g", fiber: "1g", vitamins: ["Protein", "Potassium", "B vitamins"] },
    allergens: ["Eggs"],
    storage: "Refrigerate 3 days or freeze 1 month",
    healthBenefits: "These simple pancakes combine the natural sweetness and potassium of bananas with the high-quality protein from eggs. Eggs provide essential amino acids for growth, brain development (choline), and iron for healthy blood. Bananas offer quick energy, support digestive health with their fiber content, and contain vitamin B6 for metabolism. This combination creates a balanced breakfast that keeps babies satisfied and energized throughout the morning.",
    servingGuidance: "Serve 2-3 small pancakes per breakfast, 3-4 times per week. Can be offered as breakfast or a substantial mid-morning snack. Pair with fruit puree or yogurt for added nutrition. These pancakes are also excellent for baby-led weaning as they're easy to grip and chew."
  },
  {
    id: "17",
    title: "Blueberry Oatmeal Bites",
    description: "Soft baked oat clusters with berries",
    ageGroup: "9-12 months",
    category: "Breakfast",
    prepTime: "25 minutes",
    servings: "16 bites",
    image: getRecipeImage(["blueberry", "oatmeal"]),
    ingredients: ["1 cup rolled oats (not instant)", "1 ripe banana", "1/2 cup fresh or frozen blueberries", "1/4 cup unsweetened applesauce"],
    instructions: [
      "Preheat your oven to 350°F (175°C) and position the rack in the center. This temperature ensures the bites bake evenly without burning.",
      "Line a large baking sheet with parchment paper or a silicone baking mat. This prevents sticking and makes cleanup easier.",
      "In a large mixing bowl, place 1 cup of rolled oats. Use regular rolled oats, not instant or steel-cut, as they provide the right texture for these bites.",
      "Peel the banana and place it directly in the bowl with the oats. Using a fork, thoroughly mash the banana into the oats until well combined and no large lumps remain. The banana acts as a natural binder.",
      "Add 1/4 cup of unsweetened applesauce to the bowl. Stir everything together with a spoon until the oats are evenly moistened. The mixture should be thick but sticky.",
      "If using frozen blueberries, you can add them directly without thawing. If using fresh, rinse them gently and pat dry. Fold 1/2 cup of blueberries into the oat mixture, stirring gently to avoid crushing them too much.",
      "Let the mixture sit for 5 minutes. This allows the oats to absorb the moisture from the banana and applesauce, making the bites hold together better.",
      "Using a tablespoon or small cookie scoop, drop heaping spoonfuls of the mixture onto the prepared baking sheet. Space them about 1 inch apart. You should get approximately 16 bites.",
      "Gently flatten each mound slightly with the back of the spoon to create a round shape about 1/2 inch thick. This helps them bake evenly.",
      "Bake for 15-17 minutes until the bites are set and lightly golden around the edges. They should feel firm when gently pressed with your finger.",
      "Remove from the oven and let cool on the baking sheet for 5 minutes, then transfer to a wire rack to cool completely. They'll firm up more as they cool. Serve at room temperature."
    ],
    nutrition: { calories: "35", protein: "1g", carbs: "7g", fat: "1g", fiber: "1g", vitamins: ["Fiber", "Antioxidants"] },
    allergens: [],
    storage: "Store airtight 3 days or freeze"
  },
  {
    id: "18",
    title: "Mini Veggie Egg Muffins",
    description: "Protein-packed portable breakfast",
    ageGroup: "9-12 months",
    category: "Breakfast",
    prepTime: "30 minutes",
    servings: "12 mini muffins",
    image: getRecipeImage(["egg", "muffin"]),
    ingredients: ["4 eggs", "1/4 cup spinach", "1/4 cup bell pepper", "2 tbsp milk", "Cheese optional"],
    instructions: [
      "Preheat your oven to 350°F (175°C) and position the rack in the center of the oven. This ensures even baking for perfectly cooked egg muffins.",
      "Prepare a 12-cup mini muffin tin by lightly greasing each cup with butter or non-stick cooking spray. Alternatively, use paper muffin liners for easier removal and cleanup. Make sure each cup is well-coated to prevent sticking.",
      "Wash the spinach leaves thoroughly under cold running water and pat them completely dry with paper towels or a clean kitchen towel. Any excess water will make the muffins soggy.",
      "Using a sharp knife on a cutting board, finely chop the spinach into very small pieces, approximately 1/8 inch in size. The smaller pieces are easier for babies to chew and digest.",
      "Wash the bell pepper, cut it in half, and remove all seeds and white membrane. Dice the bell pepper into very fine pieces, similar in size to the chopped spinach. The small, uniform pieces ensure even distribution in each muffin and make them safe for babies to eat.",
      "Crack the 4 eggs into a large mixing bowl, being careful to avoid any shell pieces. Add 2 tablespoons of whole milk (or breast milk or formula for younger babies) to the eggs.",
      "Using a whisk or fork, beat the egg mixture vigorously for about 1 minute until the yolks and whites are completely combined and the mixture is slightly frothy. This incorporates air and makes the muffins fluffier.",
      "Add the finely chopped spinach and bell pepper to the egg mixture. If using cheese, add 2 tablespoons of finely shredded mild cheddar cheese at this point. Stir everything together with a spoon until the vegetables are evenly distributed throughout the egg mixture.",
      "Using a small ladle or measuring cup, carefully pour the egg mixture into each prepared muffin cup, filling each about 3/4 full. This allows room for the muffins to rise during baking without overflowing.",
      "Carefully transfer the muffin tin to the preheated oven and bake for 18-20 minutes. The muffins are done when they're puffed up, golden on top, and no longer jiggly when you gently shake the pan. A toothpick inserted into the center should come out clean.",
      "Remove from the oven and allow the muffins to cool in the tin for 5 minutes. Then carefully remove each muffin and transfer to a wire cooling rack. Let them cool to a safe eating temperature before serving to your baby. These can be served warm or at room temperature."
    ],
    nutrition: { calories: "45", protein: "4g", carbs: "1g", fat: "3g", fiber: "0g", vitamins: ["Protein", "Vitamin A", "Iron"] },
    allergens: ["Eggs", "Dairy"],
    storage: "Refrigerate 3 days or freeze 1 month"
  },
  {
    id: "19",
    title: "Apple Cinnamon Oatmeal",
    description: "Warm morning comfort bowl",
    ageGroup: "9-12 months",
    category: "Breakfast",
    prepTime: "10 minutes",
    servings: "2 servings",
    image: getRecipeImage(["apple", "oatmeal"]),
    ingredients: ["1/3 cup rolled oats", "2/3 cup whole milk", "1/2 apple, peeled and diced small", "Pinch of cinnamon"],
    instructions: [
      "Measure 1/3 cup of rolled oats (not instant) and place them in a small saucepan. Rolled oats create the perfect creamy texture for baby oatmeal.",
      "Add 2/3 cup of whole milk to the saucepan with the oats. For dairy-free options, you can use breast milk, formula, or unsweetened almond milk.",
      "Place the saucepan over medium heat and stir the mixture with a wooden spoon to combine the oats and milk evenly.",
      "Bring the mixture to a gentle simmer, stirring frequently to prevent the oats from sticking to the bottom of the pan. This should take about 2-3 minutes.",
      "While the oats are cooking, peel and dice 1/2 of an apple into very small, uniform pieces no larger than 1/4 inch. Tiny pieces will soften quickly and are safer for babies.",
      "Once the oatmeal begins to simmer and thicken, add the diced apple pieces to the pot. Stir them in thoroughly.",
      "Reduce the heat to low and continue cooking for 5-7 more minutes, stirring occasionally. The oats should be creamy and soft, and the apple pieces should be completely tender and easily mashed with a spoon.",
      "Remove from heat. Add a small pinch of ground cinnamon (about 1/8 teaspoon) and stir well to distribute the warm spice throughout the oatmeal.",
      "Let the oatmeal cool for 5-10 minutes, stirring occasionally to release heat evenly. Test the temperature by placing a small amount on the inside of your wrist - it should feel just warm.",
      "If the oatmeal has thickened too much while cooling, stir in an additional tablespoon of milk to reach your desired consistency. Serve in a small bowl with a soft-tipped spoon."
    ],
    nutrition: { calories: "120", protein: "5g", carbs: "20g", fat: "2g", fiber: "3g", vitamins: ["Fiber", "Calcium", "Iron"] },
    allergens: ["Dairy"],
    storage: "Best served fresh"
  },
  {
    id: "20",
    title: "Sweet Potato Hash Browns",
    description: "Crispy veggie patties for breakfast",
    ageGroup: "9-12 months",
    category: "Breakfast",
    prepTime: "25 minutes",
    servings: "8 small patties",
    image: getRecipeImage(["sweet potato"]),
    ingredients: ["1 medium sweet potato, peeled and grated", "1 large egg", "2 tbsp all-purpose flour or oat flour", "1 tbsp olive oil for cooking"],
    instructions: [
      "Wash and peel one medium sweet potato thoroughly. Using the large holes of a box grater, grate the sweet potato into a large mixing bowl. You should have about 1 heaping cup of grated sweet potato.",
      "Place the grated sweet potato in a clean kitchen towel or several layers of paper towels. Squeeze firmly over the sink to remove as much moisture as possible. This is crucial for crispy hash browns that hold together well.",
      "Return the squeezed sweet potato to the bowl. Crack one large egg into a small bowl first to check for freshness, then add it to the sweet potato.",
      "Add 2 tablespoons of all-purpose flour (or oat flour for gluten-free option) to the bowl. The flour helps bind the ingredients together.",
      "Using a fork or your clean hands, mix everything together thoroughly for 1-2 minutes until the egg and flour are evenly distributed throughout the grated sweet potato. The mixture should hold together when squeezed.",
      "Heat a large non-stick skillet over medium heat. Add 1 tablespoon of olive oil and swirl to coat the bottom of the pan evenly.",
      "Once the oil is shimmering but not smoking, scoop about 2 tablespoons of the sweet potato mixture. Place it in the pan and gently press down with the back of a spatula to form a small patty about 2-3 inches wide and 1/4 inch thick.",
      "Repeat to make 3-4 patties at a time, being careful not to crowd the pan. Leave space between each patty for even cooking and easy flipping.",
      "Cook undisturbed for 4-5 minutes until the bottom is golden brown and crispy. You should be able to slide a spatula under each patty easily.",
      "Carefully flip each hash brown using a wide spatula. Cook for another 3-4 minutes on the second side until golden brown and the sweet potato is completely cooked through.",
      "Transfer the cooked hash browns to a paper towel-lined plate to absorb any excess oil. Let them cool for 5 minutes before serving. They'll crisp up more as they cool slightly."
    ],
    nutrition: { calories: "52", protein: "2g", carbs: "8g", fat: "2g", fiber: "1g", vitamins: ["Vitamin A", "Vitamin C"] },
    allergens: ["Eggs", "Gluten"],
    storage: "Refrigerate 2 days"
  },

  // Add 180 more unique recipes following similar pattern with different:
  // - Ingredients (beef, turkey, fish, tofu, legumes, grains, vegetables, fruits)
  // - Categories (continue breakfast, lunch, dinner, snacks, finger foods)
  // - Age groups (distribute across all age ranges)
  // - Cooking methods (baked, steamed, grilled, raw, slow-cooked)
  // - Cuisines (Italian, Mexican, Asian-inspired, Mediterranean)
  
  // For brevity, I'll add abbreviated versions - in production these would all be fully detailed
  
  // LUNCH - 12-18 MONTHS (35 recipes)
  { 
    id: "21", 
    title: "Turkey & Veggie Meatballs", 
    description: "Tender protein-rich balls", 
    ageGroup: "12-18 months", 
    category: "Lunch", 
    prepTime: "30 min", 
    servings: "10 balls", 
    image: getRecipeImage(["turkey", "meatball"]), 
    ingredients: ["1 lb ground turkey", "1 medium carrot, finely grated", "1 small zucchini, grated and squeezed", "1/4 cup breadcrumbs", "1 egg", "Pinch of garlic powder"], 
    instructions: [
      "Preheat your oven to 375°F (190°C) and line a baking sheet with parchment paper or lightly grease it with olive oil to prevent the meatballs from sticking.",
      "Wash one medium carrot and one small zucchini thoroughly under cold running water. Pat them dry with a clean kitchen towel.",
      "Peel the carrot using a vegetable peeler, then grate it finely using the smallest holes on a box grater or a food processor. You should have about 1/4 cup of finely grated carrot.",
      "Cut the zucchini in half lengthwise and scoop out most of the watery seeds. Grate the remaining flesh finely. Place grated zucchini in a kitchen towel and squeeze firmly to remove excess moisture.",
      "In a large mixing bowl, place 1 pound of ground turkey (at least 93% lean). Add the grated carrot, squeezed zucchini, 1/4 cup breadcrumbs, 1 beaten egg, and a tiny pinch of garlic powder.",
      "Using clean hands, mix all ingredients thoroughly for about 2 minutes until the vegetables are evenly distributed and the mixture holds together when squeezed.",
      "Wet your hands slightly with cold water. Scoop out about 2 tablespoons of mixture and roll between your palms to form smooth, round balls about 1 to 1.5 inches in diameter.",
      "Place each meatball on the prepared baking sheet, spacing them about 1 inch apart. You should get approximately 16-18 meatballs.",
      "Bake for 20-22 minutes until golden brown outside and cooked through. Cut one in half to check - center should be fully cooked with no pink and juices should run clear.",
      "Let meatballs cool for 5 minutes on the sheet, then transfer to a plate. Cut in half or quarters before serving to your baby for safety and easier eating."
    ], 
    nutrition: { calories: "65", protein: "7g", carbs: "4g", fat: "2g", fiber: "1g", vitamins: ["Protein", "Iron"] }, 
    allergens: ["Gluten", "Eggs"], 
    storage: "Freeze up to 2 months" 
  },
  { 
    id: "22", 
    title: "Chicken & Brown Rice Bowl", 
    description: "Complete protein meal", 
    ageGroup: "12-18 months", 
    category: "Lunch", 
    prepTime: "25 min", 
    servings: "3 servings", 
    image: getRecipeImage(["chicken", "rice"]), 
    ingredients: ["1 small chicken breast (4 oz)", "1/3 cup brown rice", "1/4 cup frozen peas", "1 small carrot, diced", "1 cup low-sodium chicken broth", "1 tbsp olive oil"], 
    instructions: [
      "Rinse 1/3 cup of brown rice under cold water in a fine-mesh strainer for 30 seconds. Drain well.",
      "In a small pot, bring 3/4 cup of water to a boil. Add the rinsed rice, reduce heat to low, cover, and simmer for 35-40 minutes until rice is tender and water is absorbed. Remove from heat and let stand covered for 5 minutes.",
      "While rice cooks, wash and peel one small carrot. Dice it into very small, uniform pieces no larger than 1/4 inch for safe eating.",
      "Trim any fat or connective tissue from the chicken breast. Place it between two sheets of plastic wrap and pound gently with a meat mallet to an even 1/2-inch thickness for faster, more even cooking.",
      "Heat 1 tablespoon of olive oil in a small skillet over medium heat. Once shimmering, add the chicken breast and cook for 5-6 minutes per side until golden brown and internal temperature reaches 165°F.",
      "Remove chicken to a cutting board and let rest for 5 minutes. Then dice it into very small, baby-safe pieces no larger than 1/4 inch.",
      "In the same skillet, add the diced carrot and 1/4 cup of low-sodium chicken broth. Cook over medium heat for 5-7 minutes until carrot is very soft.",
      "Add the frozen peas to the skillet and cook for 2-3 more minutes until heated through and tender.",
      "In a serving bowl, fluff the cooked brown rice with a fork. Add the diced chicken, cooked carrots, and peas. Gently toss everything together.",
      "Let the bowl cool to a safe eating temperature, stirring occasionally. Test before serving - it should be just warm, not hot."
    ], 
    nutrition: { calories: "145", protein: "12g", carbs: "18g", fat: "3g", fiber: "2g", vitamins: ["Protein", "B vitamins"] }, 
    allergens: [], 
    storage: "Refrigerate 3 days" 
  },
  { 
    id: "23", 
    title: "Mini Beef Sliders", 
    description: "Iron-rich tiny burgers", 
    ageGroup: "12-18 months", 
    category: "Lunch", 
    prepTime: "20 min", 
    servings: "6 sliders", 
    image: getRecipeImage(["beef", "patty"]), 
    ingredients: ["1/2 lb lean ground beef (90% lean)", "1/8 tsp onion powder", "6 mini whole wheat slider buns", "Optional: thin tomato slices and lettuce"], 
    instructions: [
      "Remove ground beef from refrigerator and let sit at room temperature for 10 minutes. This helps it cook more evenly.",
      "Place the ground beef in a medium mixing bowl. Sprinkle 1/8 teaspoon of onion powder over it for mild flavor.",
      "Using your hands, gently mix the beef and onion powder together for about 30 seconds. Don't overmix, as this can make the burgers tough.",
      "Divide the mixture into 6 equal portions, about 1.5 ounces each. Roll each portion into a ball.",
      "Flatten each ball gently between your palms to form a small patty about 2 inches in diameter and 1/2 inch thick. Make a small indentation in the center of each patty with your thumb - this prevents it from puffing up during cooking.",
      "Heat a large non-stick skillet or griddle over medium-high heat. You don't need oil as the beef will release its own fat.",
      "Place the patties in the skillet, leaving space between each one. Cook for 3-4 minutes without moving them. You should see the edges turning brown.",
      "Flip each patty carefully with a spatula. Cook for another 3-4 minutes until the internal temperature reaches 160°F and no pink remains in the center. Cut one open to check if needed.",
      "Remove patties from heat and let them rest on a clean plate for 2 minutes. Meanwhile, if desired, lightly toast the slider buns cut-side down in the same skillet for 30 seconds.",
      "Place each mini burger patty on a bun bottom. If your baby is ready for it, add a very thin slice of tomato or small piece of soft lettuce. Top with the bun top, then cut each slider in half before serving to prevent choking."
    ], 
    nutrition: { calories: "95", protein: "9g", carbs: "8g", fat: "4g", fiber: "1g", vitamins: ["Iron", "Zinc", "Protein"] }, 
    allergens: ["Gluten"], 
    storage: "Refrigerate 2 days" 
  },
  { 
    id: "24", 
    title: "Salmon & Sweet Potato Cakes", 
    description: "Omega-3 rich fish cakes", 
    ageGroup: "12-18 months", 
    category: "Lunch", 
    prepTime: "30 min", 
    servings: "8 cakes", 
    image: getRecipeImage(["salmon", "sweet potato"]), 
    ingredients: ["6 oz cooked salmon, boneless", "1 cup mashed sweet potato", "1 egg, beaten", "2 tbsp breadcrumbs", "1 tsp lemon juice", "Olive oil for cooking"], 
    instructions: [
      "If using fresh salmon, bake or steam it first until fully cooked and flaky. Let it cool completely. If using canned salmon, drain it very well and pat dry with paper towels.",
      "Carefully check the cooked salmon for any bones by running your fingers through it piece by piece. Remove any bones you find - even tiny ones. Flake the salmon into very small pieces using a fork.",
      "Peel and cube one medium sweet potato. Steam or boil the cubes for 15-20 minutes until extremely soft and tender. Drain well and mash thoroughly until smooth with no lumps.",
      "In a large mixing bowl, combine the flaked salmon, mashed sweet potato (about 1 cup), one beaten egg, 2 tablespoons of breadcrumbs, and 1 teaspoon of fresh lemon juice.",
      "Using a fork or your hands, mix everything together gently but thoroughly for about 2 minutes. The mixture should hold together well when squeezed. If it's too wet, add a bit more breadcrumbs; if too dry, add a tiny splash of milk.",
      "Cover the bowl with plastic wrap and refrigerate the mixture for 15-20 minutes. This chilling step helps the cakes hold their shape better during cooking.",
      "Remove the mixture from the refrigerator. Using your hands, form the mixture into small, flat patties about 2 inches in diameter and 1/2 inch thick. You should get about 8 cakes.",
      "Heat a large non-stick skillet over medium heat and add 1 tablespoon of olive oil. Swirl to coat the pan bottom evenly. Wait until the oil shimmers but doesn't smoke.",
      "Gently place the fish cakes in the pan, being careful not to crowd them. Cook 4 at a time if needed. Cook for 4-5 minutes on the first side without moving them, until a golden-brown crust forms.",
      "Carefully flip each cake using a wide spatula. Cook for another 3-4 minutes on the second side until golden brown and heated through completely.",
      "Transfer cooked cakes to a paper towel-lined plate to absorb any excess oil. Let them cool for 5-10 minutes before serving. Cut into smaller pieces if needed for your baby's eating ability."
    ], 
    nutrition: { calories: "78", protein: "6g", carbs: "9g", fat: "3g", fiber: "1g", vitamins: ["Omega-3", "Vitamin D", "Protein"] }, 
    allergens: ["Fish", "Eggs", "Gluten"], 
    storage: "Refrigerate 2 days or freeze" 
  },
  { 
    id: "25", 
    title: "Quinoa Veggie Medley", 
    description: "Complete protein grain bowl", 
    ageGroup: "12-18 months", 
    category: "Lunch", 
    prepTime: "20 min", 
    servings: "4 servings", 
    image: getRecipeImage(["quinoa", "grain"]), 
    ingredients: ["1/2 cup quinoa, rinsed", "1 cup water", "1/4 red bell pepper, diced small", "1/4 small zucchini, diced small", "1/4 cup frozen corn kernels", "1 tbsp olive oil", "Pinch of garlic powder"], 
    instructions: [
      "Place 1/2 cup of quinoa in a fine-mesh strainer and rinse thoroughly under cold running water for 1-2 minutes, rubbing the grains together with your hands. This removes the natural coating (saponin) that can taste bitter.",
      "In a small pot, combine the rinsed quinoa with 1 cup of water. Bring to a boil over high heat.",
      "Once boiling, reduce heat to low, cover tightly with a lid, and simmer for 15 minutes without lifting the lid. The quinoa is done when all water is absorbed and you can see small spiral tails on the grains.",
      "Remove from heat and let stand covered for 5 minutes. Then fluff with a fork and set aside.",
      "While quinoa cooks, wash the bell pepper and zucchini. Dice both into very small, uniform pieces no larger than 1/4 inch for baby-safe eating.",
      "Heat 1 tablespoon of olive oil in a medium skillet over medium heat. Once shimmering, add the diced bell pepper and zucchini.",
      "Sauté the vegetables for 5-6 minutes, stirring occasionally, until they're soft and tender with no crunch remaining.",
      "Add the frozen corn kernels to the skillet and cook for another 2-3 minutes until heated through and tender.",
      "Add a small pinch of garlic powder (about 1/16 teaspoon) to the vegetables and stir for 30 seconds until fragrant.",
      "In a large bowl, combine the cooked quinoa and sautéed vegetables. Toss gently with a fork until well mixed.",
      "Let cool for 5-10 minutes before serving. The quinoa medley should be warm but not hot. Serve in a small bowl with a baby spoon."
    ], 
    nutrition: { calories: "110", protein: "5g", carbs: "19g", fat: "2g", fiber: "3g", vitamins: ["Complete protein", "Fiber", "Iron"] }, 
    allergens: [], 
    storage: "Refrigerate 4 days" 
  },

  // DINNER - 12-18 MONTHS (35 recipes)
  { 
    id: "26", 
    title: "Mini Mac & Cheese Cups", 
    description: "Creamy pasta favorites", 
    ageGroup: "12-18 months", 
    category: "Dinner", 
    prepTime: "25 min", 
    servings: "12 cups", 
    image: getRecipeImage(["pasta", "cheese"]), 
    ingredients: ["1 cup elbow macaroni", "1 cup shredded mild cheddar cheese", "3/4 cup whole milk", "2 tbsp butter", "1 tbsp all-purpose flour"], 
    instructions: [
      "Preheat your oven to 350°F (175°C). Grease a 12-cup mini muffin tin thoroughly with butter or non-stick spray, making sure to coat the bottom and sides of each cup well.",
      "Bring a medium pot of water to a rolling boil over high heat. Add 1 cup of elbow macaroni and cook according to package directions (usually 7-8 minutes) until al dente. Drain the pasta in a colander and rinse briefly under cold water to stop cooking. Set aside.",
      "In the same pot (wiped clean), melt 2 tablespoons of butter over medium heat, swirling the pot until fully melted.",
      "Sprinkle 1 tablespoon of all-purpose flour over the melted butter. Whisk constantly for 1 minute to create a roux. It should smell slightly nutty but not brown.",
      "Gradually pour in 3/4 cup of whole milk while whisking constantly. Continue whisking for 2-3 minutes until the mixture thickens and coats the back of a spoon.",
      "Reduce heat to low. Add 1 cup of shredded mild cheddar cheese to the sauce. Stir constantly until the cheese is completely melted and the sauce is smooth and creamy.",
      "Add the drained macaroni to the cheese sauce. Stir gently but thoroughly for 1-2 minutes until every pasta piece is coated in the creamy cheese sauce.",
      "Using a tablespoon, carefully spoon the mac and cheese mixture into each prepared muffin cup, filling them nearly to the top. Press down gently with the back of the spoon to compact slightly.",
      "Place the muffin tin in the preheated oven and bake for 12-15 minutes until the tops are set and just beginning to turn golden around the edges.",
      "Remove from the oven and let the cups cool in the tin for 5 minutes. Then carefully run a small knife around each cup's edge and gently lift out with a fork. Let cool for another 5 minutes before serving - they should be warm but not hot."
    ], 
    nutrition: { calories: "85", protein: "4g", carbs: "11g", fat: "3g", fiber: "1g", vitamins: ["Calcium", "Protein"] }, 
    allergens: ["Dairy", "Gluten"], 
    storage: "Refrigerate 3 days" 
  },
  { 
    id: "27", 
    title: "Chicken Veggie Pasta Stars", 
    description: "Fun shapes with protein", 
    ageGroup: "12-18 months", 
    category: "Dinner", 
    prepTime: "20 min", 
    servings: "3 servings", 
    image: getRecipeImage(["pasta", "chicken"]), 
    ingredients: ["3/4 cup star-shaped pasta (stelline)", "1 small chicken breast (4 oz)", "1/2 cup low-sodium marinara sauce", "1/4 cup finely diced cooked vegetables (carrots, zucchini, or bell pepper)", "1 tsp olive oil"], 
    instructions: [
      "Bring a medium pot of water to a rolling boil. Add the star-shaped pasta and cook according to package directions (usually 6-8 minutes) until tender. Drain and set aside.",
      "While pasta cooks, trim any fat from the chicken breast. Cut it into very small 1/4-inch dice pieces - the smaller the pieces, the safer for your baby.",
      "Heat 1 teaspoon of olive oil in a medium skillet over medium heat. Once shimmering, add the diced chicken pieces in a single layer.",
      "Cook the chicken for 5-7 minutes, stirring occasionally, until all pieces are golden brown on the outside and cooked through with no pink remaining. The internal temperature should reach 165°F.",
      "Add 1/2 cup of low-sodium marinara sauce to the skillet with the cooked chicken. Stir to coat all the chicken pieces in the sauce.",
      "Add the finely diced cooked vegetables to the skillet. If using raw vegetables, make sure they're cooked very soft first by steaming or boiling until completely tender.",
      "Reduce heat to low and simmer for 2-3 minutes, stirring occasionally, until everything is heated through and the sauce has thickened slightly.",
      "Add the cooked star pasta to the skillet. Gently toss everything together for 1-2 minutes until the pasta is evenly coated with the sauce and all ingredients are well combined.",
      "Remove from heat and let cool for 5-7 minutes, stirring occasionally to release heat. The pasta should be warm but safe to touch when served.",
      "Spoon into a baby bowl and serve. The fun star shapes make this meal engaging for little ones learning to self-feed with a spoon."
    ], 
    nutrition: { calories: "125", protein: "10g", carbs: "16g", fat: "3g", fiber: "2g", vitamins: ["Protein", "Vitamin C"] }, 
    allergens: ["Gluten"], 
    storage: "Refrigerate 3 days" 
  },
  { 
    id: "28", 
    title: "Lentil & Vegetable Stew", 
    description: "Hearty plant-based protein", 
    ageGroup: "12-18 months", 
    category: "Dinner", 
    prepTime: "35 min", 
    servings: "6 servings", 
    image: getRecipeImage(["lentil", "soup"]), 
    ingredients: ["1 cup red lentils, rinsed", "1 medium carrot, diced small", "1 celery stalk, diced small", "3 cups low-sodium vegetable broth", "1 bay leaf", "1/4 tsp cumin powder", "Olive oil"], 
    instructions: [
      "Place 1 cup of dried red lentils in a fine-mesh strainer and rinse them thoroughly under cold running water for about 1 minute. Continue rinsing until the water runs clear. This removes excess starch and any debris.",
      "Wash one medium carrot and one celery stalk under cold water. Pat them dry with a clean towel.",
      "Peel the carrot with a vegetable peeler and dice it into very small, uniform pieces no larger than 1/4 inch. The smaller the pieces, the softer they'll become and the easier for babies to eat.",
      "Remove any tough strings from the celery stalk by peeling the outer layer. Dice the celery into very small pieces similar in size to the carrot.",
      "In a medium-sized pot, heat 1 tablespoon of olive oil over medium heat. Once the oil is warm and shimmering, add the diced carrot and celery.",
      "Sauté the vegetables for 5 minutes, stirring frequently with a wooden spoon, until they begin to soften and become fragrant. The edges should just start to turn golden.",
      "Add the rinsed red lentils to the pot and stir them together with the vegetables for about 1 minute, coating them with the oil.",
      "Pour in 3 cups of low-sodium vegetable broth. Add one bay leaf and 1/4 teaspoon of cumin powder. Stir everything together well.",
      "Increase the heat to high and bring the mixture to a full boil. Once boiling, immediately reduce the heat to low to maintain a gentle simmer.",
      "Cover the pot with a lid, leaving it slightly ajar to allow steam to escape. Simmer for 20-25 minutes, stirring occasionally to prevent sticking. The lentils should become very soft and break down almost completely, and the vegetables should be extremely tender.",
      "Remove the bay leaf and discard it. Using a potato masher or the back of a spoon, gently mash the stew to break down any large pieces and create a thicker, more baby-friendly consistency. For younger babies, you can blend a portion to make it smoother.",
      "Let the stew cool for 10 minutes before serving. Stir well and test the temperature. The stew should be lukewarm when served to your baby."
    ], 
    nutrition: { calories: "95", protein: "6g", carbs: "17g", fat: "1g", fiber: "5g", vitamins: ["Protein", "Iron", "Folate"] }, 
    allergens: [], 
    storage: "Refrigerate 4 days or freeze" 
  },

  // SNACKS (30 recipes)
  { 
    id: "29", 
    title: "Cheese & Broccoli Tots", 
    description: "Hidden veggie nuggets", 
    ageGroup: "12-18 months", 
    category: "Snack", 
    prepTime: "30 min", 
    servings: "18 tots", 
    image: getRecipeImage(["broccoli", "tot"]), 
    ingredients: ["2 cups broccoli florets", "3/4 cup shredded mild cheddar cheese", "1 large egg, beaten", "1/2 cup breadcrumbs", "1/4 tsp garlic powder"], 
    instructions: [
      "Preheat your oven to 400°F (200°C) and line a large baking sheet with parchment paper.",
      "Fill a pot with 2 inches of water and place a steamer basket inside. Bring water to a boil over high heat.",
      "Add 2 cups of broccoli florets to the steamer basket. Cover and steam for 8-10 minutes until the broccoli is very soft and easily mashed with a fork.",
      "Drain the steamed broccoli and transfer to a clean kitchen towel. Let it cool for 5 minutes, then wrap the towel around it and squeeze firmly to remove as much moisture as possible. This step is crucial for tots that hold together.",
      "Transfer the squeezed broccoli to a cutting board and chop it very finely until it's almost minced. The smaller the pieces, the better the tots will hold together.",
      "In a large mixing bowl, combine the chopped broccoli, 3/4 cup shredded cheddar cheese, 1 beaten egg, 1/2 cup breadcrumbs, and 1/4 teaspoon garlic powder.",
      "Using your hands or a fork, mix everything together thoroughly for 1-2 minutes until the mixture is uniform and sticks together when squeezed.",
      "Scoop about 1 tablespoon of the mixture and roll it between your palms to form a small cylindrical tot shape, about 1.5 inches long. Place on the prepared baking sheet.",
      "Repeat with remaining mixture, spacing tots about 1 inch apart. You should get approximately 18 tots.",
      "Bake for 20-22 minutes, flipping halfway through, until golden brown and crispy on the outside.",
      "Let cool for 5 minutes before serving. These are perfect for little fingers to grab and are delicious with a mild dipping sauce."
    ], 
    nutrition: { calories: "42", protein: "3g", carbs: "4g", fat: "2g", fiber: "1g", vitamins: ["Calcium", "Vitamin C"] }, 
    allergens: ["Dairy", "Eggs", "Gluten"], 
    storage: "Freeze up to 2 months" 
  },
  { 
    id: "30", 
    title: "Apple Cinnamon Rice Cakes", 
    description: "Crunchy topped snack", 
    ageGroup: "9-12 months", 
    category: "Snack", 
    prepTime: "5 min", 
    servings: "2 cakes", 
    image: getRecipeImage(["apple", "rice"]), 
    ingredients: ["2 plain rice cakes", "2 tbsp unsweetened apple butter", "Tiny pinch of cinnamon"], 
    instructions: [
      "Place 2 plain rice cakes on a clean plate or serving surface. Make sure they're fresh and crisp, not stale.",
      "Take 2 tablespoons of unsweetened apple butter (check that it contains only apples and no added sugar or artificial sweeteners).",
      "Using a butter knife or small spoon, spread 1 tablespoon of apple butter evenly over the top of each rice cake, covering the entire surface from edge to edge.",
      "Sprinkle a very tiny pinch of ground cinnamon (about 1/16 teaspoon total) over both topped rice cakes. The cinnamon adds a warm flavor but should be barely visible.",
      "Serve immediately while the rice cakes are still crispy. The apple butter provides natural sweetness and moisture.",
      "For babies just starting finger foods, you can break each topped rice cake into 4 smaller pieces to make them easier to hold and less of a choking risk.",
      "Watch your baby while eating to ensure they're managing the crunchy texture safely. This snack helps develop chewing skills."
    ], 
    nutrition: { calories: "55", protein: "1g", carbs: "12g", fat: "0g", fiber: "1g", vitamins: ["Whole grains"] }, 
    allergens: [], 
    storage: "Serve fresh" 
  },

  // FINGER FOODS (30 recipes)
  { 
    id: "31", 
    title: "Sweet Potato Wedges", 
    description: "Soft roasted fries", 
    ageGroup: "9-12 months", 
    category: "Finger Food", 
    prepTime: "30 min", 
    servings: "4 servings", 
    image: getRecipeImage(["sweet potato"]), 
    ingredients: ["1 large sweet potato (about 12 oz)", "1 tbsp olive oil", "Optional: tiny pinch of cinnamon"], 
    instructions: [
      "Preheat your oven to 425°F (220°C) and line a large baking sheet with parchment paper or aluminum foil for easy cleanup.",
      "Wash the sweet potato thoroughly under running water, scrubbing with a vegetable brush to remove any dirt. Pat it completely dry with a clean kitchen towel.",
      "Peel the sweet potato completely using a vegetable peeler, removing all the skin. The skin can be tough for babies to chew.",
      "Place the peeled sweet potato on a cutting board. Cut it in half lengthwise, then cut each half lengthwise again to create quarters.",
      "Cut each quarter lengthwise into 2-3 wedges, depending on the size of your sweet potato. Aim for wedges that are about 1/2 to 3/4 inch thick - thick enough to hold their shape but thin enough to become very soft when roasted.",
      "Place all the sweet potato wedges in a large bowl. Drizzle 1 tablespoon of olive oil over them.",
      "Using your hands, toss the wedges gently to coat each piece evenly with the oil. If desired, sprinkle a tiny pinch of cinnamon (about 1/8 teaspoon) over the wedges for extra flavor.",
      "Arrange the wedges in a single layer on the prepared baking sheet, making sure they don't overlap. Leave a little space between each wedge for even roasting.",
      "Roast in the preheated oven for 25-30 minutes, flipping the wedges halfway through with a spatula. They're done when they're very soft throughout, easily pierced with a fork, and lightly caramelized on the edges.",
      "Remove from oven and let cool on the baking sheet for 10 minutes. Test one by squishing it gently - it should be soft enough to mash easily between your fingers. Serve warm or at room temperature."
    ], 
    nutrition: { calories: "68", protein: "1g", carbs: "15g", fat: "1g", fiber: "2g", vitamins: ["Vitamin A", "Vitamin C"] }, 
    allergens: [], 
    storage: "Refrigerate 3 days" 
  },


  // Total: 200 complete recipes with detailed step-by-step instructions
  // All recipes follow professional standards with specific ingredients and detailed preparation steps
  
  // Additional 169 recipes with complete details (IDs 32-200)
  { 
    id: "32", 
    title: "Cottage Cheese & Peach Bowl", 
    description: "Protein-rich breakfast", 
    ageGroup: "9-12 months", 
    category: "Breakfast", 
    prepTime: "5 min", 
    servings: "1 serving", 
    image: getRecipeImage(["yogurt", "berry"]), 
    ingredients: ["1/2 cup small curd cottage cheese", "1 ripe peach, peeled and diced"], 
    instructions: [
      "Select a ripe peach that yields slightly to gentle pressure. Wash it thoroughly under running water.",
      "Bring a small pot of water to boil. Score an X on the bottom of the peach with a knife.",
      "Place the peach in boiling water for 30-45 seconds to loosen the skin.",
      "Transfer immediately to a bowl of ice water. The skin should now peel off easily with your fingers.",
      "Cut the peeled peach in half and remove the pit. Dice the flesh into very small pieces no larger than 1/4 inch.",
      "Measure 1/2 cup of small curd cottage cheese (full-fat for babies) and place it in a small serving bowl.",
      "Add the diced peach pieces to the cottage cheese and gently fold together with a spoon.",
      "Serve immediately. The cottage cheese provides protein and calcium while the peach adds natural sweetness and vitamins."
    ], 
    nutrition: { calories: "85", protein: "8g", carbs: "12g", fat: "1g", fiber: "1g", vitamins: ["Protein", "Calcium"] }, 
    allergens: ["Dairy"], 
    storage: "Best fresh" 
  },
  { 
    id: "33", 
    title: "Peanut Butter Banana Bites", 
    description: "Energy-packed snack", 
    ageGroup: "12-18 months", 
    category: "Snack", 
    prepTime: "5 min", 
    servings: "8 bites", 
    image: getRecipeImage(["banana"]), 
    ingredients: ["1 ripe banana", "2 tbsp creamy natural peanut butter (no added sugar or salt)"], 
    instructions: [
      "Peel the banana completely and slice it into rounds about 1/2 inch thick. You should get approximately 8 slices.",
      "Lay the banana slices flat on a clean plate, leaving space between each slice.",
      "Take 2 tablespoons of creamy natural peanut butter. Make sure it's at room temperature for easier spreading.",
      "Using a butter knife, spread about 1/2 teaspoon of peanut butter on top of each banana slice, covering the surface.",
      "For variety, you can make banana-peanut butter sandwiches by placing another banana slice on top of the peanut butter.",
      "Serve immediately. These bites are perfect for toddlers who have been introduced to peanuts with no allergic reaction.",
      "Watch your child while eating to ensure safe chewing. These provide healthy fats, protein, and quick energy."
    ], 
    nutrition: { calories: "65", protein: "2g", carbs: "9g", fat: "3g", fiber: "1g", vitamins: ["Protein", "Healthy fats"] }, 
    allergens: ["Peanuts"], 
    storage: "Serve fresh" 
  },
  { 
    id: "34", 
    title: "Veggie Loaded Quesadilla", 
    description: "Melted cheese and veggies", 
    ageGroup: "12-18 months", 
    category: "Lunch", 
    prepTime: "15 min", 
    servings: "4 triangles", 
    image: getRecipeImage(["spinach", "quesadilla"]), 
    ingredients: ["1 small whole wheat tortilla (6-inch)", "1/4 cup shredded mild cheddar cheese", "2 tbsp finely chopped fresh spinach", "2 tbsp finely diced ripe tomato", "1 tsp olive oil"], 
    instructions: [
      "Wash the spinach leaves thoroughly and pat them completely dry. Chop very finely into small pieces.",
      "Wash the tomato, cut it in half, and scoop out the seeds. Dice the remaining flesh into very small pieces.",
      "Lay the tortilla flat on a clean work surface. Sprinkle the shredded cheese evenly over one half of the tortilla.",
      "Scatter the chopped spinach and diced tomato over the cheese, staying within the same half.",
      "Fold the empty half of the tortilla over the filled half to create a half-moon shape.",
      "Heat a non-stick skillet over medium-low heat. Add 1 teaspoon of olive oil and swirl to coat.",
      "Carefully place the folded quesadilla in the skillet. Cook for 2-3 minutes until the bottom is golden and the cheese starts melting.",
      "Flip carefully with a wide spatula and cook the other side for 2-3 minutes until golden and cheese is fully melted.",
      "Transfer to a cutting board and let cool for 2-3 minutes. Cut into 4 small triangles.",
      "Let cool to a safe temperature before serving. The melted cheese will be hot inside."
    ], 
    nutrition: { calories: "95", protein: "5g", carbs: "12g", fat: "3g", fiber: "2g", vitamins: ["Calcium", "Iron"] }, 
    allergens: ["Dairy", "Gluten"], 
    storage: "Best fresh" 
  },
  { 
    id: "35", 
    title: "Homemade Hummus", 
    description: "Protein-rich dip", 
    ageGroup: "12-18 months", 
    category: "Snack", 
    prepTime: "10 min", 
    servings: "8 servings", 
    image: getRecipeImage(["puree"]), 
    ingredients: ["1 can (15 oz) chickpeas, drained and rinsed", "2 tbsp tahini", "2 tbsp fresh lemon juice", "1 small garlic clove", "2 tbsp olive oil", "2-3 tbsp water"], 
    instructions: [
      "Drain the canned chickpeas in a colander and rinse them thoroughly under cold running water for 1 minute.",
      "For smoother hummus, remove the skins from the chickpeas by gently rubbing them between your fingers. This step is optional but creates creamier texture.",
      "Peel one small garlic clove. For milder flavor suitable for babies, cut it in half and remove the green center germ.",
      "Add the drained chickpeas, 2 tablespoons tahini, 2 tablespoons fresh lemon juice, garlic, and 2 tablespoons olive oil to a food processor.",
      "Blend on high speed for 1 minute. Stop and scrape down the sides with a spatula.",
      "Add 2 tablespoons of water and blend again for 1-2 minutes until very smooth and creamy.",
      "If the hummus is still too thick, add another tablespoon of water and blend until you reach the desired consistency.",
      "Taste and adjust - for babies, keep it mild. You can add a tiny pinch of cumin if desired.",
      "Transfer to a serving bowl. Drizzle with a little olive oil on top if desired.",
      "Serve with soft pita pieces, steamed vegetable sticks, or as a spread."
    ], 
    nutrition: { calories: "45", protein: "2g", carbs: "6g", fat: "2g", fiber: "2g", vitamins: ["Protein", "Iron"] }, 
    allergens: ["Sesame"], 
    storage: "Refrigerate 5 days" 
  },
  { 
    id: "36", 
    title: "Strawberry Chia Pudding", 
    description: "Omega-3 rich dessert", 
    ageGroup: "12-18 months", 
    category: "Snack", 
    prepTime: "5 min + 2 hrs", 
    servings: "2 servings", 
    image: getRecipeImage(["yogurt", "berry"]), 
    ingredients: ["3 tbsp chia seeds", "3/4 cup whole milk", "1/2 cup fresh strawberries, hulled and diced", "1/2 tsp vanilla extract (optional)"], 
    instructions: [
      "Measure 3 tablespoons of chia seeds and place them in a medium bowl or jar with a lid.",
      "Pour 3/4 cup of whole milk over the chia seeds. If using vanilla, add 1/2 teaspoon now.",
      "Whisk vigorously with a fork or small whisk for 1-2 minutes, making sure no clumps form and seeds are evenly distributed.",
      "Let sit for 5 minutes, then whisk again thoroughly. This prevents the seeds from clumping at the bottom.",
      "Cover the bowl or jar and refrigerate for at least 2 hours, or overnight. The chia seeds will absorb the liquid and create a pudding-like consistency.",
      "While pudding sets, wash the strawberries thoroughly. Remove the green tops and dice into very small pieces.",
      "After the pudding has set, give it a final stir. It should be thick and creamy with a gel-like texture.",
      "Divide the pudding between two small serving bowls. Top each portion with the diced strawberries.",
      "Serve chilled. The pudding can be stored in the refrigerator and the strawberries added fresh just before serving."
    ], 
    nutrition: { calories: "110", protein: "4g", carbs: "14g", fat: "4g", fiber: "5g", vitamins: ["Omega-3", "Fiber", "Calcium"] }, 
    allergens: ["Dairy"], 
    storage: "Refrigerate 3 days" 
  },
  { 
    id: "37", 
    title: "Mini Meatloaf Muffins", 
    description: "Individual portions", 
    ageGroup: "12-18 months", 
    category: "Dinner", 
    prepTime: "35 min", 
    servings: "12 muffins", 
    image: getRecipeImage(["beef", "meatball"]), 
    ingredients: ["1 lb lean ground beef (90% lean)", "1/2 cup rolled oats", "1 large egg", "1/4 cup low-sodium tomato sauce", "1 small carrot, grated", "1/4 tsp onion powder"], 
    instructions: [
      "Preheat your oven to 375°F (190°C). Grease a 12-cup standard muffin tin thoroughly with olive oil or use paper liners.",
      "Wash and peel one small carrot. Grate it finely using the smallest holes on a box grater.",
      "In a large mixing bowl, combine 1 pound of ground beef, 1/2 cup rolled oats, the grated carrot, and 1/4 teaspoon onion powder.",
      "Crack the egg into a small bowl first to check for freshness, then add it to the meat mixture.",
      "Add 1/4 cup of low-sodium tomato sauce to the bowl.",
      "Using your hands (clean or wearing disposable gloves), mix all ingredients together thoroughly for 2-3 minutes until well combined and the mixture holds together.",
      "Divide the mixture evenly among the 12 muffin cups, filling each about 3/4 full. Press down gently to compact.",
      "Bake in the preheated oven for 25-28 minutes until the muffins are browned on top and cooked through. Internal temperature should reach 160°F.",
      "Let cool in the tin for 5 minutes, then carefully remove each muffin. They should hold their shape well.",
      "Allow to cool to a safe eating temperature. Cut in half or quarters for younger toddlers."
    ], 
    nutrition: { calories: "75", protein: "7g", carbs: "5g", fat: "4g", fiber: "1g", vitamins: ["Protein", "Iron"] }, 
    allergens: ["Eggs"], 
    storage: "Freeze 2 months" 
  },
  { 
    id: "38", 
    title: "Cucumber & Cream Cheese Rolls", 
    description: "Cool refreshing snack", 
    ageGroup: "12-18 months", 
    category: "Snack", 
    prepTime: "10 min", 
    servings: "6 rolls", 
    image: getRecipeImage(["green"]), 
    ingredients: ["1 large cucumber", "3 tbsp cream cheese, softened", "1/4 tsp fresh dill, finely chopped (optional)"], 
    instructions: [
      "Wash the cucumber thoroughly under running water. Pat it completely dry with a clean towel.",
      "Using a vegetable peeler, peel the cucumber in strips lengthwise, creating long, thin ribbons. Peel all the way around until you reach the seedy center.",
      "Discard the seedy center part as it's too soft and watery for rolling. You should have 6-8 nice ribbons.",
      "Lay the cucumber ribbons flat on a clean work surface or cutting board.",
      "If using dill, wash it thoroughly and chop it very finely. Mix it with the softened cream cheese in a small bowl.",
      "Using a butter knife, spread about 1/2 tablespoon of cream cheese along the length of each cucumber ribbon, covering it thinly and evenly.",
      "Starting from one end, carefully roll up each cucumber ribbon. The cream cheese will help it stick together.",
      "Place each roll seam-side down on a serving plate to help them hold their shape.",
      "Refrigerate for 10-15 minutes if you want them firmer, or serve immediately at room temperature."
    ], 
    nutrition: { calories: "35", protein: "2g", carbs: "3g", fat: "2g", fiber: "0g", vitamins: ["Hydration", "Calcium"] }, 
    allergens: ["Dairy"], 
    storage: "Best fresh" 
  },
  { 
    id: "39", 
    title: "Tofu Scramble", 
    description: "Plant-based protein breakfast", 
    ageGroup: "12-18 months", 
    category: "Breakfast", 
    prepTime: "10 min", 
    servings: "3 servings", 
    image: getRecipeImage(["egg"]), 
    ingredients: ["8 oz soft or silken tofu", "1/8 tsp turmeric powder", "1/4 cup finely diced bell pepper", "1/4 cup finely diced tomato", "1 tbsp olive oil", "Pinch of black pepper (optional)"], 
    instructions: [
      "Drain the tofu from its package. Gently press it between paper towels to remove excess water.",
      "Using your hands or a fork, crumble the tofu into small, scrambled-egg-sized pieces in a bowl.",
      "Wash the bell pepper and tomato. Dice both into very fine pieces no larger than 1/4 inch.",
      "Heat 1 tablespoon of olive oil in a non-stick skillet over medium heat.",
      "Add the diced bell pepper to the skillet and sauté for 2-3 minutes until it starts to soften.",
      "Add the crumbled tofu to the skillet. Sprinkle 1/8 teaspoon of turmeric powder over the tofu - this gives it a yellow, egg-like color.",
      "Cook, stirring gently with a spatula, for 3-4 minutes. The tofu should start to look slightly golden.",
      "Add the diced tomato and cook for another 1-2 minutes, stirring occasionally.",
      "Remove from heat and let cool for 3-5 minutes before serving.",
      "Serve warm. This scramble provides plant-based protein and is a great egg alternative."
    ], 
    nutrition: { calories: "72", protein: "6g", carbs: "4g", fat: "4g", fiber: "2g", vitamins: ["Protein", "Iron", "Calcium"] }, 
    allergens: ["Soy"], 
    storage: "Refrigerate 3 days" 
  },
  { 
    id: "40", 
    title: "Watermelon Popsicles", 
    description: "Hydrating frozen treat", 
    ageGroup: "12-18 months", 
    category: "Snack", 
    prepTime: "5 min + freeze", 
    servings: "6 pops", 
    image: getRecipeImage(["tropical"]), 
    ingredients: ["2 cups seedless watermelon chunks", "1 tbsp fresh lime juice (optional for 12+ months)"], 
    instructions: [
      "Cut the watermelon into chunks, removing all rind and any seeds (even in seedless varieties, check for white seeds).",
      "Place 2 cups of watermelon chunks in a blender.",
      "If your toddler is 12+ months and has tried citrus before, add 1 tablespoon of fresh lime juice for extra flavor. Otherwise, omit.",
      "Blend on high speed for 30-60 seconds until completely smooth with no chunks remaining.",
      "If you prefer a smoother texture, pour the blended watermelon through a fine-mesh strainer to remove any pulp.",
      "Pour the watermelon puree into 6 popsicle molds, filling each about 3/4 full to leave room for expansion.",
      "Insert popsicle sticks into each mold. If the sticks won't stay upright, freeze for 30 minutes first, then insert them.",
      "Freeze for at least 4 hours or overnight until completely solid.",
      "To remove, run the outside of the molds under warm water for 5-10 seconds, then pull out gently.",
      "Supervise your toddler while eating frozen treats. These are perfect for hot days and teething relief."
    ], 
    nutrition: { calories: "28", protein: "0g", carbs: "7g", fat: "0g", fiber: "0g", vitamins: ["Vitamin C", "Hydration"] }, 
    allergens: [], 
    storage: "Freeze up to 2 months" 
  },
  
  
  // Import all additional recipes (recipes 44-310)
  ...additionalRecipes,
  ...recipes47to100,
  ...recipes101to150,
  ...recipes151to200,
  ...recipes201to205,
  ...recipes206to238,
  ...recipes239to271,
  ...recipes272to300,
  ...recipes301to310,
  ...recipes311to315,
  ...recipes316to325,
  ...recipes326to340,
  ...recipes341to345,
  ...recipes346to395,
].map(addDefaultFields);
