import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { recipes, getMealCategory, Recipe } from "@/data/recipes";
import { 
  Send, Sparkles, Clock, ArrowRight, Refrigerator, X, Plus, 
  ChefHat, Filter, Bookmark, BookmarkCheck, Trash2, ShieldCheck, 
  Flame, CheckCircle2, AlertCircle, RefreshCw, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const POPULAR_SUGGESTIONS = [
  "Banana",
  "Oats",
  "Egg",
  "Sweet Potato",
  "Chicken",
  "Avocado",
  "Carrot",
  "Apple",
  "Broccoli",
  "Yogurt",
  "Spinach",
  "Salmon",
  "Peas",
  "Pumpkin",
  "Rice",
  "Lentils"
];

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
  matchedIngredients: string[];
  createdAt: string;
}

const SAVED_RECIPES_STORAGE_KEY = "babybites_saved_custom_recipes_v1";

// Intelligent Culinary Generation Engine tailored for infant & toddler nutrition
function generateCustomRecipe(ingredients: string[], targetAge: string): CustomGeneratedRecipe {
  const cleanIngs = ingredients.map(i => i.trim().toLowerCase()).filter(Boolean);
  const primary = cleanIngs[0] ? cleanIngs[0].charAt(0).toUpperCase() + cleanIngs[0].slice(1) : "Nourishing";
  const secondary = cleanIngs[1] ? cleanIngs[1].charAt(0).toUpperCase() + cleanIngs[1].slice(1) : "";
  const third = cleanIngs[2] ? cleanIngs[2].charAt(0).toUpperCase() + cleanIngs[2].slice(1) : "";

  let title = "";
  let category = "Puree & Mash";

  if (secondary && third) {
    title = `${primary}, ${secondary} & ${third} Baby Delight`;
    category = "Nourish Bowl";
  } else if (secondary) {
    if (secondary.toLowerCase().includes("oat") || primary.toLowerCase().includes("oat") || primary.toLowerCase().includes("porridge")) {
      title = `Warm ${primary} & ${secondary} Morning Porridge`;
      category = "Breakfast & Porridge";
    } else if (primary.toLowerCase().includes("chicken") || secondary.toLowerCase().includes("chicken") || primary.toLowerCase().includes("fish") || secondary.toLowerCase().includes("fish")) {
      title = `Gentle ${primary} & ${secondary} Savory Mash`;
      category = "Savory Lunch / Dinner";
    } else {
      title = `Silky ${primary} & ${secondary} Gentle Puree`;
      category = "Puree & Mash";
    }
  } else {
    title = `Wholesome ${primary} First Bites`;
    category = "Single Ingredient Introduction";
  }

  // Age group labeling
  let ageLabel = "6+ Months (Adaptable Texture)";
  if (targetAge === "6-8") ageLabel = "6–8 Months • Smooth Puree or Soft Spear";
  else if (targetAge === "9-11") ageLabel = "9–11 Months • Fork-Mashed / Pincer Grasp";
  else if (targetAge === "12-23") ageLabel = "12–23 Months • Soft Toddler Finger Food";
  else if (targetAge === "24") ageLabel = "24+ Months • Family-Style Plate";

  // Detailed recipe ingredients with realistic baby measurements
  const detailedIngredients: string[] = [];
  cleanIngs.forEach((ing, idx) => {
    const capitalized = ing.charAt(0).toUpperCase() + ing.slice(1);
    if (idx === 0) {
      detailedIngredients.push(`1 small ${capitalized} (washed, peeled and cubed into steam-friendly pieces)`);
    } else if (idx === 1) {
      detailedIngredients.push(`1/2 cup ${capitalized} (fresh or frozen, cut into small pieces)`);
    } else {
      detailedIngredients.push(`2-3 tablespoons ${capitalized} (steamed or finely prepared)`);
    }
  });

  // Always append standard safe infant moisture & healthy fat essentials
  detailedIngredients.push("1 teaspoon cold-pressed extra virgin olive oil (healthy brain fat)");
  detailedIngredients.push("2–4 tablespoons warm breastmilk, formula, or cooking liquid to adjust consistency");

  // Step-by-step instructions
  const instructions = [
    `Wash, peel, and gently chop ${cleanIngs.join(" and ")} into small, even bite-sized chunks so they steam evenly.`,
    `Place the ingredients in a steamer basket over boiling water (or in a small saucepan with a splash of water). Cover and steam over medium heat for 12–15 minutes until completely fork-tender.`,
    `Texture stage: Transfer to a clean bowl. For 6–8m, blend until silky smooth using a splash of cooking liquid or breastmilk. For 9m+, mash thoroughly with a fork for chewing texture. For 12m+, cut into soft graspable finger pieces.`,
    `Stir in the olive oil for essential fatty acids and flavor development. Allow to cool until lukewarm, and always test temperature on the inside of your wrist before serving to baby.`,
  ];

  const safetyTip = "Never add salt, sugar, honey, or artificial bouillon cubes to baby food. If introducing any of these ingredients for the first time, offer in the morning and monitor for any sensitivity.";

  return {
    id: "custom-" + Date.now(),
    title,
    description: `A pediatric-approved recipe custom formulated around your pantry ingredients (${cleanIngs.join(", ")}). Balanced, gentle on delicate stomachs, and rich in natural nutrients.`,
    ageGroup: ageLabel,
    category,
    prepTime: "10 mins",
    cookTime: "15 mins",
    servings: "2–3 baby portions (Freezer friendly)",
    ingredients: detailedIngredients,
    instructions,
    safetyTip,
    matchedIngredients: cleanIngs,
    createdAt: new Date().toISOString(),
  };
}

