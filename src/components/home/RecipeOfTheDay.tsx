import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, ArrowRight, Clock, Sparkles } from "lucide-react";
import { Recipe } from "@/data/recipes";
import { getRecipeImageById } from "@/data/recipeImages";

interface RecipeOfTheDayProps {
  recipe: Recipe;
  babyName: string;
}

const RecipeOfTheDay = ({ recipe, babyName }: RecipeOfTheDayProps) => {
  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-mint/5 shadow-lg">
      <CardContent className="p-0">
        <div className="flex">
          {/* Image Section */}
          <div className="w-28 h-28 flex-shrink-0 relative">
            <img
              src={getRecipeImageById(recipe.id)}
              alt={recipe.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Today
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ChefHat className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">Recipe of the Day</span>
              </div>
              <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                {recipe.title}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {recipe.prepTime}
                </span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                  {recipe.ageGroup}
                </span>
              </div>
            </div>

            <Link to={`/recipe/${recipe.id}`}>
              <Button 
                size="sm" 
                className="w-full mt-2 bg-gradient-to-r from-primary to-mint text-white hover:shadow-glow transition-all"
              >
                <span className="flex items-center gap-2">
                  Cook for {babyName || "Baby"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeOfTheDay;
