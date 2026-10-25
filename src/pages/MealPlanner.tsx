import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, ChefHat, Sparkles, RefreshCw,
  Calendar, TrendingUp, Utensils, Wand2, Hand, Check, PencilLine,
  AlertTriangle, Baby
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
import PlanGeneratingOverlay from "@/components/meal-planner/PlanGeneratingOverlay";
import { getWeekStartDate } from "@/utils/mealPlanGenerator";
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

const getAgeGroup = (months: number): string => {
  if (months < 6) return "0-6 months";
  if (months < 9) return "6-9 months";
  if (months < 12) return "9-12 months";
  if (months < 18) return "12-18 months";
  return "18-24 months";
};

const getRecipesForAge = (ageMonths: number) => {
  if (ageMonths < 6) return [];
  const ageGroup = getAgeGroup(ageMonths);
  return recipes.filter(r => {
    if (r.ageGroup === ageGroup) return true;
    if (ageMonths >= 9 && r.ageGroup === "6-9 months") return true;
    if (ageMonths >= 12 && r.ageGroup === "9-12 months") return true;
    return false;
  });
};

const getRecipesByMealType = (mealType: string, ageMonths: number) => {
  const ageRecipes = getRecipesForAge(ageMonths);
  const mealTypeMapping: { [key: string]: string[] } = {
    breakfast: ["breakfast", "puree", "snack"],
    lunch: ["lunch", "dinner", "main"],
    dinner: ["dinner", "lunch", "main"],
    snack: ["snack", "puree", "breakfast"],
  };
  const preferredCategories = mealTypeMapping[mealType] || ["main"];
  return ageRecipes
    .map(recipe => {
      let score = 0;
      const title = recipe.title.toLowerCase();
      const ingredients = recipe.ingredients.join(" ").toLowerCase();
      preferredCategories.forEach((cat, idx) => {
        if (title.includes(cat) || ingredients.includes(cat)) score += (3 - idx);
      });
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

const getWeekNumber = (date: Date = new Date()): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generateAutoPlan = (
  ageMonths: number, 
  dietaryPrefs: string[] = [], 
  recentlyUsedRecipeIds: string[] = [],
  seed?: number
): MealPlan => {
  if (ageMonths < 6) return {};
  const usedRecipeIds = new Set<string>([...recentlyUsedRecipeIds]);
  const plan: MealPlan = {};
  const baseSeed = seed ?? getWeekNumber();
  let seedCounter = baseSeed;
  
  const filterByDiet = (recipeList: typeof recipes) => {
    if (dietaryPrefs.length === 0) return recipeList;
    return recipeList.filter(r => {
      return dietaryPrefs.every(pref => {
        if (pref === 'dairy-free') return !r.allergens?.includes('Dairy');
        if (pref === 'gluten-free') return !r.allergens?.includes('Gluten');
        if (pref === 'nut-free') return !r.allergens?.includes('Nuts') && !r.allergens?.includes('Tree nuts');
        if (pref === 'egg-free') return !r.allergens?.includes('Eggs');
        return true;
      });
    });
  };
  
  daysOfWeek.forEach((day, dayIdx) => {
    plan[day] = {};
    mealTypes.forEach((mealType, mealIdx) => {
      const candidates = getRecipesByMealType(mealType, ageMonths);
      const filtered = filterByDiet(candidates.map(c => c.recipe));
      const available = filtered.filter(r => !usedRecipeIds.has(r.id));
      
      if (available.length > 0) {
        seedCounter++;
        const topCandidates = available.slice(0, Math.min(5, available.length));
        const selectedIdx = Math.floor(seededRandom(seedCounter + dayIdx * 10 + mealIdx) * topCandidates.length);
        const selected = topCandidates[selectedIdx];
        plan[day][mealType] = { recipeId: selected.id, prepared: false };
        usedRecipeIds.add(selected.id);
      } else if (filtered.length > 0) {
        seedCounter++;
        const selectedIdx = Math.floor(seededRandom(seedCounter) * filtered.length);
        plan[day][mealType] = { recipeId: filtered[selectedIdx].id, prepared: false };
      }
    });
  });
  
  return plan;
};

const MealPlanner = () => {
  // ========== COMPLETELY SEPARATE STATES ==========
  const [personalizedPlan, setPersonalizedPlan] = useState<MealPlan>({});
  const [customPlan, setCustomPlan] = useState<MealPlan>({});
  
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerContext, setPickerContext] = useState<{ day: string; mealType: string } | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [copySource, setCopySource] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("auto");
  const [babyAgeMonths, setBabyAgeMonths] = useState<number>(0);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [showWeekCompletionModal, setShowWeekCompletionModal] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(getWeekStartDate());
  const [hasShownCompletionModal, setHasShownCompletionModal] = useState(false);
  const [recentlyUsedRecipes, setRecentlyUsedRecipes] = useState<string[]>([]);
  const [personalizedPlanAccepted, setPersonalizedPlanAccepted] = useState(false);
  const [hasPersonalizedPlan, setHasPersonalizedPlan] = useState(false);
  const [hasCustomPlan, setHasCustomPlan] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const isTooYoungForSolids = babyAgeMonths < 6;

  useEffect(() => { checkUser(); }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadUserProfile(user.id);
      await loadMealPlans(user.id);
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
      setBabyAgeMonths(Math.max(0, Math.min(24, ageMonths)));
    } else {
      setBabyAgeMonths(6);
    }
    
    if (profile?.dietary_preferences) {
      setDietaryPrefs(profile.dietary_preferences);
    }
  };

  // ========== LOAD PLANS SEPARATELY ==========
  const loadMealPlans = async (uid: string) => {
    const weekStart = getWeekStartDate();
    setCurrentWeekStart(weekStart);
    
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', uid)
      .eq('week_start_date', weekStart);

    if (error) {
      console.error('Error loading meal plans:', error);
      return;
    }

    if (data && data.length > 0) {
      // Separate by plan_type
      const persoPlan: MealPlan = {};
      const custPlan: MealPlan = {};
      
      data.forEach((item: any) => {
        const planType = item.plan_type || 'custom';
        const target = planType === 'personalized' ? persoPlan : custPlan;
        
        if (!target[item.day_of_week]) {
          target[item.day_of_week] = {};
        }
        target[item.day_of_week][item.meal_type] = {
          recipeId: item.recipe_id,
          prepared: item.prepared || false,
          dbId: item.id,
        };
      });

      if (Object.keys(persoPlan).length > 0) {
        setPersonalizedPlan(persoPlan);
        setHasPersonalizedPlan(true);
        setPersonalizedPlanAccepted(true);
      }
      
      if (Object.keys(custPlan).length > 0) {
        setCustomPlan(custPlan);
        setHasCustomPlan(true);
      }

      // Default to personalized tab if they have one, else auto
      setActiveTab(Object.keys(persoPlan).length > 0 ? "auto" : "manual");
    } else {
      // New user — no plans at all
      setPersonalizedPlan({});
      setCustomPlan({});
      setHasPersonalizedPlan(false);
      setHasCustomPlan(false);
      setPersonalizedPlanAccepted(false);
      setActiveTab("auto");
    }
  };

  const checkWeekCompletion = useCallback(() => {
    const totalMeals = Object.values(customPlan).reduce((acc, dayMeals) => acc + Object.keys(dayMeals).length, 0);
    const preparedMeals = Object.values(customPlan).reduce((acc, dayMeals) => acc + Object.values(dayMeals).filter(slot => slot.prepared).length, 0);
    const isComplete = totalMeals >= 7 && preparedMeals === totalMeals;
    if (isComplete && !hasShownCompletionModal && activeTab === "manual") {
      setShowWeekCompletionModal(true);
      setHasShownCompletionModal(true);
    }
  }, [customPlan, hasShownCompletionModal, activeTab]);

  useEffect(() => {
    if (Object.keys(customPlan).length > 0) checkWeekCompletion();
  }, [customPlan, checkWeekCompletion]);

  // ========== PERSONALIZED PLAN ACTIONS ==========
  const handleGeneratePersonalizedPlan = () => {
    if (isTooYoungForSolids) return;
    setIsGenerating(true);
    // The overlay will call onComplete after 3s
  };

  const onGenerationComplete = useCallback(() => {
    const newSeed = Date.now();
    const generated = generateAutoPlan(babyAgeMonths, dietaryPrefs, recentlyUsedRecipes, newSeed);
    setPersonalizedPlan(generated);
    setHasPersonalizedPlan(true);
    setPersonalizedPlanAccepted(false);
    setIsGenerating(false);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    toast.success("🎉 Your personalized plan is ready!");
  }, [babyAgeMonths, dietaryPrefs, recentlyUsedRecipes]);

  const regeneratePersonalizedPlan = () => {
    if (isTooYoungForSolids) return;
    setIsGenerating(true);
  };

  const acceptPersonalizedPlan = async () => {
    if (!userId || isSaving) return;
    setIsSaving(true);
    try {
      // First delete old personalized plans for this week
      await supabase
        .from('meal_plans')
        .delete()
        .eq('user_id', userId)
        .eq('week_start_date', currentWeekStart)
        .eq('plan_type', 'personalized');

      // Save personalized plan with plan_type = 'personalized'
      const inserts: any[] = [];
      Object.entries(personalizedPlan).forEach(([day, meals]) => {
        Object.entries(meals).forEach(([mealType, slot]) => {
          if (slot.recipeId) {
            inserts.push({
              user_id: userId,
              day_of_week: day,
              meal_type: mealType,
              recipe_id: slot.recipeId,
              prepared: false,
              week_start_date: currentWeekStart,
              plan_type: 'personalized',
            });
          }
        });
      });

      const { data, error } = await supabase
        .from('meal_plans')
        .insert(inserts)
        .select();

      if (error) {
        console.error('Failed to accept plan:', error);
        toast.error(`Failed to save plan: ${error.message}`);
        return;
      }

      // Update local state with db IDs
      const savedPlan: MealPlan = {};
      data?.forEach(item => {
        if (!savedPlan[item.day_of_week]) savedPlan[item.day_of_week] = {};
        savedPlan[item.day_of_week][item.meal_type] = {
          recipeId: item.recipe_id,
          prepared: item.prepared || false,
          dbId: item.id,
        };
      });

      setPersonalizedPlan(savedPlan);
      setPersonalizedPlanAccepted(true);
      setHasPersonalizedPlan(true);
      
      // Update shopping list from personalized plan ONLY
      await updateShoppingListFromPlan(savedPlan);
      
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      toast.success("🎉 Plan saved! Your shopping list is ready.");
    } finally {
      setIsSaving(false);
    }
  };

  // ========== CUSTOM PLAN ACTIONS ==========
  const addMealToCustomPlan = async (day: string, mealType: string, recipeId: string) => {
    if (!userId || isSaving) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .upsert({
          user_id: userId,
          day_of_week: day,
          meal_type: mealType,
          recipe_id: recipeId,
          prepared: false,
          week_start_date: currentWeekStart,
          plan_type: 'custom',
        }, { 
          onConflict: 'user_id,week_start_date,day_of_week,meal_type,plan_type' 
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to add meal:', error);
        toast.error(`Failed to add meal: ${error.message}`);
        return;
      }

      setCustomPlan((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          [mealType]: { recipeId, prepared: false, dbId: data.id },
        },
      }));
      
      setHasCustomPlan(true);
      const recipe = recipes.find(r => r.id === recipeId);
      toast.success(`✅ ${recipe?.title || 'Recipe'} saved to ${day}!`);
    } finally {
      setIsSaving(false);
    }
  };

  const removeMealFromCustomPlan = async (day: string, mealType: string) => {
    const slot = customPlan[day]?.[mealType];
    if (!slot?.dbId) return;

    await supabase.from('meal_plans').delete().eq('id', slot.dbId);

    setCustomPlan((prev) => {
      const newPlan = { ...prev };
      if (newPlan[day]) {
        delete newPlan[day][mealType];
        if (Object.keys(newPlan[day]).length === 0) delete newPlan[day];
      }
      return newPlan;
    });

    toast.info("Meal removed");
  };

  const toggleCustomPrepared = async (day: string, mealType: string) => {
    const slot = customPlan[day]?.[mealType];
    if (!slot?.dbId) return;

    const newPrepared = !slot.prepared;
    await supabase.from('meal_plans').update({ prepared: newPrepared }).eq('id', slot.dbId);

    setCustomPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: { ...slot, prepared: newPrepared },
      },
    }));
  };

  const clearCustomDay = async (day: string) => {
    const dayMeals = customPlan[day];
    if (!dayMeals) return;

    const dbIds = Object.values(dayMeals).map(s => s.dbId).filter(Boolean);
    if (dbIds.length > 0) {
      await supabase.from('meal_plans').delete().in('id', dbIds);
    }

    setCustomPlan(prev => {
      const newPlan = { ...prev };
      delete newPlan[day];
      return newPlan;
    });

    toast.info(`Cleared all meals for ${day}`);
  };

  const copyDay = (day: string) => {
    setCopySource(day);
    toast.info(`Now click another day to paste ${day}'s meals`);
  };

  const pasteDay = async (targetDay: string) => {
    if (!copySource || !customPlan[copySource]) {
      setCopySource(null);
      return;
    }
    const sourceMeals = customPlan[copySource];
    await clearCustomDay(targetDay);
    for (const [mealType, slot] of Object.entries(sourceMeals)) {
      await addMealToCustomPlan(targetDay, mealType, slot.recipeId);
    }
    setCopySource(null);
    toast.success(`Copied ${copySource}'s meals to ${targetDay}!`);
  };

  const applyTemplate = async (template: WeekTemplate) => {
    if (!userId || isSaving) return;
    setIsSaving(true);
    try {
      const upserts: any[] = [];
      Object.entries(template.meals).forEach(([day, meals]) => {
        Object.entries(meals).forEach(([mealType, recipeId]) => {
          if (recipeId) {
            upserts.push({
              user_id: userId,
              day_of_week: day,
              meal_type: mealType,
              recipe_id: recipeId,
              prepared: false,
              week_start_date: currentWeekStart,
              plan_type: 'custom',
            });
          }
        });
      });

      const { data, error } = await supabase
        .from('meal_plans')
        .upsert(upserts, { onConflict: 'user_id,week_start_date,day_of_week,meal_type,plan_type' })
        .select();

      if (error) {
        toast.error(`Failed to apply template: ${error.message}`);
        return;
      }

      const newPlan: MealPlan = {};
      data?.forEach(item => {
        if (!newPlan[item.day_of_week]) newPlan[item.day_of_week] = {};
        newPlan[item.day_of_week][item.meal_type] = {
          recipeId: item.recipe_id,
          prepared: item.prepared || false,
          dbId: item.id,
        };
      });

      setCustomPlan(newPlan);
      setHasCustomPlan(true);
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      toast.success(`🎉 Applied "${template.name}" template!`);
    } finally {
      setIsSaving(false);
    }
  };

  const generateNewWeekPlan = async () => {
    if (!userId || isSaving) return;
    setIsSaving(true);
    try {
      const currentRecipeIds: string[] = [];
      Object.values(customPlan).forEach(dayMeals => {
        Object.values(dayMeals).forEach(slot => {
          if (slot.recipeId) currentRecipeIds.push(slot.recipeId);
        });
      });
      
      const newRecentlyUsed = [...recentlyUsedRecipes, ...currentRecipeIds].slice(-56);
      setRecentlyUsedRecipes(newRecentlyUsed);
      
      const newPlan = generateAutoPlan(babyAgeMonths, dietaryPrefs, newRecentlyUsed);
      const newWeekStart = getWeekStartDate();
      
      const upserts: any[] = [];
      Object.entries(newPlan).forEach(([day, meals]) => {
        Object.entries(meals).forEach(([mealType, slot]) => {
          if (slot.recipeId) {
            upserts.push({
              user_id: userId,
              day_of_week: day,
              meal_type: mealType,
              recipe_id: slot.recipeId,
              prepared: false,
              week_start_date: newWeekStart,
              plan_type: 'custom',
            });
          }
        });
      });

      const { data, error } = await supabase
        .from('meal_plans')
        .upsert(upserts, { onConflict: 'user_id,week_start_date,day_of_week,meal_type,plan_type' })
        .select();

      if (error) {
        toast.error(`Failed to generate new plan: ${error.message}`);
        return;
      }

      const rebuiltPlan: MealPlan = {};
      data?.forEach(item => {
        if (!rebuiltPlan[item.day_of_week]) rebuiltPlan[item.day_of_week] = {};
        rebuiltPlan[item.day_of_week][item.meal_type] = {
          recipeId: item.recipe_id,
          prepared: item.prepared || false,
          dbId: item.id,
        };
      });

      setCustomPlan(rebuiltPlan);
      setCurrentWeekStart(newWeekStart);
      setHasShownCompletionModal(false);
      setHasCustomPlan(true);
      
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
      toast.success("🎉 New week generated!");
    } finally {
      setIsSaving(false);
    }
  };

  // ========== SHOPPING LIST ==========
  const extractIngredientName = (ingredient: string): string => {
    let cleaned = ingredient
      .replace(/^\d+\/?\d*\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|pound|pounds|g|gram|grams|ml|piece|pieces|small|medium|large|pinch|dash|to taste|optional|finely|roughly|chopped|diced|minced|sliced|grated|peeled|mashed|cooked|raw|fresh|dried|ripe|very|about)\s*/gi, '')
      .replace(/^\d+\s*-\s*\d+\s*/g, '')
      .replace(/^\d+\s*/g, '')
      .replace(/\(.*?\)/g, '')
      .trim();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
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

  const updateShoppingListFromPlan = async (plan: MealPlan) => {
    if (!userId) return;
    const ingredientsMap = new Map<string, { ingredient: string; category: string; fromRecipes: string[] }>();
    Object.entries(plan).forEach(([day, meals]) => {
      Object.entries(meals).forEach(([mealType, slot]) => {
        const recipe = recipes.find((r) => r.id === slot.recipeId);
        if (recipe) {
          recipe.ingredients.forEach((ing) => {
            const cleanName = extractIngredientName(ing);
            const category = categorizeIngredient(cleanName);
            if (ingredientsMap.has(cleanName.toLowerCase())) {
              const existing = ingredientsMap.get(cleanName.toLowerCase())!;
              if (!existing.fromRecipes.includes(recipe.title)) existing.fromRecipes.push(recipe.title);
            } else {
              ingredientsMap.set(cleanName.toLowerCase(), { ingredient: cleanName, category, fromRecipes: [recipe.title] });
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

  // ========== UI HELPERS ==========
  const openPicker = (day: string, mealType: string) => {
    setPickerContext({ day, mealType });
    setPickerOpen(true);
  };

  const handleDayCopy = (day: string) => {
    if (copySource) pasteDay(day);
    else copyDay(day);
  };

  const currentPlan = activeTab === "auto" ? personalizedPlan : customPlan;

  const usedRecipeIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(currentPlan).forEach(dayMeals => {
      Object.values(dayMeals).forEach(slot => {
        if (slot.recipeId) ids.push(slot.recipeId);
      });
    });
    return ids;
  }, [currentPlan]);

  const stats = useMemo(() => {
    let totalMeals = 0, preparedMeals = 0, totalCalories = 0, totalPrepTime = 0, totalProtein = 0;
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
  }, [currentPlan]);

  if (isLoading) return <MealPlanSkeleton />;

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Plan Generating Overlay */}
      <PlanGeneratingOverlay
        isVisible={isGenerating}
        onComplete={onGenerationComplete}
        babyAgeMonths={babyAgeMonths}
      />

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
                {isTooYoungForSolids 
                  ? `Your baby is ${babyAgeMonths} month${babyAgeMonths !== 1 ? 's' : ''} old - too young for solids`
                  : `Nutritious meals for your ${babyAgeMonths}-month-old`
                }
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

          {!isTooYoungForSolids && stats.totalMeals > 0 && (
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

      <div className="max-w-6xl mx-auto px-3 sm:px-6 w-full max-w-full min-w-0">
        {/* Too Young Warning */}
        {isTooYoungForSolids && (
          <Card className="mb-6 border-2 border-amber-400/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <Baby className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Your Baby is {babyAgeMonths} Month{babyAgeMonths !== 1 ? 's' : ''} Old
                  </h2>
                  <p className="text-amber-700 dark:text-amber-300 mt-2 leading-relaxed">
                    <strong>Solid foods are not recommended before 6 months of age.</strong>
                  </p>
                  <p className="text-amber-600 dark:text-amber-400 mt-2 text-sm leading-relaxed">
                    According to health organizations, babies should be exclusively breastfed or formula-fed 
                    until around 6 months old.
                  </p>
                  <div className="mt-4 p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/30">
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Signs of Readiness (around 6 months):</h3>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• Baby can sit up with minimal support</li>
                      <li>• Good head and neck control</li>
                      <li>• Shows interest in food when others eat</li>
                      <li>• Can bring objects to mouth</li>
                      <li>• Loss of tongue-thrust reflex</li>
                    </ul>
                  </div>
                  <p className="text-amber-600 dark:text-amber-400 mt-3 text-sm">
                    🍼 The meal planner will be available when your baby reaches 6 months!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========== TABS ========== */}
        {!isTooYoungForSolids && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
            <TabsTrigger value="auto" className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4" />
              Personalized Plan
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2 text-sm">
              <PencilLine className="h-4 w-4" />
              My Custom Plan
            </TabsTrigger>
          </TabsList>

          {/* ========== PERSONALIZED PLAN TAB ========== */}
          <TabsContent value="auto" className="mt-6">
            {/* No plan generated yet — show CTA */}
            {!hasPersonalizedPlan && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  ✨ Generate a Weekly Plan for Your Baby
                </h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  We'll create a personalized meal plan based on your baby's age ({babyAgeMonths} months) 
                  and dietary needs. Nutritionally balanced, with zero repeats!
                </p>
                <Button
                  size="lg"
                  className="gap-2 text-lg px-8 py-6"
                  onClick={handleGeneratePersonalizedPlan}
                >
                  <Wand2 className="h-5 w-5" />
                  Generate My Baby's Plan
                </Button>
              </div>
            )}

            {/* Plan generated — show it */}
            {hasPersonalizedPlan && (
              <>
                {/* Accepted Banner */}
                {personalizedPlanAccepted && (
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-mint/20 via-secondary/10 to-mint/20 border border-mint/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-mint/30">
                        <Check className="h-5 w-5 text-mint" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-0.5">
                          ✨ Plan Accepted & Active
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Your personalized meal plan is saved. Shopping list is ready!
                        </p>
                      </div>
                      <Button 
                        onClick={() => navigate("/shopping")}
                        size="sm"
                        className="gap-2 bg-mint hover:bg-mint/90"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        View List
                      </Button>
                    </div>
                  </div>
                )}

                {/* Not yet accepted */}
                {!personalizedPlanAccepted && (
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
                          Review the plan below, then accept to save it and generate your shopping list!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <Card className={`mb-6 border-2 ${personalizedPlanAccepted ? 'border-mint/30 bg-gradient-to-r from-mint/5 to-secondary/5' : 'border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5'}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          {personalizedPlanAccepted ? (
                            <Check className="h-5 w-5 text-mint" />
                          ) : (
                            <Wand2 className="h-5 w-5 text-primary" />
                          )}
                          {personalizedPlanAccepted ? 'Your Active Meal Plan' : 'Suggested Meal Plan'}
                        </h2>
                        <p className="text-muted-foreground mt-1">
                          Optimized for {babyAgeMonths}-month-old • Nutritionally balanced
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {personalizedPlanAccepted ? (
                          <>
                            <Button disabled className="gap-2 bg-mint/80 cursor-default">
                              <Check className="h-4 w-4" />
                              Plan Saved
                            </Button>
                            <Button 
                              onClick={regeneratePersonalizedPlan} 
                              variant="outline" 
                              className="gap-2"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Generate New Plan
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={acceptPersonalizedPlan} className="gap-2" disabled={isSaving}>
                              <Check className="h-4 w-4" />
                              Accept & Save
                            </Button>
                            <Button onClick={regeneratePersonalizedPlan} variant="outline" className="gap-2">
                              <RefreshCw className="h-4 w-4" />
                              Try Another
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Day cards (read-only for personalized) */}
                <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                    {daysOfWeek.map((day, index) => (
                      <DayCard
                        key={day}
                        day={day}
                        dayIndex={index}
                        meals={personalizedPlan[day] || {}}
                        onAddMeal={() => {}}
                        onRemoveMeal={() => {}}
                        onTogglePrepared={() => {}}
                        onEditMeal={() => {}}
                        onCopyDay={() => {}}
                        onClearDay={() => {}}
                      />
                    ))}
                  </div>
                  <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-24">
                    <NutritionBalanceWidget mealPlan={personalizedPlan} />

                    {/* Quick shortcuts */}
                    <div className="rounded-[24px] bg-white border border-[#EBE8DF] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-xl bg-[#EAF5EE] border border-[#CCE0D2] flex items-center justify-center text-[#1E5E3A]">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="font-serif font-bold text-gray-900 text-sm">
                          Personalized Plan Shortcuts
                        </h4>
                      </div>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start rounded-xl border-[#E8EDE4] hover:bg-[#F4F8F4] text-gray-700 h-10"
                          onClick={() => navigate("/shopping")}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2 text-[#48B774]" />
                          View Weekly Grocery List
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start rounded-xl border-[#E8EDE4] hover:bg-[#FAF9F5] text-gray-700 h-10"
                          onClick={regeneratePersonalizedPlan}
                        >
                          <RefreshCw className="h-4 w-4 mr-2 text-amber-600" />
                          Regenerate New Meal Mix
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ========== CUSTOM PLAN TAB ========== */}
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

            {/* Empty State */}
            {Object.keys(customPlan).length === 0 && (
              <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-secondary/10 via-accent/10 to-primary/10 border border-secondary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-secondary/20">
                    <PencilLine className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      Build Your Own Plan
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      This is your personal space. Add meals one by one to build your own weekly plan. 
                      All changes are saved automatically.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button onClick={() => setTemplatesOpen(true)} size="sm" variant="secondary">
                        <Wand2 className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Template button when plan has meals */}
            {Object.keys(customPlan).length > 0 && (
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => setTemplatesOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Use Template
                </Button>
              </div>
            )}

            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                {daysOfWeek.map((day, index) => (
                  <DayCard
                    key={day}
                    day={day}
                    dayIndex={index}
                    meals={customPlan[day] || {}}
                    onAddMeal={(mealType) => openPicker(day, mealType)}
                    onRemoveMeal={(mealType) => removeMealFromCustomPlan(day, mealType)}
                    onTogglePrepared={(mealType) => toggleCustomPrepared(day, mealType)}
                    onEditMeal={(mealType) => openPicker(day, mealType)}
                    onCopyDay={() => handleDayCopy(day)}
                    onClearDay={() => clearCustomDay(day)}
                  />
                ))}
              </div>

              <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-24">
                <NutritionBalanceWidget mealPlan={customPlan} />
                
                <div className="rounded-[24px] bg-white border border-[#EBE8DF] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-xl bg-[#EAF5EE] border border-[#CCE0D2] flex items-center justify-center text-[#1E5E3A]">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-serif font-bold text-gray-900 text-sm">
                      Planner Shortcuts
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl border-[#E8EDE4] hover:bg-[#F4F8F4] text-gray-700 h-10"
                      onClick={() => setTemplatesOpen(true)}
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-primary" />
                      Apply Meal Template
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl border-[#E8EDE4] hover:bg-[#F4F8F4] text-gray-700 h-10"
                      onClick={() => navigate("/shopping")}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2 text-[#48B774]" />
                      View Shopping List
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>

      {/* Modals */}
      <RecipePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(recipeId) => {
          if (pickerContext) {
            addMealToCustomPlan(pickerContext.day, pickerContext.mealType, recipeId);
          }
          setPickerOpen(false);
        }}
        mealType={pickerContext?.mealType || ""}
        day={pickerContext?.day || ""}
        usedRecipeIds={usedRecipeIds}
        babyAgeMonths={babyAgeMonths}
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
