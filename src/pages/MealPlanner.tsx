import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, ChefHat, Sparkles, RefreshCw,
  Calendar, TrendingUp, Utensils, Wand2, Hand
} from "lucide-react";
import { recipes } from "@/data/recipes";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { DayCard } from "@/components/meal-planner/DayCard";
import { RecipePickerModal } from "@/components/meal-planner/RecipePickerModal";
import { NutritionBalanceWidget } from "@/components/meal-planner/NutritionBalanceWidget";
import { WeekTemplatesModal, WeekTemplate } from "@/components/meal-planner/WeekTemplatesModal";
import { WeekCompletionModal } from "@/components/meal-planner/WeekCompletionModal";
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

// Get baby age group from months
const getAgeGroup = (months: number): string => {
  if (months < 9) return "6-9 months";
  if (months < 12) return "9-12 months";
  return "12-18 months";
};

// Filter recipes by age group
const getRecipesForAge = (ageMonths: number) => {
  const ageGroup = getAgeGroup(ageMonths);
  return recipes.filter(r => r.ageGroup === ageGroup || r.ageGroup === "6-9 months");
};

// Get recipes by meal type preference
const getRecipesByMealType = (mealType: string, ageMonths: number) => {
  const ageRecipes = getRecipesForAge(ageMonths);
  
  const mealTypeMapping: { [key: string]: string[] } = {
    breakfast: ["breakfast", "puree", "snack"],
    lunch: ["lunch", "dinner", "main"],
    dinner: ["dinner", "lunch", "main"],
    snack: ["snack", "puree", "breakfast"],
  };
  
  const preferredCategories = mealTypeMapping[mealType] || ["main"];
  
  // Score recipes by relevance
  return ageRecipes
    .map(recipe => {
      let score = 0;
      const title = recipe.title.toLowerCase();
      const ingredients = recipe.ingredients.join(" ").toLowerCase();
      
      // Category matching
      preferredCategories.forEach((cat, idx) => {
        if (title.includes(cat) || ingredients.includes(cat)) {
          score += (3 - idx);
        }
      });
      
      // Meal type specific boosts
      if (mealType === "breakfast") {
        if (title.includes("pancake") || title.includes("oatmeal") || title.includes("egg")) score += 3;
      } else if (mealType === "lunch" || mealType === "dinner") {
        if (title.includes("chicken") || title.includes("salmon") || title.includes("beef") || 
            title.includes("turkey") || title.includes("pasta")) score += 3;
      } else if (mealType === "snack") {
        if (title.includes("puree") || title.includes("fruit") || title.includes("yogurt")) score += 3;
      }
      
      return { recipe, score };
    })
    .sort((a, b) => b.score - a.score);
};

// Get the start of the current week (Monday)
const getWeekStartDate = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
};

// Get current week number of the year
const getWeekNumber = (date: Date = new Date()): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Generate automatic meal plan based on age and preferences, avoiding recently used recipes
const generateAutoPlan = (
  ageMonths: number, 
  dietaryPrefs: string[] = [], 
  recentlyUsedRecipeIds: string[] = []
): MealPlan => {
  const usedRecipeIds = new Set<string>([...recentlyUsedRecipeIds]);
  const plan: MealPlan = {};
  
  // Filter by dietary preferences
  const filterByDiet = (recipeList: typeof recipes) => {
    if (dietaryPrefs.length === 0) return recipeList;
    return recipeList.filter(r => {
      const allergenFree = dietaryPrefs.every(pref => {
        if (pref === 'dairy-free') return !r.allergens?.includes('Dairy');
        if (pref === 'gluten-free') return !r.allergens?.includes('Gluten');
        if (pref === 'nut-free') return !r.allergens?.includes('Nuts') && !r.allergens?.includes('Tree nuts');
        if (pref === 'egg-free') return !r.allergens?.includes('Eggs');
        return true;
      });
      return allergenFree;
    });
  };
  
  daysOfWeek.forEach(day => {
    plan[day] = {};
    
    mealTypes.forEach(mealType => {
      const candidates = getRecipesByMealType(mealType, ageMonths);
      const filtered = filterByDiet(candidates.map(c => c.recipe));
      
      // Find unused recipe (prioritize recipes not used recently)
      const available = filtered.filter(r => !usedRecipeIds.has(r.id));
      
      if (available.length > 0) {
        // Pick randomly from top 5 candidates
        const topCandidates = available.slice(0, Math.min(5, available.length));
        const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
        
        plan[day][mealType] = {
          recipeId: selected.id,
          prepared: false,
        };
        
        usedRecipeIds.add(selected.id);
      } else if (filtered.length > 0) {
        // All used, pick any (reset cycle)
        const selected = filtered[Math.floor(Math.random() * filtered.length)];
        plan[day][mealType] = {
          recipeId: selected.id,
          prepared: false,
        };
      }
    });
  });
  
  return plan;
};

