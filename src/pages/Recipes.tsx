import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Heart, History, Eye, Sparkles, TrendingUp, Zap, Utensils, ChefHat, Filter } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { recipes, ageGroups, categories } from "@/data/recipes";
import { useLanguage } from "@/hooks/useLanguage";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecipeHistory } from "@/hooks/useRecipeHistory";
import { useDietaryPreferences, DietaryTag } from "@/hooks/useDietaryPreferences";
import { getRecipeDietaryTags } from "@/data/recipeDietaryTags";
import { DietaryFilterSelect } from "@/components/DietaryFilterSelect";
import { EmptyRecipes } from "@/components/empty-states";
import { motion } from "framer-motion";
import { hapticFeedback } from "@/utils/haptic";
import { GlassCard } from "@/components/ui/glass-card";

// Memoized Recipe Card for performance
const RecipeCard = memo(({ recipe, showViewCount = false, viewCount = 0, index = 0, isFav, isCompatible, isNew, isPopular, isQuick, hasPrefs, onToggleFavorite }: {
  recipe: typeof recipes[0];
  showViewCount?: boolean;
  viewCount?: number;
  index?: number;
  isFav: boolean;
  isCompatible: boolean;
  isNew: boolean;
  isPopular: boolean;
  isQuick: boolean;
  hasPrefs: boolean;
  onToggleFavorite: (id: string) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.5), duration: 0.3 }}
      whileHover={{ y: -8, scale: 1.02, rotateY: 2 }}
      whileTap={{ scale: 0.98 }}
      className="group"
      style={{ perspective: 1000 }}
    >
      <Link to={`/recipe/${recipe.id}`} className="block">
        <div className={`overflow-hidden transition-all duration-500 rounded-2xl shadow-lg hover:shadow-2xl ${
          isCompatible && hasPrefs ? 'ring-2 ring-mint/60' : ''
        } ${isFav ? 'ring-2 ring-primary/40' : ''} bg-card/80 backdrop-blur-sm border border-border/30`}>
          <div className="aspect-square relative overflow-hidden">
            <img
              src={recipe.image}
              alt={recipe.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            
            {/* Premium gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            {/* Favorite glow ring */}
            {isFav && (
              <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/50 ring-inset pointer-events-none" />
            )}
            
            {/* Top left badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isNew && (
                <Badge className="bg-gradient-to-r from-accent to-orange-500 text-white text-[9px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-lg border-0 animate-pulse">
                  <Zap className="h-2.5 w-2.5" />
                  New
                </Badge>
              )}
              {isPopular && !isNew && (
                <Badge className="bg-gradient-to-r from-primary to-secondary text-white text-[9px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-lg border-0">
                  <TrendingUp className="h-2.5 w-2.5" />
                  Popular
                </Badge>
              )}
              {isQuick && (
                <Badge className="bg-gradient-to-r from-mint to-emerald-500 text-white text-[9px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-lg border-0">
                  <Clock className="h-2.5 w-2.5" />
                  Quick
                </Badge>
              )}
            </div>
            
            {/* Age badge + Favorite */}
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <Badge className="bg-white/90 backdrop-blur-sm text-foreground/80 text-[9px] px-1.5 py-0.5 shadow-lg border-0">
                {recipe.ageGroup}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-lg"
                onClick={(e) => {
                  e.preventDefault();
                  hapticFeedback('light');
                  onToggleFavorite(recipe.id);
                }}
              >
                <Heart className={`h-3.5 w-3.5 transition-all duration-300 ${isFav ? 'fill-primary text-primary scale-125' : 'text-muted-foreground'}`} />
              </Button>
            </div>

            {/* Perfect match */}
            {isCompatible && hasPrefs && (
              <motion.div 
                className="absolute top-10 left-1/2 -translate-x-1/2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Badge className="bg-gradient-to-r from-mint to-emerald-500 text-white text-[9px] px-2 py-0.5 flex items-center gap-1 shadow-xl border-0">
                  <Sparkles className="h-2.5 w-2.5" />
                  Perfect Match
                </Badge>
              </motion.div>
            )}
            
            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight mb-2 drop-shadow-lg">
                {recipe.title}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Clock className="h-3 w-3" />
                  <span>{recipe.prepTime}</span>
                </div>
                {showViewCount && viewCount > 1 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Eye className="h-3 w-3" />
                    <span>{viewCount}x</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

RecipeCard.displayName = "RecipeCard";

const Recipes = () => {
  const { t } = useLanguage();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { recentlyViewed, loading: historyLoading, getRecentRecipes, getMostViewed } = useRecipeHistory();
  const { preferences, isRecipeCompatible } = useDietaryPreferences();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAge, setSelectedAge] = useState("All Ages");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [dietaryFilters, setDietaryFilters] = useState<DietaryTag[]>([]);

  useEffect(() => {
    const ageParam = searchParams.get('age');
    if (ageParam) {
      const decodedAge = decodeURIComponent(ageParam);
      if (ageGroups.includes(decodedAge)) {
        setSelectedAge(decodedAge);
      }
    }
  }, [searchParams]);

  const recentRecipes = getRecentRecipes();
  const mostViewedRecipes = getMostViewed();

  // Memoize filtered recipes for performance
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesSearch = searchQuery === "" || 
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAge = selectedAge === "All Ages" || recipe.ageGroup === selectedAge;
      const matchesCategory = selectedCategory === "All Categories" || recipe.category === selectedCategory;
      
      const recipeTags = getRecipeDietaryTags(recipe.id);
      const matchesDietary = dietaryFilters.length === 0 || 
                            dietaryFilters.every(filter => recipeTags.includes(filter));
      
      return matchesSearch && matchesAge && matchesCategory && matchesDietary;
    });
  }, [searchQuery, selectedAge, selectedCategory, dietaryFilters]);

  // Memoize category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    recipes.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id);
  }, [toggleFavorite]);

  const isNewRecipe = useCallback((recipeId: string) => {
    const numericId = parseInt(recipeId.replace(/\D/g, '')) || 0;
    return numericId > 300;
  }, []);

  const isPopularRecipe = useCallback((recipeId: string) => {
    const viewData = recentlyViewed.find(v => v.recipe_id === recipeId);
    return viewData && viewData.view_count >= 3;
  }, [recentlyViewed]);

  return (
    <div className="min-h-screen pt-16 pb-24 lg:pb-8 bg-gradient-to-b from-background via-peach/5 to-mint/5">
      <div className="container px-3 sm:px-4">
        {/* Clean Header with gradient text */}
        <div className="mb-6 pt-4">
          <motion.h1 
            className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent bg-[length:200%] animate-[shimmer_3s_ease-in-out_infinite]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {t('recipes.title')}
          </motion.h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {filteredRecipes.length}+ nutritious recipes for your little one ✨
          </p>
        </div>

        {/* Premium Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sticky top-16 z-30 backdrop-blur-xl bg-card/80 py-3 sm:py-4 -mx-3 sm:-mx-4 px-3 sm:px-4 border-b border-gold/10 mb-6 rounded-b-2xl shadow-lg"
        >
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <Input
                placeholder={t('recipes.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 rounded-full h-10 sm:h-12 text-sm sm:text-base shadow-lg border-primary/10 focus:border-primary/30 bg-background"
              />
            </div>
            
            {/* Filter Pills */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1">
              <Select value={selectedAge} onValueChange={setSelectedAge}>
                <SelectTrigger className="rounded-full text-xs sm:text-sm h-9 sm:h-10 min-w-[100px] sm:min-w-[120px] border-primary/20 bg-background shadow-sm flex-shrink-0">
                  <SelectValue placeholder={t('recipes.selectAge')} />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((age) => (
                    <SelectItem key={age} value={age}>{age}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="rounded-full text-xs sm:text-sm h-9 sm:h-10 min-w-[120px] sm:min-w-[140px] border-primary/20 bg-background shadow-sm flex-shrink-0">
                  <SelectValue placeholder={t('recipes.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category} {category !== "All Categories" && categoryCounts[category] ? `(${categoryCounts[category]})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DietaryFilterSelect
                selectedFilters={dietaryFilters}
                onFilterChange={setDietaryFilters}
                userPreferences={preferences}
              />
            </div>
          </div>
        </motion.div>

        {/* Recently Viewed */}
        {!historyLoading && recentRecipes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                  <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <h2 className="text-base sm:text-lg font-bold">Recently Viewed</h2>
              </div>
              <Badge variant="secondary" className="rounded-full text-[10px] sm:text-xs">
                {recentlyViewed.length} {recentlyViewed.length === 1 ? 'recipe' : 'recipes'}
              </Badge>
            </div>

            {/* Horizontal Scroll with fade edges */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-2">
                {recentRecipes.slice(0, 8).map((recipe, index) => {
                  if (!recipe) return null;
                  const viewData = recentlyViewed.find(v => v.recipe_id === recipe.id);
                  const recipeTags = getRecipeDietaryTags(recipe.id);
                  return (
                    <div key={recipe.id} className="flex-shrink-0 w-36 sm:w-44">
                      <RecipeCard 
                        recipe={recipe} 
                        showViewCount={true}
                        viewCount={viewData?.view_count || 0}
                        index={index}
                        isFav={isFavorite(recipe.id)}
                        isCompatible={isRecipeCompatible(recipeTags)}
                        isNew={isNewRecipe(recipe.id)}
                        isPopular={isPopularRecipe(recipe.id)}
                        isQuick={parseInt(recipe.prepTime) <= 15}
                        hasPrefs={preferences.length > 0}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {mostViewedRecipes.length > 0 && (
              <div className="mt-3 p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Most Viewed:</span>
                  <span className="text-muted-foreground text-[10px] sm:text-xs truncate">
                    {mostViewedRecipes.slice(0, 3).map((view) => {
                      const recipe = recipes.find(r => r.id === view.recipe_id);
                      return recipe?.title;
                    }).filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Results Count */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-4 flex items-center justify-between"
        >
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('recipes.showing')} <span className="font-semibold text-foreground">{filteredRecipes.length}</span> {filteredRecipes.length !== 1 ? t('recipes.recipes') : t('recipes.recipe')}
          </p>
        </motion.div>

        {/* Main Recipe Grid */}
        {filteredRecipes.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
          >
            {filteredRecipes.map((recipe, index) => {
              const recipeTags = getRecipeDietaryTags(recipe.id);
              return (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  index={index}
                  isFav={isFavorite(recipe.id)}
                  isCompatible={isRecipeCompatible(recipeTags)}
                  isNew={isNewRecipe(recipe.id)}
                  isPopular={isPopularRecipe(recipe.id)}
                  isQuick={parseInt(recipe.prepTime) <= 15}
                  hasPrefs={preferences.length > 0}
                  onToggleFavorite={handleToggleFavorite}
                />
              );
            })}
          </motion.div>
        ) : (
          <EmptyRecipes 
            onClearFilters={() => {
              hapticFeedback('light');
              setSearchQuery("");
              setSelectedAge("All Ages");
              setSelectedCategory("All Categories");
              setDietaryFilters([]);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Recipes;
