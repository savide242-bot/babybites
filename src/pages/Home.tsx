import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import { differenceInMonths, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import WhatToCookWidget from "@/components/home/WhatToCookWidget";
import AgeCategoryCircles from "@/components/home/AgeCategoryCircles";
import PlanMealsPrompt from "@/components/home/PlanMealsPrompt";
import TodaysMealsPreview from "@/components/home/TodaysMealsPreview";
import AppTour from "@/components/onboarding/AppTour";
import { useEngagement } from "@/hooks/useEngagement";
import { useAppTour } from "@/hooks/useAppTour";
import { toast } from "sonner";
import { RewardAnimation, useReward } from "@/components/ui/reward-animation";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { BellRing, Flame, Trophy, Target, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getRecipeImageById } from "@/data/recipeImages";

interface TodayMeal {
  mealType: string;
  recipeTitle: string;
  recipeId: string;
  prepared: boolean;
}

const Home = () => {
  const [motherName, setMotherName] = useState<string>("");
  const [babyName, setBabyName] = useState<string>("");
  const [babyAgeMonths, setBabyAgeMonths] = useState<number>(6);
  const [todayMeals, setTodayMeals] = useState<TodayMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState<{ current_streak: number; total_points: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mealsThisWeek, setMealsThisWeek] = useState(0);
  const { isSupported, subscription, subscribeToPushNotifications } = usePushNotifications();
  const [notifLoading, setNotifLoading] = useState(false);

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

    if (hour < 6) return { greeting: "Early riser", emotionalMessage: "You're amazing for being up early", emoji: "🌙" };
    if (hour < 12) return { greeting: "Good morning", emotionalMessage: `${displayBabyName} is lucky to have you`, emoji: "🌅" };
    if (hour < 15) return { greeting: "Hello sunshine", emotionalMessage: "You're doing incredible today", emoji: "☀️" };
    if (hour < 18) return { greeting: "Good afternoon", emotionalMessage: "Take a moment to breathe", emoji: "🌤️" };
    if (hour < 21) return { greeting: "Good evening", emotionalMessage: `Another beautiful day with ${displayBabyName}`, emoji: "🌆" };
    return { greeting: "Sweet dreams time", emotionalMessage: "Rest well, supermom", emoji: "🌙" };
  }, [babyName]);

  const processMealPlanData = useCallback((mealPlanData: any[]): TodayMeal[] => {
    return mealPlanData.map(item => {
      const recipe = recipes.find(r => r.id === item.recipe_id);
      return { mealType: item.meal_type, recipeTitle: recipe?.title || "Unknown recipe", recipeId: item.recipe_id, prepared: item.prepared || false };
    });
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setIsLoading(false); return; }
        const currentUserId = session.user.id;
        setUserId(currentUserId);
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const [profileResult, mealPlanResult, streakResult, weekMealsResult] = await Promise.all([
          supabase.from('profiles').select('mother_name, baby_name, baby_birth_date').eq('id', currentUserId).maybeSingle(),
          supabase.from('meal_plans').select('meal_type, recipe_id, prepared').eq('user_id', currentUserId).eq('day_of_week', todayDayName),
          supabase.from('user_streaks').select('current_streak, total_points').eq('user_id', currentUserId).maybeSingle(),
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
        if (streakResult.data) setStreak(streakResult.data);
        if (weekMealsResult.data) {
          const weekMeals = weekMealsResult.data.filter(meal => {
            if (!meal.created_at) return false;
            return isWithinInterval(new Date(meal.created_at), { start: weekStart, end: weekEnd });
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

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('home-meal-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meal_plans', filter: `user_id=eq.${userId}` },
        (payload) => {
          const updatedMeal = payload.new as any;
          if (updatedMeal.day_of_week !== todayDayName) return;
          setTodayMeals(prev => {
            const updated = prev.map(meal =>
              meal.recipeId === updatedMeal.recipe_id && meal.mealType === updatedMeal.meal_type
                ? { ...meal, prepared: updatedMeal.prepared } : meal
            );
            const allPrepared = updated.every(m => m.prepared);
            const wasPreviouslyNotAllPrepared = !prev.every(m => m.prepared);
            if (allPrepared && wasPreviouslyNotAllPrepared && updated.length > 0) {
              setTimeout(() => {
                triggerReward({ type: 'confetti', message: '🎉 All meals done today!', points: 50 });
                toast.success("Amazing! All meals prepared!", { duration: 5000 });
              }, 100);
            } else if (updatedMeal.prepared) {
              const remainingCount = updated.filter(m => !m.prepared).length;
              if (remainingCount > 0) toast.success(`✅ Meal done! ${remainingCount} left.`, { duration: 3000 });
            }
            return updated;
          });
          if (updatedMeal.prepared) setMealsThisWeek(prev => prev + 1);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, todayDayName]);

  const navRefs = (window as any).__tourNavRefs;
  const currentStreak = streak?.current_streak || 0;
  const totalPoints = streak?.total_points || 0;
  const weeklyGoal = 14;
  const preparedCount = todayMeals.filter(m => m.prepared).length;

  return (
    <div className="min-h-screen pb-24 lg:pb-8 bg-background">
      <RewardComponent />

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

      <div className="max-w-lg mx-auto px-4 pt-5 pb-4 space-y-5">

        {/* ── HERO HEADER ── */}
        {isLoading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pt-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{emotionalMessage} ✨</p>
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight mt-0.5">
                  {greeting}, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{motherName || "Mom"}</span>
                </h1>
              </div>
              <motion.div
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-xl shrink-0 mt-1"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                {emoji}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ── NOTIFICATION CTA ── */}
        {!isLoading && isSupported && !subscription && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={async () => {
              setNotifLoading(true);
              try {
                const success = await subscribeToPushNotifications();
                if (success) toast.success("🔔 Notifications enabled!");
              } finally {
                setNotifLoading(false);
              }
            }}
            disabled={notifLoading}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4 animate-[wiggle_1s_ease-in-out_infinite]" />
            </div>
            <div className="text-left flex-1">
                <p className="font-semibold text-sm">Enable Notifications</p>
              <p className="text-[11px] opacity-80">Meal reminders & daily tips</p>
            </div>
            {notifLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
          </motion.button>
        )}

        {/* ── STATS STRIP ── */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            {/* Streak */}
            <Link
              to="/achievements"
              className="flex-1 flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/15 active:scale-[0.97] transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                <Flame className="w-4.5 h-4.5 text-accent" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground leading-none">{currentStreak}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">day streak</p>
              </div>
            </Link>

            {/* Points */}
            <div className="flex-1 flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/15">
              <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center">
                <Trophy className="w-4.5 h-4.5 text-gold" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground leading-none">{totalPoints}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">points</p>
              </div>
            </div>

            {/* Weekly */}
            <Link
              to="/planner"
              className="flex-1 flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-mint/10 to-mint/5 border border-mint/15 active:scale-[0.97] transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-mint/15 flex items-center justify-center">
                <Target className="w-4.5 h-4.5 text-mint" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground leading-none">{mealsThisWeek}<span className="text-xs font-medium text-muted-foreground">/{weeklyGoal}</span></p>
                <p className="text-[10px] text-muted-foreground mt-0.5">meals</p>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── AGE CATEGORIES ── */}
        {!isLoading && (
          <motion.div
            ref={ageCategoriesRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <AgeCategoryCircles babyAgeMonths={babyAgeMonths} />
          </motion.div>
        )}

        {/* ── WHAT TO COOK (single recipe suggestion) ── */}
        {!isLoading && (
          <motion.div
            ref={recipeOfDayRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <WhatToCookWidget babyAgeMonths={babyAgeMonths} babyName={babyName} />
          </motion.div>
        )}

        {/* ── TODAY'S MEALS or PLAN MEALS ── */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {todayMeals.length > 0 ? (
              <TodaysMealsPreview meals={todayMeals} />
            ) : (
              <PlanMealsPrompt hasMealsPlanned={false} />
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Home;
