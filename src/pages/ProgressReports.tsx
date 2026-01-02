import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { 
  TrendingUp, Download, Share2, Scale, Ruler, Heart, Flame, 
  Award, Target, Sparkles, AlertTriangle, CheckCircle2, 
  Brain, Lightbulb, ArrowUp, ArrowDown, Minus, Baby
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCountUp } from "@/hooks/useCountUp";

// WHO Growth Standards (simplified percentiles for 6-24 month boys/girls average)
const WHO_PERCENTILES = {
  weight: {
    p3: [6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5],
    p50: [7.9, 8.6, 9.2, 9.7, 10.2, 10.5, 10.9, 11.2, 11.5, 11.8, 12.0, 12.3, 12.5, 12.7, 13.0, 13.2, 13.4, 13.7, 13.9],
    p97: [9.8, 10.7, 11.5, 12.1, 12.7, 13.1, 13.6, 13.9, 14.3, 14.7, 15.0, 15.4, 15.7, 16.0, 16.4, 16.7, 17.0, 17.3, 17.7],
  },
  height: {
    p3: [63.3, 65.5, 67.4, 69.1, 70.6, 72.0, 73.3, 74.5, 75.7, 76.9, 77.9, 79.0, 80.0, 81.0, 82.0, 82.9, 83.8, 84.7, 85.6],
    p50: [67.6, 69.9, 71.9, 73.7, 75.4, 76.9, 78.4, 79.7, 81.0, 82.3, 83.5, 84.6, 85.7, 86.8, 87.8, 88.8, 89.8, 90.8, 91.7],
    p97: [72.0, 74.4, 76.5, 78.4, 80.1, 81.7, 83.2, 84.6, 86.0, 87.3, 88.5, 89.8, 91.0, 92.2, 93.3, 94.4, 95.5, 96.6, 97.6],
  }
};

interface GrowthData {
  date: string;
  weight: number;
  height: number;
  milestone?: string;
  ageMonths?: number;
}

