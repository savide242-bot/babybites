import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import { differenceInMonths, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import QuickCheckinWidget from "@/components/engagement/QuickCheckinWidget";
import WhatToCookWidget from "@/components/home/WhatToCookWidget";
import DailyActionCard from "@/components/home/DailyActionCard";
import WeeklyProgressCard from "@/components/home/WeeklyProgressCard";
import AgeCategoryCircles from "@/components/home/AgeCategoryCircles";
import PlanMealsPrompt from "@/components/home/PlanMealsPrompt";
import AppTour from "@/components/onboarding/AppTour";
import { useEngagement } from "@/hooks/useEngagement";
import { useAppTour } from "@/hooks/useAppTour";
import { toast } from "sonner";
import { RewardAnimation, useReward } from "@/components/ui/reward-animation";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { BellRing, Flame, Star, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

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

  return (
    <div className="min-h-screen pb-24 lg:pb-8 bg-background">
      {/* Subtle top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

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

      <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-4 relative z-10">

        {/* ── GREETING HEADER ── */}
        <div className="home-card-enter">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div>
                <Skeleton className="h-6 w-40 mb-1" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-peach/30 flex items-center justify-center text-2xl">
                  {emoji}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground leading-tight">
                    {greeting}, <span className="text-primary">{motherName || "Mom"}</span>
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">{emotionalMessage} ✨</p>
                </div>
              </div>
              {currentStreak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                  <Flame className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold text-accent">{currentStreak}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── NOTIFICATION CTA ── */}
        {!isLoading && isSupported && !subscription && (
          <div className="home-card-enter" style={{ animationDelay: '0.05s' }}>
            <button
              onClick={async () => {
                setNotifLoading(true);
                try {
                  const success = await subscribeToPushNotifications();
                  if (success) {
                    toast.success("🔔 Notificações ativadas!");
                  }
                } finally {
                  setNotifLoading(false);
                }
              }}
              disabled={notifLoading}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 animate-[wiggle_1s_ease-in-out_infinite]" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Ativar Notificações</p>
                <p className="text-xs opacity-80">Lembretes de refeições e dicas diárias</p>
              </div>
              {notifLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
            </button>
          </div>
        )}

        {/* ── QUICK STATS ROW ── */}
        {!isLoading && (
          <div className="home-card-enter grid grid-cols-3 gap-2.5" style={{ animationDelay: '0.08s' }}>
            <Link to="/planner" className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-card border border-border/50 active:scale-[0.97] transition-transform">
              <span className="text-xl">🍽️</span>
              <span className="text-lg font-bold text-foreground">{todayMeals.length}</span>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">Today's Meals</span>
            </Link>
            <Link to="/recipes" className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-card border border-border/50 active:scale-[0.97] transition-transform">
              <span className="text-xl">📊</span>
              <span className="text-lg font-bold text-foreground">{mealsThisWeek}</span>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">This Week</span>
            </Link>
            <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-card border border-border/50">
              <Star className="w-5 h-5 text-gold" />
              <span className="text-lg font-bold text-foreground">{totalPoints}</span>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">Points</span>
            </div>
          </div>
        )}

        {/* ── WHAT TO COOK ── */}
        {!isLoading && (
          <div className="home-card-enter" style={{ animationDelay: '0.1s' }}>
            <WhatToCookWidget babyAgeMonths={babyAgeMonths} babyName={babyName} />
          </div>
        )}

        {/* ── PLAN MEALS (only if no meals planned) ── */}
        {!isLoading && todayMeals.length === 0 && (
          <div className="home-card-enter" style={{ animationDelay: '0.12s' }}>
            <PlanMealsPrompt hasMealsPlanned={false} />
          </div>
        )}

        {/* ── RECIPE OF THE DAY ── */}
        {!isLoading && recipeOfTheDay && (
          <div 
            ref={recipeOfDayRef}
            className="home-card-enter"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-card via-card to-gold/5 p-0.5">
              <div className="rounded-[14px] bg-card overflow-hidden">
                <DailyActionCard
                  recipeOfTheDay={recipeOfTheDay}
                  todayMeals={todayMeals}
                  babyName={babyName}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── QUICK CHECK-IN ── */}
        {!isLoading && (
          <div ref={checkinWidgetRef} className="home-card-enter" style={{ animationDelay: '0.2s' }}>
            <div className="rounded-2xl border border-mint/20 bg-gradient-to-br from-card to-mint/5 p-4">
              <QuickCheckinWidget 
                todayCheckin={todayCheckin} 
                onSubmit={submitCheckin}
                babyName={babyName}
              />
            </div>
          </div>
        )}

        {/* ── AGE CATEGORIES ── */}
        {!isLoading && (
          <div className="home-card-enter" style={{ animationDelay: '0.25s' }}>
            <AgeCategoryCircles 
              ref={ageCategoriesRef}
              babyAgeMonths={babyAgeMonths} 
            />
          </div>
        )}

        {/* ── WEEKLY PROGRESS ── */}
        {!isLoading && (
          <div className="home-card-enter" style={{ animationDelay: '0.3s' }}>
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <WeeklyProgressCard
                streak={streak}
                mealsThisWeek={mealsThisWeek}
                babyName={babyName}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