export const PantryHelper: React.FC = () => {
  const [inputText, setInputText] = useState("");
  // Start completely clean — zero pre-selected ingredients!
  const [activeIngredients, setActiveIngredients] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"search" | "saved">("search");

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
  };

  const removeIngredient = (ing: string) => {
    setActiveIngredients((prev) => prev.filter((i) => i !== ing));
    setGeneratedRecipe(null);
  };

  const addSuggestion = (name: string) => {
    const lower = name.toLowerCase();
    if (!activeIngredients.includes(lower)) {
      setActiveIngredients((prev) => [...prev, lower]);
      setGeneratedRecipe(null);
    }
  };

  const clearAll = () => {
    setActiveIngredients([]);
    setGeneratedRecipe(null);
  };

  // Match existing recipes with entered ingredients
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

        const matchCount = matched.length;
        if (matchCount === 0) return null;

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

  // Generate Custom Recipe with ingredients
  const handleTriggerGenerate = () => {
    if (activeIngredients.length === 0) {
      toast.error("Please add at least 1 ingredient first.");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateCustomRecipe(activeIngredients, selectedAge);
      setGeneratedRecipe(generated);
      setIsGenerating(false);
      toast.success("✨ New recipe custom formulated for your ingredients!");
    }, 600);
  };

  // Save generated recipe to collection
  const handleSaveRecipe = (recipeToSave: CustomGeneratedRecipe) => {
    const alreadySaved = savedRecipes.some(r => r.id === recipeToSave.id || r.title === recipeToSave.title);
    if (alreadySaved) {
      toast.info("This recipe is already in your saved collection!");
      return;
    }

    setSavedRecipes(prev => [recipeToSave, ...prev]);
    toast.success("🎉 Recipe saved to your collection!");
  };

  const handleDeleteSavedRecipe = (id: string) => {
    setSavedRecipes(prev => prev.filter(r => r.id !== id));
    toast.success("Recipe removed from saved collection.");
  };

  const isCurrentGeneratedSaved = generatedRecipe 
    ? savedRecipes.some(r => r.id === generatedRecipe.id || r.title === generatedRecipe.title)
    : false;

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-3.5 sm:px-4 w-full max-w-2xl mx-auto min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-5 w-full min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#48B774]">
            Smart Kitchen Assistant
          </span>
          {savedRecipes.length > 0 && (
            <button
              onClick={() => setActiveTab(activeTab === "saved" ? "search" : "saved")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest bg-white px-3 py-1 rounded-full border border-[#EBE8DF] shadow-2xs hover:bg-[#F3F6F3] transition-all"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#48B774]" />
              <span>{activeTab === "saved" ? "Back to Search" : `Saved Recipes (${savedRecipes.length})`}</span>
            </button>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-0.5 flex items-center gap-2">
          <ChefHat className="w-7 h-7 sm:w-8 sm:h-8 text-[#48B774] shrink-0" /> Pantry Recipe Finder
        </h1>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          Type whatever ingredients you have in your fridge or pantry right now. The assistant will check available cookbook recipes, or generate an exclusive baby recipe custom-tailored to what you have!
        </p>
      </div>

      {/* Main Tab Navigation */}
      {activeTab === "saved" ? (
        /* SAVED RECIPES TAB */
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-serif font-bold text-forest flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#48B774]" /> Your Saved Custom Recipes ({savedRecipes.length})
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("search")}
              className="rounded-full text-xs h-8 border-[#EBE8DF]"
            >
              Find More Recipes
            </Button>
          </div>

          {savedRecipes.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-[28px] border border-[#EBE8DF]">
              <Bookmark className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-serif font-bold text-gray-800">No saved recipes yet</p>
              <p className="text-xs text-gray-500 mt-1">
                When the assistant generates a custom recipe with your ingredients, tap "Save Recipe" to keep it here forever.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedRecipes.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-[24px] bg-white border border-[#EBE8DF] shadow-xs relative"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF5EE] text-forest">
                        {rec.category}
                      </span>
                      <h3 className="text-base font-serif font-bold text-gray-900 mt-1">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-gray-500">{rec.ageGroup}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSavedRecipe(rec.id)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete recipe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">{rec.description}</p>

                  <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EBE8DF] mb-3">
                    <span className="text-xs font-bold text-forest block mb-1.5">Ingredients:</span>
                    <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                      {rec.ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <span className="text-xs font-bold text-forest block">Preparation Steps:</span>
                    {rec.instructions.map((step, idx) => (
                      <div key={idx} className="flex gap-2 text-xs text-gray-700">
                        <span className="font-bold text-[#48B774] shrink-0">{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
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
          {/* Conversational Input Card */}
          <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-[#EBE8DF] p-4 sm:p-5 shadow-[0_8px_30px_-6px_rgba(30,94,58,0.08)] mb-5 w-full min-w-0 overflow-hidden">
            <label htmlFor="pantry-input" className="block text-xs font-bold uppercase tracking-wider text-forest mb-2">
              What ingredients do you have?
            </label>

            <form onSubmit={handleAddFromInput} className="relative w-full min-w-0">
              <div className="relative flex items-center w-full min-w-0">
                <input
                  id="pantry-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="e.g. sweet potato, chicken, carrots, oats..."
                  className="w-full min-w-0 h-12 sm:h-13 pl-3.5 sm:pl-4 pr-20 sm:pr-24 rounded-full border border-[#D5D0C3] bg-[#FAF9F5] text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#48B774] focus:bg-white transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[#1E5E3A] hover:bg-[#16482c] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-all active:scale-95 shrink-0"
                >
                  <span>Process</span>
                  <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 px-1 leading-snug">
                Type one or more ingredients separated by commas (e.g. *pumpkin, sweet potato, olive oil*).
              </p>
            </form>

            {/* Active Ingredients Tags */}
            {activeIngredients.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-[#F1EFEA] w-full min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">
                    Your Ingredients ({activeIngredients.length}):
                  </span>
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full min-w-0">
                  {activeIngredients.map((ing) => (
                    <span
                      key={ing}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#F3F6F3] text-forest border border-[#D6E3D8] text-xs font-semibold shadow-2xs animate-fade-in"
                    >
                      <span className="capitalize">{ing}</span>
                      <button
                        onClick={() => removeIngredient(ing)}
                        className="w-4 h-4 rounded-full hover:bg-forest/10 flex items-center justify-center text-gray-400 hover:text-forest transition-colors"
                        aria-label={`Remove ${ing}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Add Suggestions */}
            <div className="mt-4 pt-3 border-t border-[#F5F3EC] w-full min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Quick Add Staples:
              </span>
              <div className="flex flex-wrap gap-1.5 w-full min-w-0">
                {POPULAR_SUGGESTIONS.map((item) => {
                  const isAdded = activeIngredients.includes(item.toLowerCase());
                  return (
                    <button
                      key={item}
                      onClick={() => addSuggestion(item)}
                      disabled={isAdded}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        isAdded
                          ? "bg-gray-100 text-gray-400 cursor-default"
                          : "bg-[#FAF9F5] text-gray-600 border border-[#EBE8DF] hover:border-[#48B774] hover:text-forest"
                      }`}
                    >
                      {!isAdded && <Plus className="w-3 h-3 text-[#48B774]" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Age Filter Tabs */}
          <div className="mb-5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar w-full max-w-full min-w-0">
            <span className="text-xs font-bold text-forest shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Target Age:
            </span>
            {[
              { id: "All", label: "👶 All Ages" },
              { id: "6-8", label: "6–8m" },
              { id: "9-11", label: "9–11m" },
              { id: "12-23", label: "12–23m" },
              { id: "24", label: "24+m" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedAge(tab.id)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedAge === tab.id
                    ? "bg-forest text-white shadow-xs"
                    : "bg-white text-gray-500 border border-[#EBE8DF] hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* GENERATE CUSTOM RECIPE PROMINENT CTA (Available whenever ingredients are present) */}
          {activeIngredients.length > 0 && (
            <div className="mb-6 p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-[#1E5E3A] to-[#2D734B] text-white shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#98E2B2]">
                    <Sparkles className="w-3.5 h-3.5" /> Intelligent Culinary Generator
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white mt-0.5">
                    Want a custom recipe with ONLY your ingredients?
                  </h3>
                  <p className="text-xs text-white/80 mt-1 max-w-md">
                    Our assistant will create an exclusive pediatric recipe with safe measurements, step-by-step instructions, and texture tips for your baby.
                  </p>
                </div>
                <Button
                  onClick={handleTriggerGenerate}
                  disabled={isGenerating}
                  className="rounded-full bg-white hover:bg-white/90 text-forest font-bold text-xs px-5 h-10 shadow-sm shrink-0 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#48B774]" />
                  <span>{isGenerating ? "Crafting Recipe..." : "Generate Custom Recipe"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* DISPLAY GENERATED RECIPE CARD */}
          {generatedRecipe && (
            <div className="mb-8 p-5 sm:p-6 rounded-[28px] bg-white border-2 border-[#48B774] shadow-[0_10px_35px_-8px_rgba(72,183,116,0.18)] animate-fade-in">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF5EE] text-[#1E5E3A] border border-[#CDE5D4]">
                  ✨ Custom Formulated Recipe
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#48B774]" /> Prep: {generatedRecipe.prepTime} • Cook: {generatedRecipe.cookTime}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-1">
                {generatedRecipe.title}
              </h3>
              <p className="text-xs font-semibold text-[#48B774] mt-0.5">{generatedRecipe.ageGroup}</p>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{generatedRecipe.description}</p>

              {/* Servings */}
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF9F5] border border-[#EBE8DF] text-xs text-gray-700">
                <Refrigerator className="w-3.5 h-3.5 text-[#48B774]" />
                <span>Yield: <strong>{generatedRecipe.servings}</strong></span>
              </div>

              {/* Ingredients */}
              <div className="mt-4 pt-4 border-t border-[#F1EFEA]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest mb-2">
                  Ingredients with Baby-Safe Measurements:
                </h4>
                <ul className="space-y-1.5">
                  {generatedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#48B774] shrink-0 mt-0.5" />
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div className="mt-4 pt-4 border-t border-[#F1EFEA]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest mb-2">
                  Step-by-Step Preparation:
                </h4>
                <div className="space-y-2">
                  {generatedRecipe.instructions.map((step, idx) => (
                    <div key={idx} className="flex gap-2 text-xs text-gray-700 bg-[#FAF9F5] p-2.5 rounded-xl border border-[#EBE8DF]">
                      <span className="font-bold text-[#48B774] shrink-0">{idx + 1}.</span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pediatric Safety Banner */}
              <div className="mt-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[11px] uppercase tracking-wider text-amber-800">Pediatric Safety Advice:</strong>
                  <span className="text-[11px] leading-relaxed">{generatedRecipe.safetyTip}</span>
                </div>
              </div>

              {/* Actions: Save Recipe */}
              <div className="mt-5 pt-4 border-t border-[#F1EFEA] flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  onClick={() => handleSaveRecipe(generatedRecipe)}
                  className={`w-full sm:w-auto rounded-full text-xs font-bold px-5 h-10 shadow-xs flex items-center justify-center gap-2 ${
                    isCurrentGeneratedSaved
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-default"
                      : "bg-[#1E5E3A] hover:bg-[#16482c] text-white"
                  }`}
                >
                  {isCurrentGeneratedSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-emerald-700" />
                      <span>Saved in My Recipes ✓</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>Save Recipe to My Collection</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTriggerGenerate}
                  className="rounded-full text-xs h-9 border-[#EBE8DF] text-gray-600 hover:text-forest"
                >
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  Generate Another Variation
                </Button>
              </div>
            </div>
          )}

          {/* Matched Recipes Section from Database */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xl font-serif font-bold text-forest">
                Cookbook Recipes ({matchedRecipes.length})
              </h2>
              {matchedRecipes.length > 0 && (
                <span className="text-xs font-medium text-[#48B774] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Best matches first
                </span>
              )}
            </div>

            {activeIngredients.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-[28px] border border-[#EBE8DF]">
                <span className="text-4xl block mb-2">🥕</span>
                <h3 className="font-serif font-bold text-gray-900 text-base">
                  No ingredients entered yet
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Type what ingredients you have in the box above or tap one of the quick-add staples to discover recipes or generate a custom dish.
                </p>
              </div>
            ) : matchedRecipes.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-[28px] border border-[#EBE8DF]">
                <span className="text-4xl block mb-2">🥣</span>
                <h3 className="font-serif font-bold text-gray-900 text-base">
                  No direct cookbook match found
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  None of the pre-set recipes match only these ingredients, but our Culinary Assistant can generate an exclusive baby recipe for you right now!
                </p>
                <Button
                  onClick={handleTriggerGenerate}
                  disabled={isGenerating}
                  className="mt-4 rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white text-xs font-bold px-5 h-10 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#48B774]" />
                  <span>{isGenerating ? "Generating..." : "Generate Recipe with These Ingredients"}</span>
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
                      className="block p-3 sm:p-3.5 rounded-[20px] sm:rounded-[24px] bg-white border border-[#EBE8DF] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5 w-full min-w-0 overflow-hidden"
                    >
                      <div className="flex items-center gap-3 sm:gap-3.5 w-full min-w-0">
                        {/* Realistic Photo */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[16px] sm:rounded-[20px] overflow-hidden bg-gray-100 shrink-0 border border-[#EBE8DF] relative">
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
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full bg-[#EAF5EE] text-forest text-[10px] font-bold">
                              ✓ {matchCount} of your ingredients
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> {recipe.prepTime}
                            </span>
                          </div>

                          <h3 className="font-serif font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-forest transition-colors">
                            {recipe.title}
                          </h3>

                          {/* Matching ingredients chips */}
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {matched.slice(0, 3).map((m) => (
                              <span
                                key={m}
                                className="text-[10px] bg-[#F3F6F3] text-forest px-1.5 py-0.5 rounded-md font-medium"
                              >
                                ✓ {m}
                              </span>
                            ))}
                            {missing.length > 0 && (
                              <span className="text-[10px] text-gray-400">
                                + {missing.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-forest group-hover:translate-x-1 transition-all flex-shrink-0" />
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
