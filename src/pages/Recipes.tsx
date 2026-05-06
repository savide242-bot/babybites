import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Heart, History, Eye, Sparkles, TrendingUp, Zap, ChefHat, ChevronDown, Download, Loader2, Baby } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { recipes, ageGroups, categories } from "@/data/recipes";
import { useLanguage } from "@/hooks/useLanguage";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecipeHistory } from "@/hooks/useRecipeHistory";
import { useDietaryPreferences, DietaryTag } from "@/hooks/useDietaryPreferences";
import { getRecipeDietaryTags } from "@/data/recipeDietaryTags";
import { DietaryFilterSelect } from "@/components/DietaryFilterSelect";
import { EmptyRecipes } from "@/components/empty-states";
import { hapticFeedback } from "@/utils/haptic";
import { exportRecipeEbook } from "@/utils/recipeEbookExport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMonths } from "date-fns";

const BATCH_SIZE = 30;

// Calculate difficulty score for sorting (lower = easier)
const getDifficultyScore = (recipe: typeof recipes[0]): number => {
  const prepMinutes = parseInt(recipe.prepTime) || 30;
  const ingredientCount = recipe.ingredients.length;
  return prepMinutes * 2 + ingredientCount * 3;
};

// Get age group from months
const getAgeGroupFromMonths = (months: number): string => {
  if (months < 6) return "0-6 months";
  if (months < 9) return "6-9 months";
  if (months < 12) return "9-12 months";
  if (months < 18) return "12-18 months";
  return "18-24 months";
};

