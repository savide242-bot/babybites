import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [mealOfTheDay, setMealOfTheDay] = useState(recipes[0]);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [dailyTip, setDailyTip] = useState<string>("");

  const getRecipeOfTheDay = () => {
    const dayOfWeek = new Date().getDay();
    const weeklyRecipes = ["1", "2", "3", "4", "5", "6", "7"];
    const todayRecipeId = weeklyRecipes[dayOfWeek];
    return recipes.find(r => r.id === todayRecipeId) || recipes[0];
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('mother_name, baby_name')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setMotherName(profile.mother_name || "");
            setBabyName(profile.baby_name || "");
          }

          // Fetch daily tip
          const { data: tips } = await supabase
            .from('daily_tips')
            .select('tip_text')
            .limit(10);
          
          if (tips && tips.length > 0) {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            setDailyTip(randomTip.tip_text);
          }

          const realProgress = await calculateRealProgress(session.user.id, profile);
          setGrowthProgress(realProgress);
          
          await loadDailyTasks(session.user.id);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
    setMealOfTheDay(getRecipeOfTheDay());
  }, []);

  const loadDailyTasks = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingTasks } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_date', today);

    if (!existingTasks || existingTasks.length === 0) {
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
      setDailyTasks(existingTasks);
    }
  };

  const calculateRealProgress = async (userId: string, profile: any) => {
    let totalProgress = 0;
    
    // 1. Growth Records (20% total)
    const { data: growthData } = await supabase
      .from('baby_growth')
      .select('*')
      .eq('user_id', userId);
    
    if (growthData && growthData.length >= 1) totalProgress += 10; // First record
    if (growthData && growthData.length >= 3) totalProgress += 10; // 3+ records
    
    // 2. Meal Logs (20% total)
    const { data: mealData } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId);
    
    if (mealData && mealData.length >= 1) totalProgress += 10; // First meal
    if (mealData && mealData.length >= 5) totalProgress += 10; // 5+ meals
    
    // 3. Recipes Viewed (20% total)
    const { data: recipeViews } = await supabase
      .from('recipe_views')
      .select('*')
      .eq('user_id', userId);
    
    if (recipeViews && recipeViews.length >= 1) totalProgress += 10; // First view
    if (recipeViews && recipeViews.length >= 10) totalProgress += 10; // 10+ views
    
    // 4. Tasks Completed Today (40% total - highest weight for daily engagement)
    const today = new Date().toISOString().split('T')[0];
    const { data: tasksData } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_date', today)
      .eq('completed', true);
    
    const completedCount = tasksData?.length || 0;
    if (completedCount >= 1) totalProgress += 10; // 1 task
    if (completedCount >= 2) totalProgress += 10; // 2 tasks
    if (completedCount >= 3) totalProgress += 10; // 3 tasks
    if (completedCount >= 4) totalProgress += 10; // All 4 tasks
    
    return totalProgress;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const toggleTask = async (taskId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('daily_tasks')
      .update({ 
        completed: !currentState,
        completed_at: !currentState ? new Date().toISOString() : null 
      })
      .eq('id', taskId);

    if (!error) {
      const updatedTasks = dailyTasks.map(task => 
        task.id === taskId ? { ...task, completed: !currentState } : task
      );
      setDailyTasks(updatedTasks);

      // Check if all 4 tasks are now completed
      const allCompleted = updatedTasks.every(t => t.completed);
      if (allCompleted && !currentState) {
        toast.success("🎉 Amazing! All tasks completed today!", {
          duration: 5000,
        });
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('mother_name, baby_name')
          .eq('id', session.user.id)
          .single();
        
        const newProgress = await calculateRealProgress(session.user.id, profile);
        setGrowthProgress(newProgress);
      }
    }
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {getGreeting()}, {motherName}!
          </h1>
          <p className="text-gray-700 text-lg">
            {babyName}'s plan for today:
          </p>
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
              <CircularProgress value={growthProgress} size={80} strokeWidth={8} />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">Today's Tasks</h3>
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
