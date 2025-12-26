import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, ChevronRight, Sparkles, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Recipe } from "@/data/recipes";
import { cn } from "@/lib/utils";
import { getRecipeImageById } from "@/data/recipeImages";

interface TodayMeal {
  mealType: string;
  recipeTitle: string;
  recipeId: string;
  prepared: boolean;
}

interface DailyActionCardProps {
  recipeOfTheDay: Recipe;
  todayMeals: TodayMeal[];
  babyName: string;
}

const DailyActionCard = ({ recipeOfTheDay, todayMeals, babyName }: DailyActionCardProps) => {
  // Find next unprepared meal
  const nextMeal = todayMeals.find(m => !m.prepared);
  const allMealsDone = todayMeals.length > 0 && todayMeals.every(m => m.prepared);
  const mealCount = todayMeals.length;
  const preparedCount = todayMeals.filter(m => m.prepared).length;

  // If there's a next meal to prepare, show that
  if (nextMeal) {
    return (
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Next meal to prepare
              </p>
              <p className="text-xs text-muted-foreground">
                {preparedCount}/{mealCount} done today
              </p>
            </div>
          </div>

          <Link to={`/recipe/${nextMeal.recipeId}`}>
            <div className="group cursor-pointer">
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                {nextMeal.recipeTitle}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 bg-accent/20 rounded-full text-xs font-medium text-accent-foreground capitalize">
                  {nextMeal.mealType}
                </span>
              </div>
              <Button className="w-full rounded-xl gap-2 group-hover:bg-primary/90">
                Start Cooking
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Link>
        </div>
      </Card>
    );
  }

  // If all meals done, show celebration
  if (allMealsDone && mealCount > 0) {
    return (
      <Card className="overflow-hidden border-mint/30 bg-gradient-to-br from-mint/10 via-card to-secondary/10">
        <div className="p-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-mint/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7 text-mint" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            All meals done! 🎉
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            You prepared {mealCount} meals for {babyName || "your baby"} today
          </p>
          <Link to="/recipes">
            <Button variant="outline" className="rounded-xl border-mint/30 text-mint hover:bg-mint/10">
              Explore More Recipes
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Default: Show recipe of the day
  const recipeImage = getRecipeImageById(recipeOfTheDay.id);

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="relative h-36">
        <img 
          src={recipeImage} 
          alt={recipeOfTheDay.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 bg-accent/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-accent-foreground" />
            <span className="text-xs font-semibold text-accent-foreground">Recipe of the Day</span>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
            {recipeOfTheDay.title}
          </h3>
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{recipeOfTheDay.prepTime}</span>
          </div>
        </div>
      </div>
      <div className="p-3">
        <Link to={`/recipe/${recipeOfTheDay.id}`}>
          <Button className="w-full rounded-xl gap-2">
            <ChefHat className="w-4 h-4" />
            Cook for {babyName || "Baby"}
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default DailyActionCard;
