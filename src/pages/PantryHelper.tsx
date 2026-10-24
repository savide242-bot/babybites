import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { recipes, getMealCategory } from "@/data/recipes";
import { Send, Sparkles, Clock, ArrowRight, Refrigerator, X, Plus, ChefHat, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

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
];

export const PantryHelper: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [activeIngredients, setActiveIngredients] = useState<string[]>([
    "banana",
    "oats",
  ]);
  const [selectedAge, setSelectedAge] = useState<string>("All");

  // Handle adding ingredients from text input
  const handleAddFromInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    // Split by commas, "and", or newlines
    const rawItems = inputText
      .split(/[,;\n]|(?:\band\b)/i)
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 1);

    if (rawItems.length === 0) return;

    setActiveIngredients((prev) => {
      const set = new Set([...prev, ...rawItems]);
      return Array.from(set);
    });

    setInputText("");
  };

  const removeIngredient = (ing: string) => {
    setActiveIngredients((prev) => prev.filter((i) => i !== ing));
  };

  const addSuggestion = (name: string) => {
    const lower = name.toLowerCase();
    if (!activeIngredients.includes(lower)) {
      setActiveIngredients((prev) => [...prev, lower]);
    }
  };

  const clearAll = () => setActiveIngredients([]);

  // Match recipes with entered ingredients
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
      .slice(0, 35);
  }, [activeIngredients, selectedAge]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <span className="text-xs font-semibold tracking-wider uppercase text-[#48B774]">
          Smart Kitchen Assistant
        </span>
        <h1 className="text-3xl font-serif font-bold text-forest mt-0.5 flex items-center gap-2">
          <ChefHat className="w-8 h-8 text-[#48B774]" /> Pantry Recipe Finder
        </h1>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          Tell us what you have in your kitchen or fridge right now. Type ingredients below and let our chef find delicious, baby-approved recipes you can make immediately!
        </p>
      </div>

      {/* Modern Conversational Input Card */}
      <div className="bg-white rounded-[28px] border border-[#EBE8DF] p-5 shadow-[0_8px_30px_-6px_rgba(30,94,58,0.08)] mb-6">
        <label htmlFor="pantry-input" className="block text-xs font-bold uppercase tracking-wider text-forest mb-2">
          What ingredients do you have?
        </label>

        <form onSubmit={handleAddFromInput} className="relative">
          <div className="relative flex items-center">
            <input
              id="pantry-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. sweet potato, chicken, carrots, oats..."
              className="w-full h-13 pl-4 pr-24 rounded-full border border-[#D5D0C3] bg-[#FAF9F5] text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#48B774] focus:bg-white transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1E5E3A] hover:bg-[#16482c] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <span>Find</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5 px-1">
            Tip: You can separate multiple ingredients with commas (e.g. *apples, bananas, oats*).
          </p>
        </form>

        {/* Active Ingredients Tags */}
        {activeIngredients.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-[#F1EFEA]">
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

            <div className="flex flex-wrap gap-2">
              {activeIngredients.map((ing) => (
                <span
                  key={ing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F6F3] text-forest border border-[#D6E3D8] text-xs font-semibold shadow-xs animate-fade-in"
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
        <div className="mt-4 pt-3 border-t border-[#F5F3EC]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Quick Add Staples:
          </span>
          <div className="flex flex-wrap gap-1.5">
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
      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-bold text-forest flex-shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Age:
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
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedAge === tab.id
                ? "bg-forest text-white shadow-xs"
                : "bg-white text-gray-500 border border-[#EBE8DF] hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Matched Recipes Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xl font-serif font-bold text-forest">
            Recipes You Can Make ({matchedRecipes.length})
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
              Type what ingredients you have in the box above or tap one of the quick-add staples to discover what you can cook.
            </p>
          </div>
        ) : matchedRecipes.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-[28px] border border-[#EBE8DF]">
            <span className="text-4xl block mb-2">🥣</span>
            <h3 className="font-serif font-bold text-gray-900 text-base">
              No direct matches found
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Try adding a staple ingredient like banana, oats, egg, carrots, or milk to see recipes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matchedRecipes.map(({ recipe, matchCount, matchPercent, matched, missing }) => {
              const cat = getMealCategory(recipe);

              return (
                <Link
                  key={recipe.id}
                  to={`/recipe/${recipe.id}`}
                  className="block p-3.5 rounded-[24px] bg-white border border-[#EBE8DF] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Realistic Photo */}
                    <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-[20px] overflow-hidden bg-gray-100 flex-shrink-0 border border-[#EBE8DF] relative">
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
    </div>
  );
};

export default PantryHelper;
