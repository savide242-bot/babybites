import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { recipes } from "@/data/recipes";
import { Search, Sparkles, Clock, Check, ArrowRight, Refrigerator, RefreshCw, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

const COMMON_PANTRY_INGREDIENTS = [
  // Fruits
  { id: "banana", label: "Banana", emoji: "🍌", group: "Fruits" },
  { id: "apple", label: "Apple", emoji: "🍎", group: "Fruits" },
  { id: "avocado", label: "Avocado", emoji: "🥑", group: "Fruits" },
  { id: "pear", label: "Pear", emoji: "🍐", group: "Fruits" },
  { id: "berry", label: "Berries", emoji: "🍓", group: "Fruits" },
  { id: "mango", label: "Mango", emoji: "🥭", group: "Fruits" },

  // Veggies
  { id: "carrot", label: "Carrot", emoji: "🥕", group: "Veggies" },
  { id: "sweet potato", label: "Sweet Potato", emoji: "🍠", group: "Veggies" },
  { id: "potato", label: "Potato", emoji: "🥔", group: "Veggies" },
  { id: "broccoli", label: "Broccoli", emoji: "🥦", group: "Veggies" },
  { id: "spinach", label: "Spinach", emoji: "🥬", group: "Veggies" },
  { id: "pea", label: "Peas", emoji: "🟢", group: "Veggies" },
  { id: "zucchini", label: "Zucchini", emoji: "🥒", group: "Veggies" },
  { id: "cauliflower", label: "Cauliflower", emoji: "🤍", group: "Veggies" },

  // Grains & Pantry
  { id: "oat", label: "Oats", emoji: "🌾", group: "Grains & Pantry" },
  { id: "rice", label: "Rice", emoji: "🍚", group: "Grains & Pantry" },
  { id: "pasta", label: "Pasta", emoji: "🍝", group: "Grains & Pantry" },
  { id: "flour", label: "Flour", emoji: "🥣", group: "Grains & Pantry" },
  { id: "peanut butter", label: "Peanut Butter", emoji: "🥜", group: "Grains & Pantry" },

  // Dairy & Proteins
  { id: "egg", label: "Eggs", emoji: "🥚", group: "Proteins & Dairy" },
  { id: "cheese", label: "Cheese", emoji: "🧀", group: "Proteins & Dairy" },
  { id: "yogurt", label: "Yogurt", emoji: "🥛", group: "Proteins & Dairy" },
  { id: "chicken", label: "Chicken", emoji: "🍗", group: "Proteins & Dairy" },
  { id: "salmon", label: "Salmon", emoji: "🐟", group: "Proteins & Dairy" },
  { id: "lentil", label: "Lentils", emoji: "🫘", group: "Proteins & Dairy" },
];

export const PantryHelper: React.FC = () => {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(["banana", "oat"]);

  const toggleIngredient = (id: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearAll = () => setSelectedIngredients([]);

  // Match recipes with selected ingredients
  const matchedRecipes = useMemo(() => {
    if (selectedIngredients.length === 0) return [];

    return recipes
      .map((recipe) => {
        const ingredientsText = recipe.ingredients.join(" ").toLowerCase();
        const matched = selectedIngredients.filter((ing) =>
          ingredientsText.includes(ing) || recipe.title.toLowerCase().includes(ing)
        );

        const matchCount = matched.length;
        const totalRecipeIngs = recipe.ingredients.length;
        const matchPercent = Math.round((matchCount / Math.min(totalRecipeIngs, 5)) * 100);

        return {
          recipe,
          matchCount,
          matchPercent,
          matched,
        };
      })
      .filter((item) => item.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount || b.matchPercent - a.matchPercent)
      .slice(0, 30);
  }, [selectedIngredients]);

  // Group by food categories
  const groups = ["Fruits", "Veggies", "Grains & Pantry", "Proteins & Dairy"];

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-[#48B774]">
              Zero Food Waste
            </span>
            <h1 className="text-3xl font-serif font-bold text-forest mt-0.5 flex items-center gap-2">
              <Refrigerator className="w-7 h-7 text-[#48B774]" /> Pantry Helper
            </h1>
          </div>

          {selectedIngredients.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Select what you have in your fridge or kitchen right now, and see instant baby meals you can cook!
        </p>
      </div>

      {/* Ingredient Selection Chips */}
      <div className="bg-white rounded-[28px] border border-[#EBE8DF] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] mb-8">
        <div className="flex items-center justify-between mb-3 border-b border-[#F5F3EC] pb-2">
          <span className="font-serif font-bold text-gray-900 text-sm">
            Tap Ingredients You Have ({selectedIngredients.length} selected):
          </span>
        </div>

        <div className="space-y-4">
          {groups.map((group) => {
            const items = COMMON_PANTRY_INGREDIENTS.filter((i) => i.group === group);
            return (
              <div key={group}>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  {group}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => {
                    const isSelected = selectedIngredients.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleIngredient(item.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                          isSelected
                            ? "bg-forest text-white shadow-xs scale-102"
                            : "bg-[#FAF9F5] text-gray-700 border border-[#EBE8DF] hover:border-[#D0CBBF]"
                        }`}
                      >
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#48B774] stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matched Recipes Section */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-serif font-bold text-forest">
            Recipes You Can Make ({matchedRecipes.length})
          </h2>
          <span className="text-xs font-medium text-gray-500">
            Sorted by highest match
          </span>
        </div>

        {selectedIngredients.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-[28px] border border-[#EBE8DF]">
            <span className="text-4xl block mb-2">🥕</span>
            <h3 className="font-serif font-bold text-gray-900 text-base">
              No ingredients selected
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Select 2 or more ingredients above to discover matching baby meals.
            </p>
          </div>
        ) : matchedRecipes.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-[28px] border border-[#EBE8DF]">
            <span className="text-4xl block mb-2">🥣</span>
            <h3 className="font-serif font-bold text-gray-900 text-base">
              No direct matches found
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Try adding staples like banana, oats, egg, or carrots.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matchedRecipes.map(({ recipe, matchCount, matched }) => (
              <Link
                key={recipe.id}
                to={`/recipe/${recipe.id}`}
                className="block p-3.5 rounded-[24px] bg-white border border-[#EBE8DF] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3.5">
                  {/* Photo */}
                  <div className="w-20 h-20 rounded-[18px] overflow-hidden bg-gray-100 flex-shrink-0 border border-[#EBE8DF]">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-[#EAF5EE] text-forest text-[10px] font-bold">
                        {matchCount} ingredients matched
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {recipe.prepTime}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-forest transition-colors">
                      {recipe.title}
                    </h3>

                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                      Uses: {matched.join(", ")}
                    </p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-forest group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PantryHelper;
