import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, Calendar, Heart, TrendingUp, Scan, Bot, 
  BarChart3, Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import CircularProgress from "@/components/CircularProgress";
import { toast } from "sonner";

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
  const [dailyTip, setDailyTip] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Instant greeting calculation (no DB needed)
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Instant recipe of the day (no DB needed)
  const mealOfTheDay = useMemo(() => {
    const dayOfWeek = new Date().getDay();
    const weeklyRecipes = ["1", "2", "3", "4", "5", "6", "7"];
    const todayRecipeId = weeklyRecipes[dayOfWeek];
    return recipes.find(r => r.id === todayRecipeId) || recipes[0];
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

        // Fetch ALL data in parallel for instant loading
        const [profileResult, tipsResult, existingTasksResult, growthResult, mealsResult, viewsResult, todayTasksResult] = await Promise.all([
          supabase.from('profiles').select('mother_name, baby_name').eq('id', userId).single(),
          supabase.from('daily_tips').select('tip_text').limit(10),
          supabase.from('daily_tasks').select('*').eq('user_id', userId).eq('task_date', today),
          supabase.from('baby_growth').select('id').eq('user_id', userId),
          supabase.from('meal_logs').select('id').eq('user_id', userId),
          supabase.from('recipe_views').select('id').eq('user_id', userId),
          supabase.from('daily_tasks').select('id').eq('user_id', userId).eq('task_date', today).eq('completed', true)
        ]);

        // Set profile data immediately
        if (profileResult.data) {
          setMotherName(profileResult.data.mother_name || "");
          setBabyName(profileResult.data.baby_name || "");
        }

        // Set random daily tip
        if (tipsResult.data && tipsResult.data.length > 0) {
          const randomTip = tipsResult.data[Math.floor(Math.random() * tipsResult.data.length)];
          setDailyTip(randomTip.tip_text);
        }

        // Handle tasks - create if needed
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

        // Calculate progress from parallel results
        let totalProgress = 0;
        
        // Growth Records (20% total)
        const growthCount = growthResult.data?.length || 0;
        if (growthCount >= 1) totalProgress += 10;
        if (growthCount >= 3) totalProgress += 10;
        
        // Meal Logs (20% total)
        const mealCount = mealsResult.data?.length || 0;
        if (mealCount >= 1) totalProgress += 10;
        if (mealCount >= 5) totalProgress += 10;
        
        // Recipe Views (20% total)
        const viewsCount = viewsResult.data?.length || 0;
        if (viewsCount >= 1) totalProgress += 10;
        if (viewsCount >= 10) totalProgress += 10;
        
        // Tasks Completed Today (40% total)
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
    // Optimistic update
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
      // Revert on error
      setDailyTasks(dailyTasks);
      return;
    }

    // Check if all 4 tasks are now completed
    const allCompleted = updatedTasks.every(t => t.completed);
    if (allCompleted && !currentState) {
      toast.success("🎉 Amazing! All tasks completed today!", {
        duration: 5000,
      });
    }

    // Update progress
    const completedCount = updatedTasks.filter(t => t.completed).length;
    setGrowthProgress(prev => {
      let newProgress = prev;
      // Recalculate task portion (40% of progress)
      const taskProgress = Math.min(completedCount, 4) * 10;
      // Keep other progress and update task portion
      return Math.min(100, 60 + taskProgress); // Max 60% from other sources + up to 40% from tasks
    });
  };

  const quickActions = [
    { icon: BookOpen, label: "Recipes", path: "/recipes", bgColor: "bg-purple-500" },
    { icon: Heart, label: "Favorites", path: "/favorites", bgColor: "bg-pink-400" },
    { icon: Calendar, label: "Planner", path: "/planner", bgColor: "bg-cyan-400" },
    { icon: Scan, label: "Scanner", path: "/scanner", bgColor: "bg-teal-400" },
  ];

  const exploreItems = [
    { icon: TrendingUp, label: "Growth Tracker", path: "/growth" },
    { icon: BarChart3, label: "Progress Reports", path: "/reports" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-gradient-to-br from-purple-300 via-pink-200 to-cyan-100 pt-8 pb-6 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container max-w-4xl relative z-10">
          {isLoading ? (
            <>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-6 w-48" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {greeting}, {motherName || "Mom"}! 👋
              </h1>
              <p className="text-gray-700 text-lg">
                {babyName ? `${babyName}'s` : "Baby's"} plan for today:
              </p>
            </>
          )}
          {dailyTip && (
            <p className="text-gray-700 text-sm mt-2 italic opacity-90">💡 {dailyTip}</p>
          )}
        </div>
      </header>

      <div className="container max-w-4xl px-4 mt-4 space-y-6">
        {/* Top Row: Growth Progress + Today's Tasks */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-lg">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <h3 className="text-sm font-semibold text-foreground mb-3">Growth Progress</h3>
              {isLoading ? (
                <Skeleton className="h-20 w-20 rounded-full" />
              ) : (
                <CircularProgress value={growthProgress} size={80} strokeWidth={8} />
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">Today's Tasks</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-5 w-full" />
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
                        className="data-[state=checked]:bg-cyan-400"
                      />
                      <label
                        htmlFor={task.id}
                        className={`text-sm cursor-pointer ${
                          task.completed ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {task.task_type}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout: Left (Quick Access + Explore More) + Right (Recipe of the Day) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Quick Access Section */}
            <section>
              <h2 className="text-base font-bold text-foreground mb-2">Quick Access</h2>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <Link key={index} to={action.path}>
                    <button 
                      className={`${action.bgColor} w-full h-20 rounded-2xl flex flex-col items-center justify-center gap-1 text-white hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-md`}
                    >
                      <action.icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{action.label}</span>
                    </button>
                  </Link>
                ))}
              </div>
            </section>

            {/* Explore More Section */}
            <section>
              <h2 className="text-base font-bold text-foreground mb-2">Explore More</h2>
              <div className="space-y-1">
                {exploreItems.map((item, index) => (
                  <Link key={index} to={item.path}>
                    <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="font-medium text-foreground text-xs">{item.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Recipe of the Day */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">Recipe of the Day</h2>
            <Link to={`/recipe/${mealOfTheDay.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative h-32">
                  <img 
                    src={mealOfTheDay.image}
                    alt={mealOfTheDay.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {mealOfTheDay.prepTime}
                  </div>
                </div>
                <CardContent className="p-3 space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">{mealOfTheDay.title}</h3>
                  <Button className="w-full bg-purple-300 hover:bg-purple-400 text-white text-sm py-2">
                    View Recipe
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </section>
        </div>
      </div>

      {/* Floating Ask BibiAI Button */}
      <Link to="/chat" className="fixed bottom-6 left-6 z-50">
        <Button 
          className="bg-cyan-400 hover:bg-cyan-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          <Bot className="w-5 h-5" />
          <span className="font-medium">Ask BibiAI</span>
        </Button>
      </Link>
    </div>
  );
};

export default Home;
