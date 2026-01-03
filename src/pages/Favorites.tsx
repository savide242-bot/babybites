import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Heart, ArrowLeft } from "lucide-react";
import { recipes } from "@/data/recipes";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { EmptyFavorites } from "@/components/empty-states";

const Favorites = () => {
  const { t } = useLanguage();
  const { favorites, loading, toggleFavorite, isFavorite } = useFavorites();

  const favoriteRecipes = useMemo(() => {
    return recipes.filter(recipe => favorites.has(recipe.id));
  }, [favorites]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="outline" className="mb-4 rounded-full">
            <Link to="/recipes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Recipes
            </Link>
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary fill-current" />
            <h1 className="text-4xl font-bold">My Favorite Recipes</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {favoriteRecipes.length} {favoriteRecipes.length === 1 ? 'recipe' : 'recipes'} saved
          </p>
        </div>

        {/* Empty State */}
        {favoriteRecipes.length === 0 && (
          <Card className="border-dashed border-2 animate-fade-in">
            <EmptyFavorites />
          </Card>
        )}

        {/* Recipes Grid */}
        {favoriteRecipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteRecipes.map((recipe, index) => (
              <Card
                key={recipe.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(recipe.id);
                    }}
                  >
                    <Heart className="h-4 w-4 fill-current text-primary" />
                  </Button>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      {recipe.category}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5">
                  <Link to={`/recipe/${recipe.id}`}>
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 hover:text-primary transition-colors">
                      {recipe.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {recipe.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{recipe.prepTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{recipe.servings}</span>
                    </div>
                  </div>

                  <Badge className="rounded-full">{recipe.ageGroup}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
