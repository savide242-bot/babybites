import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, ChefHat, Sparkles, Download, Share2, 
  Calendar, TrendingUp, Utensils 
} from "lucide-react";
import { recipes } from "@/data/recipes";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { DayCard } from "@/components/meal-planner/DayCard";
import { RecipePickerModal } from "@/components/meal-planner/RecipePickerModal";
import { NutritionBalanceWidget } from "@/components/meal-planner/NutritionBalanceWidget";
import { WeekTemplatesModal, WeekTemplate } from "@/components/meal-planner/WeekTemplatesModal";
import { MealPlanSkeleton } from "@/components/skeletons/MealPlanSkeleton";
import confetti from "canvas-confetti";

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
  const [isLoading, setIsLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerContext, setPickerContext] = useState<{ day: string; mealType: string } | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [copySource, setCopySource] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadMealPlan(user.id);
    }
    setIsLoading(false);
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

  const usedRecipeIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(mealPlan).forEach(dayMeals => {
      Object.values(dayMeals).forEach(slot => {
        if (slot.recipeId) ids.push(slot.recipeId);
      });
    });
    return ids;
  }, [mealPlan]);

  // Stats
  const stats = useMemo(() => {
    let totalMeals = 0;
    let preparedMeals = 0;
    let totalCalories = 0;
    let totalPrepTime = 0;

    Object.values(mealPlan).forEach(dayMeals => {
      Object.values(dayMeals).forEach(slot => {
        totalMeals++;
        if (slot.prepared) preparedMeals++;
        const recipe = recipes.find(r => r.id === slot.recipeId);
        if (recipe) {
          totalCalories += parseInt(recipe.nutrition?.calories) || 0;
          totalPrepTime += parseInt(recipe.prepTime) || 0;
        }
      });
    });

    return { totalMeals, preparedMeals, totalCalories, totalPrepTime };
  }, [mealPlan]);

  const addMeal = async (day: string, mealType: string, recipeId: string) => {
    if (!userId) return;

    // Remove existing meal if any
    const existingSlot = mealPlan[day]?.[mealType];
    if (existingSlot?.dbId) {
      await supabase.from('meal_plans').delete().eq('id', existingSlot.dbId);
    }

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
      return;
    }

    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: { recipeId, prepared: false, dbId: data.id },
      },
    }));

    const recipe = recipes.find(r => r.id === recipeId);
    toast.success(`Added ${recipe?.title || 'recipe'} to ${day}!`);
    updateShoppingList();
  };

  const removeMeal = async (day: string, mealType: string) => {
    const slot = mealPlan[day]?.[mealType];
    if (!slot?.dbId) return;

    await supabase.from('meal_plans').delete().eq('id', slot.dbId);

    setMealPlan((prev) => {
      const newPlan = { ...prev };
      if (newPlan[day]) {
        delete newPlan[day][mealType];
        if (Object.keys(newPlan[day]).length === 0) {
          delete newPlan[day];
        }
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
    await supabase.from('meal_plans').update({ prepared: newPrepared }).eq('id', slot.dbId);

    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: { ...slot, prepared: newPrepared },
      },
    }));
  };

  const clearDay = async (day: string) => {
    const dayMeals = mealPlan[day];
    if (!dayMeals) return;

    const dbIds = Object.values(dayMeals).map(s => s.dbId).filter(Boolean);
    if (dbIds.length > 0) {
      await supabase.from('meal_plans').delete().in('id', dbIds);
    }

    setMealPlan(prev => {
      const newPlan = { ...prev };
      delete newPlan[day];
      return newPlan;
    });

    toast.info(`Cleared all meals for ${day}`);
    updateShoppingList();
  };

  const copyDay = (day: string) => {
    setCopySource(day);
    toast.info(`Now click another day to paste ${day}'s meals`);
  };

  const pasteDay = async (targetDay: string) => {
    if (!copySource || !mealPlan[copySource]) {
      setCopySource(null);
      return;
    }

    const sourceMeals = mealPlan[copySource];
    
    // Clear target day first
    await clearDay(targetDay);

    // Copy each meal
    for (const [mealType, slot] of Object.entries(sourceMeals)) {
      await addMeal(targetDay, mealType, slot.recipeId);
    }

    setCopySource(null);
    toast.success(`Copied ${copySource}'s meals to ${targetDay}!`);
  };

  const applyTemplate = async (template: WeekTemplate) => {
    if (!userId) return;

    // Clear all existing meals
    const allDbIds: string[] = [];
    Object.values(mealPlan).forEach(dayMeals => {
      Object.values(dayMeals).forEach(slot => {
        if (slot.dbId) allDbIds.push(slot.dbId);
      });
    });

    if (allDbIds.length > 0) {
      await supabase.from('meal_plans').delete().in('id', allDbIds);
    }

    // Insert template meals
    const inserts: any[] = [];
    Object.entries(template.meals).forEach(([day, meals]) => {
      Object.entries(meals).forEach(([mealType, recipeId]) => {
        if (recipeId) {
          inserts.push({
            user_id: userId,
            day_of_week: day,
            meal_type: mealType,
            recipe_id: recipeId,
            prepared: false,
          });
        }
      });
    });

    const { data, error } = await supabase
      .from('meal_plans')
      .insert(inserts)
      .select();

    if (error) {
      toast.error("Failed to apply template");
      return;
    }

    // Rebuild local state
    const newPlan: MealPlan = {};
    data?.forEach(item => {
      if (!newPlan[item.day_of_week]) {
        newPlan[item.day_of_week] = {};
      }
      newPlan[item.day_of_week][item.meal_type] = {
        recipeId: item.recipe_id,
        prepared: false,
        dbId: item.id,
      };
    });

    setMealPlan(newPlan);
    
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    toast.success(`🎉 Applied "${template.name}" template!`);
    updateShoppingList();
  };

  const updateShoppingList = async () => {
    if (!userId) return;

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

    await supabase.from('shopping_list_items').delete().eq('user_id', userId);

    if (ingredients.length > 0) {
      await supabase.from('shopping_list_items').insert(
        ingredients.map((item) => ({
          user_id: userId,
          ingredient: item.ingredient,
          category: item.category,
          from_recipe: item.fromRecipe,
          checked: false,
        }))
      );
    }
  };

  const categorizeIngredient = (ingredient: string): string => {
    const lower = ingredient.toLowerCase();
    if (lower.includes('apple') || lower.includes('banana') || lower.includes('berry') || 
        lower.includes('mango') || lower.includes('avocado')) return 'Fruits';
    if (lower.includes('carrot') || lower.includes('broccoli') || lower.includes('spinach') || 
        lower.includes('pea') || lower.includes('potato')) return 'Vegetables';
    if (lower.includes('chicken') || lower.includes('beef') || lower.includes('turkey') || 
        lower.includes('salmon') || lower.includes('fish')) return 'Proteins';
    if (lower.includes('rice') || lower.includes('oat') || lower.includes('quinoa') || 
        lower.includes('pasta')) return 'Cereals & Grains';
    if (lower.includes('milk') || lower.includes('cheese') || lower.includes('yogurt')) return 'Dairy';
    return 'Other';
  };

  const openPicker = (day: string, mealType: string) => {
    setPickerContext({ day, mealType });
    setPickerOpen(true);
  };

  const handleDayCopy = (day: string) => {
    if (copySource) {
      pasteDay(day);
    } else {
      copyDay(day);
    }
  };

  if (isLoading) {
    return <MealPlanSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-secondary to-accent p-6 text-white">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ChefHat className="h-8 w-8" />
                Meal Planner
              </h1>
              <p className="text-white/80 mt-1">Plan delicious meals for your little one</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTemplatesOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Templates
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/shopping")}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Shopping
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          {stats.totalMeals > 0 && (
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <Badge className="bg-white/20 text-white border-0">
                <Utensils className="h-3 w-3 mr-1" />
                {stats.totalMeals} meals planned
              </Badge>
              <Badge className="bg-white/20 text-white border-0">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.preparedMeals} prepared
              </Badge>
              <Badge className="bg-white/20 text-white border-0">
                {stats.totalCalories} total cal
              </Badge>
              <Badge className="bg-white/20 text-white border-0">
                ~{Math.round(stats.totalPrepTime / 60)}h prep time
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Copy Mode Banner */}
        {copySource && (
          <Card className="mb-4 border-primary bg-primary/10 animate-pulse">
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm font-medium">
                📋 Click a day to paste {copySource}'s meals
              </span>
              <Button size="sm" variant="outline" onClick={() => setCopySource(null)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content - Days */}
          <div className="lg:col-span-3 space-y-4">
            {/* Empty State */}
            {Object.keys(mealPlan).length === 0 && (
              <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="py-12 text-center space-y-4">
                  <div className="text-6xl animate-bounce">🍽️</div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Start Planning Your Week!
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Add meals to each day or use a template to get started quickly. 
                    We'll generate your shopping list automatically!
                  </p>
                  <Button onClick={() => setTemplatesOpen(true)} className="mt-4">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Use a Template
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Day Cards */}
            {daysOfWeek.map((day, index) => (
              <DayCard
                key={day}
                day={day}
                dayIndex={index}
                meals={mealPlan[day] || {}}
                onAddMeal={(mealType) => openPicker(day, mealType)}
                onRemoveMeal={(mealType) => removeMeal(day, mealType)}
                onTogglePrepared={(mealType) => togglePrepared(day, mealType)}
                onEditMeal={(mealType) => openPicker(day, mealType)}
                onCopyDay={() => handleDayCopy(day)}
                onClearDay={() => clearDay(day)}
              />
            ))}
          </div>

          {/* Sidebar - Nutrition Widget */}
          <div className="space-y-4">
            <NutritionBalanceWidget mealPlan={mealPlan} />
            
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setTemplatesOpen(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  Apply Template
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/shopping")}
                >
                  <ShoppingCart className="h-4 w-4 mr-2 text-green-500" />
                  View Shopping List
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RecipePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(recipeId) => {
          if (pickerContext) {
            addMeal(pickerContext.day, pickerContext.mealType, recipeId);
          }
        }}
        mealType={pickerContext?.mealType || "breakfast"}
        day={pickerContext?.day || "Monday"}
        usedRecipeIds={usedRecipeIds}
      />

      <WeekTemplatesModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onApplyTemplate={applyTemplate}
      />
    </div>
  );
};

export default MealPlanner;
