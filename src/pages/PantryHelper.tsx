import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { recipes, getMealCategory, Recipe } from "@/data/recipes";
import { 
  Send, Sparkles, Clock, ArrowRight, Refrigerator, X, Plus, 
  ChefHat, Filter, Bookmark, BookmarkCheck, Trash2, ShieldCheck, 
  Flame, CheckCircle2, AlertCircle, RefreshCw, BookOpen, Heart,
  Utensils, Baby, Sparkle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import pantryHeroBanner from "@/assets/pantry-hero-banner.webp";


export interface CustomGeneratedRecipe {
  id: string;
  title: string;
  description: string;
  ageGroup: string;
  category: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
  safetyTip: string;
  selectedIngredients: string[];
  unusedIngredients: string[];
  pairingExplanation: string;
  createdAt: string;
}

const SAVED_RECIPES_STORAGE_KEY = "babybites_saved_custom_recipes_v1";

// Ingredient profiles for harmonious culinary clustering
const INGREDIENT_PROFILES: Record<string, string[]> = {
  fruits: ["banana", "apple", "pear", "mango", "peach", "apricot", "strawberry", "blueberry", "raspberry", "kiwi", "melon", "papaya", "prune", "orange", "plum", "berries"],
  grains: ["oats", "oatmeal", "rice", "quinoa", "chia", "orzo", "pasta", "barley", "porridge"],
  proteins: ["chicken", "turkey", "beef", "salmon", "cod", "fish", "egg", "egg yolk", "tofu", "lentils", "chickpeas", "beans"],
  starchyVeggies: ["sweet potato", "potato", "carrot", "butternut squash", "pumpkin", "parsnip", "corn", "squash"],
  greenVeggies: ["broccoli", "spinach", "peas", "zucchini", "cauliflower", "green beans", "asparagus", "kale"],
  dairyFats: ["yogurt", "ricotta", "cottage cheese", "cheddar", "avocado", "coconut milk"]
};

function classifyIngredient(ing: string): string {
  const lower = ing.toLowerCase().trim();
  for (const [category, list] of Object.entries(INGREDIENT_PROFILES)) {
    if (list.some(item => lower.includes(item) || item.includes(lower))) {
      return category;
    }
  }
  return "other";
}

// Intelligent Culinary Clustering: Selects 2 to 4 harmonious ingredients instead of mixing everything
function selectHarmoniousIngredients(ingredients: string[], variationIndex: number = 0) {
  const clean = ingredients.map(i => i.trim().toLowerCase()).filter(Boolean);
  if (clean.length <= 3) {
    return { 
      selected: clean, 
      unused: [], 
      mealType: "natural",
      explanation: `All ${clean.length} ingredients blend harmoniously for your baby.`
    };
  }

  const categorized: Record<string, string[]> = {
    fruits: [],
    grains: [],
    proteins: [],
    starchyVeggies: [],
    greenVeggies: [],
    dairyFats: [],
    other: []
  };

  clean.forEach(ing => {
    const cat = classifyIngredient(ing);
    categorized[cat].push(ing);
  });

  const combos: Array<{ selected: string[]; mealType: string; explanation: string }> = [];

  // Combo Option A: Savory Lunch/Dinner (Protein + Starchy Veggie + Green Veggie)
  if (categorized.proteins.length > 0 && categorized.starchyVeggies.length > 0) {
    const selected = [
      categorized.proteins[0],
      categorized.starchyVeggies[0],
      categorized.greenVeggies[0] || categorized.starchyVeggies[1] || categorized.dairyFats[0]
    ].filter(Boolean);
    combos.push({
      selected,
      mealType: "savory",
      explanation: `Paired healthy protein (${categorized.proteins[0]}) with comforting veggies for a savory lunch/dinner.`
    });
  }

  // Combo Option B: Warm Morning Breakfast / Porridge (Grains + Sweet Fruits)
  if (categorized.grains.length > 0 && categorized.fruits.length > 0) {
    const selected = [
      categorized.grains[0],
      categorized.fruits[0],
      categorized.fruits[1] || categorized.dairyFats[0]
    ].filter(Boolean);
    combos.push({
      selected,
      mealType: "breakfast",
      explanation: `Paired nourishing ${categorized.grains[0]} with natural sweet ${categorized.fruits[0]} for a gentle morning breakfast.`
    });
  }

  // Combo Option C: Pure Garden Veggie Mash (Starchy Veggie + Green Veggie + Healthy Fat)
  if (categorized.starchyVeggies.length > 0 && categorized.greenVeggies.length > 0) {
    const selected = [
      categorized.starchyVeggies[0],
      categorized.greenVeggies[0],
      categorized.starchyVeggies[1] || categorized.dairyFats[0]
    ].filter(Boolean);
    combos.push({
      selected,
      mealType: "veggie",
      explanation: `Combined vibrant, vitamin-rich garden vegetables (${selected.join(", ")}) for healthy digestion and fiber.`
    });
  }

  // Combo Option D: Gentle Fruit Parfait (Fruits + Dairy/Fat)
  if (categorized.fruits.length >= 2) {
    const selected = [
      categorized.fruits[0],
      categorized.fruits[1],
      categorized.dairyFats[0] || categorized.grains[0]
    ].filter(Boolean);
    combos.push({
      selected,
      mealType: "fruit",
      explanation: `Paired sweet fruits (${categorized.fruits[0]} & ${categorized.fruits[1]}) for a gentle digestive snack.`
    });
  }

  // Pick the combo based on variationIndex
  let chosen = combos[variationIndex % combos.length];
  if (!chosen) {
    const selected = clean.slice(0, 3);
    chosen = {
      selected,
      mealType: "custom",
      explanation: `Selected 3 compatible ingredients for optimal texture and baby digestion.`
    };
  }

  const unused = clean.filter(i => !chosen.selected.includes(i));
  return {
    selected: chosen.selected,
    unused,
    mealType: chosen.mealType,
    explanation: chosen.explanation
  };
}

// Intelligent Culinary Generation Engine tailored for infant & toddler nutrition
function generateCustomRecipe(
  allIngredients: string[], 
  targetAge: string,
  variationIndex: number = 0
): CustomGeneratedRecipe {
  const pairing = selectHarmoniousIngredients(allIngredients, variationIndex);
  const cleanIngs = pairing.selected;

  const primary = cleanIngs[0] ? cleanIngs[0].charAt(0).toUpperCase() + cleanIngs[0].slice(1) : "Nourishing";
  const secondary = cleanIngs[1] ? cleanIngs[1].charAt(0).toUpperCase() + cleanIngs[1].slice(1) : "";
  const third = cleanIngs[2] ? cleanIngs[2].charAt(0).toUpperCase() + cleanIngs[2].slice(1) : "";

  let title = "";
  let category = "Puree & Mash";

  if (pairing.mealType === "breakfast") {
    title = third ? `Warm ${primary}, ${secondary} & ${third} Morning Porridge` : `Creamy ${primary} & ${secondary} Breakfast Porridge`;
    category = "Breakfast & Porridge";
  } else if (pairing.mealType === "savory") {
    title = third ? `Gentle ${primary}, ${secondary} & ${third} Baby Mash` : `Savory ${primary} & ${secondary} Lunch Puree`;
    category = "Savory Lunch / Dinner";
  } else if (pairing.mealType === "fruit") {
    title = third ? `Silky ${primary}, ${secondary} & ${third} Fruit Melody` : `Velvety ${primary} & ${secondary} Puree`;
    category = "Fruit Puree & Snack";
  } else {
    title = secondary ? `Gentle ${primary} & ${secondary} Baby Bowl` : `Wholesome ${primary} First Bites`;
    category = "Puree & Mash";
  }

  // Age group labeling
  let ageLabel = "6+ Months • Adaptable Texture";
  if (targetAge === "6-8") ageLabel = "6–8 Months • Smooth Puree or Soft Spear";
  else if (targetAge === "9-11") ageLabel = "9–11 Months • Fork-Mashed / Pincer Grasp";
  else if (targetAge === "12-23") ageLabel = "12–23 Months • Soft Toddler Finger Food";
  else if (targetAge === "24") ageLabel = "24+ Months • Family-Style Plate";

  // Detailed recipe ingredients with realistic baby measurements
  const detailedIngredients: string[] = [];
  cleanIngs.forEach((ing, idx) => {
    const capitalized = ing.charAt(0).toUpperCase() + ing.slice(1);
    if (idx === 0) {
      detailedIngredients.push(`1 small or 1/2 cup ${capitalized} (freshly washed, peeled, and cut into steam-friendly pieces)`);
    } else if (idx === 1) {
      detailedIngredients.push(`1/2 cup ${capitalized} (cleaned and diced into small, tender cubes)`);
    } else {
      detailedIngredients.push(`2–3 tablespoons ${capitalized} (finely prepped for baby texture)`);
    }
  });

  // Always append standard safe infant moisture & healthy fat essentials
  detailedIngredients.push("1 teaspoon cold-pressed extra virgin olive oil (or unsalted butter for essential brain fats)");
  detailedIngredients.push("2–4 tablespoons warm breastmilk, formula, or vegetable steaming broth to adjust texture");

  // Step-by-step instructions
  const instructions = [
    `Wash, gently peel, and chop ${cleanIngs.join(" and ")} into small, uniform cubes so they cook evenly.`,
    `Place the ingredients in a steamer basket over boiling water. Cover and steam gently over medium heat for 12–15 minutes until completely fork-tender.`,
    `Texture stage: Transfer to a clean bowl. For 6–8 months, blend until silky smooth using cooking liquid or milk. For 9+ months, mash thoroughly with a fork for soft chewing practice. For 12+ months, leave as soft finger bites.`,
    `Gently fold in the healthy oil or butter for brain-building fatty acids. Let cool to lukewarm, and always test the temperature on the inside of your wrist before serving to your baby.`,
  ];

  const safetyTip = "Never add salt, sugar, honey, or cow's milk before 12 months. If introducing any of these ingredients for the first time, offer in the morning and observe baby for any sensitivities.";

  return {
    id: "custom-" + Date.now(),
    title,
    description: `A pediatrician-aligned recipe crafted with love around ${cleanIngs.join(", ")}. Balanced, gentle on delicate stomachs, and packed with wholesome nutrition.`,
    ageGroup: ageLabel,
    category,
    prepTime: "10 mins",
    cookTime: "15 mins",
    servings: "2–3 baby portions (Freezer friendly)",
    ingredients: detailedIngredients,
    instructions,
    safetyTip,
    selectedIngredients: cleanIngs,
    unusedIngredients: pairing.unused,
    pairingExplanation: pairing.explanation,
    createdAt: new Date().toISOString(),
  };
}

export const PantryHelper: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [activeIngredients, setActiveIngredients] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"search" | "saved">("search");
  const [variationCount, setVariationCount] = useState(0);

  // Generated Recipe state
  const [generatedRecipe, setGeneratedRecipe] = useState<CustomGeneratedRecipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Saved Recipes collection
  const [savedRecipes, setSavedRecipes] = useState<CustomGeneratedRecipe[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_RECIPES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_RECIPES_STORAGE_KEY, JSON.stringify(savedRecipes));
    } catch (e) {
      console.error(e);
    }
  }, [savedRecipes]);

  // Handle adding ingredients from text input
  const handleAddFromInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    // Split by commas, "and", "e", or newlines
    const rawItems = inputText
      .split(/[,;\n]|(?:\band\b)|(?:\be\b)/i)
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 1);

    if (rawItems.length === 0) return;

    setActiveIngredients((prev) => {
      const set = new Set([...prev, ...rawItems]);
      return Array.from(set);
    });

    setInputText("");
    setGeneratedRecipe(null);
    toast.success(`Added ${rawItems.length} ingredient(s) to your pantry!`);
  };

  const removeIngredient = (ing: string) => {
    setActiveIngredients((prev) => prev.filter((i) => i !== ing));
    setGeneratedRecipe(null);
  };

  const clearAll = () => {
    setActiveIngredients([]);
    setGeneratedRecipe(null);
  };

  // Match existing recipes from database
  // MANDATORY REQUIREMENT: Must match AT LEAST 2 ingredients (matchedCount >= 2)!
  const matchedRecipes = useMemo(() => {
    if (activeIngredients.length === 0) return [];

    return recipes
      .map((recipe) => {
        const ingredientsText = recipe.ingredients.join(" ").toLowerCase();
        const recipeTitle = recipe.title.toLowerCase();

        // Check which ingredients match
        const matched = activeIngredients.filter((ing) => {
          return ingredientsText.includes(ing) || recipeTitle.includes(ing);
        });

        const matchCount = matched.length;

        // STRICT RULE: At least 2 ingredients from the recipe must match!
        if (matchCount < 2) return null;

        // Age filter check
        if (selectedAge !== "All") {
          const recAge = recipe.ageGroup.toLowerCase();
          const target = selectedAge.toLowerCase();
          let matchAge = false;
          if (target.includes("6-8") && (recAge.includes("6-9") || recAge.includes("6-8"))) matchAge = true;
          else if (target.includes("9-11") && (recAge.includes("9-12") || recAge.includes("9-11"))) matchAge = true;
          else if (target.includes("12-23") && (recAge.includes("12-18") || recAge.includes("18-24") || recAge.includes("12-23"))) matchAge = true;
          else if (target.includes("24") && (recAge.includes("24") || recAge.includes("18-24"))) matchAge = true;
          if (!matchAge) return null;
        }

        const totalRecipeIngs = recipe.ingredients.length;
        const matchPercent = Math.min(100, Math.round((matchCount / Math.min(totalRecipeIngs, 4)) * 100));

        // Find missing ingredients
        const missing = recipe.ingredients.filter((item) => {
          const lower = item.toLowerCase();
          return !matched.some((m) => lower.includes(m));
        }).slice(0, 3);

        return {
          recipe,
          matchCount,
          matchPercent,
          matched,
          missing,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.matchCount - a.matchCount || b.matchPercent - a.matchPercent)
      .slice(0, 30);
  }, [activeIngredients, selectedAge]);

  // Generate Custom Recipe with harmonious pairing logic
  const handleTriggerGenerate = (variation: number = 0) => {
    if (activeIngredients.length === 0) {
      toast.error("Please add at least 1 ingredient first.");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateCustomRecipe(activeIngredients, selectedAge, variation);
      setGeneratedRecipe(generated);
      setIsGenerating(false);
      setVariationCount(variation);
      toast.success("✨ Crafted a balanced, loving recipe for your baby!");
    }, 500);
  };

  // Save generated recipe to collection
  const handleSaveRecipe = (recipeToSave: CustomGeneratedRecipe) => {
    const alreadySaved = savedRecipes.some(r => r.id === recipeToSave.id || r.title === recipeToSave.title);
    if (alreadySaved) {
      toast.info("This recipe is already in your saved collection!");
      return;
    }

    setSavedRecipes(prev => [recipeToSave, ...prev]);
    toast.success("🎉 Recipe saved to your personal collection!");
  };

  const handleDeleteSavedRecipe = (id: string) => {
    setSavedRecipes(prev => prev.filter(r => r.id !== id));
    toast.success("Recipe removed from saved collection.");
  };

  const isCurrentGeneratedSaved = generatedRecipe 
    ? savedRecipes.some(r => r.id === generatedRecipe.id || r.title === generatedRecipe.title)
    : false;

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#121614] pb-24 pt-3 sm:pt-5 px-3.5 sm:px-5 w-full max-w-2xl mx-auto min-w-0 overflow-x-hidden text-stone-900 dark:text-stone-100 transition-colors">
      {/* Warm Loving Header */}
      <div className="mb-6 w-full min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#EAF5EE] dark:bg-emerald-950/70 text-[#1E5E3A] dark:text-emerald-300 border border-[#CCE0D2] dark:border-emerald-800/60 shadow-2xs">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>Nourished With Love</span>
          </span>
          {savedRecipes.length > 0 && (
            <button
              onClick={() => setActiveTab(activeTab === "saved" ? "search" : "saved")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E5E3A] dark:text-emerald-400 bg-white dark:bg-stone-800 px-3 py-1 rounded-full border border-[#EBE8DF] dark:border-stone-700 shadow-2xs hover:bg-[#F3F6F3] dark:hover:bg-stone-700 transition-all cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#48B774]" />
              <span>{activeTab === "saved" ? "Back to Pantry" : `Saved (${savedRecipes.length})`}</span>
            </button>
          )}
        </div>

        {/* High-End Responsive Photographic Hero Banner */}
        <div className="rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-md border border-[#EBE8DF] dark:border-stone-800 mb-4 bg-white dark:bg-stone-900 transition-all">
          <img
            src={pantryHeroBanner}
            alt="What's in your pantry today? Nourishing Kitchen Companion"
            className="w-full h-auto object-cover block rounded-[24px] sm:rounded-[32px] hover:scale-[1.005] transition-transform duration-300"
            loading="eager"
          />
        </div>
      </div>

      {/* Main Tab Navigation: Saved vs Search */}
      {activeTab === "saved" ? (
        /* SAVED RECIPES TAB */
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#1E5E3A] dark:text-emerald-400 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#48B774]" /> 
              <span>Your Saved Custom Recipes ({savedRecipes.length})</span>
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("search")}
              className="rounded-full text-xs h-8 border-[#EBE8DF] dark:border-stone-700 text-forest dark:text-emerald-400"
            >
              Find More Recipes
            </Button>
          </div>

          {savedRecipes.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-[28px] border border-[#EBE8DF] dark:border-stone-800 shadow-xs">
              <Bookmark className="w-10 h-10 mx-auto text-gray-300 dark:text-stone-600 mb-2" />
              <p className="text-sm font-serif font-bold text-gray-800 dark:text-stone-200">No saved recipes yet</p>
              <p className="text-xs text-gray-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                When the assistant generates a custom recipe with your pantry ingredients, tap "Save Recipe" to keep it here forever.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedRecipes.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-[24px] bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800 shadow-xs relative"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF5EE] dark:bg-emerald-950/70 text-[#1E5E3A] dark:text-emerald-300">
                        {rec.category}
                      </span>
                      <h3 className="text-base font-serif font-bold text-gray-900 dark:text-stone-100 mt-1">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-stone-400">{rec.ageGroup}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSavedRecipe(rec.id)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      title="Delete recipe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-stone-300 mb-3 leading-relaxed">{rec.description}</p>

                  <div className="bg-[#FAF9F5] dark:bg-stone-800/50 p-3 rounded-xl border border-[#EBE8DF] dark:border-stone-800 mb-3">
                    <span className="text-xs font-bold text-[#1E5E3A] dark:text-emerald-400 block mb-1.5">Harmonious Ingredients:</span>
                    <ul className="text-xs text-gray-700 dark:text-stone-300 space-y-1 list-disc list-inside">
                      {rec.ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <span className="text-xs font-bold text-[#1E5E3A] dark:text-emerald-400 block">Preparation Steps:</span>
                    {rec.instructions.map((step, idx) => (
                      <div key={idx} className="flex gap-2 text-xs text-gray-700 dark:text-stone-300">
                        <span className="font-bold text-[#48B774] shrink-0">{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Pediatric Tip:</strong> {rec.safetyTip}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* SEARCH & PROCESS TAB */
        <>
          {/* Conversational Loving Input Card */}
          <div className="bg-white dark:bg-stone-900 rounded-[24px] sm:rounded-[28px] border border-[#EBE8DF] dark:border-stone-800 p-4 sm:p-5 shadow-[0_8px_30px_-6px_rgba(30,94,58,0.08)] mb-5 w-full min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="pantry-input" className="block text-xs font-bold uppercase tracking-wider text-[#1E5E3A] dark:text-emerald-400">
                Ingredients You Have On Hand
              </label>
              {activeIngredients.length > 0 && (
                <span className="text-[11px] font-semibold text-[#1E5E3A] dark:text-emerald-400 bg-[#EAF5EE] dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                  {activeIngredients.length} item{activeIngredients.length > 1 ? "s" : ""} in pantry
                </span>
              )}
            </div>

            <form onSubmit={handleAddFromInput} className="relative w-full min-w-0">
              <div className="relative flex items-center w-full min-w-0">
                <input
                  id="pantry-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type ingredients here (e.g. oats, banana, mango, sweet potato)..."
                  className="w-full min-w-0 h-12 sm:h-13 pl-4 pr-24 rounded-full border border-[#D5D0C3] dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-800/60 text-xs sm:text-sm text-gray-800 dark:text-stone-100 placeholder-gray-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#48B774] focus:bg-white dark:focus:bg-stone-800 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1E5E3A] hover:bg-[#16482c] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  <span>Add</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-stone-400 mt-1.5 px-1 leading-snug">
                Type ingredients separated by commas (e.g. <em>oats, banana, mango, orange</em>).
              </p>
            </form>

            {/* Active Ingredients Tags */}
            {activeIngredients.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-[#F1EFEA] dark:border-stone-800 w-full min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-stone-300">
                    Your Selected Ingredients ({activeIngredients.length}):
                  </span>
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full min-w-0">
                  {activeIngredients.map((ing) => (
                    <span
                      key={ing}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#EAF5EE] dark:bg-emerald-950/70 text-[#1E5E3A] dark:text-emerald-300 border border-[#CCE0D2] dark:border-emerald-800/70 text-xs font-semibold shadow-2xs animate-fade-in"
                    >
                      <span className="capitalize">{ing}</span>
                      <button
                        onClick={() => removeIngredient(ing)}
                        className="w-4 h-4 rounded-full hover:bg-forest/10 flex items-center justify-center text-gray-400 hover:text-forest transition-colors cursor-pointer"
                        aria-label={`Remove ${ing}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            </div>

          {/* Age Filter Tabs */}
          <div className="mb-5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar w-full max-w-full min-w-0">
            <span className="text-xs font-bold text-[#1E5E3A] dark:text-emerald-400 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Stage:
            </span>
            {[
              { id: "All", label: "👶 All Ages" },
              { id: "6-8", label: "6–8m Purees" },
              { id: "9-11", label: "9–11m Mashes" },
              { id: "12-23", label: "12–23m Finger Food" },
              { id: "24", label: "24+m Family" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedAge(tab.id)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedAge === tab.id
                    ? "bg-[#1E5E3A] text-white shadow-xs font-bold"
                    : "bg-white dark:bg-stone-800 text-gray-600 dark:text-stone-300 border border-[#EBE8DF] dark:border-stone-700 hover:bg-gray-50 dark:hover:bg-stone-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* GENERATE CUSTOM RECIPE CTA */}
          {activeIngredients.length > 0 && (
            <div className="mb-6 p-4 sm:p-5 rounded-[24px] bg-gradient-to-br from-[#1E5E3A] via-[#246B42] to-[#348A57] text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#A3EAC0]">
                    <Sparkles className="w-3.5 h-3.5" /> Smart Pediatric Pairing
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white mt-0.5">
                    Craft a Custom Recipe With Your Ingredients?
                  </h3>
                  <p className="text-xs text-white/90 mt-1 max-w-md leading-relaxed">
                    Our pediatric kitchen selects the 2–4 ingredients that truly pair harmoniously together, leaving incompatible ones out for other meals.
                  </p>
                </div>
                <Button
                  onClick={() => handleTriggerGenerate(0)}
                  disabled={isGenerating}
                  className="rounded-full bg-white hover:bg-white/90 text-[#1E5E3A] font-bold text-xs px-5 h-10 shadow-sm shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#48B774]" />
                  <span>{isGenerating ? "Crafting Recipe..." : "Generate Custom Dish"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* DISPLAY GENERATED RECIPE CARD */}
          {generatedRecipe && (
            <div className="mb-8 p-5 sm:p-6 rounded-[28px] bg-white dark:bg-stone-900 border-2 border-[#48B774] shadow-[0_10px_35px_-8px_rgba(72,183,116,0.18)] animate-fade-in">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF5EE] dark:bg-emerald-950/70 text-[#1E5E3A] dark:text-emerald-300 border border-[#CDE5D4] dark:border-emerald-800">
                  ✨ Custom Formulated Dish
                </span>
                <span className="text-xs text-gray-500 dark:text-stone-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#48B774]" /> Prep: {generatedRecipe.prepTime} • Cook: {generatedRecipe.cookTime}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 dark:text-stone-100 mt-1">
                {generatedRecipe.title}
              </h3>
              <p className="text-xs font-semibold text-[#48B774] mt-0.5">{generatedRecipe.ageGroup}</p>

              {/* Smart Pairing Explanation Box */}
              <div className="my-3 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#1E5E3A] dark:text-emerald-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Intelligent Pairing Logic:</span>
                </div>
                <p className="text-gray-700 dark:text-stone-300 leading-relaxed">
                  {generatedRecipe.pairingExplanation}
                </p>
                {generatedRecipe.unusedIngredients.length > 0 && (
                  <p className="text-[11px] text-gray-500 dark:text-stone-400 mt-1 italic">
                    💡 Remaining items ({generatedRecipe.unusedIngredients.join(", ")}) are left out so the dish stays gentle and tasty!
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-600 dark:text-stone-300 mt-2 leading-relaxed">{generatedRecipe.description}</p>

              {/* Servings */}
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF9F5] dark:bg-stone-800 border border-[#EBE8DF] dark:border-stone-700 text-xs text-gray-700 dark:text-stone-300">
                <Refrigerator className="w-3.5 h-3.5 text-[#48B774]" />
                <span>Yield: <strong>{generatedRecipe.servings}</strong></span>
              </div>

              {/* Ingredients */}
              <div className="mt-4 pt-4 border-t border-[#F1EFEA] dark:border-stone-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A] dark:text-emerald-400 mb-2">
                  Harmonious Ingredients with Safe Measurements:
                </h4>
                <ul className="space-y-1.5">
                  {generatedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-stone-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#48B774] shrink-0 mt-0.5" />
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div className="mt-4 pt-4 border-t border-[#F1EFEA] dark:border-stone-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E5E3A] dark:text-emerald-400 mb-2">
                  Step-by-Step Gentle Preparation:
                </h4>
                <div className="space-y-2">
                  {generatedRecipe.instructions.map((step, idx) => (
                    <div key={idx} className="flex gap-2 text-xs text-gray-700 dark:text-stone-300 bg-[#FAF9F5] dark:bg-stone-800/60 p-2.5 rounded-xl border border-[#EBE8DF] dark:border-stone-800">
                      <span className="font-bold text-[#48B774] shrink-0">{idx + 1}.</span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pediatric Safety Banner */}
              <div className="mt-4 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300">Pediatric Guidance:</strong>
                  <span className="text-[11px] leading-relaxed">{generatedRecipe.safetyTip}</span>
                </div>
              </div>

              {/* Actions: Save Recipe */}
              <div className="mt-5 pt-4 border-t border-[#F1EFEA] dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  onClick={() => handleSaveRecipe(generatedRecipe)}
                  className={`w-full sm:w-auto rounded-full text-xs font-bold px-5 h-10 shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                    isCurrentGeneratedSaved
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 cursor-default"
                      : "bg-[#1E5E3A] hover:bg-[#16482c] text-white"
                  }`}
                >
                  {isCurrentGeneratedSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Saved to Collection ✓</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>Save Recipe to Collection</span>
                    </>
                  )}
                </Button>

                {activeIngredients.length > 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTriggerGenerate(variationCount + 1)}
                    className="rounded-full text-xs h-9 border-[#EBE8DF] dark:border-stone-700 text-gray-600 dark:text-stone-300 hover:text-forest cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 mr-1.5" />
                    Try Another Flavor Combination
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Matched Recipes Section from Database (Min 2 Ingredients Rule) */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1E5E3A] dark:text-emerald-400">
                  Cookbook Recipes ({matchedRecipes.length})
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-stone-400">
                  Showing recipes that contain at least 2 of your selected ingredients.
                </p>
              </div>
              {matchedRecipes.length > 0 && (
                <span className="text-xs font-semibold text-[#48B774] flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" /> Top matches
                </span>
              )}
            </div>

            {activeIngredients.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-[28px] border border-[#EBE8DF] dark:border-stone-800 shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-3xl mx-auto mb-3 shadow-xs">
                  🥣
                </div>
                <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-lg">
                  Ready to turn ingredients into baby smiles
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Simply enter 2 or more ingredients above from your kitchen, and we'll instantly reveal wholesome meals you can cook right now.
                </p>
              </div>
            ) : matchedRecipes.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-[28px] border border-[#EBE8DF] dark:border-stone-800 shadow-xs">
                <span className="text-4xl block mb-2">🥣</span>
                <h3 className="font-serif font-bold text-gray-900 dark:text-stone-100 text-base">
                  No 2+ ingredient matches found in cookbook
                </h3>
                <p className="text-xs text-gray-500 dark:text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  We don't recommend recipes with only 1 matching ingredient so you don't have to buy lots of groceries! But our assistant can craft a custom recipe with your ingredients right now:
                </p>
                <Button
                  onClick={() => handleTriggerGenerate(0)}
                  disabled={isGenerating}
                  className="mt-4 rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white text-xs font-bold px-5 h-10 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#48B774]" />
                  <span>{isGenerating ? "Generating..." : "Generate Custom Recipe Now"}</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 w-full min-w-0">
                {matchedRecipes.map(({ recipe, matchCount, matchPercent, matched, missing }) => {
                  const cat = getMealCategory(recipe);

                  return (
                    <Link
                      key={recipe.id}
                      to={`/recipe/${recipe.id}`}
                      className="block p-3 sm:p-3.5 rounded-[20px] sm:rounded-[24px] bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5 w-full min-w-0 overflow-hidden"
                    >
                      <div className="flex items-center gap-3 sm:gap-3.5 w-full min-w-0">
                        {/* Realistic Photo */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[16px] sm:rounded-[20px] overflow-hidden bg-gray-100 dark:bg-stone-800 shrink-0 border border-[#EBE8DF] dark:border-stone-700 relative">
                          <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute top-1.5 left-1.5">
                            <span className="px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold">
                              {cat}
                            </span>
                          </div>
                        </div>

                        {/* Recipe Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-[#EAF5EE] dark:bg-emerald-950/70 text-[#1E5E3A] dark:text-emerald-300 text-[10px] font-bold">
                              ✓ {matchCount} matching ingredients
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-stone-500 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> {recipe.prepTime}
                            </span>
                          </div>

                          <h3 className="font-serif font-bold text-gray-900 dark:text-stone-100 text-sm leading-snug line-clamp-1 group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors">
                            {recipe.title}
                          </h3>

                          {/* Matching ingredients chips */}
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {matched.map((m) => (
                              <span
                                key={m}
                                className="text-[10px] bg-[#EAF5EE] dark:bg-emerald-950/70 text-[#1E5E3A] dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-medium"
                              >
                                ✓ {m}
                              </span>
                            ))}
                            {missing.length > 0 && (
                              <span className="text-[10px] text-gray-400 dark:text-stone-500">
                                + needs: {missing.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-forest dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PantryHelper;
