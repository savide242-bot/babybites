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
    { icon: BookOpen, label: "Recipes", path: "/recipes", bg: "from-rose-400 to-pink-500", emoji: "🍳" },
    { icon: Heart, label: "Favorites", path: "/favorites", bg: "from-red-400 to-rose-500", emoji: "❤️" },
    { icon: Calendar, label: "Planner", path: "/planner", bg: "from-violet-400 to-purple-500", emoji: "📅" },
    { icon: Scan, label: "Food AI", path: "/scanner", bg: "from-cyan-400 to-teal-500", emoji: "🔍" },
    { icon: Bot, label: "Ask Bibi", path: "/chat", bg: "from-amber-400 to-orange-500", emoji: "💬" },
    { icon: TrendingUp, label: "Growth", path: "/growth", bg: "from-emerald-400 to-green-500", emoji: "📈" },
  ];

  const taskEmojis: { [key: string]: string } = {
    'Breakfast': '🌅',
    'Lunch': '☀️',
    'Dinner': '🌙',
    'Hydration': '💧'
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="bg-gradient-to-br from-primary via-accent to-secondary p-4 pb-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        </div>
        
        <div className="relative z-10 max-w-lg mx-auto">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
              <div>
                <Skeleton className="h-5 w-32 bg-white/20 mb-1" />
                <Skeleton className="h-3 w-24 bg-white/20" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-xl">
                {emoji}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {greeting}, {motherName || "Mom"}!
                </h1>
                <p className="text-white/80 text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {emotionalMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-3 space-y-4 pb-6">
        {/* Stats Bar */}
        <div className="flex justify-center gap-3">
          <div className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-full shadow-md border">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-sm text-orange-600">{streak?.current_streak || 0}</span>
            <span className="text-[10px] text-muted-foreground">days</span>
          </div>
          <div className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-full shadow-md border">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-sm text-amber-600">{streak?.total_points || 0}</span>
            <span className="text-[10px] text-muted-foreground">pts</span>
          </div>
        </div>

        {/* Progress & Tasks */}
        <div className="grid grid-cols-5 gap-3">
          {/* Progress */}
          <div className="col-span-2 bg-card rounded-2xl p-3 shadow-md border flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium text-muted-foreground mb-1">Progress</span>
            {isLoading ? (
              <Skeleton className="h-14 w-14 rounded-full" />
            ) : (
              <CircularProgress value={growthProgress} size={56} strokeWidth={5} />
            )}
          </div>

          {/* Tasks */}
          <div className="col-span-3 bg-card rounded-2xl p-3 shadow-md border">
            <span className="text-[10px] font-medium text-muted-foreground mb-2 block">Today</span>
            {isLoading ? (
              <div className="space-y-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {dailyTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <Checkbox
                      id={task.id}
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id, task.completed)}
                      className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor={task.id}
                      className={`text-xs cursor-pointer flex items-center gap-1 ${
                        task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      <span className="text-[10px]">{taskEmojis[task.task_type]}</span>
                      {task.task_type}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-3 gap-3">
          {navCircles.map((item, index) => (
            <Link 
              key={index} 
              to={item.path}
              className="group"
            >
              <div className="bg-card rounded-2xl p-3 shadow-md border hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95">
                <div 
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.bg} flex items-center justify-center mb-2 mx-auto shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-center text-foreground">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Motivational Card */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-2xl p-4 border border-primary/20">
          <p className="text-sm font-medium text-center text-foreground/80">
            💕 Every meal is a moment of love for {babyName || "your baby"}
          </p>
          <p className="text-[10px] text-center text-muted-foreground mt-1">
            Building healthy habits that last a lifetime
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
