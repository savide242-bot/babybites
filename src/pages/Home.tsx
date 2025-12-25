import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Star, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import { differenceInMonths } from "date-fns";
import RecipeOfTheDay from "@/components/home/RecipeOfTheDay";
import TodaysMealsPreview from "@/components/home/TodaysMealsPreview";
import QuickCheckinWidget from "@/components/engagement/QuickCheckinWidget";
import DailyPollWidget from "@/components/engagement/DailyPollWidget";
import SevenDayChallengeCard from "@/components/engagement/SevenDayChallengeCard";
import ReferralWidget from "@/components/referral/ReferralWidget";
import FoodJourneyTimeline from "@/components/journey/FoodJourneyTimeline";
import { useEngagement } from "@/hooks/useEngagement";
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
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
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

  const { todayCheckin, submitCheckin } = useEngagement();

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

        const [profileResult, mealPlanResult, streakResult] = await Promise.all([
          supabase.from('profiles').select('mother_name, baby_name, baby_birth_date').eq('id', currentUserId).single(),
          supabase.from('meal_plans').select('meal_type, recipe_id, prepared').eq('user_id', currentUserId).eq('day_of_week', todayDayName),
          supabase.from('user_streaks').select('current_streak, total_points').eq('user_id', currentUserId).single()
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
                toast.success("🎉 Parabéns! Todas as refeições de hoje concluídas!", {
                  duration: 5000,
                });
              }, 100);
            } else if (updatedMeal.prepared) {
              const remainingCount = updated.filter(m => !m.prepared).length;
              if (remainingCount > 0) {
                toast.success(`✅ Refeição concluída! Faltam ${remainingCount} refeições.`, {
                  duration: 3000,
                });
              }
            }
            
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, todayDayName]);

  return (
    <div className="min-h-screen bg-background">
      <motion.div 
        className="max-w-lg mx-auto px-4 py-6 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-peach text-2xl shadow-soft">
                  {emoji}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    {greeting}, <span className="text-primary">{motherName || "Mom"}</span>
                  </h1>
                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    {emotionalMessage}
                  </p>
                </div>
              </div>
              
              {/* Streak & Points */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-accent/20 px-3 py-1.5 rounded-full">
                  <Flame className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold text-foreground">{streak?.current_streak || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-sunshine/30 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-sunshine-foreground" />
                  <span className="text-sm font-bold text-foreground">{streak?.total_points || 0}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Check-in - 1 Tap */}
        {!isLoading && (
          <motion.div variants={itemVariants}>
            <QuickCheckinWidget 
              todayCheckin={todayCheckin} 
              onSubmit={submitCheckin}
              babyName={babyName}
            />
          </motion.div>
        )}

        {/* 7-Day Challenge for New Users */}
        {!isLoading && (
          <motion.div variants={itemVariants}>
            <SevenDayChallengeCard babyName={babyName} />
          </motion.div>
        )}

        {/* Daily Poll */}
        {!isLoading && (
          <motion.div variants={itemVariants}>
            <DailyPollWidget babyName={babyName} />
          </motion.div>
        )}

        {/* Recipe of the Day - Hero */}
        {!isLoading && recipeOfTheDay && (
          <motion.div variants={itemVariants}>
            <RecipeOfTheDay recipe={recipeOfTheDay} babyName={babyName} />
          </motion.div>
        )}

        {/* Today's Meals */}
        <motion.div variants={itemVariants}>
          <TodaysMealsPreview meals={todayMeals} />
        </motion.div>

        {/* Food Journey Timeline */}
        {!isLoading && (
          <motion.div variants={itemVariants}>
            <FoodJourneyTimeline compact babyName={babyName} />
          </motion.div>
        )}

        {/* Referral Widget */}
        {!isLoading && (
          <motion.div variants={itemVariants}>
            <ReferralWidget />
          </motion.div>
        )}

        {/* Motivational Message */}
        <motion.div variants={itemVariants}>
          <div className="bg-peach/30 rounded-2xl p-5 border border-peach/50">
            <p className="text-base font-medium text-center text-foreground">
              💕 Every meal is a moment of love for {babyName || "your baby"}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
