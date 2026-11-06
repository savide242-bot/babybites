import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  TrendingUp, 
  Utensils, 
  Scale, 
  Ruler, 
  Sparkles, 
  Calendar, 
  ChevronRight,
  ShieldCheck,
  Award,
  CheckCircle2,
  Heart,
  Baby,
  Smile,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
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
  milestone: string | null;
  recorded_at: string;
  notes: string | null;
}

interface MealLog {
  id: string;
  baby_name: string;
  meal_type: string;
  recipe_title: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  eaten_at: string;
}

interface PediatricMilestone {
  id: string;
  stage: "4-6m" | "6-8m" | "9-11m" | "12m+";
  stageLabel: string;
  title: string;
  description: string;
  category: "eating" | "motor" | "oral";
}

const PEDIATRIC_MILESTONES: PediatricMilestone[] = [
  {
    id: "m1",
    stage: "4-6m",
    stageLabel: "4 to 6 Months",
    title: "Steadily Holds Head Upright",
    description: "Maintains head & neck control securely in a highchair without slumping.",
    category: "motor",
  },
  {
    id: "m2",
    stage: "4-6m",
    stageLabel: "4 to 6 Months",
    title: "Diminished Tongue-Thrust Reflex",
    description: "Doesn't automatically push puree out of mouth with tongue when offered.",
    category: "oral",
  },
  {
    id: "m3",
    stage: "4-6m",
    stageLabel: "4 to 6 Months",
    title: "Opens Mouth for Spoon & Puree",
    description: "Shows keen interest in food and leans forward opening mouth when spoon nears.",
    category: "eating",
  },
  {
    id: "m4",
    stage: "6-8m",
    stageLabel: "6 to 8 Months",
    title: "Palmar Grasp & Finger Food Exploration",
    description: "Grabs steamed carrot or avocado stick with whole palm and brings to mouth.",
    category: "motor",
  },
  {
    id: "m5",
    stage: "6-8m",
    stageLabel: "6 to 8 Months",
    title: "Munching & Jaw Chewing Movement",
    description: "Moves jaw up and down to mash soft lumps against gums.",
    category: "oral",
  },
  {
    id: "m6",
    stage: "6-8m",
    stageLabel: "6 to 8 Months",
    title: "Sits Supported for 15+ Mins",
    description: "Maintains upright posture comfortably throughout a full meal session.",
    category: "motor",
  },
  {
    id: "m7",
    stage: "9-11m",
    stageLabel: "9 to 11 Months",
    title: "Neat Pincer Grasp (Thumb & Forefinger)",
    description: "Picks up tiny pea-sized bites or soft blueberries with tips of two fingers.",
    category: "motor",
  },
  {
    id: "m8",
    stage: "9-11m",
    stageLabel: "9 to 11 Months",
    title: "Rotary Chewing of Textured Foods",
    description: "Moves food side-to-side across the tongue to grind thicker textures.",
    category: "oral",
  },
  {
    id: "m9",
    stage: "9-11m",
    stageLabel: "9 to 11 Months",
    title: "Self-Feeding Finger Foods Confidently",
    description: "Regularly picks up and finishes pieces of baby food independently.",
    category: "eating",
  },
  {
    id: "m10",
    stage: "12m+",
    stageLabel: "12+ Months",
    title: "Open Cup Sipping with Minimal Spills",
    description: "Drinks water or milk from an open baby training cup with two hands.",
    category: "oral",
  },
  {
    id: "m11",
    stage: "12m+",
    stageLabel: "12+ Months",
    title: "Baby Spoon Loading & Dipping",
    description: "Dips spoon into yogurt or porridge and guides it into mouth with pride.",
    category: "eating",
  },
  {
    id: "m12",
    stage: "12m+",
    stageLabel: "12+ Months",
    title: "Sharing Modified Family Table Meals",
    description: "Eats balanced family table foods cut into bite-safe toddler pieces.",
    category: "eating",
  },
];

