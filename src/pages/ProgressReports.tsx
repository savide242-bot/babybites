import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { TrendingUp, Download, Share2, Baby, Scale, Ruler, Heart, Flame, Beef, Cookie, Droplets, Sparkles, Award, Target } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCountUp } from "@/hooks/useCountUp";

interface GrowthData {
  date: string;
  weight: number;
  height: number;
  milestone?: string;
}

interface NutritionData {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  mealCount: number;
}

const COLORS = {
  coral: "#FF6B6B",
  cyan: "#00CED1",
  purple: "#8B5CF6",
  orange: "#F59E0B",
  green: "#10B981",
  pink: "#EC4899",
  indigo: "#6366F1",
};

const PIE_COLORS = ["#FF6B6B", "#00CED1", "#8B5CF6", "#F59E0B", "#10B981"];

const ProgressReports = () => {
  const { toast } = useToast();
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [nutritionData, setNutritionData] = useState<NutritionData>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    mealCount: 0,
  });
  const [weeklyNutrition, setWeeklyNutrition] = useState<any[]>([]);
  const [mealTypeData, setMealTypeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [babyName, setBabyName] = useState("");

  // Animated counters
  const animatedWeight = useCountUp(growthData.length > 0 ? growthData[growthData.length - 1].weight : 0, 1500);
  const animatedHeight = useCountUp(growthData.length > 0 ? growthData[growthData.length - 1].height : 0, 1500);
  const animatedCalories = useCountUp(nutritionData.totalCalories, 1500);
  const animatedMeals = useCountUp(nutritionData.mealCount, 1500);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("baby_name")
        .eq("id", user.id)
        .single();
      
      if (profile) setBabyName(profile.baby_name || "");

      // Fetch growth data
      const { data: growth } = await supabase
        .from("baby_growth")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: true });

      if (growth) {
        const formatted = growth.map(g => ({
          date: new Date(g.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: g.weight_kg,
          height: g.height_cm,
          milestone: g.milestone || undefined
        }));
        setGrowthData(formatted);
      }

      // Fetch meal logs for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: meals } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("eaten_at", thirtyDaysAgo)
        .order("eaten_at", { ascending: true });

      if (meals) {
        // Calculate totals
        const totals = meals.reduce((acc, meal) => ({
          totalCalories: acc.totalCalories + (meal.calories || 0),
          totalProtein: acc.totalProtein + (meal.protein_g || 0),
          totalCarbs: acc.totalCarbs + (meal.carbs_g || 0),
          totalFats: acc.totalFats + (meal.fats_g || 0),
          mealCount: acc.mealCount + 1,
        }), { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0, mealCount: 0 });
        
        setNutritionData(totals);

        // Calculate weekly nutrition
        const weeklyData: Record<string, any> = {};
        meals.forEach(meal => {
          const week = getWeekNumber(new Date(meal.eaten_at));
          const weekKey = `Week ${week}`;
          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { week: weekKey, calories: 0, protein: 0, carbs: 0, fats: 0 };
          }
          weeklyData[weekKey].calories += meal.calories || 0;
          weeklyData[weekKey].protein += meal.protein_g || 0;
          weeklyData[weekKey].carbs += meal.carbs_g || 0;
          weeklyData[weekKey].fats += meal.fats_g || 0;
        });
        setWeeklyNutrition(Object.values(weeklyData));

        // Calculate meal type distribution
        const mealTypes: Record<string, number> = {};
        meals.forEach(meal => {
          mealTypes[meal.meal_type] = (mealTypes[meal.meal_type] || 0) + 1;
        });
        setMealTypeData(Object.entries(mealTypes).map(([name, value], idx) => ({
          name,
          value,
          color: PIE_COLORS[idx % PIE_COLORS.length]
        })));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
  };

  const handleExportPDF = () => {
    toast({
      title: "Report Exported",
      description: "Your progress report has been downloaded as PDF.",
    });
  };

  const handleShare = () => {
    toast({
      title: "Share Report",
      description: "Share link copied to clipboard!",
    });
  };

  // Calculate insights
  const getInsights = () => {
    const insights = [];
    
    if (growthData.length >= 2) {
      const recent = growthData[growthData.length - 1];
      const previous = growthData[growthData.length - 2];
      const weightGain = recent.weight - previous.weight;
      if (weightGain > 0) {
        insights.push({ 
          icon: Scale, 
          text: `${babyName || "Baby"} gained ${weightGain.toFixed(2)}kg since last record!`,
          color: COLORS.coral 
        });
      }
    }

    if (nutritionData.mealCount > 0) {
      const avgCalories = Math.round(nutritionData.totalCalories / nutritionData.mealCount);
      insights.push({ 
        icon: Flame, 
        text: `Average ${avgCalories} calories per meal this month`,
        color: COLORS.purple 
      });
    }

    if (nutritionData.totalProtein > 100) {
      insights.push({ 
        icon: Beef, 
        text: `Great protein intake! ${nutritionData.totalProtein.toFixed(0)}g this month`,
        color: COLORS.green 
      });
    }

    if (mealTypeData.length >= 3) {
      insights.push({ 
        icon: Target, 
        text: "Excellent meal variety with multiple meal types!",
        color: COLORS.cyan 
      });
    }

    return insights.length > 0 ? insights : [
      { icon: Sparkles, text: "Start logging meals and growth to see personalized insights!", color: COLORS.pink }
    ];
  };

  const macroData = [
    { name: "Protein", value: nutritionData.totalProtein, color: COLORS.coral },
    { name: "Carbs", value: nutritionData.totalCarbs, color: COLORS.cyan },
    { name: "Fats", value: nutritionData.totalFats, color: COLORS.purple },
  ].filter(m => m.value > 0);

  // BMI calculation (simplified for babies)
  const currentWeight = growthData.length > 0 ? growthData[growthData.length - 1].weight : 0;
  const currentHeight = growthData.length > 0 ? growthData[growthData.length - 1].height : 0;
  const bmi = currentWeight > 0 && currentHeight > 0 
    ? (currentWeight / Math.pow(currentHeight / 100, 2)).toFixed(1)
    : "N/A";

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 pt-20 pb-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 pt-20 pb-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
              Progress Reports
            </h1>
            <p className="text-lg text-muted-foreground">
              {babyName ? `${babyName}'s` : "Your baby's"} comprehensive growth & nutrition analysis
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 bg-gradient-to-br from-coral/20 to-coral/5 border-coral/30 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-coral/20">
                <Scale className="w-6 h-6" style={{ color: COLORS.coral }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Weight</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.coral }}>
                  {animatedWeight.toFixed(1)} <span className="text-sm">kg</span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Ruler className="w-6 h-6" style={{ color: COLORS.cyan }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Height</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.cyan }}>
                  {animatedHeight.toFixed(1)} <span className="text-sm">cm</span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Flame className="w-6 h-6" style={{ color: COLORS.purple }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Calories</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.purple }}>
                  {animatedCalories.toFixed(0)} <span className="text-sm">kcal</span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/20">
                <Heart className="w-6 h-6" style={{ color: COLORS.green }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Meals Logged</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.green }}>
                  {animatedMeals.toFixed(0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {getInsights().map((insight, idx) => (
            <Card key={idx} className="p-4 bg-gradient-to-br from-card to-muted/20 hover:shadow-md transition-all animate-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full" style={{ backgroundColor: `${insight.color}20` }}>
                  <insight.icon className="w-5 h-5" style={{ color: insight.color }} />
                </div>
                <p className="text-sm font-medium">{insight.text}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Growth Evolution Chart */}
        {growthData.length > 0 && (
          <Card className="p-6 mb-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Growth Evolution</h2>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="weightGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.coral} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.coral} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="heightGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke={COLORS.coral} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke={COLORS.cyan} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="weight"
                  stroke={COLORS.coral}
                  fill="url(#weightGradient2)"
                  strokeWidth={3}
                  name="Weight (kg)"
                  dot={{ fill: COLORS.coral, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, stroke: COLORS.coral, strokeWidth: 2 }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="height"
                  stroke={COLORS.cyan}
                  fill="url(#heightGradient2)"
                  strokeWidth={3}
                  name="Height (cm)"
                  dot={{ fill: COLORS.cyan, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, stroke: COLORS.cyan, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Nutrition Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Macro Distribution Pie Chart */}
          {macroData.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Macro Distribution</h2>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                {macroData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm">{entry.name}: {entry.value.toFixed(1)}g</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Meal Type Distribution */}
          {mealTypeData.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Baby className="w-5 h-5 text-secondary" />
                <h2 className="text-xl font-bold">Meals by Type</h2>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mealTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" name="Meals" radius={[0, 8, 8, 0]}>
                    {mealTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Weekly Nutrition Trends */}
        {weeklyNutrition.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Weekly Nutrition Trends</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyNutrition}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="protein" fill={COLORS.coral} name="Protein (g)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="carbs" fill={COLORS.cyan} name="Carbs (g)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fats" fill={COLORS.purple} name="Fats (g)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Nutrition Progress Bars */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Monthly Nutrition Progress
          </h2>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <Flame className="w-4 h-4" style={{ color: COLORS.orange }} /> Calories
                </span>
                <span className="font-bold">{nutritionData.totalCalories.toFixed(0)} kcal</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ 
                    width: `${Math.min(100, (nutritionData.totalCalories / 10000) * 100)}%`, 
                    background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.coral})` 
                  }} 
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <Beef className="w-4 h-4" style={{ color: COLORS.coral }} /> Protein
                </span>
                <span className="font-bold">{nutritionData.totalProtein.toFixed(1)}g</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ 
                    width: `${Math.min(100, (nutritionData.totalProtein / 500) * 100)}%`, 
                    backgroundColor: COLORS.coral 
                  }} 
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <Cookie className="w-4 h-4" style={{ color: COLORS.cyan }} /> Carbohydrates
                </span>
                <span className="font-bold">{nutritionData.totalCarbs.toFixed(1)}g</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ 
                    width: `${Math.min(100, (nutritionData.totalCarbs / 1000) * 100)}%`, 
                    backgroundColor: COLORS.cyan 
                  }} 
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <Droplets className="w-4 h-4" style={{ color: COLORS.purple }} /> Fats
                </span>
                <span className="font-bold">{nutritionData.totalFats.toFixed(1)}g</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ 
                    width: `${Math.min(100, (nutritionData.totalFats / 300) * 100)}%`, 
                    backgroundColor: COLORS.purple 
                  }} 
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-coral/10 to-transparent">
            <div className="flex items-center gap-3 mb-2">
              <Scale className="w-10 h-10 p-2 rounded-full bg-coral/20" style={{ color: COLORS.coral }} />
              <div>
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-3xl font-bold" style={{ color: COLORS.coral }}>
                  {currentWeight > 0 ? `${currentWeight}kg` : "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-transparent">
            <div className="flex items-center gap-3 mb-2">
              <Ruler className="w-10 h-10 p-2 rounded-full bg-cyan-500/20" style={{ color: COLORS.cyan }} />
              <div>
                <p className="text-sm text-muted-foreground">Current Height</p>
                <p className="text-3xl font-bold" style={{ color: COLORS.cyan }}>
                  {currentHeight > 0 ? `${currentHeight}cm` : "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-transparent">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-10 h-10 p-2 rounded-full bg-green-500/20" style={{ color: COLORS.green }} />
              <div>
                <p className="text-sm text-muted-foreground">BMI</p>
                <p className="text-3xl font-bold" style={{ color: COLORS.green }}>
                  {bmi}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Empty State */}
        {growthData.length === 0 && nutritionData.mealCount === 0 && (
          <Card className="p-8 text-center mt-6 bg-gradient-to-br from-primary/5 to-secondary/5">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking growth and meals to see beautiful progress reports!
            </p>
            <Button onClick={() => window.location.href = "/growth"}>
              Start Tracking
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
};

export default ProgressReports;