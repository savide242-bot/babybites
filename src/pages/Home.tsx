import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import { differenceInMonths, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import QuickCheckinWidget from "@/components/engagement/QuickCheckinWidget";
import DailyActionCard from "@/components/home/DailyActionCard";
import WeeklyProgressCard from "@/components/home/WeeklyProgressCard";
import AgeCategoryCircles from "@/components/home/AgeCategoryCircles";
import PlanMealsPrompt from "@/components/home/PlanMealsPrompt";
import AppTour from "@/components/onboarding/AppTour";
import { useEngagement } from "@/hooks/useEngagement";
import { useAppTour } from "@/hooks/useAppTour";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface TodayMeal {
  mealType: string;
  recipeTitle: string;
  recipeId: string;
  prepared: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1] as const
    }
  }
};

const Home = () => {
  const [motherName, setMotherName] = useState<string>("");
  const [babyName, setBabyName] = useState<string>("");
  const [babyAgeMonths, setBabyAgeMonths] = useState<number>(6);
  const [todayMeals, setTodayMeals] = useState<TodayMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState<{ current_streak: number; total_points: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mealsThisWeek, setMealsThisWeek] = useState(0);

  // Tour refs
  const recipeOfDayRef = useRef<HTMLDivElement>(null);
  const checkinWidgetRef = useRef<HTMLDivElement>(null);
  const ageCategoriesRef = useRef<HTMLDivElement>(null);

  const { todayCheckin, submitCheckin } = useEngagement();
  const tour = useAppTour();

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDayName = dayNames[new Date().getDay()];

  const { greeting, emotionalMessage, emoji } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { 
      greeting: "Good morning", 
      emotionalMessage: "Start the day with love",
      emoji: "🌅"
    };
    if (hour < 18) return { 
      greeting: "Good afternoon", 
      emotionalMessage: "You're doing amazing",
      emoji: "☀️"
    };
    return { 
      greeting: "Good evening", 
      emotionalMessage: "Rest well tonight",
      emoji: "🌙"
    };
  }, []);

  // Get recipe of the day based on baby's age
  const recipeOfTheDay = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    
    let ageGroup = "6-9 months";
    if (babyAgeMonths >= 9 && babyAgeMonths < 12) ageGroup = "9-12 months";
    else if (babyAgeMonths >= 12 && babyAgeMonths < 18) ageGroup = "12-18 months";
    else if (babyAgeMonths >= 18) ageGroup = "18-24 months";

    const ageAppropriateRecipes = recipes.filter(r => r.ageGroup === ageGroup);
    const index = dayOfYear % ageAppropriateRecipes.length;
    return ageAppropriateRecipes[index] || recipes[0];
  }, [babyAgeMonths]);

  // Process meal plan data into TodayMeal format
  const processMealPlanData = useCallback((mealPlanData: any[]): TodayMeal[] => {
    return mealPlanData.map(item => {
      const recipe = recipes.find(r => r.id === item.recipe_id);
      return {
        mealType: item.meal_type,
        recipeTitle: recipe?.title || "Unknown recipe",
        recipeId: item.recipe_id,
        prepared: item.prepared || false
      };
    });
  }, []);

  // Fetch all data in parallel
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const currentUserId = session.user.id;
        setUserId(currentUserId);

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const [profileResult, mealPlanResult, streakResult, weekMealsResult] = await Promise.all([
          supabase.from('profiles').select('mother_name, baby_name, baby_birth_date').eq('id', currentUserId).single(),
          supabase.from('meal_plans').select('meal_type, recipe_id, prepared').eq('user_id', currentUserId).eq('day_of_week', todayDayName),
          supabase.from('user_streaks').select('current_streak, total_points').eq('user_id', currentUserId).single(),
          supabase.from('meal_plans').select('prepared, created_at').eq('user_id', currentUserId).eq('prepared', true)
        ]);

        if (profileResult.data) {
          setMotherName(profileResult.data.mother_name || "");
          setBabyName(profileResult.data.baby_name || "");
          if (profileResult.data.baby_birth_date) {
            const age = differenceInMonths(new Date(), new Date(profileResult.data.baby_birth_date));
            setBabyAgeMonths(Math.max(0, age));
          }
        }

        if (streakResult.data) {
          setStreak(streakResult.data);
        }

        if (weekMealsResult.data) {
          const weekMeals = weekMealsResult.data.filter(meal => {
            if (!meal.created_at) return false;
            const mealDate = new Date(meal.created_at);
            return isWithinInterval(mealDate, { start: weekStart, end: weekEnd });
          });
          setMealsThisWeek(weekMeals.length);
        }

        if (mealPlanResult.data && mealPlanResult.data.length > 0) {
          setTodayMeals(processMealPlanData(mealPlanResult.data));
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [todayDayName, processMealPlanData]);

  // Real-time subscription for meal_plans updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('home-meal-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meal_plans',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const updatedMeal = payload.new as any;
          
          if (updatedMeal.day_of_week !== todayDayName) return;
          
          setTodayMeals(prev => {
            const updated = prev.map(meal => 
              meal.recipeId === updatedMeal.recipe_id && meal.mealType === updatedMeal.meal_type
                ? { ...meal, prepared: updatedMeal.prepared }
                : meal
            );
            
            const allPrepared = updated.every(m => m.prepared);
            const wasPreviouslyNotAllPrepared = !prev.every(m => m.prepared);
            
            if (allPrepared && wasPreviouslyNotAllPrepared && updated.length > 0) {
              setTimeout(() => {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 }
                });
                toast.success("🎉 All meals done today!", {
                  duration: 5000,
                });
              }, 100);
            } else if (updatedMeal.prepared) {
              const remainingCount = updated.filter(m => !m.prepared).length;
              if (remainingCount > 0) {
                toast.success(`✅ Meal done! ${remainingCount} left.`, {
                  duration: 3000,
                });
              }
            }
            
            return updated;
          });

          if (updatedMeal.prepared) {
            setMealsThisWeek(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, todayDayName]);

  // Get nav refs from window for tour (set by App.tsx)
  const navRefs = (window as any).__tourNavRefs;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* App Tour for new users */}
      {!tour.isLoading && (
        <AppTour
          isActive={tour.isActive}
          currentStep={tour.currentStep}
          motherName={tour.motherName}
          babyName={tour.babyName}
          refs={{
            recipeOfDay: recipeOfDayRef,
            checkinWidget: checkinWidgetRef,
            ageCategoriesRef: ageCategoriesRef,
            recipesNav: navRefs?.recipes,
            plannerNav: navRefs?.planner,
          }}
          onNext={tour.nextStep}
          onPrev={tour.prevStep}
          onSkip={tour.skipTour}
          onComplete={tour.completeTour}
        />
      )}

      <motion.div 
        className="max-w-lg mx-auto px-4 py-5 space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Greeting Header */}
        <motion.div variants={itemVariants}>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div>
                <Skeleton className="h-6 w-40 mb-1.5" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-gold/30 via-peach/50 to-primary/20 text-2xl shadow-lg border border-gold/20">
                {emoji}
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {greeting}, <span className="bg-gradient-to-r from-gold to-primary bg-clip-text text-transparent">{motherName || "Mom"}</span>!
                </h1>
                <p className="text-muted-foreground text-sm">
                  {emotionalMessage} ✨
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Streak Badge */}
        {!isLoading && streak && streak.current_streak > 0 && (
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold/20 via-amber-500/15 to-gold/20 border border-gold/40 shadow-lg backdrop-blur-sm">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-bold bg-gradient-to-r from-gold to-amber-600 bg-clip-text text-transparent">
                {streak.current_streak} day streak
              </span>
              <span className="text-gold text-xs">⭐</span>
            </div>
          </motion.div>
        )}

        {/* Plan Meals Prompt */}
        {!isLoading && (
          <motion.div variants={itemVariants}>
            <PlanMealsPrompt hasMealsPlanned={todayMeals.length > 0} />
          </motion.div>
        )}

        {/* Age Category Circles */}
        {!isLoading && (
          <motion.div variants={itemVariants}>
            <AgeCategoryCircles 
              ref={ageCategoriesRef}
              babyAgeMonths={babyAgeMonths} 
            />
          </motion.div>
        )}

        {/* Recipe of the Day */}
        {!isLoading && recipeOfTheDay && (
          <motion.div variants={itemVariants} ref={recipeOfDayRef}>
            <DailyActionCard
              recipeOfTheDay={recipeOfTheDay}
              todayMeals={todayMeals}
              babyName={babyName}
            />
          </motion.div>
        )}

        {/* Quick Check-in */}
        {!isLoading && (
          <motion.div variants={itemVariants} ref={checkinWidgetRef}>
            <QuickCheckinWidget 
              todayCheckin={todayCheckin} 
              onSubmit={submitCheckin}
              babyName={babyName}
            />
          </motion.div>
        )}

        {/* Weekly Progress */}
        <motion.div variants={itemVariants}>
          <WeeklyProgressCard
            streak={streak}
            mealsThisWeek={mealsThisWeek}
            babyName={babyName}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
