import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Heart, Clock, Flame, Sparkles, Filter, X, AlertTriangle, Baby } from "lucide-react";
import { recipes } from "@/data/recipes";
import { getRecipeImage } from "@/data/recipeImages";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { useDietaryPreferences } from "@/hooks/useDietaryPreferences";
import { getRecipeDietaryTags } from "@/data/recipeDietaryTags";

interface RecipePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (recipeId: string) => void;
  mealType: string;
  day: string;
  usedRecipeIds?: string[];
  babyAgeMonths?: number;
}

const mealTypeConfig: Record<string, { gradient: string; icon: string }> = {
  breakfast: { gradient: "from-amber-400 to-orange-500", icon: "🌅" },
  lunch: { gradient: "from-green-400 to-emerald-500", icon: "🥗" },
  dinner: { gradient: "from-purple-400 to-pink-500", icon: "🌙" },
  snack: { gradient: "from-cyan-400 to-teal-500", icon: "🍎" }
};

const quickFilters = [
  { id: "quick", label: "⚡ Quick (<20min)", filter: (r: any) => parseInt(r.prepTime) <= 20 },
  { id: "puree", label: "🥣 Purees", filter: (r: any) => r.category === "Puree" },
  { id: "soup", label: "🍲 Soups", filter: (r: any) => r.category === "Soup" },
  { id: "finger", label: "🖐️ Finger Foods", filter: (r: any) => r.category === "Finger Food" },
  { id: "pasta", label: "🍝 Pasta", filter: (r: any) => r.category === "Pasta" },
  { id: "vegetarian", label: "🥬 Vegetarian", filter: (r: any) => getRecipeDietaryTags(r.id).includes("vegetarian") },
  { id: "dairy-free", label: "🥛 Dairy-Free", filter: (r: any) => getRecipeDietaryTags(r.id).includes("dairy-free") },
  { id: "nut-free", label: "🥜 Nut-Free", filter: (r: any) => getRecipeDietaryTags(r.id).includes("nut-free") }
];

