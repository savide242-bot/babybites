import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Check, Circle, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Meal {
  mealType: string;
  recipeTitle: string;
  recipeId: string;
  prepared: boolean;
}

interface TodaysMealsPreviewProps {
  meals: Meal[];
}

const mealConfig: { [key: string]: { emoji: string; label: string; gradient: string } } = {
  breakfast: { emoji: '🌅', label: 'Breakfast', gradient: 'from-amber-100 to-orange-100' },
  lunch: { emoji: '☀️', label: 'Lunch', gradient: 'from-yellow-100 to-amber-100' },
  dinner: { emoji: '🌙', label: 'Dinner', gradient: 'from-indigo-100 to-purple-100' },
  snack: { emoji: '🍎', label: 'Snack', gradient: 'from-green-100 to-emerald-100' }
};

const TodaysMealsPreview = ({ meals: initialMeals }: TodaysMealsPreviewProps) => {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [updating, setUpdating] = useState<string | null>(null);

  const togglePrepared = async (meal: Meal, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setUpdating(meal.recipeId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayDayName = dayNames[new Date().getDay()];

      const { error } = await supabase
        .from('meal_plans')
        .update({ prepared: !meal.prepared })
        .eq('user_id', session.user.id)
        .eq('recipe_id', meal.recipeId)
        .eq('day_of_week', todayDayName)
        .eq('meal_type', meal.mealType);

      if (error) throw error;

      setMeals(prev => prev.map(m => 
        m.recipeId === meal.recipeId && m.mealType === meal.mealType 
          ? { ...m, prepared: !m.prepared } 
          : m
      ));

      toast.success(
        !meal.prepared ? "Meal marked as prepared! 🎉" : "Meal unmarked",
        { duration: 2000 }
      );
    } catch (error) {
      console.error('Error updating meal:', error);
      toast.error("Failed to update meal");
    } finally {
      setUpdating(null);
    }
  };

  if (meals.length === 0) {
    return (
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Utensils className="w-7 h-7 text-primary" />
          </div>
          <p className="text-base font-medium text-foreground mb-1">No meals planned yet</p>
          <p className="text-sm text-muted-foreground mb-4">Plan delicious meals for your baby</p>
          <Link to="/planner">
            <Button className="bg-gradient-to-r from-primary to-secondary text-white">
              Start Planning <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const completedCount = meals.filter(m => m.prepared).length;
  const progress = (completedCount / meals.length) * 100;

  return (
    <Card className="border border-border/50 bg-card shadow-card overflow-hidden">
      <CardContent className="p-0">
        {/* Header with Progress */}
        <div className="p-4 pb-3 border-b border-border/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Today's Meals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-primary">{completedCount}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm text-muted-foreground">{meals.length}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-mint rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Meals List */}
        <div className="divide-y divide-border/30">
          {meals.map((meal, idx) => {
            const config = mealConfig[meal.mealType] || { emoji: '🍽️', label: meal.mealType, gradient: 'from-gray-100 to-gray-50' };
            const isUpdating = updating === meal.recipeId;
            
            return (
              <div 
                key={idx}
                className={cn(
                  "flex items-center gap-3 p-3 transition-all",
                  meal.prepared ? "bg-mint/5" : "hover:bg-muted/30"
                )}
              >
                {/* Checkbox Button */}
                <button
                  onClick={(e) => togglePrepared(meal, e)}
                  disabled={isUpdating}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                    meal.prepared 
                      ? "bg-mint border-mint text-white" 
                      : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5",
                    isUpdating && "opacity-50 animate-pulse"
                  )}
                >
                  {meal.prepared ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/50" />
                  )}
                </button>

                {/* Emoji */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br flex-shrink-0",
                  config.gradient
                )}>
                  {config.emoji}
                </div>

                {/* Content */}
                <Link 
                  to={`/recipe/${meal.recipeId}`}
                  className="flex-1 min-w-0 group"
                >
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {config.label}
                  </p>
                  <p className={cn(
                    "text-sm font-medium truncate transition-colors",
                    meal.prepared 
                      ? "text-muted-foreground line-through" 
                      : "text-foreground group-hover:text-primary"
                  )}>
                    {meal.recipeTitle}
                  </p>
                </Link>

                {/* Arrow */}
                <Link to={`/recipe/${meal.recipeId}`} className="flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted/20 border-t border-border/30">
          <Link to="/planner" className="block">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-secondary hover:text-secondary hover:bg-secondary/10"
            >
              View Full Weekly Plan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysMealsPreview;