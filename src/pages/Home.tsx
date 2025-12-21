import { useEffect, useState, useMemo } from "react";
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

  const { todayCheckin, submitCheckin } = useEngagement();

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

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const userId = session.user.id;
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayDayName = dayNames[new Date().getDay()];

        const [profileResult, mealPlanResult, streakResult] = await Promise.all([
          supabase.from('profiles').select('mother_name, baby_name, baby_birth_date').eq('id', userId).single(),
          supabase.from('meal_plans').select('meal_type, recipe_id, prepared').eq('user_id', userId).eq('day_of_week', todayDayName),
          supabase.from('user_streaks').select('current_streak, total_points').eq('user_id', userId).single()
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
          const meals: TodayMeal[] = mealPlanResult.data.map(item => {
            const recipe = recipes.find(r => r.id === item.recipe_id);
            return {
              mealType: item.meal_type,
              recipeTitle: recipe?.title || "Unknown recipe",
              recipeId: item.recipe_id,
              prepared: item.prepared || false
            };
          });
          setTodayMeals(meals);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
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

        {/* Quick Check-in - 1 Tap */}
        {!isLoading && (
          <QuickCheckinWidget 
            todayCheckin={todayCheckin} 
            onSubmit={submitCheckin}
            babyName={babyName}
          />
        )}

        {/* 7-Day Challenge for New Users */}
        {!isLoading && <SevenDayChallengeCard babyName={babyName} />}

        {/* Daily Poll */}
        {!isLoading && <DailyPollWidget babyName={babyName} />}

        {/* Recipe of the Day - Hero */}
        {!isLoading && recipeOfTheDay && (
          <RecipeOfTheDay recipe={recipeOfTheDay} babyName={babyName} />
        )}

        {/* Today's Meals */}
        <TodaysMealsPreview meals={todayMeals} />

        {/* Food Journey Timeline */}
        {!isLoading && <FoodJourneyTimeline compact babyName={babyName} />}

        {/* Referral Widget */}
        {!isLoading && <ReferralWidget />}

        {/* Motivational Message */}
        <div className="bg-peach/30 rounded-2xl p-5 border border-peach/50">
          <p className="text-base font-medium text-center text-foreground">
            💕 Every meal is a moment of love for {babyName || "your baby"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;