import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, Utensils, Scale, Ruler, Activity, Flame, Beef, Cookie, Droplets, Trophy, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { z } from "zod";
import { useCountUp } from "@/hooks/useCountUp";

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

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  coral: "#FF6B6B",
  cyan: "#00CED1",
  purple: "#8B5CF6",
  orange: "#F59E0B",
  green: "#10B981",
  pink: "#EC4899",
};

const PIE_COLORS = ["#FF6B6B", "#00CED1", "#8B5CF6", "#F59E0B", "#10B981"];

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
  const totalCalories = mealLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const totalProtein = mealLogs.reduce((sum, log) => sum + (log.protein_g || 0), 0);
  const totalCarbs = mealLogs.reduce((sum, log) => sum + (log.carbs_g || 0), 0);
  const totalFats = mealLogs.reduce((sum, log) => sum + (log.fats_g || 0), 0);

  const animatedWeight = useCountUp(latestWeight, 1500);
  const animatedHeight = useCountUp(latestHeight, 1500);
  const animatedCalories = useCountUp(totalCalories, 1500);
  const animatedProtein = useCountUp(totalProtein, 1500);

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

  // Chart data transformations
  const growthChartData = growthRecords.map((record) => ({
    date: new Date(record.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: record.weight_kg,
    height: record.height_cm,
  }));

  const macroDistribution = [
    { name: "Protein", value: totalProtein, color: PIE_COLORS[0] },
    { name: "Carbs", value: totalCarbs, color: PIE_COLORS[1] },
    { name: "Fats", value: totalFats, color: PIE_COLORS[2] },
  ].filter(m => m.value > 0);

  const mealTypeDistribution = mealLogs.reduce((acc, log) => {
    acc[log.meal_type] = (acc[log.meal_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mealTypeData = Object.entries(mealTypeDistribution).map(([type, count]) => ({
    type,
    count,
  }));

  // Calculate BMI for babies (simplified)
  const bmi = latestWeight > 0 && latestHeight > 0 
    ? (latestWeight / Math.pow(latestHeight / 100, 2)).toFixed(1)
    : "N/A";

  // Weight gain calculation
  const weightGain = growthRecords.length >= 2 
    ? (growthRecords[growthRecords.length - 1].weight_kg - growthRecords[0].weight_kg).toFixed(2)
    : "0";

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 pt-20 pb-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
            Growth & Nutrition Tracker
          </h1>
          <p className="text-lg text-muted-foreground">
            Beautiful insights into {babyProfile?.baby_name || "your baby"}'s development
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-coral/20 to-coral/5 border-coral/30 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-coral/20">
                <Scale className="w-6 h-6 text-coral" style={{ color: CHART_COLORS.coral }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Weight</p>
                <p className="text-2xl font-bold" style={{ color: CHART_COLORS.coral }}>
                  {animatedWeight.toFixed(1)} <span className="text-sm">kg</span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Ruler className="w-6 h-6" style={{ color: CHART_COLORS.cyan }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Height</p>
                <p className="text-2xl font-bold" style={{ color: CHART_COLORS.cyan }}>
                  {animatedHeight.toFixed(1)} <span className="text-sm">cm</span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Flame className="w-6 h-6" style={{ color: CHART_COLORS.purple }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Calories</p>
                <p className="text-2xl font-bold" style={{ color: CHART_COLORS.purple }}>
                  {animatedCalories.toFixed(0)} <span className="text-sm">kcal</span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/20">
                <Activity className="w-6 h-6" style={{ color: CHART_COLORS.green }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">BMI</p>
                <p className="text-2xl font-bold" style={{ color: CHART_COLORS.green }}>
                  {bmi}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="growth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="growth" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Growth Charts
            </TabsTrigger>
            <TabsTrigger value="meals" className="gap-2">
              <Utensils className="w-4 h-4" />
              Nutrition
            </TabsTrigger>
          </TabsList>

          {/* Growth Tab */}
          <TabsContent value="growth" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Total weight gain: <span className="font-bold text-primary">+{weightGain}kg</span>
                </span>
              </div>
              <Button onClick={() => setShowNewGrowth(!showNewGrowth)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Growth Record
              </Button>
            </div>

            {showNewGrowth && (
              <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-in slide-in-from-top-4">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  New Growth Record
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="babyName">Baby Name *</Label>
                    <Input id="babyName" value={babyName} onChange={(e) => setBabyName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg) *</Label>
                    <Input id="weight" type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g., 8.5" />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (cm) *</Label>
                    <Input id="height" type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g., 68" />
                  </div>
                  <div>
                    <Label htmlFor="milestone">Milestone</Label>
                    <Input id="milestone" value={milestone} onChange={(e) => setMilestone(e.target.value)} placeholder="e.g., First tooth, crawling" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddGrowth}>Save Record</Button>
                  <Button variant="outline" onClick={() => setShowNewGrowth(false)}>Cancel</Button>
                </div>
              </Card>
            )}

            {/* Beautiful Growth Chart */}
            {growthRecords.length > 0 && (
              <Card className="p-6 overflow-hidden">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Growth Evolution
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={growthChartData}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.coral} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.coral} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="heightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke={CHART_COLORS.coral} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke={CHART_COLORS.cyan} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      stroke={CHART_COLORS.coral}
                      fill="url(#weightGradient)"
                      strokeWidth={3}
                      name="Weight (kg)"
                      dot={{ fill: CHART_COLORS.coral, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: CHART_COLORS.coral, strokeWidth: 2 }}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="height"
                      stroke={CHART_COLORS.cyan}
                      fill="url(#heightGradient)"
                      strokeWidth={3}
                      name="Height (cm)"
                      dot={{ fill: CHART_COLORS.cyan, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: CHART_COLORS.cyan, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Growth Records Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Growth Timeline</h3>
              {growthRecords.slice().reverse().map((record, idx) => (
                <Card key={record.id} className="p-4 hover:shadow-md transition-all animate-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {record.baby_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold">{record.baby_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.recorded_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex gap-4">
                      <div className="px-3 py-1 rounded-full bg-coral/10" style={{ color: CHART_COLORS.coral }}>
                        <span className="font-bold">{record.weight_kg}</span> kg
                      </div>
                      <div className="px-3 py-1 rounded-full bg-cyan-500/10" style={{ color: CHART_COLORS.cyan }}>
                        <span className="font-bold">{record.height_cm}</span> cm
                      </div>
                    </div>
                  </div>
                  {record.milestone && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">Milestone:</span> {record.milestone}
                    </div>
                  )}
                  {record.notes && <p className="mt-2 text-sm text-muted-foreground">{record.notes}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Meals/Nutrition Tab */}
          <TabsContent value="meals" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowNewMeal(!showNewMeal)} className="gap-2">
                <Plus className="w-4 h-4" />
                Log Meal
              </Button>
            </div>

            {showNewMeal && (
              <Card className="p-6 border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent animate-in slide-in-from-top-4">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-secondary" />
                  Log New Meal
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="mealBabyName">Baby Name *</Label>
                    <Input id="mealBabyName" value={babyName} onChange={(e) => setBabyName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="mealType">Meal Type *</Label>
                    <Input id="mealType" value={mealType} onChange={(e) => setMealType(e.target.value)} placeholder="Breakfast, Lunch, Snack..." />
                  </div>
                  <div>
                    <Label htmlFor="recipeTitle">Recipe/Food *</Label>
                    <Input id="recipeTitle" value={recipeTitle} onChange={(e) => setRecipeTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="calories" className="flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Calories
                    </Label>
                    <Input id="calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="e.g., 150" />
                  </div>
                  <div>
                    <Label htmlFor="protein" className="flex items-center gap-1">
                      <Beef className="w-3 h-3" /> Protein (g)
                    </Label>
                    <Input id="protein" type="number" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="e.g., 8" />
                  </div>
                  <div>
                    <Label htmlFor="carbs" className="flex items-center gap-1">
                      <Cookie className="w-3 h-3" /> Carbs (g)
                    </Label>
                    <Input id="carbs" type="number" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="e.g., 20" />
                  </div>
                  <div>
                    <Label htmlFor="fats" className="flex items-center gap-1">
                      <Droplets className="w-3 h-3" /> Fats (g)
                    </Label>
                    <Input id="fats" type="number" step="0.1" value={fats} onChange={(e) => setFats(e.target.value)} placeholder="e.g., 5" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddMeal}>Save Meal</Button>
                  <Button variant="outline" onClick={() => setShowNewMeal(false)}>Cancel</Button>
                </div>
              </Card>
            )}

            {/* Macros Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart - Macro Distribution */}
              {macroDistribution.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Macro Distribution
                  </h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={macroDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {macroDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-4">
                    {macroDistribution.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm">{entry.name}: {entry.value.toFixed(1)}g</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Bar Chart - Meal Types */}
              {mealTypeData.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-secondary" />
                    Meals by Type
                  </h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={mealTypeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill={CHART_COLORS.purple} radius={[8, 8, 0, 0]} name="Meals" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>

            {/* Macro Progress Bars */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Nutritional Summary (Last 50 meals)</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-2"><Beef className="w-4 h-4" style={{ color: PIE_COLORS[0] }} /> Protein</span>
                    <span className="font-bold">{totalProtein.toFixed(1)}g</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (totalProtein / 100) * 100)}%`, backgroundColor: PIE_COLORS[0] }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-2"><Cookie className="w-4 h-4" style={{ color: PIE_COLORS[1] }} /> Carbohydrates</span>
                    <span className="font-bold">{totalCarbs.toFixed(1)}g</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (totalCarbs / 200) * 100)}%`, backgroundColor: PIE_COLORS[1] }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-2"><Droplets className="w-4 h-4" style={{ color: PIE_COLORS[2] }} /> Fats</span>
                    <span className="font-bold">{totalFats.toFixed(1)}g</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (totalFats / 50) * 100)}%`, backgroundColor: PIE_COLORS[2] }} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Meal Logs List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Meals</h3>
              {mealLogs.map((log, idx) => (
                <Card key={log.id} className="p-4 hover:shadow-md transition-all animate-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 30}ms` }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{log.recipe_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {log.meal_type} • {new Date(log.eaten_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {log.calories && (
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-500/10" style={{ color: CHART_COLORS.purple }}>
                          {log.calories} kcal
                        </span>
                      )}
                      {log.protein_g && (
                        <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: `${PIE_COLORS[0]}20`, color: PIE_COLORS[0] }}>
                          {log.protein_g}g protein
                        </span>
                      )}
                      {log.carbs_g && (
                        <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: `${PIE_COLORS[1]}20`, color: PIE_COLORS[1] }}>
                          {log.carbs_g}g carbs
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {growthRecords.length === 0 && mealLogs.length === 0 && (
          <Card className="p-8 text-center mt-6 bg-gradient-to-br from-primary/5 to-secondary/5">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold mb-2">Start Tracking Today!</h3>
            <p className="text-muted-foreground mb-4">
              Add your first growth record or meal to see beautiful charts and insights.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowNewGrowth(true)}>Add Growth Record</Button>
              <Button variant="outline" onClick={() => setShowNewMeal(true)}>Log First Meal</Button>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
};

export default GrowthTracker;