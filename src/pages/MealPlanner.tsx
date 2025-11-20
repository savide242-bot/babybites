import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Check, ChefHat, X } from "lucide-react";
import { recipes } from "@/data/recipes";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

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

const MealPlanner = () => {
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      loadMealPlan(user.id);
    }
  };

  const loadMealPlan = async (uid: string) => {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', uid);

    if (error) {
      console.error('Error loading meal plan:', error);
      return;
    }

    if (data) {
      const plan: MealPlan = {};
      data.forEach((item) => {
        if (!plan[item.day_of_week]) {
          plan[item.day_of_week] = {};
        }
        plan[item.day_of_week][item.meal_type] = {
          recipeId: item.recipe_id,
          prepared: item.prepared || false,
          dbId: item.id,
        };
      });
      setMealPlan(plan);
    }
  };

  const addMeal = async (day: string, mealType: string, recipeId: string) => {
    if (!userId) return;

    // Remove existing meal if any
    const existingSlot = mealPlan[day]?.[mealType];
    if (existingSlot?.dbId) {
      await supabase
        .from('meal_plans')
        .delete()
        .eq('id', existingSlot.dbId);
    }

    // Add new meal
    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        day_of_week: day,
        meal_type: mealType,
        recipe_id: recipeId,
        prepared: false,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add meal");
      console.error(error);
      return;
    }

    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: {
          recipeId,
          prepared: false,
          dbId: data.id,
        },
      },
    }));

    toast.success("Meal added! Shopping list updated.");
    updateShoppingList();
  };

  const removeMeal = async (day: string, mealType: string) => {
    const slot = mealPlan[day]?.[mealType];
    if (!slot?.dbId) return;

    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', slot.dbId);

    if (error) {
      toast.error("Failed to remove meal");
      return;
    }

    setMealPlan((prev) => {
      const newPlan = { ...prev };
      if (newPlan[day]) {
        delete newPlan[day][mealType];
      }
      return newPlan;
    });

    toast.info("Meal removed");
    updateShoppingList();
  };

  const togglePrepared = async (day: string, mealType: string) => {
    const slot = mealPlan[day]?.[mealType];
    if (!slot?.dbId) return;

    const newPrepared = !slot.prepared;

    const { error } = await supabase
      .from('meal_plans')
      .update({ prepared: newPrepared })
      .eq('id', slot.dbId);

    if (error) {
      toast.error("Failed to update meal status");
      return;
    }

    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: {
          ...slot,
          prepared: newPrepared,
        },
      },
    }));

    toast.success(newPrepared ? "Meal marked as prepared!" : "Meal marked as not prepared");
  };

  const updateShoppingList = async () => {
    if (!userId) return;

    // Gather all ingredients from meal plan
    const ingredients: { ingredient: string; category: string; fromRecipe: string }[] = [];

    Object.entries(mealPlan).forEach(([day, meals]) => {
      Object.entries(meals).forEach(([mealType, slot]) => {
        const recipe = recipes.find((r) => r.id === slot.recipeId);
        if (recipe) {
          recipe.ingredients.forEach((ing) => {
            ingredients.push({
              ingredient: ing,
              category: categorizeIngredient(ing),
              fromRecipe: recipe.title,
            });
          });
        }
      });
    });

    // Clear existing shopping list
    await supabase
      .from('shopping_list_items')
      .delete()
      .eq('user_id', userId);

    // Insert new shopping list items
    if (ingredients.length > 0) {
      const { error } = await supabase
        .from('shopping_list_items')
        .insert(
          ingredients.map((item) => ({
            user_id: userId,
            ingredient: item.ingredient,
            category: item.category,
            from_recipe: item.fromRecipe,
            checked: false,
          }))
        );

      if (error) {
        console.error('Error updating shopping list:', error);
      }
    }
  };

  const categorizeIngredient = (ingredient: string): string => {
    const lower = ingredient.toLowerCase();
    if (lower.includes('apple') || lower.includes('banana') || lower.includes('berry') || 
        lower.includes('mango') || lower.includes('avocado') || lower.includes('fruit')) {
      return 'Fruits';
    }
    if (lower.includes('carrot') || lower.includes('broccoli') || lower.includes('spinach') || 
        lower.includes('pea') || lower.includes('vegetable') || lower.includes('potato')) {
      return 'Vegetables';
    }
    if (lower.includes('chicken') || lower.includes('beef') || lower.includes('turkey') || 
        lower.includes('salmon') || lower.includes('fish') || lower.includes('meat')) {
      return 'Proteins';
    }
    if (lower.includes('rice') || lower.includes('oat') || lower.includes('quinoa') || 
        lower.includes('pasta') || lower.includes('bread') || lower.includes('cereal')) {
      return 'Cereals & Grains';
    }
    if (lower.includes('milk') || lower.includes('cheese') || lower.includes('yogurt') || 
        lower.includes('dairy')) {
      return 'Dairy';
    }
    return 'Other';
  };

  const getRecipe = (recipeId: string) => {
    return recipes.find((r) => r.id === recipeId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-2">
              <ChefHat className="h-8 w-8 text-primary" />
              Weekly Meal Planner
            </h1>
            <p className="text-muted-foreground">Plan your baby's meals for the week</p>
          </div>
          <Button
            onClick={() => navigate("/shopping")}
            className="bg-primary hover:bg-primary/90"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            View Shopping List
          </Button>
        </div>

        <div className="grid gap-6">
          {daysOfWeek.map((day) => (
            <Card key={day} className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="text-xl font-semibold text-foreground">
                  {day}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mealTypes.map((mealType) => {
                    const slot = mealPlan[day]?.[mealType];
                    const recipe = slot ? getRecipe(slot.recipeId) : null;

                    return (
                      <div key={mealType} className="space-y-2">
                        <h3 className="font-medium text-sm text-muted-foreground capitalize">
                          {mealType}
                        </h3>
                        {recipe ? (
                          <div className="p-3 rounded-lg border bg-card space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium line-clamp-2">{recipe.title}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={() => removeMeal(day, mealType)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant={slot.prepared ? "default" : "outline"}
                              size="sm"
                              className="w-full"
                              onClick={() => togglePrepared(day, mealType)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              {slot.prepared ? "Prepared" : "Mark Prepared"}
                            </Button>
                          </div>
                        ) : (
                          <Select
                            onValueChange={(value) => addMeal(day, mealType, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select recipe" />
                            </SelectTrigger>
                            <SelectContent>
                              {recipes.map((recipe) => (
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
      </div>
    </div>
  );
};

export default MealPlanner;
