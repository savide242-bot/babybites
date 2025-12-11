import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, Utensils, Scale, Ruler, Activity, Sparkles, Calendar, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { z } from "zod";
import { useCountUp } from "@/hooks/useCountUp";
import { format } from "date-fns";

const growthSchema = z.object({
  babyName: z.string().trim().min(1, "Baby name is required").max(100, "Name too long"),
  weight: z.number().positive("Weight must be positive").max(50, "Weight seems too high"),
  height: z.number().positive("Height must be positive").max(150, "Height seems too high"),
  milestone: z.string().max(200, "Milestone too long").optional(),
  notes: z.string().max(1000, "Notes too long").optional(),
});

const mealSchema = z.object({
  babyName: z.string().trim().min(1, "Baby name is required").max(100, "Name too long"),
  mealType: z.string().trim().min(1, "Meal type is required").max(50, "Meal type too long"),
  recipeTitle: z.string().trim().min(1, "Recipe/food is required").max(200, "Title too long"),
  calories: z.number().positive("Calories must be positive").max(10000, "Calories seem too high").optional(),
  protein: z.number().min(0).max(500).optional(),
  carbs: z.number().min(0).max(500).optional(),
  fats: z.number().min(0).max(500).optional(),
});

interface GrowthRecord {
  id: string;
  baby_name: string;
  weight_kg: number;
  height_cm: number;
  milestone: string;
  recorded_at: string;
  notes: string;
}

interface MealLog {
  id: string;
  baby_name: string;
  meal_type: string;
  recipe_title: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  eaten_at: string;
}

