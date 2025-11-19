import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { recipes, ageGroups, categories } from "@/data/recipes";
import { useLanguage } from "@/hooks/useLanguage";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useFavorites } from "@/hooks/useFavorites";

const Recipes = () => {
  const { t } = useLanguage();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAge, setSelectedAge] = useState("All Ages");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAge = selectedAge === "All Ages" || recipe.ageGroup === selectedAge;
    const matchesCategory = selectedCategory === "All Categories" || recipe.category === selectedCategory;
    
    return matchesSearch && matchesAge && matchesCategory;
  });

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('recipes.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t('recipes.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('recipes.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Select value={selectedAge} onValueChange={setSelectedAge}>
              <SelectTrigger className={`rounded-full transition-all duration-200 ${selectedAge !== 'All Ages' ? 'animate-bounceSoft' : ''}`}>
                <SelectValue placeholder={t('recipes.selectAge')} />
              </SelectTrigger>
              <SelectContent>
                {ageGroups.map((age) => (
                  <SelectItem key={age} value={age}>
                    {age}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className={`rounded-full transition-all duration-200 ${selectedCategory !== 'All Categories' ? 'animate-bounceSoft' : ''}`}>
                <SelectValue placeholder={t('recipes.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-muted-foreground">
          {t('recipes.showing')} {filteredRecipes.length} {filteredRecipes.length !== 1 ? t('recipes.recipes') : t('recipes.recipe')}
        </div>

        {/* Recipe Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe, index) => {
              const RecipeCard = () => {
                const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
                
                return (
                  <div ref={ref}>
                    <Card 
                      className={`overflow-hidden hover:shadow-xl transition-all border-2 hover:border-primary/50 ${
                        isVisible ? 'animate-fade-in' : 'opacity-0'
                      }`}
                      style={{ animationDelay: `${(index % 6) * 50}ms` }}
                    >
                      <div className="aspect-video bg-muted relative overflow-hidden group">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
                          {recipe.ageGroup}
                        </div>
                        <Button
                          size="icon"
                          variant={isFavorite(recipe.id) ? "default" : "secondary"}
                          className="absolute top-3 right-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(recipe.id);
                          }}
                        >
                          <Heart className={`h-4 w-4 ${isFavorite(recipe.id) ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                      <CardHeader>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className={`bg-primary/10 text-primary px-2 py-1 rounded-full font-medium ${
                            isVisible ? 'animate-scale-in' : 'opacity-0'
                          }`} style={{ animationDelay: `${(index % 6) * 50 + 200}ms` }}>
                            {recipe.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {recipe.prepTime}
                          </span>
                        </div>
                        <CardTitle className="text-xl line-clamp-1">{recipe.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          <Button asChild className="rounded-full">
                            <Link to={`/recipe/${recipe.id}`}>{t('recipes.viewRecipe')}</Link>
                          </Button>
                          <Button 
                            variant={isFavorite(recipe.id) ? "default" : "outline"}
                            className="rounded-full"
                            onClick={() => toggleFavorite(recipe.id)}
                          >
                            <Heart className={`h-4 w-4 ${isFavorite(recipe.id) ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              };
              
              return <RecipeCard key={recipe.id} />;
            })}
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
