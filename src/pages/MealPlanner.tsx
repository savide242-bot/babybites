import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ShoppingCart, Plus, X, Sparkles, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { recipes } from "@/data/recipes";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

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
  const { t } = useLanguage();
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [activeTab, setActiveTab] = useState("custom");
  const [userId, setUserId] = useState<string | null>(null);
  const [savedDays, setSavedDays] = useState<Set<string>>(new Set());

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
      const saved = new Set<string>();
      data.forEach((item) => {
        if (!plan[item.day_of_week]) {
          plan[item.day_of_week] = {};
        }
        plan[item.day_of_week][item.meal_type] = item.recipe_id;
        saved.add(item.day_of_week);
      });
      setMealPlan(plan);
      setSavedDays(saved);
    }
  };

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

  const handleSaveDay = async (day: string) => {
    if (!userId) {
      toast.error("Please login to save meal plans");
      return;
    }

    const dayMeals = mealPlan[day];
    if (!dayMeals || Object.keys(dayMeals).length === 0) {
      toast.error("No meals to save for this day");
      return;
    }

    try {
      // Delete existing meals for this day
      await supabase
        .from('meal_plans')
        .delete()
        .eq('user_id', userId)
        .eq('day_of_week', day);

      // Insert new meals
      const mealsToInsert = Object.entries(dayMeals).map(([mealType, recipeId]) => ({
        user_id: userId,
        day_of_week: day,
        meal_type: mealType,
        recipe_id: recipeId,
      }));

      const { error } = await supabase
        .from('meal_plans')
        .insert(mealsToInsert);

      if (error) throw error;

      setSavedDays((prev) => new Set([...prev, day]));
      await updateShoppingList();
      toast.success(`${day} meal plan saved!`);
    } catch (error) {
      console.error('Error saving meal plan:', error);
      toast.error("Failed to save meal plan");
    }
  };

  const handleRemoveDay = async (day: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('user_id', userId)
        .eq('day_of_week', day);

      if (error) throw error;

      setMealPlan((prev) => {
        const newPlan = { ...prev };
        delete newPlan[day];
        return newPlan;
      });

      setSavedDays((prev) => {
        const newSaved = new Set(prev);
        newSaved.delete(day);
        return newSaved;
      });

      await updateShoppingList();
      toast.success(`${day} meal plan removed`);
    } catch (error) {
      console.error('Error removing meal plan:', error);
      toast.error("Failed to remove meal plan");
    }
  };

  const updateShoppingList = async () => {
    if (!userId) return;

    try {
      // Delete all existing shopping items
      await supabase
        .from('shopping_list_items')
        .delete()
        .eq('user_id', userId);

      // Get all current meal plans
      const { data: mealPlans } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId);

      if (!mealPlans || mealPlans.length === 0) return;

      // Collect all ingredients
      const ingredientMap = new Map<string, { category: string; fromRecipe: string }>();

      mealPlans.forEach((plan) => {
        const recipe = recipes.find((r) => r.id === plan.recipe_id);
        if (recipe) {
          recipe.ingredients.forEach((ingredient) => {
            const cleanIngredient = ingredient.split(',')[0].trim();
            if (!ingredientMap.has(cleanIngredient)) {
              ingredientMap.set(cleanIngredient, {
                category: categorizeIngredient(cleanIngredient),
                fromRecipe: recipe.title,
              });
            }
          });
        }
      });

      // Insert new shopping items
      const itemsToInsert = Array.from(ingredientMap.entries()).map(([ingredient, info]) => ({
        user_id: userId,
        ingredient,
        category: info.category,
        from_recipe: info.fromRecipe,
        checked: false,
      }));

      if (itemsToInsert.length > 0) {
        await supabase.from('shopping_list_items').insert(itemsToInsert);
      }
    } catch (error) {
      console.error('Error updating shopping list:', error);
    }
  };

  const categorizeIngredient = (ingredient: string): string => {
    const lower = ingredient.toLowerCase();
    if (lower.includes("tomato") || lower.includes("carrot") || lower.includes("broccoli") || 
        lower.includes("spinach") || lower.includes("kale") || lower.includes("pepper") ||
        lower.includes("onion") || lower.includes("garlic")) {
      return "Vegetables";
    }
    if (lower.includes("banana") || lower.includes("apple") || lower.includes("pear") || 
        lower.includes("strawberry") || lower.includes("mango") || lower.includes("avocado")) {
      return "Fruits";
    }
    if (lower.includes("chicken") || lower.includes("beef") || lower.includes("fish") || 
        lower.includes("salmon") || lower.includes("turkey") || lower.includes("egg")) {
      return "Proteins";
    }
    if (lower.includes("rice") || lower.includes("pasta") || lower.includes("bread") || 
        lower.includes("oat") || lower.includes("quinoa")) {
      return "Cereals";
    }
    if (lower.includes("milk") || lower.includes("cheese") || lower.includes("yogurt")) {
      return "Dairy";
    }
    return "Others";
  };

  const getRecipeById = (id: string) => recipes.find((r) => r.id === id);


  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('planner.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            {t('planner.subtitle')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="suggestions">{t('planner.suggestions')}</TabsTrigger>
            <TabsTrigger value="custom">{t('planner.custom')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="suggestions" className="mt-8">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-4">AI Meal Suggestions Coming Soon</h3>
                  <p className="text-muted-foreground mb-6">Get personalized 7-day meal plans based on your baby's age and preferences</p>
                  <Button size="lg" className="rounded-full" disabled>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {t('planner.generateSuggestions')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="mt-8">

            <div className="space-y-6">
          {daysOfWeek.map((day) => (
            <Card key={day} className="border-2">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {day}
                  </CardTitle>
                  <div className="flex gap-2">
                    {savedDays.has(day) ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveDay(day)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSaveDay(day)}
                        disabled={!mealPlan[day] || Object.keys(mealPlan[day]).length === 0}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    )}
                  </div>
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
          </TabsContent>
        </Tabs>
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
