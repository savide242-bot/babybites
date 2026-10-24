import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Heart, ArrowLeft, Snowflake, Sparkles, Zap, Utensils, FolderHeart } from "lucide-react";
import { recipes, getMealCategory } from "@/data/recipes";
import { useFavorites } from "@/hooks/useFavorites";

const COLLECTIONS = [
  { id: "all", label: "All Saved", icon: Heart },
  { id: "quick_breakfast", label: "Quick Breakfasts", icon: Zap },
  { id: "freezer", label: "Freezer Stash", icon: Snowflake },
  { id: "finger_foods", label: "Finger Foods", icon: Utensils },
  { id: "simple", label: "3-4 Ingredients", icon: Sparkles },
];

export const Favorites = () => {
  const { favorites, loading, toggleFavorite } = useFavorites();
  const [selectedCollection, setSelectedCollection] = useState("all");

  const favoriteRecipes = useMemo(() => {
    return recipes.filter((recipe) => favorites.has(recipe.id));
  }, [favorites]);

  const filteredByCollection = useMemo(() => {
    if (selectedCollection === "all") return favoriteRecipes;

    if (selectedCollection === "quick_breakfast") {
      return favoriteRecipes.filter((r) => {
        const cat = getMealCategory(r);
        return cat === "Breakfast" || r.title.toLowerCase().includes("pancake") || r.prepTime.includes("10") || r.prepTime.includes("5");
      });
    }

    if (selectedCollection === "freezer") {
      return favoriteRecipes.filter((r) => {
        const text = (r.title + " " + r.description).toLowerCase();
        return text.includes("freeze") || text.includes("puree") || text.includes("muffin") || text.includes("batch");
      });
    }

    if (selectedCollection === "finger_foods") {
      return favoriteRecipes.filter((r) => {
        const text = (r.title + " " + r.description).toLowerCase();
        return text.includes("finger") || text.includes("bite") || text.includes("tots") || text.includes("strips");
      });
    }

    if (selectedCollection === "simple") {
      return favoriteRecipes.filter((r) => r.ingredients.length <= 4);
    }

    return favoriteRecipes;
  }, [favoriteRecipes, selectedCollection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1E5E3A] border-t-transparent mx-auto"></div>
          <p className="text-gray-500 text-xs">Loading your saved recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#48B774]">
            Personal Recipe Box
          </span>
          <Link to="/recipes" className="text-xs font-semibold text-[#1E5E3A] hover:underline">
            Browse More Recipes →
          </Link>
        </div>
        <h1 className="text-3xl font-serif font-bold text-forest flex items-center gap-2">
          <FolderHeart className="w-8 h-8 text-[#48B774]" /> Saved Collections
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {favoriteRecipes.length} {favoriteRecipes.length === 1 ? "recipe" : "recipes"} saved in your personal library
        </p>
      </div>

      {/* Thematic Collections Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {COLLECTIONS.map((col) => {
          const Icon = col.icon;
          return (
            <button
              key={col.id}
              onClick={() => setSelectedCollection(col.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCollection === col.id
                  ? "bg-forest text-white shadow-xs"
                  : "bg-white text-gray-600 border border-[#EBE8DF] hover:bg-gray-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{col.label}</span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {favoriteRecipes.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-[28px] border border-[#EBE8DF] shadow-xs">
          <Heart className="w-12 h-12 text-[#48B774] fill-[#48B774]/20 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-gray-900 text-lg">
            No saved favorites yet
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Tap the heart icon on any recipe across the library to organize your baby's favorites into quick collections!
          </p>
          <Button asChild className="mt-5 rounded-full bg-[#1E5E3A] text-white text-xs px-5">
            <Link to="/recipes">Discover Recipes</Link>
          </Button>
        </div>
      ) : filteredByCollection.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-[28px] border border-[#EBE8DF]">
          <h3 className="font-serif font-bold text-gray-900 text-sm">
            No recipes in this collection yet
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Try switching to "All Saved" to view all your bookmarked recipes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filteredByCollection.map((recipe) => {
            const cat = getMealCategory(recipe);
            return (
              <div
                key={recipe.id}
                className="rounded-[24px] bg-white border border-[#EBE8DF] shadow-[0_4px_16px_-4px_rgba(30,94,58,0.06)] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
              >
                <Link to={`/recipe/${recipe.id}`} className="block relative">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#FAF9F5] relative">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Heart button */}
                    <button
                      aria-label="Remove from favorites"
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center bg-white text-red-500 shadow-md backdrop-blur-md"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(recipe.id);
                      }}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>

                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold">
                        {cat}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 pb-2">
                    <span className="text-[10px] text-[#48B774] font-medium block mb-1">
                      💚 {recipe.ageGroup}
                    </span>
                    <h3 className="font-serif font-bold text-gray-900 text-xs sm:text-sm line-clamp-1 group-hover:text-forest transition-colors">
                      {recipe.title}
                    </h3>
                  </div>
                </Link>

                <div className="px-3 pb-3 pt-1 border-t border-[#F3F1EB] flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {recipe.prepTime}
                  </span>
                  <span>{recipe.ingredients.length} ingr.</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites;
