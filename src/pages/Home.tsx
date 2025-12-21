import { useEffect, useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, Calendar, Heart, TrendingUp, Scan, Bot, 
  Flame, Star, Sparkles, Trophy, X, BookOpen as Diary
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useGamification } from "@/hooks/useGamification";
import { useEngagement } from "@/hooks/useEngagement";
import { useTutorial } from "@/hooks/useTutorial";
import { recipes } from "@/data/recipes";
import { differenceInMonths } from "date-fns";
import DailyTipCard from "@/components/engagement/DailyTipCard";
import DailyCheckinWidget from "@/components/engagement/DailyCheckinWidget";
import ActiveChallengeCard from "@/components/engagement/ActiveChallengeCard";
import EnrichedDailyContent from "@/components/engagement/EnrichedDailyContent";
import RecipeOfTheDay from "@/components/home/RecipeOfTheDay";
import TodaysMealsPreview from "@/components/home/TodaysMealsPreview";
import TutorialTooltip from "@/components/tutorial/TutorialTooltip";
import { DevelopmentalAlert } from "@/components/milestones/DevelopmentalAlert";
import { StreakRecoveryWidget } from "@/components/streak/StreakRecoveryWidget";

interface DailyTask {
  id: string;
  task_type: string;
  completed: boolean;
}

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
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [todayMeals, setTodayMeals] = useState<TodayMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { streak, logActivity } = useGamification();
  const { 
    dailyTip, 
    dailyContent,
    todayCheckin, 
    activeChallenge, 
    challengeProgress, 
    submitCheckin 
  } = useEngagement();
  const { 
    currentTip, 
    showTutorial, 
    completeStep, 
    dismissTutorial,
    completedSteps,
    totalSteps 
  } = useTutorial();

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
        const today = new Date().toISOString().split('T')[0];
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayDayName = dayNames[new Date().getDay()];

        const [profileResult, existingTasksResult, mealPlanResult] = await Promise.all([
          supabase.from('profiles').select('mother_name, baby_name, baby_birth_date').eq('id', userId).single(),
          supabase.from('daily_tasks').select('*').eq('user_id', userId).eq('task_date', today),
          supabase.from('meal_plans').select('meal_type, recipe_id, prepared').eq('user_id', userId).eq('day_of_week', todayDayName)
        ]);

        if (profileResult.data) {
          setMotherName(profileResult.data.mother_name || "");
          setBabyName(profileResult.data.baby_name || "");
          if (profileResult.data.baby_birth_date) {
            const age = differenceInMonths(new Date(), new Date(profileResult.data.baby_birth_date));
            setBabyAgeMonths(Math.max(0, age));
          }
        }

        if (!existingTasksResult.data || existingTasksResult.data.length === 0) {
          const taskTypes = ['Breakfast', 'Lunch', 'Dinner', 'Hydration'];
          const newTasks = taskTypes.map(type => ({
            user_id: userId,
            task_type: type,
            task_date: today,
            completed: false,
          }));

          const { data: inserted } = await supabase
            .from('daily_tasks')
            .insert(newTasks)
            .select();

          if (inserted) setDailyTasks(inserted);
        } else {
          setDailyTasks(existingTasksResult.data);
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

  const toggleTask = async (taskId: string, currentState: boolean) => {
    const updatedTasks = dailyTasks.map(task => 
      task.id === taskId ? { ...task, completed: !currentState } : task
    );
    setDailyTasks(updatedTasks);

    const { error } = await supabase
      .from('daily_tasks')
      .update({ 
        completed: !currentState,
        completed_at: !currentState ? new Date().toISOString() : null 
      })
      .eq('id', taskId);

    if (error) {
      setDailyTasks(dailyTasks);
      return;
    }

    const allCompleted = updatedTasks.every(t => t.completed);
    if (allCompleted && !currentState) {
      toast.success("🎉 Amazing! All tasks completed!", { duration: 5000 });
    }

    if (!currentState) {
      logActivity('daily_task');
    }
  };

  const navCircles = [
    { icon: BookOpen, label: "Recipes", path: "/recipes", color: "bg-primary/15 text-primary", iconBg: "bg-primary", tutorialId: "recipes" },
    { icon: Heart, label: "Favorites", path: "/favorites", color: "bg-peach text-peach-foreground", iconBg: "bg-primary", tutorialId: null },
    { icon: Calendar, label: "Planner", path: "/planner", color: "bg-secondary/15 text-secondary", iconBg: "bg-secondary", tutorialId: "planner" },
    { icon: Scan, label: "Food AI", path: "/scanner", color: "bg-mint/15 text-mint", iconBg: "bg-mint", tutorialId: "scanner" },
    { icon: Bot, label: "Ask Bibi", path: "/chat", color: "bg-accent/20 text-accent-foreground", iconBg: "bg-accent", tutorialId: "chat" },
    { icon: TrendingUp, label: "Growth", path: "/growth", color: "bg-soft-blue text-soft-blue-foreground", iconBg: "bg-secondary", tutorialId: null },
    { icon: Diary, label: "Food Diary", path: "/food-diary", color: "bg-peach/30 text-peach-foreground", iconBg: "bg-primary", tutorialId: null },
    { icon: Trophy, label: "Achievements", path: "/achievements", color: "bg-sunshine/30 text-sunshine-foreground", iconBg: "bg-sunshine", tutorialId: null },
  ];

  const taskEmojis: { [key: string]: string } = {
    'Breakfast': '🌅',
    'Lunch': '☀️',
    'Dinner': '🌙',
    'Hydration': '💧'
  };

  const completedTasksCount = dailyTasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Tutorial Dismiss Banner */}
      {showTutorial && currentTip && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <span className="text-xs text-primary font-medium flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Tip {completedSteps.length + 1} of {totalSteps}
            </span>
            <button 
              onClick={dismissTutorial}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Skip tips <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Compact Header */}
      <div className="bg-card border-b border-border/50 px-4 py-4">
        <div className="max-w-lg mx-auto">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-5 w-36 mb-1" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-peach text-xl shadow-soft">
                  {emoji}
                </div>
                <div>
                  <h1 className="text-base font-semibold text-foreground">
                    {greeting}, <span className="text-primary">{motherName || "Mom"}</span>
                  </h1>
                  <p className="text-muted-foreground text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-accent" />
                    {emotionalMessage}
                  </p>
                </div>
              </div>
              
              {/* Compact Stats */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-bold text-foreground">{streak?.current_streak || 0}</span>
                </div>
                <div className="flex items-center gap-1 bg-sunshine/30 px-2 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 text-sunshine-foreground" />
                  <span className="text-xs font-bold text-foreground">{streak?.total_points || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Developmental Milestone Alert */}
        {!isLoading && babyAgeMonths >= 6 && babyAgeMonths <= 12 && (
          <DevelopmentalAlert 
            babyAgeMonths={babyAgeMonths} 
            babyName={babyName} 
          />
        )}

        {/* Streak Recovery Alert */}
        <StreakRecoveryWidget />

        {/* HERO: Recipe of the Day - Primary CTA */}
        {!isLoading && recipeOfTheDay && (
          <RecipeOfTheDay recipe={recipeOfTheDay} babyName={babyName} />
        )}

        {/* Today's Meals Quick View */}
        <TodaysMealsPreview meals={todayMeals} />

        {/* Daily Tasks - Compact */}
        <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Today's Goals</span>
            <span className="text-xs text-muted-foreground">{completedTasksCount}/{dailyTasks.length}</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {dailyTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    task.completed ? 'bg-mint/10' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    id={task.id}
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id, task.completed)}
                    className="h-4 w-4 rounded-full border-2 data-[state=checked]:bg-mint data-[state=checked]:border-mint"
                  />
                  <label
                    htmlFor={task.id}
                    className={`text-xs cursor-pointer flex items-center gap-1 ${
                      task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    <span>{taskEmojis[task.task_type]}</span>
                    {task.task_type}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Tip or Content */}
        {dailyContent ? (
          <EnrichedDailyContent content={dailyContent} />
        ) : (
          <DailyTipCard tip={dailyTip} />
        )}

        {/* Daily Check-in */}
        <DailyCheckinWidget 
          todayCheckin={todayCheckin} 
          onSubmit={submitCheckin} 
        />

        {/* Active Challenge */}
        <ActiveChallengeCard 
          challenge={activeChallenge} 
          progress={challengeProgress} 
        />

        {/* Quick Navigation Grid with Tutorial Highlights */}
        <div className="grid grid-cols-4 gap-2">
          {navCircles.slice(0, 4).map((item, index) => {
            const showTooltip = showTutorial && currentTip?.id === item.tutorialId;
            
            return (
              <div key={index} className="relative">
                <Link 
                  to={item.path}
                  onClick={() => {
                    if (showTooltip && item.tutorialId) {
                      completeStep(item.tutorialId);
                    }
                  }}
                  className="group block"
                >
                  <div className={`${item.color} rounded-xl p-3 shadow-card border border-border/30 hover:shadow-hover transition-all hover:-translate-y-0.5 active:scale-[0.98] ${showTooltip ? 'ring-2 ring-primary ring-offset-2 animate-pulse' : ''}`}>
                    <div 
                      className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center mx-auto mb-1.5 shadow-soft group-hover:scale-105 transition-transform`}
                    >
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[10px] font-medium text-center">{item.label}</p>
                  </div>
                </Link>
                
                {showTooltip && currentTip && (
                  <TutorialTooltip
                    title={currentTip.title}
                    description={currentTip.description}
                    onDismiss={dismissTutorial}
                    onAction={() => completeStep(item.tutorialId!)}
                    position="bottom"
                    step={completedSteps.length + 1}
                    totalSteps={totalSteps}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Secondary Nav */}
        <div className="grid grid-cols-4 gap-2">
          {navCircles.slice(4).map((item, index) => (
            <Link 
              key={index} 
              to={item.path}
              className="group"
            >
              <div className={`${item.color} rounded-xl p-3 shadow-card border border-border/30 hover:shadow-hover transition-all hover:-translate-y-0.5 active:scale-[0.98]`}>
                <div 
                  className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center mx-auto mb-1.5 shadow-soft group-hover:scale-105 transition-transform`}
                >
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-[10px] font-medium text-center">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Motivational Card - Compact */}
        <div className="bg-peach/30 rounded-xl p-4 border border-peach/50">
          <p className="text-sm font-medium text-center text-foreground">
            💕 Every meal is a moment of love for {babyName || "your baby"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
