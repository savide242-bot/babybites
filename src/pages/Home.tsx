import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import { differenceInMonths, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import QuickCheckinWidget from "@/components/engagement/QuickCheckinWidget";
import BabyPhaseCard from "@/components/home/BabyPhaseCard";
import DailyActionCard from "@/components/home/DailyActionCard";
import WeeklyProgressCard from "@/components/home/WeeklyProgressCard";
import TiredMomMode from "@/components/home/TiredMomMode";
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
  const [showTiredMode, setShowTiredMode] = useState(false);
  const [mealsThisWeek, setMealsThisWeek] = useState(0);

  // Tour refs
  const recipeOfDayRef = useRef<HTMLDivElement>(null);
  const checkinWidgetRef = useRef<HTMLDivElement>(null);

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
    
    // Filter by age group
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

        // Get week boundaries
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

        // Count meals prepared this week
        if (weekMealsResult.data) {
          const weekMeals = weekMealsResult.data.filter(meal => {
            if (!meal.created_at) return false;
            const mealDate = new Date(meal.created_at);
            return isWithinInterval(mealDate, { start: weekStart, end: weekEnd });
          });
          setMealsThisWeek(weekMeals.length);
        }

        // Process today's meals
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
          
          // Only update if it's for today
          if (updatedMeal.day_of_week !== todayDayName) return;
          
          setTodayMeals(prev => {
            const updated = prev.map(meal => 
              meal.recipeId === updatedMeal.recipe_id && meal.mealType === updatedMeal.meal_type
                ? { ...meal, prepared: updatedMeal.prepared }
                : meal
            );
            
            // Check if all meals are now prepared
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

          // Update weekly count
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
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
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
            recipesNav: navRefs?.recipes,
            plannerNav: navRefs?.planner,
            chatNav: navRefs?.chat
          }}
          onNext={tour.nextStep}
          onPrev={tour.prevStep}
          onSkip={tour.skipTour}
          onComplete={tour.completeTour}
        />
      )}

      {/* Tired Mom Mode Modal */}
      <AnimatePresence>
        {showTiredMode && (
          <TiredMomMode 
            babyName={babyName}
            babyAgeMonths={babyAgeMonths}
            onClose={() => setShowTiredMode(false)}
          />
        )}
      </AnimatePresence>

      <motion.div 
        className="max-w-lg mx-auto px-4 py-5 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Compact Header */}
        <motion.div variants={itemVariants}>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <div>
                <Skeleton className="h-5 w-36 mb-1.5" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-peach/50 text-xl shadow-soft">
                  {emoji}
                </div>
                <div>
                  <h1 className="text-base font-semibold text-foreground">
                    {greeting}, <span className="text-primary">{motherName || "Mom"}</span>
                  </h1>
                  <p className="text-muted-foreground text-xs">
                    {emotionalMessage} ✨
                  </p>
                </div>
              </div>
              
              {/* Tired Mom Mode Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTiredMode(true)}
                className="rounded-xl h-9 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-soft-blue/20 gap-1.5"
              >
                <Moon className="w-4 h-4" />
                <span className="hidden sm:inline">Rest Mode</span>
              </Button>
            </div>
          )}
        </motion.div>

        {/* Quick Check-in - Priority 1 */}
        {!isLoading && (
          <motion.div variants={itemVariants} ref={checkinWidgetRef}>
            <QuickCheckinWidget 
              todayCheckin={todayCheckin} 
              onSubmit={submitCheckin}
              babyName={babyName}
            />
          </motion.div>
        )}

        {/* Baby Phase Card - Shows current development stage */}
        {!isLoading && (
          <motion.div variants={itemVariants}>
            <BabyPhaseCard 
              babyName={babyName} 
              babyAgeMonths={babyAgeMonths}
            />
          </motion.div>
        )}

        {/* Daily Action Card - Next meal or recipe of the day */}
        {!isLoading && recipeOfTheDay && (
          <motion.div variants={itemVariants} ref={recipeOfDayRef}>
            <DailyActionCard
              recipeOfTheDay={recipeOfTheDay}
              todayMeals={todayMeals}
              babyName={babyName}
            />
          </motion.div>
        )}

        {/* Weekly Progress Card - Streak and points */}
        <motion.div variants={itemVariants}>
          <WeeklyProgressCard
            streak={streak}
            mealsThisWeek={mealsThisWeek}
            babyName={babyName}
          />
        </motion.div>

        {/* Motivational Message */}
        <motion.div variants={itemVariants}>
          <div className="bg-gradient-to-r from-peach/30 via-card to-soft-blue/20 rounded-2xl p-4 border border-peach/30">
            <p className="text-sm font-medium text-center text-foreground">
              💕 Every meal is a moment of love for {babyName || "your baby"}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
