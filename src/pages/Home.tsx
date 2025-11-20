import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Calendar, Heart, TrendingUp, Scan, Bot, 
  ShoppingCart, Users, MessageCircle, BarChart3, 
  Sparkles, ChevronRight, Apple, Droplets, Clock,
  Settings, Bell, HelpCircle, RefreshCw, Lightbulb
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import { useNotifications } from "@/hooks/useNotifications";
import ProgressExplanationDialog from "@/components/ProgressExplanationDialog";
import { toast } from "sonner";

const Home = () => {
  const [motherName, setMotherName] = useState<string>("");
  const [babyName, setBabyName] = useState<string>("");
  const [mealOfTheDay, setMealOfTheDay] = useState(recipes[0]);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [nextMeal, setNextMeal] = useState<{ type: string; recipe: any } | null>(null);
  const [dailyTip, setDailyTip] = useState<string>("");
  const { permission, requestPermission } = useNotifications();

  const getRecipeOfTheDay = () => {
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const weeklyRecipes = [
      "1",  // Sunday: Banana Pancakes
      "2",  // Monday: Sweet Potato & Carrot Puree
      "3",  // Tuesday: Blueberry Oatmeal
      "4",  // Wednesday: Chicken Patties
      "5",  // Thursday: Pasta with Tomato Sauce
      "6",  // Friday: Turkey Meatballs
      "7",  // Saturday: Salmon & Sweet Potato
    ];
    
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
          
          // Animate progress bar from 0
          setTimeout(() => setAnimatedProgress(realProgress), 100);
          
          // Load next scheduled meal
          await loadNextMeal(session.user.id);
          
          // Load daily tip
          await loadDailyTip();
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
    
    const todaysRecipe = getRecipeOfTheDay();
    setMealOfTheDay(todaysRecipe);
  }, []);

  const loadNextMeal = async (userId: string) => {
    try {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      
      const { data } = await supabase
        .from('meal_plans')
        .select('meal_type, recipe_id')
        .eq('user_id', userId)
        .eq('day_of_week', today)
        .eq('prepared', false)
        .order('meal_type', { ascending: true })
        .limit(1)
        .single();

      if (data) {
        const recipe = recipes.find(r => r.id === data.recipe_id);
        if (recipe) {
          setNextMeal({ type: data.meal_type, recipe });
        }
      }
    } catch (error) {
      // No next meal scheduled
    }
  };

  const loadDailyTip = async () => {
    try {
      const { data } = await supabase
        .from('daily_tips')
        .select('tip_text')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        // Pick a tip based on day of year for consistency
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const tipIndex = dayOfYear % data.length;
        setDailyTip(data[tipIndex].tip_text);
      }
    } catch (error) {
      console.error('Error loading daily tip:', error);
    }
  };

  const handleRefreshRecipe = () => {
    const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    setMealOfTheDay(randomRecipe);
    toast.success("Recipe refreshed! Here's a new suggestion.");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (permission === 'default') {
        setShowNotificationBanner(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [permission]);

  const calculateRealProgress = async (userId: string, profile: any) => {
    let totalProgress = 0;
    
    const { data: growthData } = await supabase
      .from('baby_growth')
      .select('*')
      .eq('user_id', userId);
    
    if (growthData && growthData.length > 0) {
      totalProgress += 25;
    }
    
    const { data: mealData } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId);
    
    if (mealData && mealData.length > 0) {
      totalProgress += 25;
    }
    
    if (profile?.mother_name && profile?.baby_name) {
      totalProgress += 25;
    }
    
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
    { icon: BookOpen, label: "Recipes", path: "/recipes", color: "from-primary to-primary/80" },
    { icon: Heart, label: "Favorites", path: "/favorites", color: "from-[#FF6B9D] to-[#FF8BB5]" },
    { icon: Calendar, label: "Planner", path: "/planner", color: "from-secondary to-secondary/80" },
    { icon: Scan, label: "Scanner", path: "/scanner", color: "from-accent to-accent/80" },
    { icon: ShoppingCart, label: "Shopping", path: "/shopping", color: "from-mint to-mint/80" },
  ];

  const features = [
    { icon: TrendingUp, label: "Growth Tracker", path: "/growth", description: "Monitor baby's development" },
    { icon: BarChart3, label: "Progress Reports", path: "/reports", description: "View detailed insights" },
    { icon: Users, label: "Community", path: "/community", description: "Connect with parents" },
    { icon: MessageCircle, label: "Tips & Advice", path: "/advice", description: "Expert guidance" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {showNotificationBanner && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
          <Card className="border-primary/50 bg-gradient-to-r from-primary/10 to-mint/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-mint flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Never Miss a Meal!</h3>
                <p className="text-sm text-muted-foreground">Get daily reminders for baby's nutrition</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={async () => {
                    await requestPermission();
                    setShowNotificationBanner(false);
                  }}
                  className="bg-gradient-to-r from-primary to-mint animate-pulse"
                >
                  Enable
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowNotificationBanner(false)}
                >
                  Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <section className="relative pt-8 pb-6 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-mint/10 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="container max-w-4xl relative z-10">
          <div className="flex justify-end mb-6">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" asChild>
              <Link to="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="text-center space-y-3 mb-8">
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

          <Card className="bg-gradient-to-br from-card via-card/95 to-card/90 border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 backdrop-blur-xl">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Growth Progress</h3>
                    <button
                      onClick={() => setShowProgressDialog(true)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">{growthProgress}%</span>
                </div>
                <Progress value={animatedProgress} className="h-2" />
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">
                    {growthProgress}% Complete
                  </span>
                  <span className="text-primary font-medium">
                    {growthProgress < 100 ? `${100 - growthProgress}% remaining!` : 'Perfect! 🎉'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-mint animate-pulse" />
                  <span>{babyName} is growing beautifully!</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Today's Tasks
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Apple className="w-4 h-4 text-primary" />
                    <span className="text-sm">Breakfast</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Apple className="w-4 h-4 text-secondary" />
                    <span className="text-sm">Lunch</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Apple className="w-4 h-4 text-accent" />
                    <span className="text-sm">Dinner</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Droplets className="w-4 h-4 text-mint" />
                    <span className="text-sm">Hydration</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-6 px-4">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path} className="group">
                <Card 
                  className="border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-card bg-card group-hover:scale-105 h-full animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`}>
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

      <section className="py-6 px-4">
        <div className="container max-w-4xl">
          <Link to="/chat" className="block group">
            <Card className="bg-gradient-to-br from-primary/10 via-mint/10 to-accent/10 border-primary/30 hover:border-primary/50 transition-all duration-500 hover:shadow-elegant group-hover:scale-[1.02]">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-mint flex items-center justify-center">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Ask Bibi AI</h3>
                    <p className="text-sm text-muted-foreground">Get instant nutrition advice</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      <section className="py-6 px-4">
        <div className="container max-w-4xl space-y-6">
          <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg animate-slide-in-bottom" style={{ animationDelay: '400ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Recipe of the Day</h3>
                    <p className="text-xs text-muted-foreground">Perfect for {babyName || "your baby"}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefreshRecipe}
                  className="hover:bg-primary/10"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              
              <Link to={`/recipe/${mealOfTheDay.id}`} className="block group">
                <div className="relative overflow-hidden rounded-xl mb-3">
                  <img 
                    src={mealOfTheDay.image}
                    alt={mealOfTheDay.title}
                    className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="text-white font-semibold text-lg mb-1">{mealOfTheDay.title}</h4>
                    <p className="text-xs text-white/90">{mealOfTheDay.ageGroup}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {mealOfTheDay.prepTime}
                  </span>
                  <span className="text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    View Recipe
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>

          {nextMeal && (
            <Card className="overflow-hidden border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 animate-slide-in-bottom" style={{ animationDelay: '500ms' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-xl">
                    <Calendar className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Next Planned Meal</h3>
                    <p className="text-xs text-muted-foreground">{nextMeal.type}</p>
                  </div>
                </div>
                <Link to={`/recipe/${nextMeal.recipe.id}`} className="block group">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
                    <img 
                      src={nextMeal.recipe.image}
                      alt={nextMeal.recipe.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{nextMeal.recipe.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {nextMeal.recipe.prepTime} • Tap to view
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {dailyTip && (
            <Card className="overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent animate-slide-in-bottom" style={{ animationDelay: '600ms' }}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-accent/20 rounded-xl">
                    <Lightbulb className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Daily Tip</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {dailyTip}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="py-6 px-4 pb-24">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">Explore More</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <Link key={index} to={feature.path} className="group">
                <Card className="border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-card bg-card group-hover:scale-[1.02]">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-mint/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{feature.label}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      <ProgressExplanationDialog 
        open={showProgressDialog}
        onOpenChange={setShowProgressDialog}
      />
    </div>
  );
};

export default Home;