// Pure CSS recipe card
const RecipeCard = memo(({ recipe, showViewCount = false, viewCount = 0, index = 0, isFav, isCompatible, isNew, isPopular, isQuick, hasPrefs, onToggleFavorite, displayTitle }: {
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
  displayTitle?: string;
}) => {
  return (
    <div
      className="group recipe-card-enter"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.6)}s` }}
    >
      <Link to={`/recipe/${recipe.id}`} className="block">
        <div className={`overflow-hidden rounded-2xl shadow-lg border border-border/30 bg-card/80 backdrop-blur-sm
          transition-all duration-500 ease-out
          hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/10
          active:scale-[0.97]
          ${isCompatible && hasPrefs ? 'ring-2 ring-mint/60' : ''} 
          ${isFav ? 'ring-2 ring-primary/40 hover:ring-primary/60' : ''}`}
        >
          <div className="aspect-square relative overflow-hidden">
            <img
              src={recipe.image}
              alt={recipe.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            {isFav && (
              <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/50 ring-inset pointer-events-none" />
            )}
            
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isNew && (
                <Badge className="bg-gradient-to-r from-accent to-orange-500 text-white text-[9px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-lg border-0 animate-pulse">
                  <Zap className="h-2.5 w-2.5" />New
                </Badge>
              )}
              {isPopular && !isNew && (
                <Badge className="bg-gradient-to-r from-primary to-secondary text-white text-[9px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-lg border-0">
                  <TrendingUp className="h-2.5 w-2.5" />Popular
                </Badge>
              )}
              {isQuick && (
                <Badge className="bg-gradient-to-r from-mint to-emerald-500 text-white text-[9px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-lg border-0">
                  <Clock className="h-2.5 w-2.5" />Quick
                </Badge>
              )}
            </div>
            
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

            {isCompatible && hasPrefs && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-mint to-emerald-500 text-white text-[9px] px-2 py-0.5 flex items-center gap-1 shadow-xl border-0">
                  <Sparkles className="h-2.5 w-2.5" />Perfect Match
                </Badge>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight mb-2 drop-shadow-lg">
                {displayTitle || recipe.title}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Clock className="h-3 w-3" /><span>{recipe.prepTime}</span>
                </div>
                {showViewCount && viewCount > 1 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Eye className="h-3 w-3" /><span>{viewCount}x</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
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
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [easyCookingMode, setEasyCookingMode] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [babyAgeMonths, setBabyAgeMonths] = useState<number | null>(null);
  const [babyName, setBabyName] = useState<string>("");

  // Fetch baby profile for age-based sorting
  useEffect(() => {
    const fetchBabyAge = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('baby_birth_date, baby_name')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.baby_birth_date) {
        const months = differenceInMonths(new Date(), new Date(profile.baby_birth_date));
        setBabyAgeMonths(Math.max(0, months));
        setBabyName(profile.baby_name || '');
      }
    };
    fetchBabyAge();
  }, []);

  useEffect(() => {
    const ageParam = searchParams.get('age');
    if (ageParam) {
      const decodedAge = decodeURIComponent(ageParam);
      if (ageGroups.includes(decodedAge)) {
        setSelectedAge(decodedAge);
      }
    }
    const easyParam = searchParams.get('easy');
    if (easyParam === 'true') {
      setEasyCookingMode(true);
    }
  }, [searchParams]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [searchQuery, selectedAge, selectedCategory, dietaryFilters, easyCookingMode]);

  const recentRecipes = getRecentRecipes();
  const mostViewedRecipes = getMostViewed();

  const isEasyRecipe = useCallback((recipe: typeof recipes[0]) => {
    const prepMinutes = parseInt(recipe.prepTime) || 999;
    return prepMinutes <= 15 && recipe.ingredients.length <= 6;
  }, []);

  // Smart sorted recipes — ALL recipes, baby's age group first, then rest, both sorted by difficulty
  const filteredRecipes = useMemo(() => {
    // Apply user filters
    let result = recipes.filter((recipe) => {
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

    if (easyCookingMode) {
      result = result.filter(isEasyRecipe);
    }

    // Smart sort: baby's age group first, then rest — both sorted by difficulty (easiest first)
    if (babyAgeMonths !== null && babyAgeMonths >= 6 && selectedAge === "All Ages") {
      const babyAgeGroup = getAgeGroupFromMonths(babyAgeMonths);
      const ageMatched = result.filter(r => r.ageGroup === babyAgeGroup);
      const rest = result.filter(r => r.ageGroup !== babyAgeGroup);
      ageMatched.sort((a, b) => getDifficultyScore(a) - getDifficultyScore(b));
      rest.sort((a, b) => getDifficultyScore(a) - getDifficultyScore(b));
      return [...ageMatched, ...rest];
    }

    // Default sort by difficulty
    result.sort((a, b) => getDifficultyScore(a) - getDifficultyScore(b));
    return result;
  }, [searchQuery, selectedAge, selectedCategory, dietaryFilters, easyCookingMode, isEasyRecipe, babyAgeMonths]);

  const visibleRecipes = useMemo(() => {
    return filteredRecipes.slice(0, visibleCount);
  }, [filteredRecipes, visibleCount]);

  const hasMore = visibleCount < filteredRecipes.length;

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filteredRecipes.length));
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, filteredRecipes.length]);

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

  const [isExporting, setIsExporting] = useState(false);

  const handleExportEbook = useCallback(() => {
    hapticFeedback('light');
    setIsExporting(true);
    toast.info('Generating eBook with photos... This may take a moment.');
    setTimeout(() => {
      try {
        exportRecipeEbook(recipes as any);
        toast.success('eBook generated successfully! 📖');
      } catch {
        toast.error('Error generating eBook. Please try again.');
      } finally {
        setIsExporting(false);
      }
    }, 100);
  }, []);

  // Determine the baby's age group for the banner
  const babyAgeGroup = babyAgeMonths !== null && babyAgeMonths >= 6 ? getAgeGroupFromMonths(babyAgeMonths) : null;
  const ageMatchedCount = babyAgeGroup ? recipes.filter(r => r.ageGroup === babyAgeGroup).length : 0;

  return (
    <div className="min-h-screen pt-16 pb-24 lg:pb-8 bg-gradient-to-b from-background via-peach/5 to-mint/5">
      <div className="container px-3 sm:px-4">
        {/* Header */}
        <div className="mb-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent bg-[length:200%] animate-[shimmer_3s_ease-in-out_infinite]">
                {t('recipes.title')}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                {filteredRecipes.length} nutritious recipes for your little one
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportEbook}
              disabled={isExporting}
              className="rounded-full gap-1.5 border-primary/20 hover:bg-primary/5 text-xs sm:text-sm flex-shrink-0"
            >
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">eBook PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>

        {/* Smart age banner */}
        {babyAgeGroup && selectedAge === "All Ages" && babyName && (
          <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-mint/10 border border-primary/20 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/15 shrink-0">
                <Baby className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">
                  Sorted for {babyName} ({babyAgeMonths}m)
                </p>
                <p className="text-xs text-muted-foreground">
                  {ageMatchedCount} recipes for {babyAgeGroup} shown first • Easiest to prepare
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="sticky top-16 z-30 backdrop-blur-xl bg-card/80 py-3 sm:py-4 -mx-3 sm:-mx-4 px-3 sm:px-4 border-b border-gold/10 mb-6 rounded-b-2xl shadow-lg">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <Input
                placeholder={t('recipes.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 rounded-full h-10 sm:h-12 text-sm sm:text-base shadow-lg border-primary/10 focus:border-primary/30 bg-background"
              />
            </div>
            
            <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1">
              <Button
                variant={easyCookingMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  hapticFeedback('light');
                  setEasyCookingMode(!easyCookingMode);
                }}
                className={`rounded-full text-xs h-9 sm:h-10 px-3 sm:px-4 flex-shrink-0 gap-1.5 ${
                  easyCookingMode 
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg' 
                    : 'border-primary/20 bg-background shadow-sm'
                }`}
              >
                <ChefHat className="h-3.5 w-3.5" />
                Easy Cooking
              </Button>

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
        </div>

        {/* Recently Viewed */}
        {!historyLoading && recentRecipes.length > 0 && (
          <div className="mb-6 sm:mb-8 animate-fade-in">
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
          </div>
        )}

        {/* Easy Cooking Banner */}
        {easyCookingMode && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-accent/10 via-primary/5 to-secondary/10 border border-accent/20 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/15 shrink-0">
                <ChefHat className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground">Easy Cooking Mode</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Simple recipes anyone can make — max 6 ingredients, ready in 15 minutes or less.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between animate-fade-in">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredRecipes.length}</span> {filteredRecipes.length !== 1 ? 'delicious recipes' : 'recipe'} to explore
            {babyAgeGroup && selectedAge === "All Ages" && <span className="text-primary font-medium"> • Sorted for {babyAgeGroup}</span>}
          </p>
        </div>

        {/* Main Recipe Grid */}
        {filteredRecipes.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {visibleRecipes.map((recipe, index) => {
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
            </div>
            
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filteredRecipes.length))}
                  className="rounded-full px-6 gap-2 border-primary/20 hover:bg-primary/5"
                >
                  <ChevronDown className="h-4 w-4" />
                  Load more ({filteredRecipes.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyRecipes 
            onClearFilters={() => {
              hapticFeedback('light');
              setSearchQuery("");
              setSelectedAge("All Ages");
              setSelectedCategory("All Categories");
              setDietaryFilters([]);
              setEasyCookingMode(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Recipes;