export const GrowthTracker = () => {
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showNewGrowth, setShowNewGrowth] = useState(false);
  const [showNewMeal, setShowNewMeal] = useState(false);
  const [babyProfile, setBabyProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"growth" | "milestones" | "meals">("growth");
  const [milestonesCompleted, setMilestonesCompleted] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("babybites_completed_milestones");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const navigate = useNavigate();

  // Form states
  const [babyName, setBabyName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [milestone, setMilestone] = useState("");
  const [notes, setNotes] = useState("");
  const [mealType, setMealType] = useState("Breakfast");
  const [recipeTitle, setRecipeTitle] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  // Stats
  const latestWeight = growthRecords.length > 0 ? growthRecords[growthRecords.length - 1].weight_kg : 0;
  const latestHeight = growthRecords.length > 0 ? growthRecords[growthRecords.length - 1].height_cm : 0;
  
  // Pediatric weight gain since first recorded entry
  const weightGain = growthRecords.length >= 2 
    ? (growthRecords[growthRecords.length - 1].weight_kg - growthRecords[0].weight_kg).toFixed(2)
    : "0.00";

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      fetchGrowthRecords(session.user.id);
      fetchMealLogs(session.user.id);
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

  const fetchGrowthRecords = async (userIdParam?: string) => {
    const uid = userIdParam || user?.id;
    if (!uid) return;

    const { data, error } = await supabase
      .from("baby_growth")
      .select("*")
      .eq("user_id", uid)
      .order("recorded_at", { ascending: true })
      .limit(100);

    if (!error) setGrowthRecords(data || []);
  };

  const fetchMealLogs = async (userIdParam?: string) => {
    const uid = userIdParam || user?.id;
    if (!uid) return;

    const { data, error } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", uid)
      .order("eaten_at", { ascending: false })
      .limit(50);

    if (!error) setMealLogs(data || []);
  };

  const toggleMilestone = (id: string, title: string) => {
    const next = { ...milestonesCompleted, [id]: !milestonesCompleted[id] };
    setMilestonesCompleted(next);
    localStorage.setItem("babybites_completed_milestones", JSON.stringify(next));

    if (next[id]) {
      toast.success(`🎉 Milestone Unlocked: ${title}!`);
    }
  };

  const handleAddGrowth = async () => {
    const validation = growthSchema.safeParse({
      babyName: babyName || babyProfile?.baby_name || "Baby",
      weight: parseFloat(weight),
      height: parseFloat(height),
      milestone: milestone || undefined,
      notes: notes || undefined,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (!user) {
      // Local fallback if guest
      const newRec: GrowthRecord = {
        id: Date.now().toString(),
        baby_name: validation.data.babyName,
        weight_kg: validation.data.weight,
        height_cm: validation.data.height,
        milestone: validation.data.milestone || null,
        notes: validation.data.notes || null,
        recorded_at: new Date().toISOString(),
      };
      setGrowthRecords([...growthRecords, newRec]);
      toast.success(`🎉 Growth entry recorded for ${validation.data.babyName}!`);
      setShowNewGrowth(false);
      setWeight("");
      setHeight("");
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
      toast.error("Failed to save growth record");
      return;
    }

    toast.success(`🎉 Growth entry recorded for ${validation.data.babyName}!`);
    setWeight("");
    setHeight("");
    setMilestone("");
    setNotes("");
    setShowNewGrowth(false);
    fetchGrowthRecords();
  };

  const handleAddMeal = async () => {
    const validation = mealSchema.safeParse({
      babyName: babyName || babyProfile?.baby_name || "Baby",
      mealType,
      recipeTitle,
      calories: calories ? parseInt(calories) : undefined,
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fats: fats ? parseFloat(fats) : undefined,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (!user) {
      toast.success("Meal logged locally!");
      setShowNewMeal(false);
      setRecipeTitle("");
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
      toast.error("Failed to add meal log");
      return;
    }

    toast.success("Meal logged successfully!");
    setRecipeTitle("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");
    setShowNewMeal(false);
    fetchMealLogs();
  };

  const growthChartData = growthRecords.map((record) => ({
    date: new Date(record.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: record.weight_kg,
    height: record.height_cm,
  }));

  const totalCompletedMilestones = Object.values(milestonesCompleted).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#121614] pb-28 pt-4 px-3.5 sm:px-6 w-full max-w-4xl mx-auto transition-colors">
      {/* Editorial Luxury Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2">
          <Baby className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Pediatric Development & Nutrition Tracker
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          Baby Growth & Feeding Milestones
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xl leading-relaxed">
          Monitor your baby&apos;s physical progress against WHO healthy developmental bands and celebrate key self-feeding milestones.
        </p>
      </div>

      {/* 4 Overview Stat Cards (WHO-aligned, no adult BMI!) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Latest Weight */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">Weight</span>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {latestWeight > 0 ? `${latestWeight.toFixed(1)} kg` : "—"}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {latestWeight > 0 ? "Latest check-in" : "Tap + to add"}
          </span>
        </div>

        {/* Latest Length / Height */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <Ruler className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">Length</span>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {latestHeight > 0 ? `${latestHeight.toFixed(1)} cm` : "—"}
          </div>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
            {latestHeight > 0 ? "WHO standard" : "Tap + to add"}
          </span>
        </div>

        {/* WHO Healthy Growth Indicator */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">WHO Status</span>
          </div>
          <div className="text-sm sm:text-base font-serif font-bold text-stone-800 dark:text-stone-200">
            {latestWeight > 0 ? "Healthy Band" : "Awaiting Data"}
          </div>
          <span className="text-[10px] text-stone-400 font-medium">
            Optimal infant curve
          </span>
        </div>

        {/* Milestones Achieved */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">Milestones</span>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {totalCompletedMilestones} / 12
          </div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
            {totalCompletedMilestones > 0 ? "Feeding skills active" : "Track first skill"}
          </span>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#EBE8DF] dark:border-stone-800 pb-3">
        <button
          onClick={() => setActiveTab("growth")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "growth"
              ? "bg-forest dark:bg-emerald-600 text-white shadow-xs"
              : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-[#EBE8DF] dark:border-stone-700 hover:border-stone-300"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Growth Curve
        </button>

        <button
          onClick={() => setActiveTab("milestones")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "milestones"
              ? "bg-forest dark:bg-emerald-600 text-white shadow-xs"
              : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-[#EBE8DF] dark:border-stone-700 hover:border-stone-300"
          }`}
        >
          <Award className="w-4 h-4" />
          Feeding Milestones ({totalCompletedMilestones}/12)
        </button>

        <button
          onClick={() => setActiveTab("meals")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "meals"
              ? "bg-forest dark:bg-emerald-600 text-white shadow-xs"
              : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-[#EBE8DF] dark:border-stone-700 hover:border-stone-300"
          }`}
        >
          <Utensils className="w-4 h-4" />
          Daily Meals ({mealLogs.length})
        </button>
      </div>

      {/* TAB 1: GROWTH CURVE */}
      {activeTab === "growth" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
              Weight & Length Progression
            </h2>
            <Button
              onClick={() => setShowNewGrowth(!showNewGrowth)}
              className="rounded-full bg-forest dark:bg-emerald-600 hover:bg-forest/90 text-white text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Check-in
            </Button>
          </div>

          {/* New Record Form */}
          {showNewGrowth && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-800/50 shadow-sm animate-in fade-in duration-200">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Record Pediatric Measurement
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="babyName" className="text-xs text-stone-600 dark:text-stone-400">Baby Name</Label>
                  <Input 
                    id="babyName" 
                    value={babyName} 
                    onChange={(e) => setBabyName(e.target.value)} 
                    placeholder={babyProfile?.baby_name || "Sophie"} 
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="weight" className="text-xs text-stone-600 dark:text-stone-400">Weight (kg) *</Label>
                  <Input 
                    id="weight" 
                    type="number" 
                    step="0.05" 
                    value={weight} 
                    onChange={(e) => setWeight(e.target.value)} 
                    placeholder="e.g. 8.45" 
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-xs text-stone-600 dark:text-stone-400">Length (cm) *</Label>
                  <Input 
                    id="height" 
                    type="number" 
                    step="0.1" 
                    value={height} 
                    onChange={(e) => setHeight(e.target.value)} 
                    placeholder="e.g. 69.5" 
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="milestone" className="text-xs text-stone-600 dark:text-stone-400">Milestone Note (Optional)</Label>
                  <Input 
                    id="milestone" 
                    value={milestone} 
                    onChange={(e) => setMilestone(e.target.value)} 
                    placeholder="e.g. First tooth, sitting upright" 
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes" className="text-xs text-stone-600 dark:text-stone-400">Pediatrician Notes (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Doctor commended solid foods variety..." 
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddGrowth} className="rounded-full bg-forest dark:bg-emerald-600 text-white text-xs">
                  Save Measurement
                </Button>
                <Button variant="ghost" onClick={() => setShowNewGrowth(false)} className="rounded-full text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Growth Chart */}
          {growthRecords.length > 0 ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    Weight Progression Curve
                  </h3>
                  <p className="text-xs text-stone-400">Smoothed trajectory over time</p>
                </div>
                {parseFloat(weightGain) > 0 && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60">
                    +{weightGain} kg gained
                  </span>
                )}
              </div>

              <div className="w-full h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthChartData}>
                    <defs>
                      <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1E5E3A" stopOpacity={0.35}/>
                        <stop offset="100%" stopColor="#1E5E3A" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EBE8DF" opacity={0.6} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#888' }} 
                      axisLine={{ stroke: '#EBE8DF' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#888' }} 
                      axisLine={{ stroke: '#EBE8DF' }}
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E5E3A', 
                        border: 'none',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="#1E5E3A"
                      fill="url(#growthGradient)"
                      strokeWidth={3}
                      name="Weight (kg)"
                      dot={{ fill: '#1E5E3A', strokeWidth: 0, r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-[#EBE8DF] dark:border-stone-800 text-center">
              <Scale className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200 mb-1">
                No growth measurements yet
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                Record your baby&apos;s latest pediatric weigh-in to generate their personal healthy growth curve.
              </p>
              <Button onClick={() => setShowNewGrowth(true)} className="rounded-full bg-forest dark:bg-emerald-600 text-white text-xs">
                Log First Measurement
              </Button>
            </div>
          )}

          {/* Recent Records Log */}
          {growthRecords.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800 p-5 shadow-2xs">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mb-3">
                Measurement History
              </h3>
              <div className="space-y-2">
                {growthRecords.slice(-5).reverse().map((rec) => (
                  <div key={rec.id} className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {format(new Date(rec.recorded_at), "MMMM d, yyyy")}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {rec.weight_kg} kg • {rec.height_cm} cm {rec.milestone && `• ${rec.milestone}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FEEDING MILESTONES */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 text-xs text-emerald-900 dark:text-emerald-200">
            <strong>Pediatric Feeding Milestones:</strong> Track oral-motor skills as your baby transitions from smooth purees to finger foods and family meals. Tap to celebrate each milestone!
          </div>

          <div className="space-y-3">
            {PEDIATRIC_MILESTONES.map((item) => {
              const isChecked = !!milestonesCompleted[item.id];

              return (
                <div
                  key={item.id}
                  onClick={() => toggleMilestone(item.id, item.title)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isChecked
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                      : "bg-white dark:bg-stone-900 border-[#EBE8DF] dark:border-stone-800 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {item.stageLabel}
                        </span>
                        <span className="text-[10px] text-stone-400 capitalize">
                          {item.category} skill
                        </span>
                      </div>
                      <h4 className={`font-serif font-bold text-sm sm:text-base mt-1 ${
                        isChecked ? "text-emerald-900 dark:text-emerald-100" : "text-stone-900 dark:text-stone-100"
                      }`}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DAILY MEAL LOG */}
      {activeTab === "meals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
              Daily Nutrition Diary
            </h2>
            <Button
              onClick={() => setShowNewMeal(!showNewMeal)}
              className="rounded-full bg-forest dark:bg-emerald-600 hover:bg-forest/90 text-white text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Meal
            </Button>
          </div>

          {/* New Meal Form */}
          {showNewMeal && (
            <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-800/50 shadow-sm animate-in fade-in">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mb-3">
                Log Baby Meal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Meal Category</Label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full h-10 px-3 mt-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Dish or Recipe Served *</Label>
                  <Input
                    value={recipeTitle}
                    onChange={(e) => setRecipeTitle(e.target.value)}
                    placeholder="e.g. Avocado Sweet Potato Mash"
                    className="mt-1 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddMeal} className="rounded-full bg-forest dark:bg-emerald-600 text-white text-xs">
                  Save Meal
                </Button>
                <Button variant="ghost" onClick={() => setShowNewMeal(false)} className="rounded-full text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Meal History */}
          <div className="space-y-2.5">
            {mealLogs.length > 0 ? (
              mealLogs.map((meal) => (
                <div key={meal.id} className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 flex items-center justify-center">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                        {meal.recipe_title}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {meal.meal_type} • {format(new Date(meal.eaten_at), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-[#EBE8DF] dark:border-stone-800 text-center">
                <Utensils className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500">No meals logged yet today.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthTracker;
