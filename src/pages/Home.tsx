import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Calendar, Heart, TrendingUp, Scan, Bot, 
  ShoppingCart, Users, MessageCircle, BarChart3, 
  Sparkles, ChevronRight, Apple, Droplets, Moon, Clock,
  Menu, Bell
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";

const Home = () => {
  const [motherName, setMotherName] = useState<string>("");
  const [babyName, setBabyName] = useState<string>("");
  const [mealOfTheDay, setMealOfTheDay] = useState(recipes[0]);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const { permission, requestPermission } = useNotifications();

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

          // Calculate REAL progress based on 4 pillars (25% each)
          const realProgress = await calculateRealProgress(session.user.id, profile);
          setGrowthProgress(realProgress);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
    
    // Random meal of the day
    const randomIndex = Math.floor(Math.random() * recipes.length);
    setMealOfTheDay(recipes[randomIndex]);
  }, []);

  useEffect(() => {
    // Show notification banner after 3 seconds if permission not granted
    const timer = setTimeout(() => {
      if (permission === 'default') {
        setShowNotificationBanner(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [permission]);

  const calculateRealProgress = async (userId: string, profile: any) => {
    let totalProgress = 0;
    
    // 1. Growth Records (25 points)
    const { data: growthData } = await supabase
      .from('baby_growth')
      .select('*')
      .eq('user_id', userId);
    
    if (growthData && growthData.length > 0) {
      totalProgress += 25;
    }
    
    // 2. Meal Logs (25 points)
    const { data: mealData } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId);
    
    if (mealData && mealData.length > 0) {
      totalProgress += 25;
    }
    
    // 3. Profile Complete (25 points)
    if (profile?.mother_name && profile?.baby_name) {
      totalProgress += 25;
    }
    
    // 4. Tasks Completed Today (25 points)
    const today = new Date().toISOString().split('T')[0];
    const { data: tasksData } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_date', today)
      .eq('completed', true);
    
    if (tasksData && tasksData.length > 0) {
      totalProgress += 25;
    }
    
    return totalProgress;
  };

  const quickActions = [
    { icon: BookOpen, label: "Recipes", path: "/recipes", color: "from-primary to-primary-glow" },
    { icon: Calendar, label: "Planner", path: "/planner", color: "from-secondary to-secondary-glow" },
    { icon: Scan, label: "Scanner", path: "/scanner", color: "from-accent to-accent-glow" },
    { icon: ShoppingCart, label: "Shopping", path: "/shopping", color: "from-mint to-mint-glow" },
    { icon: BarChart3, label: "Reports", path: "/reports", color: "from-purple-500 to-purple-600" },
    { icon: Users, label: "Community", path: "/community", color: "from-pink-500 to-rose-500" },
    { icon: Bot, label: "Bibi AI", path: "/chat", color: "from-blue-500 to-indigo-500" },
    { icon: TrendingUp, label: "Growth", path: "/growth", color: "from-green-500 to-emerald-500" },
  ];

  const todaysTasks = [
    { icon: Apple, label: "Breakfast", time: "8:00 AM", done: true },
    { icon: Droplets, label: "Hydration Check", time: "10:00 AM", done: true },
    { icon: Apple, label: "Lunch", time: "12:30 PM", done: false },
    { icon: Moon, label: "Log Nap", time: "2:00 PM", done: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Notification Permission Banner */}
      {showNotificationBanner && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top">
          <Card className="border-primary/50 bg-gradient-to-r from-primary/10 to-mint/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-mint flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Nunca Perca uma Refeição!</h3>
                <p className="text-sm text-muted-foreground">Receba lembretes diários sobre a nutrição do bebê</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={async () => {
                    await requestPermission();
                    setShowNotificationBanner(false);
                  }}
                  className="bg-gradient-to-r from-primary to-mint"
                >
                  Ativar
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowNotificationBanner(false)}
                >
                  Depois
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hero Section with Personalized Greeting */}
      <section className="relative pt-8 pb-6 px-4 overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-mint/10 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className="container max-w-4xl relative z-10">
          {/* Top Bar with Menu */}
          <div className="flex justify-end mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/recipes" className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Recipes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/planner" className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    Meal Planner
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/scanner" className="cursor-pointer">
                    <Scan className="mr-2 h-4 w-4" />
                    Food Scanner
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shopping" className="cursor-pointer">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Shopping List
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/reports" className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Progress Reports
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/community" className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    Community
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/advice" className="cursor-pointer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Tips & Advice
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Personalized Greeting */}
          <div className="text-center space-y-3 animate-fade-in mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 via-mint/20 to-accent/20 rounded-full px-6 py-2 backdrop-blur-sm border border-primary/20">
              <Heart className="w-4 h-4 text-primary animate-pulse" />
              <p className="text-sm font-medium text-foreground">
                Every meal is a milestone 💕
              </p>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Hello, {motherName}! 👋
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light">
              Here's {babyName}'s plan for today
            </p>
          </div>

          {/* Main Progress Panel */}
          <Card className="bg-gradient-to-br from-card via-card/95 to-card/90 border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 backdrop-blur-xl">
            <CardContent className="p-6 space-y-6">
              {/* Growth Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Growth Progress</h3>
                  </div>
                  <span className="text-sm text-muted-foreground">{growthProgress}%</span>
                </div>
                  <Progress value={growthProgress} className="h-2" />
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">
                      {growthProgress}% Completo
                    </span>
                    <span className="text-primary font-medium">
                      {growthProgress < 100 ? `${100 - growthProgress}% restante!` : 'Perfeito! 🎉'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">
                      {growthProgress}% Completo
                    </span>
                    <span className="text-primary font-medium">
                      {growthProgress < 100 ? `${100 - growthProgress}% restante!` : 'Perfeito! 🎉'}
                    </span>
                  </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-mint animate-pulse" />
                  <span>{babyName} is growing beautifully!</span>
                </div>
              </div>

              {/* Nutrition Score */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <div className="text-2xl font-bold text-primary">85%</div>
                  <div className="text-xs text-muted-foreground mt-1">Nutrition</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-mint/10 to-mint/5 border border-mint/20">
                  <div className="text-2xl font-bold text-mint">12</div>
                  <div className="text-xs text-muted-foreground mt-1">Meals</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                  <div className="text-2xl font-bold text-accent">5</div>
                  <div className="text-xs text-muted-foreground mt-1">Days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Meal of the Day */}
      <section className="py-6 px-4">
        <div className="container max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Meal of the Day
            </h2>
            <Link to={`/recipe/${mealOfTheDay.id}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                View Recipe
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <Link to={`/recipe/${mealOfTheDay.id}`}>
            <Card className="group overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-elegant bg-gradient-card hover:scale-[1.02] cursor-pointer">
              <CardContent className="p-0 flex items-center gap-4">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <img
                    src={mealOfTheDay.image}
                    alt={mealOfTheDay.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/10" />
                </div>
                <div className="flex-1 p-4">
                  <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                    {mealOfTheDay.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {mealOfTheDay.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {mealOfTheDay.prepTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {mealOfTheDay.category}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Today's Tasks */}
      <section className="py-6 px-4">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-mint" />
            Today's Tasks
          </h2>

          <div className="space-y-3">
            {todaysTasks.map((task, index) => (
              <Card
                key={index}
                className={`border-border/50 bg-gradient-card transition-all duration-300 hover:shadow-card ${
                  task.done ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    task.done 
                      ? 'bg-mint/20 text-mint' 
                      : 'bg-primary/20 text-primary'
                  }`}>
                    <task.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-foreground ${task.done ? 'line-through' : ''}`}>
                      {task.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">{task.time}</p>
                  </div>
                  {task.done && (
                    <div className="text-mint text-sm font-medium">✓ Done</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="py-6 px-4 pb-20">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Access</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path} className="group">
                <Card className="border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-card bg-gradient-card group-hover:scale-105 h-full">
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Floating CTA */}
      <div className="fixed bottom-24 right-6 z-40 animate-bounce-soft">
        <Link to="/chat">
          <Button
            size="lg"
            className="h-14 rounded-full shadow-elegant hover:shadow-glow bg-gradient-to-r from-primary to-mint hover:from-primary-glow hover:to-mint-glow text-white font-semibold gap-2 px-6"
          >
            <Bot className="w-5 h-5" />
            Chat with Bibi AI
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
