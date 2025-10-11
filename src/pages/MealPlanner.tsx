import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ShoppingCart, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recipes } from "@/data/recipes";
import { toast } from "sonner";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface MealPlan {
  [key: string]: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snack?: string;
  };
}

const MealPlanner = () => {
  const [mealPlan, setMealPlan] = useState<MealPlan>({});

  const handleAddMeal = (day: string, mealType: string, recipeId: string) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: recipeId,
      },
    }));
    toast.success("Meal added to planner!");
  };

  const handleRemoveMeal = (day: string, mealType: string) => {
    setMealPlan((prev) => {
      const dayMeals = { ...prev[day] };
      delete dayMeals[mealType as keyof typeof dayMeals];
      return {
        ...prev,
        [day]: dayMeals,
      };
    });
    toast.info("Meal removed from planner");
  };

  const getRecipeById = (id: string) => recipes.find((r) => r.id === id);

  const generateShoppingList = () => {
    const ingredients = new Set<string>();
    Object.values(mealPlan).forEach((dayMeals) => {
      Object.values(dayMeals).forEach((recipeId) => {
        const recipe = getRecipeById(recipeId);
        if (recipe) {
          recipe.ingredients.forEach((ing) => ingredients.add(ing));
        }
      });
    });
    
    toast.success("Shopping list generated!", {
      description: `You have ${ingredients.size} unique ingredients to buy.`,
    });
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Weekly Meal Planner</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            Plan your baby's meals for the week and generate an automatic shopping list
          </p>
          <Button onClick={generateShoppingList} size="lg" className="rounded-full">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Generate Shopping List
          </Button>
        </div>

        {/* Meal Plan Grid */}
        <div className="space-y-6">
          {daysOfWeek.map((day) => (
            <Card key={day} className="border-2">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {day}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {["breakfast", "lunch", "dinner", "snack"].map((mealType) => {
                    const recipeId = mealPlan[day]?.[mealType];
                    const recipe = recipeId ? getRecipeById(recipeId) : null;

                    return (
                      <div key={mealType} className="space-y-2">
                        <div className="text-sm font-medium capitalize text-muted-foreground">
                          {mealType}
                        </div>
                        
                        {recipe ? (
                          <Card className="relative group">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onClick={() => handleRemoveMeal(day, mealType)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <CardContent className="p-3">
                              <div className="text-sm font-medium line-clamp-2">
                                {recipe.title}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {recipe.prepTime}
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Select onValueChange={(value) => handleAddMeal(day, mealType, value)}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Add meal" />
                            </SelectTrigger>
                            <SelectContent>
                              {recipes
                                .filter((r) => 
                                  r.category.toLowerCase() === mealType.toLowerCase() ||
                                  mealType === "snack" && r.category === "Snack"
                                )
                                .map((recipe) => (
                                  <SelectItem key={recipe.id} value={recipe.id}>
                                    {recipe.title}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips Card */}
        <Card className="mt-12 border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Meal Planning Tips
            </CardTitle>
            <CardDescription>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• Plan meals that share common ingredients to reduce waste</li>
                <li>• Prepare larger batches and freeze portions for busy days</li>
                <li>• Rotate proteins and vegetables throughout the week for variety</li>
                <li>• Keep favorite meals on hand for days when plans change</li>
              </ul>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default MealPlanner;
