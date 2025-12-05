import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MealCard } from "./MealCard";
import { Copy, Trash2, ChevronDown, ChevronUp, Flame, Clock, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { recipes } from "@/data/recipes";
import confetti from "canvas-confetti";
import { toast } from "sonner";

interface MealSlot {
  recipeId: string;
  prepared: boolean;
  dbId?: string;
}

interface DayCardProps {
  day: string;
  dayIndex: number;
  meals: Record<string, MealSlot>;
  onAddMeal: (mealType: string) => void;
  onRemoveMeal: (mealType: string) => void;
  onTogglePrepared: (mealType: string) => void;
  onEditMeal: (mealType: string) => void;
  onCopyDay: () => void;
  onClearDay: () => void;
}

const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;

const dayEmojis = ["📅", "💪", "🌟", "✨", "🎯", "🌈", "🎉"];

export const DayCard = ({
  day,
  dayIndex,
  meals,
  onAddMeal,
  onRemoveMeal,
  onTogglePrepared,
  onEditMeal,
  onCopyDay,
  onClearDay
}: DayCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getRecipe = (recipeId: string) => recipes.find(r => r.id === recipeId);

  // Calculate day stats
  const plannedMeals = Object.keys(meals).length;
  const preparedMeals = Object.values(meals).filter(m => m.prepared).length;
  const progress = plannedMeals > 0 ? (preparedMeals / plannedMeals) * 100 : 0;

  // Calculate totals
  const totals = Object.values(meals).reduce(
    (acc, slot) => {
      const recipe = getRecipe(slot.recipeId);
      if (recipe) {
        acc.calories += parseInt(recipe.nutrition?.calories) || 0;
        acc.prepTime += parseInt(recipe.prepTime) || 0;
        acc.protein += parseInt(recipe.nutrition?.protein) || 0;
      }
      return acc;
    },
    { calories: 0, prepTime: 0, protein: 0 }
  );

  const isComplete = plannedMeals === 4 && preparedMeals === 4;

  // Celebrate when day is complete
  const handleTogglePrepared = (mealType: string) => {
    const currentPrepared = Object.values(meals).filter(m => m.prepared).length;
    const willBeComplete = currentPrepared === 3 && plannedMeals === 4 && !meals[mealType]?.prepared;
    
    onTogglePrepared(mealType);
    
    if (willBeComplete) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success(`🎉 Amazing! All meals for ${day} are prepared!`);
      }, 300);
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 border-2",
      isComplete && "border-green-500/50 bg-green-50/30 dark:bg-green-950/10",
      !isComplete && plannedMeals > 0 && "border-primary/30",
      !plannedMeals && "border-dashed border-muted-foreground/30"
    )}>
      {/* Header */}
      <CardHeader className={cn(
        "p-4 cursor-pointer select-none",
        "bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10"
      )} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{dayEmojis[dayIndex]}</span>
            <div>
              <h3 className="font-bold text-lg text-foreground">{day}</h3>
              <p className="text-xs text-muted-foreground">
                {plannedMeals}/4 meals planned • {preparedMeals} prepared
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Stats */}
            {plannedMeals > 0 && (
              <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mr-4">
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {totals.calories} cal
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  {totals.prepTime}min
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onCopyDay(); }}
              title="Copy day"
            >
              <Copy className="h-4 w-4" />
            </Button>
            {plannedMeals > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={(e) => { e.stopPropagation(); onClearDay(); }}
                title="Clear day"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {plannedMeals > 0 && (
          <div className="mt-3">
            <Progress 
              value={progress} 
              className={cn(
                "h-2",
                isComplete && "[&>div]:bg-green-500"
              )} 
            />
          </div>
        )}
      </CardHeader>

      {/* Content */}
      {isExpanded && (
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {mealTypes.map((mealType) => {
              const slot = meals[mealType];
              const recipe = slot ? getRecipe(slot.recipeId) : null;

              return (
                <MealCard
                  key={mealType}
                  recipe={recipe ? {
                    id: recipe.id,
                    title: recipe.title,
                    prepTime: recipe.prepTime,
                    calories: parseInt(recipe.nutrition?.calories) || undefined
                  } : null}
                  mealType={mealType}
                  prepared={slot?.prepared || false}
                  onTogglePrepared={() => handleTogglePrepared(mealType)}
                  onRemove={() => onRemoveMeal(mealType)}
                  onEdit={() => onEditMeal(mealType)}
                  onAdd={() => onAddMeal(mealType)}
                />
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
