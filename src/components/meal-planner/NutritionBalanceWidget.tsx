import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, TrendingUp, Apple, Beef, Wheat, Milk } from "lucide-react";
import { recipes } from "@/data/recipes";
import { cn } from "@/lib/utils";

interface MealSlot {
  recipeId: string;
  prepared: boolean;
}

interface MealPlan {
  [day: string]: {
    [mealType: string]: MealSlot;
  };
}

interface NutritionBalanceWidgetProps {
  mealPlan: MealPlan;
}

const nutritionTargets = {
  calories: { min: 700, max: 1000, label: "Calories", unit: "cal/day" },
  protein: { min: 15, max: 25, label: "Protein", unit: "g/day" },
  vegetables: { min: 3, label: "Vegetable servings", unit: "servings/day" },
  fruits: { min: 2, label: "Fruit servings", unit: "servings/day" }
};

const foodCategories = [
  { id: "proteins", icon: Beef, color: "text-red-500", bgColor: "bg-red-100", label: "Proteins", keywords: ["chicken", "beef", "turkey", "salmon", "fish", "egg", "meat", "lentil", "bean"] },
  { id: "vegetables", icon: Apple, color: "text-green-500", bgColor: "bg-green-100", label: "Vegetables", keywords: ["carrot", "broccoli", "spinach", "pea", "sweet potato", "vegetable", "zucchini"] },
  { id: "grains", icon: Wheat, color: "text-amber-500", bgColor: "bg-amber-100", label: "Grains", keywords: ["rice", "oat", "quinoa", "pasta", "bread", "cereal", "wheat"] },
  { id: "dairy", icon: Milk, color: "text-blue-500", bgColor: "bg-blue-100", label: "Dairy", keywords: ["milk", "cheese", "yogurt", "cream"] }
];

export const NutritionBalanceWidget = ({ mealPlan }: NutritionBalanceWidgetProps) => {
  const stats = useMemo(() => {
    const weeklyStats = {
      totalCalories: 0,
      totalProtein: 0,
      totalMeals: 0,
      categories: {} as Record<string, number>
    };

    foodCategories.forEach(cat => {
      weeklyStats.categories[cat.id] = 0;
    });

    Object.values(mealPlan).forEach(dayMeals => {
      Object.values(dayMeals).forEach(slot => {
        const recipe = recipes.find(r => r.id === slot.recipeId);
        if (recipe) {
          weeklyStats.totalMeals++;
          weeklyStats.totalCalories += parseInt(recipe.nutrition?.calories) || 0;
          weeklyStats.totalProtein += parseInt(recipe.nutrition?.protein) || 0;

          // Categorize ingredients
          const ingredientsLower = recipe.ingredients.join(" ").toLowerCase();
          foodCategories.forEach(cat => {
            if (cat.keywords.some(kw => ingredientsLower.includes(kw))) {
              weeklyStats.categories[cat.id]++;
            }
          });
        }
      });
    });

    return weeklyStats;
  }, [mealPlan]);

  const daysPlanned = Object.keys(mealPlan).length;
  const avgCalories = daysPlanned > 0 ? Math.round(stats.totalCalories / daysPlanned) : 0;
  const avgProtein = daysPlanned > 0 ? Math.round(stats.totalProtein / daysPlanned) : 0;

  const getBalanceStatus = () => {
    const issues: string[] = [];
    
    if (avgCalories < nutritionTargets.calories.min) {
      issues.push("Add more calorie-rich meals");
    }
    if (avgProtein < nutritionTargets.protein.min) {
      issues.push("Include more protein sources");
    }

    // Check food category balance
    const totalCategoryMeals = Object.values(stats.categories).reduce((a, b) => a + b, 0);
    foodCategories.forEach(cat => {
      const percentage = totalCategoryMeals > 0 ? (stats.categories[cat.id] / totalCategoryMeals) * 100 : 0;
      if (percentage < 15 && stats.totalMeals > 5) {
        issues.push(`Add more ${cat.label.toLowerCase()}`);
      }
    });

    return issues;
  };

  const issues = getBalanceStatus();
  const isBalanced = issues.length === 0 && stats.totalMeals >= 7;

  return (
    <Card className="overflow-hidden">
      <CardHeader className={cn(
        "p-4 bg-gradient-to-r",
        isBalanced 
          ? "from-green-500/20 to-emerald-500/20" 
          : "from-amber-500/20 to-orange-500/20"
      )}>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Nutrition Balance
          </span>
          {isBalanced ? (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Balanced
            </Badge>
          ) : stats.totalMeals > 0 ? (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {issues.length} tips
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {stats.totalMeals === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Start adding meals to see nutrition insights</p>
          </div>
        ) : (
          <>
            {/* Daily Averages */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Calories/day</span>
                  <span className={cn(
                    "font-semibold",
                    avgCalories >= nutritionTargets.calories.min ? "text-green-600" : "text-amber-600"
                  )}>
                    {avgCalories} cal
                  </span>
                </div>
                <Progress 
                  value={Math.min((avgCalories / nutritionTargets.calories.max) * 100, 100)} 
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Protein/day</span>
                  <span className={cn(
                    "font-semibold",
                    avgProtein >= nutritionTargets.protein.min ? "text-green-600" : "text-amber-600"
                  )}>
                    {avgProtein}g
                  </span>
                </div>
                <Progress 
                  value={Math.min((avgProtein / nutritionTargets.protein.max) * 100, 100)} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Food Category Balance */}
            <div>
              <p className="text-sm font-medium mb-2">Food Groups</p>
              <div className="grid grid-cols-4 gap-2">
                {foodCategories.map(cat => {
                  const Icon = cat.icon;
                  const count = stats.categories[cat.id];
                  const percentage = stats.totalMeals > 0 ? Math.round((count / stats.totalMeals) * 100) : 0;
                  
                  return (
                    <div
                      key={cat.id}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-lg text-center",
                        cat.bgColor
                      )}
                    >
                      <Icon className={cn("h-5 w-5 mb-1", cat.color)} />
                      <span className="text-xs font-medium">{cat.label}</span>
                      <span className={cn("text-lg font-bold", cat.color)}>{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            {issues.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Nutrition Tips
                </p>
                <ul className="text-xs text-amber-600 dark:text-amber-300 space-y-0.5">
                  {issues.slice(0, 3).map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
