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
import { GlassCard } from "@/components/ui/glass-card";
import { EmotionalHeader, StreakBadge } from "@/components/ui/emotional-header";
import { RewardAnimation, useReward } from "@/components/ui/reward-animation";

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
  const { triggerReward, RewardComponent } = useReward();

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDayName = dayNames[new Date().getDay()];

  const { greeting, emotionalMessage, emoji } = useMemo(() => {
    const hour = new Date().getHours();
    const displayBabyName = babyName || "your little one";
    
    if (hour < 6) return { 
      greeting: "Early riser", 
      emotionalMessage: "You're amazing for being up early ✨",
      emoji: "🌙"
    };
    if (hour < 12) return { 
      greeting: "Good morning", 
      emotionalMessage: `${displayBabyName} is lucky to have you 💕`,
      emoji: "🌅"
    };
    if (hour < 15) return { 
      greeting: "Hello sunshine", 
      emotionalMessage: "You're doing incredible today 🌟",
      emoji: "☀️"
    };
    if (hour < 18) return { 
      greeting: "Good afternoon", 
      emotionalMessage: "Take a moment to breathe 💛",
      emoji: "🌤️"
    };
    if (hour < 21) return { 
      greeting: "Good evening", 
      emotionalMessage: `Another beautiful day with ${displayBabyName} 💜`,
      emoji: "🌆"
    };
    return { 
      greeting: "Sweet dreams time", 
      emotionalMessage: "Rest well, supermom 💫",
      emoji: "🌙"
    };
  }, [babyName]);

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
                triggerReward({
                  type: 'confetti',
                  message: '🎉 All meals done today!',
                  points: 50,
                });
                toast.success("Amazing! All meals prepared!", {
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
    <div className="min-h-screen bg-gradient-to-br from-peach/15 via-background to-mint/5 pb-24 lg:pb-8 relative overflow-hidden">
      {/* Floating decorative orbs */}
      <div className="absolute top-20 left-5 w-32 h-32 bg-primary/8 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute top-60 right-5 w-40 h-40 bg-gold/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 left-10 w-28 h-28 bg-mint/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
      
      {/* Reward animation overlay */}
      <RewardComponent />

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
        {/* Emotional Header with Greeting */}
        <motion.div variants={itemVariants}>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div>
                <Skeleton className="h-6 w-40 mb-1.5" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ) : (
            <EmotionalHeader
              greeting={greeting}
              name={motherName || "Mom"}
              subtitle={emotionalMessage}
              emoji={emoji}
              badge={streak && streak.current_streak > 0 ? (
                <StreakBadge streak={streak.current_streak} />
              ) : undefined}
            />
          )}
        </motion.div>

        {/* Plan Meals Prompt */}
        {!isLoading && (
          <motion.div variants={itemVariants}>
            <GlassCard variant="peach" hover={false}>
              <PlanMealsPrompt hasMealsPlanned={todayMeals.length > 0} />
            </GlassCard>
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

        {/* Recipe of the Day - Premium with Glow */}
        {!isLoading && recipeOfTheDay && (
          <motion.div 
            variants={itemVariants} 
            ref={recipeOfDayRef}
            className="relative"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Glow effect behind card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-gold/25 via-primary/15 to-gold/25 rounded-3xl blur-xl opacity-70 pointer-events-none" />
            <GlassCard variant="gold" glow className="relative z-10">
              <DailyActionCard
                recipeOfTheDay={recipeOfTheDay}
                todayMeals={todayMeals}
                babyName={babyName}
              />
            </GlassCard>
          </motion.div>
        )}

        {/* Quick Check-in */}
        {!isLoading && (
          <motion.div variants={itemVariants} ref={checkinWidgetRef}>
            <GlassCard variant="mint">
              <QuickCheckinWidget 
                todayCheckin={todayCheckin} 
                onSubmit={submitCheckin}
                babyName={babyName}
              />
            </GlassCard>
          </motion.div>
        )}

        {/* Weekly Progress */}
        <motion.div variants={itemVariants}>
          <GlassCard variant="warm">
            <WeeklyProgressCard
              streak={streak}
              mealsThisWeek={mealsThisWeek}
              babyName={babyName}
            />
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