const MealPlanner = () => {
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [autoPlan, setAutoPlan] = useState<MealPlan>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerContext, setPickerContext] = useState<{ day: string; mealType: string } | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [copySource, setCopySource] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("manual"); // Default to manual when plan exists
  const [babyAgeMonths, setBabyAgeMonths] = useState(9);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [showWeekCompletionModal, setShowWeekCompletionModal] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(getWeekStartDate());
  const [hasShownCompletionModal, setHasShownCompletionModal] = useState(false);
  const [recentlyUsedRecipes, setRecentlyUsedRecipes] = useState<string[]>([]);
  const [hasSavedPlan, setHasSavedPlan] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadUserProfile(user.id);
      await loadMealPlan(user.id);
    }
    setIsLoading(false);
  };

  const loadUserProfile = async (uid: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('baby_birth_date, dietary_preferences')
      .eq('id', uid)
      .maybeSingle();
    
    if (profile?.baby_birth_date) {
      const birthDate = new Date(profile.baby_birth_date);
      const now = new Date();
      const ageMonths = Math.floor((now.getTime() - birthDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
      setBabyAgeMonths(Math.max(6, Math.min(24, ageMonths)));
    }
    
    if (profile?.dietary_preferences) {
      setDietaryPrefs(profile.dietary_preferences);
    }
  };

  // Check if the current week is complete (all meals prepared)
  const checkWeekCompletion = useCallback(() => {
    const totalMeals = Object.values(mealPlan).reduce((acc, dayMeals) => {
      return acc + Object.keys(dayMeals).length;
    }, 0);
    
    const preparedMeals = Object.values(mealPlan).reduce((acc, dayMeals) => {
      return acc + Object.values(dayMeals).filter(slot => slot.prepared).length;
    }, 0);

    // Check if all meals are prepared (minimum 7 meals for a valid week)
    const isComplete = totalMeals >= 7 && preparedMeals === totalMeals;
    
    if (isComplete && !hasShownCompletionModal && activeTab === "manual") {
      setShowWeekCompletionModal(true);
      setHasShownCompletionModal(true);
    }
  }, [mealPlan, hasShownCompletionModal, activeTab]);

  // Monitor meal completion
  useEffect(() => {
    if (Object.keys(mealPlan).length > 0) {
      checkWeekCompletion();
    }
  }, [mealPlan, checkWeekCompletion]);

  const regenerateAutoPlan = () => {
    const generated = generateAutoPlan(babyAgeMonths, dietaryPrefs, recentlyUsedRecipes);
    setAutoPlan(generated);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    toast.success("🎉 New meal plan generated!");
  };

  // Generate new week plan after completing the current week
  const generateNewWeekPlan = async () => {
    if (!userId) return;
    
    // Collect all recipe IDs from current plan to avoid repeating
    const currentRecipeIds: string[] = [];
    Object.values(mealPlan).forEach(dayMeals => {
      Object.values(dayMeals).forEach(slot => {
        if (slot.recipeId) currentRecipeIds.push(slot.recipeId);
      });
    });
    
    // Update recently used recipes (keep last 2 weeks worth)
    const newRecentlyUsed = [...recentlyUsedRecipes, ...currentRecipeIds].slice(-56);
    setRecentlyUsedRecipes(newRecentlyUsed);
    
    // Clear current week's plan from database
    await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', userId)
      .eq('week_start_date', currentWeekStart);
    
    // Generate new plan avoiding recently used recipes
    const newPlan = generateAutoPlan(babyAgeMonths, dietaryPrefs, newRecentlyUsed);
    
    // Insert new plan into database
    const inserts: any[] = [];
    const newWeekStart = getWeekStartDate();
    
    Object.entries(newPlan).forEach(([day, meals]) => {
      Object.entries(meals).forEach(([mealType, slot]) => {
        if (slot.recipeId) {
          inserts.push({
            user_id: userId,
            day_of_week: day,
            meal_type: mealType,
            recipe_id: slot.recipeId,
            prepared: false,
            week_start_date: newWeekStart,
          });
        }
      });
    });

    const { data, error } = await supabase
      .from('meal_plans')
      .insert(inserts)
      .select();

    if (error) {
      toast.error("Failed to generate new plan");
      return;
    }

    // Rebuild local state
    const rebuiltPlan: MealPlan = {};
    data?.forEach(item => {
      if (!rebuiltPlan[item.day_of_week]) {
        rebuiltPlan[item.day_of_week] = {};
      }
      rebuiltPlan[item.day_of_week][item.meal_type] = {
        recipeId: item.recipe_id,
        prepared: false,
        dbId: item.id,
      };
    });

    setMealPlan(rebuiltPlan);
    setAutoPlan(newPlan);
    setCurrentWeekStart(newWeekStart);
    setHasShownCompletionModal(false);
    setHasSavedPlan(true);
    
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
    toast.success("🎉 New week generated! Enjoy your meals!");
    updateShoppingList();
  };

  const applyAutoPlanToManual = async () => {
    if (!userId) return;
    
    // Clear existing plan for current week
    await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', userId)
      .eq('week_start_date', currentWeekStart);
    
    // Insert auto plan with week_start_date
    const inserts: any[] = [];
    Object.entries(autoPlan).forEach(([day, meals]) => {
      Object.entries(meals).forEach(([mealType, slot]) => {
        if (slot.recipeId) {
          inserts.push({
            user_id: userId,
            day_of_week: day,
            meal_type: mealType,
            recipe_id: slot.recipeId,
            prepared: false,
            week_start_date: currentWeekStart,
          });
        }
      });
    });

    const { data, error } = await supabase
      .from('meal_plans')
      .insert(inserts)
      .select();

    if (error) {
      toast.error("Failed to apply plan");
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
    setActiveTab("manual");
    setHasSavedPlan(true);
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    toast.success("🎉 Plan applied! Now you can customize it.");
    updateShoppingList();
  };

  const loadMealPlan = async (uid: string) => {
    const weekStart = getWeekStartDate();
    setCurrentWeekStart(weekStart);
    
    // Load only current week's plan
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', uid)
      .eq('week_start_date', weekStart);

    if (error) {
      console.error('Error loading meal plan:', error);
      return;
    }

    if (data && data.length > 0) {
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
      setHasSavedPlan(true);
      setActiveTab("manual"); // Show saved plan by default
    } else {
      // No saved plan - generate auto suggestions
      const generated = generateAutoPlan(babyAgeMonths, dietaryPrefs, recentlyUsedRecipes);
      setAutoPlan(generated);
      setHasSavedPlan(false);
      setActiveTab("auto"); // Show auto suggestions for new users
    }
  };

  const usedRecipeIds = useMemo(() => {
    const ids: string[] = [];
    const currentPlan = activeTab === "auto" ? autoPlan : mealPlan;
    Object.values(currentPlan).forEach(dayMeals => {
      Object.values(dayMeals).forEach(slot => {
        if (slot.recipeId) ids.push(slot.recipeId);
      });
    });
    return ids;
  }, [mealPlan, autoPlan, activeTab]);

  // Stats
  const stats = useMemo(() => {
    const currentPlan = activeTab === "auto" ? autoPlan : mealPlan;
    let totalMeals = 0;
    let preparedMeals = 0;
    let totalCalories = 0;
    let totalPrepTime = 0;
    let totalProtein = 0;

    Object.values(currentPlan).forEach(dayMeals => {
      Object.values(dayMeals).forEach(slot => {
        totalMeals++;
        if (slot.prepared) preparedMeals++;
        const recipe = recipes.find(r => r.id === slot.recipeId);
        if (recipe) {
          totalCalories += parseInt(recipe.nutrition?.calories) || 0;
          totalProtein += parseInt(recipe.nutrition?.protein) || 0;
          totalPrepTime += parseInt(recipe.prepTime) || 0;
        }
      });
    });

    return { totalMeals, preparedMeals, totalCalories, totalPrepTime, totalProtein };
  }, [mealPlan, autoPlan, activeTab]);

  const addMeal = async (day: string, mealType: string, recipeId: string) => {
    if (!userId) return;

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
        week_start_date: currentWeekStart,
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
    
    setHasSavedPlan(true);

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
    await clearDay(targetDay);

    for (const [mealType, slot] of Object.entries(sourceMeals)) {
      await addMeal(targetDay, mealType, slot.recipeId);
    }

    setCopySource(null);
    toast.success(`Copied ${copySource}'s meals to ${targetDay}!`);
  };

  const applyTemplate = async (template: WeekTemplate) => {
    if (!userId) return;

    // Clear current week's plan
    await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', userId)
      .eq('week_start_date', currentWeekStart);

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
            week_start_date: currentWeekStart,
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
    setHasSavedPlan(true);
    
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    toast.success(`🎉 Applied "${template.name}" template!`);
    updateShoppingList();
  };

  // Extract ingredient name without quantity
  const extractIngredientName = (ingredient: string): string => {
    // Remove common quantities and measurements
    let cleaned = ingredient
      .replace(/^\d+\/?\d*\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|pound|pounds|g|gram|grams|ml|piece|pieces|small|medium|large|pinch|dash|to taste|optional|finely|roughly|chopped|diced|minced|sliced|grated|peeled|mashed|cooked|raw|fresh|dried|ripe|very|about)\s*/gi, '')
      .replace(/^\d+\s*-\s*\d+\s*/g, '')
      .replace(/^\d+\s*/g, '')
      .replace(/\(.*?\)/g, '')
      .trim();
    
    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  const updateShoppingList = async () => {
    if (!userId) return;

    const ingredientsMap = new Map<string, { ingredient: string; category: string; fromRecipes: string[] }>();

    Object.entries(mealPlan).forEach(([day, meals]) => {
      Object.entries(meals).forEach(([mealType, slot]) => {
        const recipe = recipes.find((r) => r.id === slot.recipeId);
        if (recipe) {
          recipe.ingredients.forEach((ing) => {
            const cleanName = extractIngredientName(ing);
            const category = categorizeIngredient(cleanName);
            
            if (ingredientsMap.has(cleanName.toLowerCase())) {
              const existing = ingredientsMap.get(cleanName.toLowerCase())!;
              if (!existing.fromRecipes.includes(recipe.title)) {
                existing.fromRecipes.push(recipe.title);
              }
            } else {
              ingredientsMap.set(cleanName.toLowerCase(), {
                ingredient: cleanName,
                category,
                fromRecipes: [recipe.title],
              });
            }
          });
        }
      });
    });

    await supabase.from('shopping_list_items').delete().eq('user_id', userId);

    if (ingredientsMap.size > 0) {
      const items = Array.from(ingredientsMap.values()).map(item => ({
        user_id: userId,
        ingredient: item.ingredient,
        category: item.category,
        from_recipe: item.fromRecipes.join(", "),
        checked: false,
      }));
      
      await supabase.from('shopping_list_items').insert(items);
    }
  };

  const categorizeIngredient = (ingredient: string): string => {
    const lower = ingredient.toLowerCase();
    if (lower.includes('apple') || lower.includes('banana') || lower.includes('berry') || 
        lower.includes('mango') || lower.includes('avocado') || lower.includes('pear') ||
        lower.includes('orange') || lower.includes('blueberry') || lower.includes('peach')) return 'Fruits';
    if (lower.includes('carrot') || lower.includes('broccoli') || lower.includes('spinach') || 
        lower.includes('pea') || lower.includes('potato') || lower.includes('zucchini') ||
        lower.includes('tomato') || lower.includes('onion') || lower.includes('garlic')) return 'Vegetables';
    if (lower.includes('chicken') || lower.includes('beef') || lower.includes('turkey') || 
        lower.includes('salmon') || lower.includes('fish') || lower.includes('egg')) return 'Proteins';
    if (lower.includes('rice') || lower.includes('oat') || lower.includes('quinoa') || 
        lower.includes('pasta') || lower.includes('flour') || lower.includes('bread')) return 'Cereals & Grains';
    if (lower.includes('milk') || lower.includes('cheese') || lower.includes('yogurt') ||
        lower.includes('butter') || lower.includes('cream')) return 'Dairy';
    if (lower.includes('oil') || lower.includes('salt') || lower.includes('pepper') ||
        lower.includes('cinnamon') || lower.includes('cumin') || lower.includes('herb')) return 'Pantry Essentials';
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

  const currentPlan = activeTab === "auto" ? autoPlan : mealPlan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-accent to-secondary p-6 text-primary-foreground">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ChefHat className="h-8 w-8" />
                Meal Planner
              </h1>
              <p className="text-primary-foreground/80 mt-1">
                Nutritious meals for your {babyAgeMonths}-month-old
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/shopping")}
              className="bg-background/20 hover:bg-background/30 border-0"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Shopping List
            </Button>
          </div>

          {/* Stats Bar */}
          {stats.totalMeals > 0 && (
            <div className="flex flex-wrap gap-3 mt-4 text-sm">
              <Badge className="bg-background/20 text-primary-foreground border-0">
                <Utensils className="h-3 w-3 mr-1" />
                {stats.totalMeals} meals
              </Badge>
              <Badge className="bg-background/20 text-primary-foreground border-0">
                🔥 {stats.totalCalories} cal/week
              </Badge>
              <Badge className="bg-background/20 text-primary-foreground border-0">
                🥩 {stats.totalProtein}g protein
              </Badge>
              <Badge className="bg-background/20 text-primary-foreground border-0">
                ⏱️ ~{Math.round(stats.totalPrepTime / 60)}h prep
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs - Auto vs Manual */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
            <TabsTrigger value="auto" className="flex items-center gap-2 text-sm">
              <Wand2 className="h-4 w-4" />
              Auto-Generated
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2 text-sm">
              <Hand className="h-4 w-4" />
              My Plan
            </TabsTrigger>
          </TabsList>

          {/* Auto-Generated Tab */}
          <TabsContent value="auto" className="mt-6">
            {/* Explanatory Note */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Personalized Plan for Your {babyAgeMonths}-Month-Old
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Based on your baby's age, we've generated a nutritious meal plan rich in proteins, vitamins, and essential nutrients for healthy growth and development. 
                    You can customize at any moment by clicking "Apply & Customize" to adjust recipes according to your preferences!
                  </p>
                </div>
              </div>
            </div>

            <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Wand2 className="h-5 w-5 text-primary" />
                      AI-Generated Meal Plan
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      Optimized for {babyAgeMonths}-month-old babies • Nutritionally balanced • No repeated meals
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={regenerateAutoPlan} variant="outline" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button onClick={applyAutoPlanToManual} className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Apply & Customize
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-4">
                {daysOfWeek.map((day, index) => (
                  <DayCard
                    key={day}
                    day={day}
                    dayIndex={index}
                    meals={autoPlan[day] || {}}
                    onAddMeal={() => {}}
                    onRemoveMeal={() => {}}
                    onTogglePrepared={() => {}}
                    onEditMeal={() => {}}
                    onCopyDay={() => {}}
                    onClearDay={() => {}}
                    
                  />
                ))}
              </div>
              <div className="space-y-4">
                <NutritionBalanceWidget mealPlan={autoPlan} />
              </div>
            </div>
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="mt-6">
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

            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTemplatesOpen(true)}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Use Template
              </Button>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-4">
                {Object.keys(mealPlan).length === 0 && (
                  <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <CardContent className="py-12 text-center space-y-4">
                      <div className="text-6xl animate-bounce">🍽️</div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Start Planning Your Week!
                      </h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Add meals to each day or use a template to get started.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => setActiveTab("auto")} variant="outline">
                          <Wand2 className="h-4 w-4 mr-2" />
                          View Auto-Generated Plan
                        </Button>
                        <Button onClick={() => setTemplatesOpen(true)}>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Use a Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

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

              <div className="space-y-4">
                <NutritionBalanceWidget mealPlan={mealPlan} />
                
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
                      <ShoppingCart className="h-4 w-4 mr-2 text-mint" />
                      View Shopping List
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <RecipePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(recipeId) => {
          if (pickerContext) {
            addMeal(pickerContext.day, pickerContext.mealType, recipeId);
          }
          setPickerOpen(false);
        }}
        mealType={pickerContext?.mealType || ""}
        day={pickerContext?.day || ""}
        usedRecipeIds={usedRecipeIds}
      />

      <WeekTemplatesModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onApplyTemplate={applyTemplate}
      />

      <WeekCompletionModal
        open={showWeekCompletionModal}
        onClose={() => setShowWeekCompletionModal(false)}
        onGenerateNewWeek={generateNewWeekPlan}
        completedMeals={stats.preparedMeals}
        weekNumber={Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}
      />
    </div>
  );
};

export default MealPlanner;
