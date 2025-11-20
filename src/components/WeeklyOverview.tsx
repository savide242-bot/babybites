import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Utensils, Flame, Drumstick, Wheat, Droplet } from "lucide-react";
import { recipes } from "@/data/recipes";

interface MealSlot {
  recipeId: string;
  prepared: boolean;
  dbId?: string;
}

interface MealPlan {
  [day: string]: {
    [mealType: string]: MealSlot;
  };
}

interface WeeklyOverviewProps {
  mealPlan: MealPlan;
}

export const WeeklyOverview = ({ mealPlan }: WeeklyOverviewProps) => {
  // Calculate meal statistics
  const calculateStats = () => {
    let totalMeals = 0;
    let preparedMeals = 0;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    Object.values(mealPlan).forEach((day) => {
      Object.values(day).forEach((slot) => {
        totalMeals++;
        if (slot.prepared) preparedMeals++;

        const recipe = recipes.find((r) => r.id === slot.recipeId);
        if (recipe) {
          totalCalories += parseInt(recipe.nutrition.calories) || 0;
          totalProtein += parseFloat(recipe.nutrition.protein) || 0;
          totalCarbs += parseFloat(recipe.nutrition.carbs) || 0;
          totalFat += parseFloat(recipe.nutrition.fat) || 0;
        }
      });
    });

    return {
      totalMeals,
      preparedMeals,
      completionPercentage: totalMeals > 0 ? (preparedMeals / totalMeals) * 100 : 0,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    };
  };

  const stats = calculateStats();

  if (stats.totalMeals === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background mb-8">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          Weekly Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Meal Completion */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Meal Completion</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {stats.preparedMeals}/{stats.totalMeals}
            </span>
          </div>
          <Progress value={stats.completionPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {stats.completionPercentage.toFixed(0)}% of this week's meals prepared
          </p>
        </div>

        {/* Nutrition Summary */}
        <div>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Weekly Nutrition Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Calories */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Calories</p>
                  <p className="text-lg font-bold text-foreground">{stats.totalCalories}</p>
                </div>
              </div>
              <Progress 
                value={Math.min((stats.totalCalories / 7000) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">~{Math.round(stats.totalCalories / 7)} per day</p>
            </div>

            {/* Protein */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Drumstick className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="text-lg font-bold text-foreground">{stats.totalProtein.toFixed(1)}g</p>
                </div>
              </div>
              <Progress 
                value={Math.min((stats.totalProtein / 70) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">~{(stats.totalProtein / 7).toFixed(1)}g per day</p>
            </div>

            {/* Carbs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Wheat className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                  <p className="text-lg font-bold text-foreground">{stats.totalCarbs.toFixed(1)}g</p>
                </div>
              </div>
              <Progress 
                value={Math.min((stats.totalCarbs / 210) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">~{(stats.totalCarbs / 7).toFixed(1)}g per day</p>
            </div>

            {/* Fat */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Droplet className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fat</p>
                  <p className="text-lg font-bold text-foreground">{stats.totalFat.toFixed(1)}g</p>
                </div>
              </div>
              <Progress 
                value={Math.min((stats.totalFat / 105) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">~{(stats.totalFat / 7).toFixed(1)}g per day</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        {stats.completionPercentage < 50 && stats.totalMeals > 0 && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-foreground">
              💡 <span className="font-semibold">Tip:</span> Keep track of your meal prep progress! 
              Mark meals as prepared once you've cooked them to see your weekly completion rate.
            </p>
          </div>
        )}

        {stats.completionPercentage === 100 && (
          <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-500/20">
            <p className="text-sm text-green-800 dark:text-green-200">
              🎉 <span className="font-semibold">Amazing!</span> You've completed all planned meals for this week! 
              Great job staying on track with your baby's nutrition.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