const GrowthTracker = () => {
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showNewGrowth, setShowNewGrowth] = useState(false);
  const [showNewMeal, setShowNewMeal] = useState(false);
  const [babyProfile, setBabyProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form states
  const [babyName, setBabyName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [milestone, setMilestone] = useState("");
  const [notes, setNotes] = useState("");
  const [mealType, setMealType] = useState("");
  const [recipeTitle, setRecipeTitle] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  // Stats for animated counters
  const latestWeight = growthRecords.length > 0 ? growthRecords[growthRecords.length - 1].weight_kg : 0;
  const latestHeight = growthRecords.length > 0 ? growthRecords[growthRecords.length - 1].height_cm : 0;
  const totalMeals = mealLogs.length;

  const animatedWeight = useCountUp(latestWeight, 1500);
  const animatedHeight = useCountUp(latestHeight, 1500);

  // BMI calculation
  const bmi = latestWeight > 0 && latestHeight > 0 
    ? (latestWeight / Math.pow(latestHeight / 100, 2)).toFixed(1)
    : "N/A";

  // Weight gain calculation
  const weightGain = growthRecords.length >= 2 
    ? (growthRecords[growthRecords.length - 1].weight_kg - growthRecords[0].weight_kg).toFixed(2)
    : "0";

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      fetchGrowthRecords();
      fetchMealLogs();
      fetchBabyProfile(session.user.id);
    }
  };

  const fetchBabyProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("baby_name")
      .eq("id", userId)
      .single();
    if (data) {
      setBabyProfile(data);
      setBabyName(data.baby_name || "");
    }
  };

  const fetchGrowthRecords = async () => {
    const { data, error } = await supabase
      .from("baby_growth")
      .select("*")
      .order("recorded_at", { ascending: true });

    if (!error) setGrowthRecords(data || []);
  };

  const fetchMealLogs = async () => {
    const { data, error } = await supabase
      .from("meal_logs")
      .select("*")
      .order("eaten_at", { ascending: false })
      .limit(50);

    if (!error) setMealLogs(data || []);
  };

  const handleAddGrowth = async () => {
    const validation = growthSchema.safeParse({
      babyName,
      weight: parseFloat(weight),
      height: parseFloat(height),
      milestone: milestone || undefined,
      notes: notes || undefined,
    });

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("baby_growth").insert({
      baby_name: validation.data.babyName,
      weight_kg: validation.data.weight,
      height_cm: validation.data.height,
      milestone: validation.data.milestone || null,
      notes: validation.data.notes || null,
      recorded_at: new Date().toISOString(),
      user_id: user.id,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add growth record", variant: "destructive" });
      return;
    }

    // Send push notification on successful growth record
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification("🎉 Growth Record Saved!", {
        body: `${validation.data.babyName} is growing! Weight: ${validation.data.weight}kg, Height: ${validation.data.height}cm`,
        icon: "/favicon.ico",
        tag: "growth-saved"
      });
    }

    toast({
      title: "🎉 Growth Record Saved!",
      description: `${validation.data.babyName}'s growth is being tracked beautifully!`,
    });

    setBabyName(babyProfile?.baby_name || "");
    setWeight("");
    setHeight("");
    setMilestone("");
    setNotes("");
    setShowNewGrowth(false);
    fetchGrowthRecords();
  };

  const handleAddMeal = async () => {
    const validation = mealSchema.safeParse({
      babyName,
      mealType,
      recipeTitle,
      calories: calories ? parseInt(calories) : undefined,
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fats: fats ? parseFloat(fats) : undefined,
    });

    if (!validation.success) {
      toast({ title: "Validation Error", description: validation.error.errors[0].message, variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("meal_logs").insert({
      baby_name: validation.data.babyName,
      meal_type: validation.data.mealType,
      recipe_title: validation.data.recipeTitle,
      calories: validation.data.calories || null,
      protein_g: validation.data.protein || null,
      carbs_g: validation.data.carbs || null,
      fats_g: validation.data.fats || null,
      eaten_at: new Date().toISOString(),
      user_id: user.id,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add meal log", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Meal logged successfully!" });
    setBabyName(babyProfile?.baby_name || "");
    setMealType("");
    setRecipeTitle("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");
    setShowNewMeal(false);
    fetchMealLogs();
  };

  // Chart data - smooth mint/cyan gradient like reference
  const growthChartData = growthRecords.map((record) => ({
    date: new Date(record.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: record.weight_kg,
    height: record.height_cm,
  }));

  return (
    <main className="min-h-screen bg-background pt-20 pb-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Clean Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Growth Tracker
          </h1>
          <p className="text-muted-foreground">
            Record {babyProfile?.baby_name || "your baby"}'s growth milestones
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card className="p-4 bg-card border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-mint/20">
                <Scale className="w-5 h-5 text-mint" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Weight</p>
                <p className="text-xl font-bold text-foreground">
                  {animatedWeight.toFixed(1)}<span className="text-sm font-normal ml-0.5">kg</span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-secondary/20">
                <Ruler className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Height</p>
                <p className="text-xl font-bold text-foreground">
                  {animatedHeight.toFixed(1)}<span className="text-sm font-normal ml-0.5">cm</span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/20">
                <Activity className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">BMI</p>
                <p className="text-xl font-bold text-foreground">{bmi}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/20">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gained</p>
                <p className="text-xl font-bold text-foreground">
                  +{weightGain}<span className="text-sm font-normal ml-0.5">kg</span>
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="growth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="growth" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <TrendingUp className="w-4 h-4" />
              Growth
            </TabsTrigger>
            <TabsTrigger value="meals" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Utensils className="w-4 h-4" />
              Nutrition
            </TabsTrigger>
          </TabsList>

          {/* Growth Tab */}
          <TabsContent value="growth" className="space-y-6">
            {/* Add Button */}
            <div className="flex justify-end">
              <Button onClick={() => setShowNewGrowth(!showNewGrowth)} className="gap-2 rounded-xl">
                <Plus className="w-4 h-4" />
                Add Record
              </Button>
            </div>

            {/* New Growth Form */}
            {showNewGrowth && (
              <Card className="p-6 border-mint/30 bg-gradient-to-br from-mint/5 to-transparent animate-in slide-in-from-top-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-mint" />
                  New Growth Record
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="babyName">Baby Name *</Label>
                    <Input id="babyName" value={babyName} onChange={(e) => setBabyName(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg) *</Label>
                    <Input id="weight" type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g., 8.5" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (cm) *</Label>
                    <Input id="height" type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g., 68" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="milestone">Milestone</Label>
                    <Input id="milestone" value={milestone} onChange={(e) => setMilestone(e.target.value)} placeholder="e.g., First tooth" className="mt-1.5" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddGrowth} className="rounded-xl">Save Record</Button>
                  <Button variant="outline" onClick={() => setShowNewGrowth(false)} className="rounded-xl">Cancel</Button>
                </div>
              </Card>
            )}

            {/* Beautiful Growth Chart - Mint theme like reference */}
            {growthRecords.length > 0 ? (
              <Card className="p-6 overflow-hidden border-border/50">
                <h2 className="text-lg font-semibold mb-4">Growth Evolution</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={growthChartData}>
                    <defs>
                      <linearGradient id="mintGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--mint))" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="hsl(var(--mint))" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--mint))"
                      fill="url(#mintGradient)"
                      strokeWidth={3}
                      name="Weight (kg)"
                      dot={{ fill: 'hsl(var(--mint))', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            ) : (
              <Card className="p-8 text-center border-dashed border-2 border-border/50">
                <Scale className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No growth records yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start tracking to see beautiful growth charts</p>
                <Button onClick={() => setShowNewGrowth(true)} className="rounded-xl">
                  Add First Record
                </Button>
              </Card>
            )}

            {/* Recent Records Timeline */}
            {growthRecords.length > 0 && (
              <Card className="p-6 border-border/50">
                <h2 className="text-lg font-semibold mb-4">Recent Records</h2>
                <div className="space-y-3">
                  {growthRecords.slice(-5).reverse().map((record, idx) => (
                    <div key={record.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-mint/20">
                        <Calendar className="w-4 h-4 text-mint" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{format(new Date(record.recorded_at), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.weight_kg}kg • {record.height_cm}cm
                          {record.milestone && ` • ${record.milestone}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="meals" className="space-y-6">
            {/* Add Button */}
            <div className="flex justify-end">
              <Button onClick={() => setShowNewMeal(!showNewMeal)} className="gap-2 rounded-xl">
                <Plus className="w-4 h-4" />
                Log Meal
              </Button>
            </div>

            {/* New Meal Form */}
            {showNewMeal && (
              <Card className="p-6 border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent animate-in slide-in-from-top-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-secondary" />
                  Log New Meal
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mealBabyName">Baby Name *</Label>
                    <Input id="mealBabyName" value={babyName} onChange={(e) => setBabyName(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="mealType">Meal Type *</Label>
                    <select
                      id="mealType"
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full h-10 px-3 mt-1.5 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Select type</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="recipeTitle">Food/Recipe *</Label>
                    <Input id="recipeTitle" value={recipeTitle} onChange={(e) => setRecipeTitle(e.target.value)} placeholder="What did baby eat?" className="mt-1.5" />
                  </div>
                  
                  {/* Prominent Nutrition Fields */}
                  <div className="md:col-span-2 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm font-medium mb-3 text-foreground">Nutrition Information</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label htmlFor="calories" className="text-xs">Calories</Label>
                        <Input id="calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="kcal" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="protein" className="text-xs">Protein (g)</Label>
                        <Input id="protein" type="number" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="g" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="carbs" className="text-xs">Carbs (g)</Label>
                        <Input id="carbs" type="number" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="g" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="fats" className="text-xs">Fats (g)</Label>
                        <Input id="fats" type="number" step="0.1" value={fats} onChange={(e) => setFats(e.target.value)} placeholder="g" className="mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddMeal} className="rounded-xl">Log Meal</Button>
                  <Button variant="outline" onClick={() => setShowNewMeal(false)} className="rounded-xl">Cancel</Button>
                </div>
              </Card>
            )}

            {/* Recent Meals */}
            {mealLogs.length > 0 ? (
              <Card className="p-6 border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Recent Meals</h2>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/progress')} className="text-primary">
                    View Reports <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {mealLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-lg ${
                        log.meal_type === 'Breakfast' ? 'bg-peach/20' :
                        log.meal_type === 'Lunch' ? 'bg-mint/20' :
                        log.meal_type === 'Dinner' ? 'bg-secondary/20' : 'bg-accent/20'
                      }`}>
                        <Utensils className={`w-4 h-4 ${
                          log.meal_type === 'Breakfast' ? 'text-peach' :
                          log.meal_type === 'Lunch' ? 'text-mint' :
                          log.meal_type === 'Dinner' ? 'text-secondary' : 'text-accent'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{log.recipe_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.meal_type} • {format(new Date(log.eaten_at), 'MMM d')}
                          {log.calories && ` • ${log.calories} kcal`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center border-dashed border-2 border-border/50">
                <Utensils className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No meals logged yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start logging meals to track nutrition</p>
                <Button onClick={() => setShowNewMeal(true)} className="rounded-xl">
                  Log First Meal
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default GrowthTracker;
