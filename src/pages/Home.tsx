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
import { GlassCard } from "@/components/ui/glass-card";
import { EmotionalHeader, StreakBadge } from "@/components/ui/emotional-header";
import { RewardAnimation, useReward } from "@/components/ui/reward-animation";

interface TodayMeal {
  mealType: string;
  recipeTitle: string;
  recipeId: string;
  prepared: boolean;
}

// Floating food emojis data
const floatingFoods = [
  { emoji: "🥑", size: "text-5xl", delay: "0s", duration: "18s", startX: "-5%", startY: "15%", endX: "105%", endY: "60%" },
  { emoji: "🍌", size: "text-6xl", delay: "3s", duration: "22s", startX: "110%", startY: "30%", endX: "-10%", endY: "70%" },
  { emoji: "🥕", size: "text-4xl", delay: "6s", duration: "20s", startX: "-8%", startY: "50%", endX: "108%", endY: "20%" },
  { emoji: "🍠", size: "text-5xl", delay: "9s", duration: "25s", startX: "105%", startY: "70%", endX: "-5%", endY: "25%" },
  { emoji: "🥦", size: "text-4xl", delay: "12s", duration: "19s", startX: "50%", startY: "-5%", endX: "20%", endY: "110%" },
  { emoji: "🍎", size: "text-5xl", delay: "15s", duration: "21s", startX: "-10%", startY: "80%", endX: "110%", endY: "10%" },
];

const Home = () => {
  const [motherName, setMotherName] = useState<string>("");
  const [babyName, setBabyName] = useState<string>("");
  const [babyAgeMonths, setBabyAgeMonths] = useState<number>(6);
  const [todayMeals, setTodayMeals] = useState<TodayMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState<{ current_streak: number; total_points: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mealsThisWeek, setMealsThisWeek] = useState(0);

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
    
    if (hour < 6) return { greeting: "Early riser", emotionalMessage: "You're amazing for being up early ✨", emoji: "🌙" };
    if (hour < 12) return { greeting: "Good morning", emotionalMessage: `${displayBabyName} is lucky to have you 💕`, emoji: "🌅" };
    if (hour < 15) return { greeting: "Hello sunshine", emotionalMessage: "You're doing incredible today 🌟", emoji: "☀️" };
    if (hour < 18) return { greeting: "Good afternoon", emotionalMessage: "Take a moment to breathe 💛", emoji: "🌤️" };
    if (hour < 21) return { greeting: "Good evening", emotionalMessage: `Another beautiful day with ${displayBabyName} 💜`, emoji: "🌆" };
    return { greeting: "Sweet dreams time", emotionalMessage: "Rest well, supermom 💫", emoji: "🌙" };
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

  return (
    <div className="min-h-screen pb-24 lg:pb-8 relative overflow-hidden">
      {/* Animated shifting gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-peach/25 via-background via-50% to-mint/15 bg-[length:400%_400%] animate-[gradient-shift_8s_ease_infinite] pointer-events-none" />
      
      {/* Large floating food emojis */}
      {floatingFoods.map((food, i) => (
        <div
          key={i}
          className={`absolute ${food.size} pointer-events-none opacity-20 z-0`}
          style={{
            left: food.startX,
            top: food.startY,
            animation: `float-across ${food.duration} linear ${food.delay} infinite`,
            filter: 'blur(1px)',
          }}
        >
          {food.emoji}
        </div>
      ))}

      {/* Glowing orbs - bigger and more visible */}
      <div className="absolute top-10 left-0 w-48 h-48 bg-primary/15 rounded-full blur-3xl animate-[glow-pulse_4s_ease-in-out_infinite] pointer-events-none" />
      <div className="absolute top-40 right-0 w-56 h-56 bg-gold/15 rounded-full blur-3xl animate-[glow-pulse_5s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-32 left-5 w-40 h-40 bg-mint/15 rounded-full blur-3xl animate-[glow-pulse_6s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '3s' }} />

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

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 relative z-10">
        {/* Greeting */}
        <div className="home-card-enter" style={{ animationDelay: '0s' }}>
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
        </div>

        {/* What to Cook Widget */}
        {!isLoading && (
          <div className="home-card-enter" style={{ animationDelay: '0.1s' }}>
            <WhatToCookWidget babyAgeMonths={babyAgeMonths} babyName={babyName} />
          </div>
        )}

        {/* Plan Meals Prompt */}
        {!isLoading && (
          <div className="home-card-enter" style={{ animationDelay: '0.15s' }}>
            <GlassCard variant="peach" hover={false}>
              <PlanMealsPrompt hasMealsPlanned={todayMeals.length > 0} />
            </GlassCard>
          </div>
        )}

        {/* Age Category Circles */}
        {!isLoading && (
          <div className="home-card-enter" style={{ animationDelay: '0.2s' }}>
            <AgeCategoryCircles 
              ref={ageCategoriesRef}
              babyAgeMonths={babyAgeMonths} 
            />
          </div>
        )}

        {/* Recipe of the Day - with dramatic glow */}
        {!isLoading && recipeOfTheDay && (
          <div 
            ref={recipeOfDayRef}
            className="relative home-card-enter"
            style={{ animationDelay: '0.3s' }}
          >
            {/* Animated golden glow behind card */}
            <div className="absolute -inset-2 bg-gradient-to-r from-gold/30 via-primary/20 to-gold/30 rounded-3xl blur-xl animate-[glow-pulse_3s_ease-in-out_infinite] pointer-events-none" />
            <GlassCard variant="gold" glow className="relative z-10">
              <DailyActionCard
                recipeOfTheDay={recipeOfTheDay}
                todayMeals={todayMeals}
                babyName={babyName}
              />
            </GlassCard>
          </div>
        )}

        {/* Quick Check-in */}
        {!isLoading && (
          <div ref={checkinWidgetRef} className="home-card-enter" style={{ animationDelay: '0.4s' }}>
            <GlassCard variant="mint">
              <QuickCheckinWidget 
                todayCheckin={todayCheckin} 
                onSubmit={submitCheckin}
                babyName={babyName}
              />
            </GlassCard>
          </div>
        )}

        {/* Weekly Progress */}
        <div className="home-card-enter" style={{ animationDelay: '0.5s' }}>
          <GlassCard variant="warm">
            <WeeklyProgressCard
              streak={streak}
              mealsThisWeek={mealsThisWeek}
              babyName={babyName}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Home;