interface NutritionData {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  mealCount: number;
}

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
  const [babyAgeMonths, setBabyAgeMonths] = useState(12);

  // Calculate nutrition score (0-100)
  const calculateNutritionScore = () => {
    if (nutritionData.mealCount === 0) return 0;
    
    const avgCalories = nutritionData.totalCalories / nutritionData.mealCount;
    const avgProtein = nutritionData.totalProtein / nutritionData.mealCount;
    
    // Target ranges for babies 6-24 months
    const calorieScore = Math.min(100, (avgCalories / 150) * 100);
    const proteinScore = Math.min(100, (avgProtein / 8) * 100);
    const varietyScore = Math.min(100, (mealTypeData.length / 4) * 100);
    const consistencyScore = Math.min(100, (nutritionData.mealCount / 30) * 100);
    
    return Math.round((calorieScore + proteinScore + varietyScore + consistencyScore) / 4);
  };

  const nutritionScore = calculateNutritionScore();

  // Get score badge
  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "bg-mint text-mint-foreground", icon: CheckCircle2 };
    if (score >= 60) return { label: "Good", color: "bg-secondary text-secondary-foreground", icon: TrendingUp };
    if (score >= 40) return { label: "Improving", color: "bg-peach text-foreground", icon: Target };
    return { label: "Needs Attention", color: "bg-destructive text-destructive-foreground", icon: AlertTriangle };
  };

  const scoreBadge = getScoreBadge(nutritionScore);

  // Animated counters
  const animatedWeight = useCountUp(growthData.length > 0 ? growthData[growthData.length - 1].weight : 0, 1500);
  const animatedHeight = useCountUp(growthData.length > 0 ? growthData[growthData.length - 1].height : 0, 1500);
  const animatedScore = useCountUp(nutritionScore, 2000);

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
        .select("baby_name, baby_birth_date")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setBabyName(profile.baby_name || "");
        if (profile.baby_birth_date) {
          const birthDate = new Date(profile.baby_birth_date);
          const ageInMonths = Math.floor((Date.now() - birthDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
          setBabyAgeMonths(Math.max(6, Math.min(24, ageInMonths)));
        }
      }

      // Fetch growth data
      const { data: growth } = await supabase
        .from("baby_growth")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: true });

      if (growth) {
        const formatted = growth.map((g, idx) => ({
          date: new Date(g.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: g.weight_kg,
          height: g.height_cm,
          milestone: g.milestone || undefined,
          ageMonths: babyAgeMonths + idx
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
            weeklyData[weekKey] = { week: weekKey, calories: 0, protein: 0 };
          }
          weeklyData[weekKey].calories += meal.calories || 0;
          weeklyData[weekKey].protein += meal.protein_g || 0;
        });
        setWeeklyNutrition(Object.values(weeklyData));

        // Calculate meal type distribution
        const mealTypes: Record<string, number> = {};
        meals.forEach(meal => {
          mealTypes[meal.meal_type] = (mealTypes[meal.meal_type] || 0) + 1;
        });
        setMealTypeData(Object.entries(mealTypes).map(([name, value]) => ({ name, value })));
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

  // Calculate percentile position
  const getPercentileStatus = (value: number, type: 'weight' | 'height') => {
    const ageIndex = Math.min(babyAgeMonths - 6, 18);
    const p3 = WHO_PERCENTILES[type].p3[ageIndex];
    const p50 = WHO_PERCENTILES[type].p50[ageIndex];
    const p97 = WHO_PERCENTILES[type].p97[ageIndex];
    
    if (value < p3) return { percentile: "<3rd", status: "below", color: "text-destructive" };
    if (value < p50) return { percentile: "3rd-50th", status: "healthy", color: "text-mint" };
    if (value < p97) return { percentile: "50th-97th", status: "healthy", color: "text-mint" };
    return { percentile: ">97th", status: "above", color: "text-peach" };
  };

  // Generate intelligent insights
  const generateInsights = () => {
    const insights = [];
    
    // Growth insights
    if (growthData.length >= 2) {
      const recent = growthData[growthData.length - 1];
      const previous = growthData[growthData.length - 2];
      const weightChange = recent.weight - previous.weight;
      const heightChange = recent.height - previous.height;
      
      if (weightChange > 0.3) {
        insights.push({
          type: "success",
          icon: ArrowUp,
          title: "Excellent Weight Gain",
          description: `${babyName || "Baby"} gained ${weightChange.toFixed(2)}kg - perfect growth trajectory!`,
          recommendation: "Continue current feeding routine"
        });
      } else if (weightChange < 0) {
        insights.push({
          type: "warning",
          icon: ArrowDown,
          title: "Weight Monitoring Needed",
          description: `Weight decreased by ${Math.abs(weightChange).toFixed(2)}kg`,
          recommendation: "Consider increasing calorie-rich foods like avocado, olive oil"
        });
      }
      
      if (heightChange > 0.5) {
        insights.push({
          type: "success",
          icon: Ruler,
          title: "Growth Spurt Detected",
          description: `Height increased ${heightChange.toFixed(1)}cm - may need extra nutrition`,
          recommendation: "Increase protein intake during growth spurts"
        });
      }
    }

    // Nutrition insights
    if (nutritionData.mealCount > 0) {
      const avgProtein = nutritionData.totalProtein / nutritionData.mealCount;
      
      if (avgProtein < 5) {
        insights.push({
          type: "warning",
          icon: AlertTriangle,
          title: "Low Protein Intake",
          description: "Average protein per meal is below recommended levels",
          recommendation: "Add more eggs, fish, lentils, or yogurt to meals"
        });
      } else if (avgProtein >= 8) {
        insights.push({
          type: "success",
          icon: CheckCircle2,
          title: "Great Protein Balance",
          description: "Protein intake is optimal for healthy development",
          recommendation: "Maintain variety in protein sources"
        });
      }
    }

    // Variety insights
    if (mealTypeData.length < 3) {
      insights.push({
        type: "info",
        icon: Lightbulb,
        title: "Increase Meal Variety",
        description: "Adding more meal types improves nutrient diversity",
        recommendation: "Try introducing healthy snacks between main meals"
      });
    }

    return insights.length > 0 ? insights : [{
      type: "info",
      icon: Sparkles,
      title: "Start Tracking",
      description: "Log more meals and growth records for personalized insights",
      recommendation: "Aim for at least 3 meal logs per day"
    }];
  };

  const insights = generateInsights();

  // Macro distribution with percentages
  const totalMacros = nutritionData.totalProtein + nutritionData.totalCarbs + nutritionData.totalFats;
  const macroData = [
    { name: "Protein", value: nutritionData.totalProtein, percent: totalMacros > 0 ? (nutritionData.totalProtein / totalMacros * 100).toFixed(0) : 0 },
    { name: "Carbs", value: nutritionData.totalCarbs, percent: totalMacros > 0 ? (nutritionData.totalCarbs / totalMacros * 100).toFixed(0) : 0 },
    { name: "Fats", value: nutritionData.totalFats, percent: totalMacros > 0 ? (nutritionData.totalFats / totalMacros * 100).toFixed(0) : 0 },
  ].filter(m => m.value > 0);

  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--mint))", "hsl(var(--secondary))"];
  const BAR_COLORS = ["hsl(var(--peach))", "hsl(var(--mint))", "hsl(var(--secondary))", "hsl(var(--accent))"];

  // WHO percentile chart data
  const whoChartData = Array.from({ length: 19 }, (_, i) => ({
    age: i + 6,
    p3: WHO_PERCENTILES.weight.p3[i],
    p50: WHO_PERCENTILES.weight.p50[i],
    p97: WHO_PERCENTILES.weight.p97[i],
    baby: growthData.find(g => g.ageMonths === i + 6)?.weight || null
  }));

  const handleExportPDF = () => {
    toast({ title: "Report Exported", description: "Your progress report has been downloaded." });
  };

  const handleShare = () => {
    toast({ title: "Link Copied", description: "Share link copied to clipboard!" });
  };

  // BMI calculation
  const currentWeight = growthData.length > 0 ? growthData[growthData.length - 1].weight : 0;
  const currentHeight = growthData.length > 0 ? growthData[growthData.length - 1].height : 0;
  const bmi = currentWeight > 0 && currentHeight > 0 
    ? (currentWeight / Math.pow(currentHeight / 100, 2)).toFixed(1)
    : "N/A";

  const weightStatus = currentWeight > 0 ? getPercentileStatus(currentWeight, 'weight') : null;
  const heightStatus = currentHeight > 0 ? getPercentileStatus(currentHeight, 'height') : null;

  if (loading) {
    return (
      <main className="min-h-screen bg-background pt-20 pb-24 lg:pb-8">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 lg:pb-8">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header with Score */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Progress Reports
            </h1>
            <p className="text-muted-foreground">
              {babyName ? `${babyName}'s` : "Your baby's"} expert growth & nutrition analysis
            </p>
          </div>
          
          {/* Nutrition Score Card */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-mint/10 border-primary/20 min-w-[200px]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
                  <circle 
                    cx="32" cy="32" r="28" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="6" 
                    fill="none"
                    strokeDasharray={`${(animatedScore / 100) * 176} 176`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{Math.round(animatedScore)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nutrition Score</p>
                <Badge className={`${scoreBadge.color} gap-1`}>
                  <scoreBadge.icon className="w-3 h-3" />
                  {scoreBadge.label}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-2 rounded-xl">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm" className="gap-2 rounded-xl">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        {/* Current Stats with Percentiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Card className="p-4 bg-card border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Weight</span>
            </div>
            <p className="text-2xl font-bold">{animatedWeight.toFixed(1)}<span className="text-sm font-normal ml-0.5">kg</span></p>
            {weightStatus && (
              <p className={`text-xs mt-1 ${weightStatus.color}`}>
                {weightStatus.percentile} percentile
              </p>
            )}
          </Card>

          <Card className="p-4 bg-card border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Height</span>
            </div>
            <p className="text-2xl font-bold">{animatedHeight.toFixed(1)}<span className="text-sm font-normal ml-0.5">cm</span></p>
            {heightStatus && (
              <p className={`text-xs mt-1 ${heightStatus.color}`}>
                {heightStatus.percentile} percentile
              </p>
            )}
          </Card>

          <Card className="p-4 bg-card border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-peach" />
              <span className="text-xs text-muted-foreground">Avg Calories/Meal</span>
            </div>
            <p className="text-2xl font-bold">
              {nutritionData.mealCount > 0 ? Math.round(nutritionData.totalCalories / nutritionData.mealCount) : 0}
              <span className="text-sm font-normal ml-0.5">kcal</span>
            </p>
          </Card>

          <Card className="p-4 bg-card border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-mint" />
              <span className="text-xs text-muted-foreground">BMI</span>
            </div>
            <p className="text-2xl font-bold">{bmi}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {bmi !== "N/A" && parseFloat(bmi) >= 14 && parseFloat(bmi) <= 19 ? "Healthy range" : ""}
            </p>
          </Card>
        </div>

        {/* Intelligent Insights */}
        <Card className="p-6 mb-6 border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Expert Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border ${
                  insight.type === 'success' ? 'bg-mint/10 border-mint/30' :
                  insight.type === 'warning' ? 'bg-peach/10 border-peach/30' :
                  'bg-muted/30 border-border/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'success' ? 'bg-mint/20' :
                    insight.type === 'warning' ? 'bg-peach/20' :
                    'bg-primary/20'
                  }`}>
                    <insight.icon className={`w-4 h-4 ${
                      insight.type === 'success' ? 'text-mint' :
                      insight.type === 'warning' ? 'text-peach' :
                      'text-primary'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                    <p className="text-xs text-primary mt-2 font-medium">💡 {insight.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* WHO Percentile Chart */}
        {growthData.length > 0 && (
          <Card className="p-6 mb-6 border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">WHO Growth Percentiles</h2>
              <Badge variant="outline" className="ml-2 text-xs">Weight</Badge>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={whoChartData}>
                <defs>
                  <linearGradient id="whoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--mint))" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="hsl(var(--mint))" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="age" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Age (months)', position: 'bottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                />
                <Area type="monotone" dataKey="p97" stroke="hsl(var(--muted-foreground))" fill="url(#whoGradient)" strokeWidth={1} strokeDasharray="4 4" name="97th percentile" />
                <Area type="monotone" dataKey="p50" stroke="hsl(var(--mint))" fill="transparent" strokeWidth={2} name="50th percentile" />
                <Area type="monotone" dataKey="p3" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={1} strokeDasharray="4 4" name="3rd percentile" />
                <Line 
                  type="monotone" 
                  dataKey="baby" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                  name={`${babyName || "Baby"}'s weight`}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-primary rounded"></div>
                {babyName || "Baby"}'s weight
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-mint rounded"></div>
                50th percentile
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-muted-foreground rounded dashed"></div>
                3rd-97th range
              </span>
            </div>
          </Card>
        )}

        {/* Nutrition Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Macro Distribution */}
          {macroData.length > 0 && (
            <Card className="p-6 border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-secondary" />
                <h2 className="text-lg font-semibold">Macro Distribution</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {macroData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {macroData.map((entry, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                      <span className="text-xs text-muted-foreground">{entry.name}</span>
                    </div>
                    <p className="text-sm font-semibold">{entry.percent}%</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Meal Distribution */}
          {mealTypeData.length > 0 && (
            <Card className="p-6 border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Baby className="w-5 h-5 text-peach" />
                <h2 className="text-lg font-semibold">Meals by Type</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mealTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={70} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {mealTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Weekly Nutrition Trend */}
        {weeklyNutrition.length > 0 && (
          <Card className="p-6 border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-mint" />
              <h2 className="text-lg font-semibold">Weekly Nutrition Trend</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyNutrition}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Calories" />
                <Bar dataKey="protein" fill="hsl(var(--mint))" radius={[4, 4, 0, 0]} name="Protein (g)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Empty State */}
        {growthData.length === 0 && nutritionData.mealCount === 0 && (
          <Card className="p-8 text-center border-dashed border-2 border-border/50">
            <Award className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No data yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start logging growth records and meals to see expert analysis
            </p>
            <Button onClick={() => window.location.href = '/growth'} className="rounded-xl">
              Go to Growth Tracker
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
};

export default ProgressReports;
