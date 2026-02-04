import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, ChevronRight, Sparkles, Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Recipe } from "@/data/recipes";
import { cn } from "@/lib/utils";
import { getRecipeImageById } from "@/data/recipeImages";
import { motion } from "framer-motion";

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
    const nextMealImage = getRecipeImageById(nextMeal.recipeId);
    
    return (
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5">
        <div className="flex">
          {/* Recipe Image */}
          <div className="w-24 h-28 flex-shrink-0 relative overflow-hidden">
            <img 
              src={nextMealImage} 
              alt={nextMeal.recipeTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
          </div>
          
          {/* Content */}
          <div className="flex-1 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                <ChefHat className="w-3 h-3 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Next meal to prepare
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {preparedCount}/{mealCount} done today
                </p>
              </div>
            </div>

            <Link to={`/recipe/${nextMeal.recipeId}`}>
              <div className="group cursor-pointer">
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                  {nextMeal.recipeTitle}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-accent/20 rounded-full text-[10px] font-medium text-accent-foreground capitalize">
                    {nextMeal.mealType}
                  </span>
                </div>
                <Button size="sm" className="w-full rounded-lg gap-1.5 text-xs h-8 group-hover:bg-primary/90">
                  Start Cooking
                  <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Link>
          </div>
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
    <Card className="overflow-hidden border-gold/30 bg-gradient-to-br from-gold/5 via-card to-primary/5 relative">
      {/* Sparkle decoration */}
      <motion.div 
        className="absolute -top-1 -right-1 z-20"
        animate={{ rotate: 360, scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center backdrop-blur-sm border border-gold/30">
          <Star className="w-4 h-4 text-gold fill-gold/50" />
        </div>
      </motion.div>

      <div className="relative h-40">
        <img 
          src={recipeImage} 
          alt={recipeOfTheDay.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Premium badge */}
        <div className="absolute top-3 left-3">
          <motion.div 
            className="flex items-center gap-1.5 bg-gradient-to-r from-gold/90 to-gold/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-bold text-white">Recipe of the Day</span>
          </motion.div>
        </div>
        
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-xl font-bold text-white mb-1.5 line-clamp-1 drop-shadow-lg">
            {recipeOfTheDay.title}
          </h3>
          <div className="flex items-center gap-3 text-white/90">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{recipeOfTheDay.prepTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">🥗</span>
              <span className="text-xs font-medium">{recipeOfTheDay.ageGroup}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <Link to={`/recipe/${recipeOfTheDay.id}`}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="w-full rounded-xl gap-2 h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
              <ChefHat className="w-4 h-4" />
              Cook for {babyName || "Baby"} 👶
            </Button>
          </motion.div>
        </Link>
      </div>
    </Card>
  );
};

export default DailyActionCard;
