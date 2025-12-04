import { useEffect, useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, Calendar, Heart, TrendingUp, Scan, Bot, 
  Flame, Star
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

  // Emotional greeting based on time
  const { greeting, emotionalMessage } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { 
      greeting: "Good morning", 
      emotionalMessage: "You're doing amazing! 💕" 
    };
    if (hour < 18) return { 
      greeting: "Good afternoon", 
      emotionalMessage: "Keep up the great work! 🌟" 
    };
    return { 
      greeting: "Good evening", 
      emotionalMessage: "Rest well tonight! 🌙" 
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
      toast.success("🎉 Amazing! All tasks completed today!", { duration: 5000 });
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

  // Emotional circular navigation
  const navCircles = [
    { icon: BookOpen, label: "Recipes", path: "/recipes", gradient: "from-pink-400 to-rose-500", emoji: "🍳" },
    { icon: Heart, label: "Favorites", path: "/favorites", gradient: "from-red-400 to-pink-500", emoji: "❤️" },
    { icon: Calendar, label: "Planner", path: "/planner", gradient: "from-purple-400 to-indigo-500", emoji: "📅" },
    { icon: Scan, label: "Food AI", path: "/scanner", gradient: "from-cyan-400 to-teal-500", emoji: "🤖" },
    { icon: Bot, label: "Ask Bibi", path: "/chat", gradient: "from-amber-400 to-orange-500", emoji: "💬" },
    { icon: TrendingUp, label: "Growth", path: "/growth", gradient: "from-green-400 to-emerald-500", emoji: "📈" },
  ];

  const taskEmojis: { [key: string]: string } = {
    'Breakfast': '🍳',
    'Lunch': '🥗',
    'Dinner': '🍽️',
    'Hydration': '💧'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-cyan-50 dark:from-background dark:via-background dark:to-background overflow-hidden">
      {/* Emotional Header */}
      <header className="bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 pt-6 pb-5 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-300/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl" />
        </div>
        
        <div className="container max-w-4xl relative z-10 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-8 w-48 bg-white/30" />
              <Skeleton className="h-5 w-36 bg-white/30" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-md">
                {greeting}, {motherName || "Mom"}! 👋
              </h1>
              <p className="text-white/90 text-sm font-medium">
                {babyName ? `${babyName} is growing beautifully!` : "Your baby is growing beautifully!"} {emotionalMessage}
              </p>
            </>
          )}
        </div>
      </header>

      <div className="container max-w-4xl px-4 py-4 space-y-4">
        {/* Streak & Points Mini Bar */}
        <div className="flex justify-center gap-6 py-2">
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 px-4 py-2 rounded-full shadow-sm">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-orange-600 dark:text-orange-400">{streak?.current_streak || 0}</span>
            <span className="text-xs text-orange-500/80">days</span>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 rounded-full shadow-sm">
            <Star className="w-5 h-5 text-purple-500" />
            <span className="font-bold text-purple-600 dark:text-purple-400">{streak?.total_points || 0}</span>
            <span className="text-xs text-purple-500/80">pts</span>
          </div>
        </div>

        {/* Progress + Tasks Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Progress Circle */}
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center border border-pink-100 dark:border-border">
            <span className="text-xs font-semibold text-muted-foreground mb-2">Baby Progress</span>
            {isLoading ? (
              <Skeleton className="h-16 w-16 rounded-full" />
            ) : (
              <CircularProgress value={growthProgress} size={70} strokeWidth={7} />
            )}
          </div>

          {/* Mini Tasks */}
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-cyan-100 dark:border-border">
            <span className="text-xs font-semibold text-muted-foreground mb-2 block">Today's Tasks</span>
            {isLoading ? (
              <div className="space-y-1">
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
                      className="h-4 w-4 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-400 data-[state=checked]:to-cyan-400"
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
        </div>

        {/* Emotional Navigation Circles */}
        <div className="py-2">
          <div className="grid grid-cols-3 gap-4">
            {navCircles.map((item, index) => (
              <Link 
                key={index} 
                to={item.path}
                className="flex flex-col items-center gap-2 group"
              >
                <div 
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-active:scale-95`}
                  style={{
                    animation: `pulse 3s ease-in-out ${index * 0.2}s infinite`
                  }}
                >
                  <item.icon className="w-7 h-7 text-white drop-shadow-sm" />
                </div>
                <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Emotional Message Card */}
        <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-cyan-100 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-cyan-900/20 rounded-2xl p-4 text-center shadow-md border border-white/50 dark:border-border">
          <p className="text-sm font-medium text-foreground/80">
            💝 Every meal is a moment of love for {babyName || "your baby"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You're building healthy habits that last a lifetime!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
