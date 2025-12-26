import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Heart, History, Eye, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { recipes, ageGroups, categories } from "@/data/recipes";
import { useLanguage } from "@/hooks/useLanguage";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecipeHistory } from "@/hooks/useRecipeHistory";
import { useDietaryPreferences, DietaryTag } from "@/hooks/useDietaryPreferences";
import { getRecipeDietaryTags } from "@/data/recipeDietaryTags";
import { DietaryFilterSelect } from "@/components/DietaryFilterSelect";

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

  // Read age filter from URL parameter (e.g., /recipes?age=6-8%20months)
  useEffect(() => {
    const ageParam = searchParams.get('age');
    if (ageParam) {
      // Decode and set the age filter
      const decodedAge = decodeURIComponent(ageParam);
      if (ageGroups.includes(decodedAge)) {
        setSelectedAge(decodedAge);
      }
    }
  }, [searchParams]);

  const recentRecipes = getRecentRecipes();
  const mostViewedRecipes = getMostViewed();

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAge = selectedAge === "All Ages" || recipe.ageGroup === selectedAge;
    const matchesCategory = selectedCategory === "All Categories" || recipe.category === selectedCategory;
    
    const recipeTags = getRecipeDietaryTags(recipe.id);
    const matchesDietary = dietaryFilters.length === 0 || 
                          dietaryFilters.every(filter => recipeTags.includes(filter));
    
    return matchesSearch && matchesAge && matchesCategory && matchesDietary;
  });

  const isCompatibleWithUserPrefs = (recipeId: string) => {
    const recipeTags = getRecipeDietaryTags(recipeId);
    return isRecipeCompatible(recipeTags);
  };

  // Compact Recipe Card Component
  const RecipeCard = ({ recipe, showViewCount = false, viewCount = 0 }: { recipe: typeof recipes[0], showViewCount?: boolean, viewCount?: number }) => {
    const isCompatible = isCompatibleWithUserPrefs(recipe.id);
    
    return (
      <Link to={`/recipe/${recipe.id}`} className="group">
        <Card className={`overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 ${
          isCompatible && preferences.length > 0 ? 'ring-2 ring-green-500/50' : ''
        }`}>
          <div className="aspect-square relative overflow-hidden">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Top badges */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
              <Badge className="bg-white/90 text-gray-700 text-[10px] px-2 py-0.5">
                {recipe.ageGroup}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 bg-white/80 hover:bg-white rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(recipe.id);
                }}
              >
                <Heart className={`h-3.5 w-3.5 ${isFavorite(recipe.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </Button>
            </div>

            {/* Perfect match indicator */}
            {isCompatible && preferences.length > 0 && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2">
                <Badge className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 flex items-center gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  Match
                </Badge>
              </div>
            )}
            
            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight mb-1">
                {recipe.title}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-white/80">
                  <Clock className="h-3 w-3" />
                  <span>{recipe.prepTime}</span>
                </div>
                {showViewCount && viewCount > 1 && (
                  <div className="flex items-center gap-1 text-[10px] text-white/80">
                    <Eye className="h-3 w-3" />
                    <span>{viewCount}x</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen py-16">
      <div className="container px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {t('recipes.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed">
            {t('recipes.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('recipes.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-full h-12 text-base shadow-md focus:shadow-lg transition-all duration-300"
            />
          </div>
          
          <div className="grid gap-3 grid-cols-3">
            <Select value={selectedAge} onValueChange={setSelectedAge}>
              <SelectTrigger className="rounded-full text-sm">
                <SelectValue placeholder={t('recipes.selectAge')} />
              </SelectTrigger>
              <SelectContent>
                {ageGroups.map((age) => (
                  <SelectItem key={age} value={age}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="rounded-full text-sm">
                <SelectValue placeholder={t('recipes.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
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

        {/* Recently Viewed Section */}
        {!historyLoading && recentRecipes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Recently Viewed</h2>
              </div>
              <Badge variant="secondary" className="rounded-full text-xs">
                {recentlyViewed.length} {recentlyViewed.length === 1 ? 'recipe' : 'recipes'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {recentRecipes.slice(0, 6).map((recipe) => {
                if (!recipe) return null;
                const viewData = recentlyViewed.find(v => v.recipe_id === recipe.id);
                return (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    showViewCount={true}
                    viewCount={viewData?.view_count || 0}
                  />
                );
              })}
            </div>

            {/* Most Viewed Info */}
            {mostViewedRecipes.length > 0 && (
              <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Most Viewed:</span>
                  <span className="text-muted-foreground text-xs">
                    {mostViewedRecipes.map((view, idx) => {
                      const recipe = recipes.find(r => r.id === view.recipe_id);
                      return (
                        <span key={view.recipe_id}>
                          {recipe?.title} ({view.view_count}x)
                          {idx < mostViewedRecipes.length - 1 && ', '}
                        </span>
                      );
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {t('recipes.showing')} {filteredRecipes.length} {filteredRecipes.length !== 1 ? t('recipes.recipes') : t('recipes.recipe')}
        </div>

        {/* Main Recipe Grid - Uniform compact layout */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">{t('recipes.noResults')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('recipes.noResultsDesc')}
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedAge("All Ages");
                setSelectedCategory("All Categories");
                setDietaryFilters([]);
              }}
              variant="outline"
              className="rounded-full"
            >
              {t('recipes.clearFilters')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;
