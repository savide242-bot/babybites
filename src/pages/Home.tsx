import { useEffect, useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, Calendar, Heart, TrendingUp, Scan, Bot, 
  Flame, Star, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CircularProgress from "@/components/CircularProgress";
import { toast } from "sonner";
import { useGamification } from "@/hooks/useGamification";
import { useEngagement } from "@/hooks/useEngagement";
import DailyTipCard from "@/components/engagement/DailyTipCard";
import DailyCheckinWidget from "@/components/engagement/DailyCheckinWidget";
import WeeklyProgressTracker from "@/components/engagement/WeeklyProgressTracker";
import ActiveChallengeCard from "@/components/engagement/ActiveChallengeCard";
import EnrichedDailyContent from "@/components/engagement/EnrichedDailyContent";

interface DailyTask {
  id: string;
  task_type: string;
  completed: boolean;
}

const Home = () => {
  const [motherName, setMotherName] = useState<string>("");
  const [babyName, setBabyName] = useState<string>("");
  const [growthProgress, setGrowthProgress] = useState(0);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { streak, logActivity } = useGamification();
  const { 
    dailyTip, 
    dailyContent,
    todayCheckin, 
    activeChallenge, 
    challengeProgress, 
    weeklyProgress,
    submitCheckin 
  } = useEngagement();

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

        const [profileResult, existingTasksResult, growthResult, mealsResult, viewsResult, todayTasksResult] = await Promise.all([
          supabase.from('profiles').select('mother_name, baby_name').eq('id', userId).single(),
          supabase.from('daily_tasks').select('*').eq('user_id', userId).eq('task_date', today),
          supabase.from('baby_growth').select('id').eq('user_id', userId),
          supabase.from('meal_logs').select('id').eq('user_id', userId),
          supabase.from('recipe_views').select('id').eq('user_id', userId),
          supabase.from('daily_tasks').select('id').eq('user_id', userId).eq('task_date', today).eq('completed', true)
        ]);

        if (profileResult.data) {
          setMotherName(profileResult.data.mother_name || "");
          setBabyName(profileResult.data.baby_name || "");
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

        let totalProgress = 0;
        const growthCount = growthResult.data?.length || 0;
        if (growthCount >= 1) totalProgress += 10;
        if (growthCount >= 3) totalProgress += 10;
        
        const mealCount = mealsResult.data?.length || 0;
        if (mealCount >= 1) totalProgress += 10;
        if (mealCount >= 5) totalProgress += 10;
        
        const viewsCount = viewsResult.data?.length || 0;
        if (viewsCount >= 1) totalProgress += 10;
        if (viewsCount >= 10) totalProgress += 10;
        
        const completedCount = todayTasksResult.data?.length || 0;
        if (completedCount >= 1) totalProgress += 10;
        if (completedCount >= 2) totalProgress += 10;
        if (completedCount >= 3) totalProgress += 10;
        if (completedCount >= 4) totalProgress += 10;
        
        setGrowthProgress(totalProgress);
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

    const completedCount = updatedTasks.filter(t => t.completed).length;
    setGrowthProgress(prev => {
      const taskProgress = Math.min(completedCount, 4) * 10;
      return Math.min(100, 60 + taskProgress);
    });
  };

  const navCircles = [
    { icon: BookOpen, label: "Recipes", path: "/recipes", color: "bg-primary/15 text-primary", iconBg: "bg-primary" },
    { icon: Heart, label: "Favorites", path: "/favorites", color: "bg-peach text-peach-foreground", iconBg: "bg-primary" },
    { icon: Calendar, label: "Planner", path: "/planner", color: "bg-secondary/15 text-secondary", iconBg: "bg-secondary" },
    { icon: Scan, label: "Food AI", path: "/scanner", color: "bg-mint/15 text-mint", iconBg: "bg-mint" },
    { icon: Bot, label: "Ask Bibi", path: "/chat", color: "bg-accent/20 text-accent-foreground", iconBg: "bg-accent" },
    { icon: TrendingUp, label: "Growth", path: "/growth", color: "bg-soft-blue text-soft-blue-foreground", iconBg: "bg-secondary" },
  ];

  const taskEmojis: { [key: string]: string } = {
    'Breakfast': '🌅',
    'Lunch': '☀️',
    'Dinner': '🌙',
    'Hydration': '💧'
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Elegant Header */}
      <div className="bg-card border-b border-border/50 px-4 py-5">
        <div className="max-w-lg mx-auto">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-5 w-36 mb-2" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-peach text-2xl shadow-soft">
                {emoji}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {greeting}, <span className="text-primary">{motherName || "Mom"}</span>
                </h1>
                <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  {emotionalMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Stats Bar */}
        <div className="flex justify-center gap-4">
          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-card border border-border/50">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-accent" />
            </div>
            <div className="text-center">
              <span className="font-bold text-sm text-foreground">{streak?.current_streak || 0}</span>
              <span className="text-xs text-muted-foreground ml-1">days</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-card border border-border/50">
            <div className="w-7 h-7 rounded-full bg-sunshine/30 flex items-center justify-center">
              <Star className="w-4 h-4 text-sunshine-foreground" />
            </div>
            <div className="text-center">
              <span className="font-bold text-sm text-foreground">{streak?.total_points || 0}</span>
              <span className="text-xs text-muted-foreground ml-1">pts</span>
            </div>
          </div>
        </div>

        {/* Progress & Tasks */}
        <div className="grid grid-cols-5 gap-4">
          {/* Progress */}
          <div className="col-span-2 bg-card rounded-2xl p-4 shadow-card border border-border/50 flex flex-col items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground mb-2">Progress</span>
            {isLoading ? (
              <Skeleton className="h-16 w-16 rounded-full" />
            ) : (
              <CircularProgress value={growthProgress} size={64} strokeWidth={5} />
            )}
          </div>

          {/* Tasks */}
          <div className="col-span-3 bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <span className="text-xs font-medium text-muted-foreground mb-3 block">Today's Goals</span>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {dailyTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center gap-2.5 p-1.5 rounded-lg transition-colors ${
                      task.completed ? 'bg-mint/10' : 'hover:bg-muted/50'
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
                      className={`text-sm cursor-pointer flex items-center gap-1.5 flex-1 ${
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
        </div>

        {/* Enriched Daily Content (rotates by day type) */}
        {dailyContent ? (
          <EnrichedDailyContent content={dailyContent} />
        ) : (
          <DailyTipCard tip={dailyTip} />
        )}

        {/* Daily Check-in with Emotional Feedback */}
        <DailyCheckinWidget 
          todayCheckin={todayCheckin} 
          onSubmit={submitCheckin} 
        />

        {/* Active Challenge with Countdown */}
        <ActiveChallengeCard 
          challenge={activeChallenge} 
          progress={challengeProgress} 
        />

        {/* Weekly Progress Tracker */}
        <WeeklyProgressTracker progress={weeklyProgress} />

        {/* Navigation Grid */}
        <div className="grid grid-cols-3 gap-3">
          {navCircles.map((item, index) => (
            <Link 
              key={index} 
              to={item.path}
              className="group"
            >
              <div className={`${item.color} rounded-2xl p-4 shadow-card border border-border/30 hover:shadow-hover transition-all hover:-translate-y-0.5 active:scale-[0.98]`}>
                <div 
                  className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center mb-2.5 mx-auto shadow-soft group-hover:scale-105 transition-transform`}
                >
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-center">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Motivational Card */}
        <div className="bg-peach/50 rounded-2xl p-5 border border-peach">
          <p className="text-sm font-medium text-center text-foreground">
            💕 Every meal is a moment of love for {babyName || "your baby"}
          </p>
          <p className="text-xs text-center text-muted-foreground mt-1.5">
            Building healthy habits that last a lifetime
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