export const RecipePickerModal = ({
  open,
  onClose,
  onSelect,
  mealType,
  day,
  usedRecipeIds = [],
  babyAgeMonths,
}: RecipePickerModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { favorites } = useFavorites();
  const { preferences } = useDietaryPreferences();
  const config = mealTypeConfig[mealType] || mealTypeConfig.snack;

  const isTooYoungForSolids = typeof babyAgeMonths === "number" && babyAgeMonths < 6;

  const allowedRecipes = useMemo(() => {
    if (isTooYoungForSolids) return [];

    // Same age gating logic as planner: show current group + earlier groups when older
    const getAgeGroup = (months: number): string => {
      if (months < 6) return "0-6 months";
      if (months < 9) return "6-9 months";
      if (months < 12) return "9-12 months";
      if (months < 18) return "12-18 months";
      return "18-24 months";
    };

    const ageGroup = typeof babyAgeMonths === "number" ? getAgeGroup(babyAgeMonths) : "6-9 months";

    return recipes.filter((r) => {
      const rAge = (r as any).ageGroup as string | undefined;
      if (!rAge) return true; // fallback if recipe missing age info

      if (rAge === ageGroup) return true;
      if ((babyAgeMonths ?? 0) >= 9 && rAge === "6-9 months") return true;
      if ((babyAgeMonths ?? 0) >= 12 && rAge === "9-12 months") return true;
      return false;
    });
  }, [babyAgeMonths, isTooYoungForSolids]);

  const favoriteRecipes = useMemo(() => {
    return allowedRecipes.filter(r => Array.isArray(favorites) ? favorites.includes(r.id) : favorites.has?.(r.id));
  }, [favorites, allowedRecipes]);

  const suggestedRecipes = useMemo(() => {
    // Suggest recipes not used this week
    return allowedRecipes
      .filter(r => !usedRecipeIds.includes(r.id))
      .slice(0, 5);
  }, [usedRecipeIds, allowedRecipes]);

  const filteredRecipes = useMemo(() => {
    let result = [...allowedRecipes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.ingredients.some(i => i.toLowerCase().includes(query))
      );
    }

    // Quick filters
    activeFilters.forEach(filterId => {
      const filterConfig = quickFilters.find(f => f.id === filterId);
      if (filterConfig) {
        result = result.filter(filterConfig.filter);
      }
    });

    return result;
  }, [searchQuery, activeFilters, allowedRecipes]);

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const handleSelect = (recipeId: string) => {
    onSelect(recipeId);
    onClose();
    setSearchQuery("");
    setActiveFilters([]);
  };

  const RecipeCard = ({ recipe, badge }: { recipe: any; badge?: string }) => (
    <button
      onClick={() => handleSelect(recipe.id)}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-accent/50 border border-border hover:border-primary/50 transition-all group text-left"
    >
      <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
        <img
          src={getRecipeImage([recipe.id, recipe.title])}
          alt={recipe.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
        />
        {badge && (
          <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-br-lg font-medium">
            {badge}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {recipe.title}
        </h4>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {recipe.prepTime}
          </span>
          {recipe.nutrition?.calories && (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {recipe.nutrition.calories}
            </span>
          )}
        </div>
        {usedRecipeIds.includes(recipe.id) && (
          <Badge variant="secondary" className="text-[10px] mt-1">
            Already planned
          </Badge>
        )}
      </div>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className={cn(
          "p-4 pb-3 bg-gradient-to-r text-white",
          config.gradient
        )}>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">{config.icon}</span>
            Select {mealType.charAt(0).toUpperCase() + mealType.slice(1)} for {day}
          </DialogTitle>
        </DialogHeader>

        {/* Too Young Warning */}
        {isTooYoungForSolids ? (
          <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <Baby className="h-12 w-12 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Baby Too Young for Solids
            </h3>
            <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
              Your baby is {babyAgeMonths} month{babyAgeMonths !== 1 ? 's' : ''} old. 
              Solid foods are not recommended before 6 months of age.
            </p>
            <p className="text-amber-600 dark:text-amber-400 text-xs mt-3">
              Please consult your pediatrician before starting solids.
            </p>
            <Button 
              onClick={onClose}
              variant="outline"
              className="mt-4"
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                {quickFilters.map(filter => (
                  <Badge
                    key={filter.id}
                    variant={activeFilters.includes(filter.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => toggleFilter(filter.id)}
                  >
                    {filter.label}
                  </Badge>
                ))}
              </div>
            </div>

        <ScrollArea className="h-[400px] px-4 pb-4">
          <div className="space-y-4">
            {/* Favorites Section */}
            {favoriteRecipes.length > 0 && !searchQuery && activeFilters.length === 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                  Your Favorites
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {favoriteRecipes.slice(0, 6).map(recipe => (
                    <button
                      key={recipe.id}
                      onClick={() => handleSelect(recipe.id)}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <img
                        src={getRecipeImage([recipe.id, recipe.title])}
                        alt={recipe.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute bottom-1 left-1 right-1 text-white text-[10px] font-medium line-clamp-2">
                        {recipe.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {!searchQuery && activeFilters.length === 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Suggestions for You
                </h3>
                <div className="space-y-2">
                  {suggestedRecipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} badge="New" />
                  ))}
                </div>
              </div>
            )}

            {/* All/Filtered Recipes */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                <Filter className="h-4 w-4" />
                {searchQuery || activeFilters.length > 0 ? `Results (${filteredRecipes.length})` : "All Recipes"}
              </h3>
              <div className="space-y-2">
                {filteredRecipes.slice(0, 20).map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
                {filteredRecipes.length > 20 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    + {filteredRecipes.length - 20} more recipes
                  </p>
                )}
                {filteredRecipes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No recipes found</p>
                    <Button
                      variant="link"
                      onClick={() => { setSearchQuery(""); setActiveFilters([]); }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
};
