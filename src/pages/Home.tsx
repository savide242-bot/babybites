import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  BookOpen, Calendar, Heart, TrendingUp, Scan, Bot, 
  Users, MessageCircle, BarChart3, Apple, Droplets, Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import CircularProgress from "@/components/CircularProgress";

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
    
    const { data: growthData } = await supabase
      .from('baby_growth')
      .select('*')
      .eq('user_id', userId);
    
    if (growthData && growthData.length > 0) totalProgress += 25;
    
    const { data: mealData } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId);
    
    if (mealData && mealData.length > 0) totalProgress += 25;
    
    if (profile?.mother_name && profile?.baby_name) totalProgress += 25;
    
    const today = new Date().toISOString().split('T')[0];
    const { data: tasksData } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_date', today)
      .eq('completed', true);
    
    if (tasksData && tasksData.length > 0) totalProgress += 25;
    
    return totalProgress;
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
      setDailyTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, completed: !currentState } : task
        )
      );

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

  const getTaskIcon = (taskType: string) => {
    if (taskType === 'Hydration') return <Droplets className="w-4 h-4" />;
    return <Apple className="w-4 h-4" />;
  };

  const quickActions = [
    { icon: BookOpen, label: "Recipes", path: "/recipes", color: "from-accent to-accent/80" },
    { icon: Heart, label: "Favorites", path: "/favorites", color: "from-primary to-primary/80" },
    { icon: Calendar, label: "Planner", path: "/planner", color: "from-secondary to-secondary/80" },
    { icon: Scan, label: "Scanner", path: "/scanner", color: "from-mint to-mint/80" },
  ];

  const exploreItems = [
    { icon: TrendingUp, label: "Growth Tracker", path: "/growth" },
    { icon: BarChart3, label: "Progress Reports", path: "/reports" },
    { icon: Users, label: "Community", path: "/community" },
    { icon: MessageCircle, label: "Tips & Advice", path: "/advice" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-gradient-to-br from-purple-300 via-pink-200 to-cyan-100 pt-8 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container max-w-4xl relative z-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Hello, {motherName}! 👋
          </h1>
          <p className="text-gray-700 text-lg">
            {babyName}'s plan for today:
          </p>
        </div>
      </header>

      <div className="container max-w-4xl px-4 -mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-lg">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
              <CircularProgress value={growthProgress} size={100} strokeWidth={8} />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-secondary" />
                <h3 className="font-semibold text-sm">Today's Tasks</h3>
              </div>
              <div className="space-y-2">
                {dailyTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <Checkbox
                      id={task.id}
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id, task.completed)}
                      className="data-[state=checked]:bg-secondary"
                    />
                    <label
                      htmlFor={task.id}
                      className={`text-sm flex items-center gap-2 cursor-pointer ${
                        task.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {getTaskIcon(task.task_type)}
                      {task.task_type}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path} className="group">
                <Card className="hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Recipe of the Day</h2>
          <Link to={`/recipe/${mealOfTheDay.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="relative h-40">
                  <img 
                    src={mealOfTheDay.image}
                    alt={mealOfTheDay.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="text-white font-semibold text-lg">{mealOfTheDay.title}</h4>
                  </div>
                </div>
                <div className="p-4">
                  <Button className="w-full bg-gradient-to-r from-accent to-accent/80 text-white">
                    View Recipe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Explore More</h2>
          <div className="space-y-2">
            {exploreItems.map((item, index) => (
              <Link key={index} to={item.path}>
                <Card className="hover:shadow-md transition-all duration-300">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <Link to="/chat" className="fixed bottom-6 right-6 z-50 group">
        <Button 
          size="lg"
          className="rounded-full w-16 h-16 bg-gradient-to-br from-secondary to-mint shadow-glow hover:shadow-2xl transition-all duration-300 hover:scale-110"
        >
          <Bot className="w-8 h-8 text-white" />
        </Button>
      </Link>
    </div>
  );
};

export default Home;
