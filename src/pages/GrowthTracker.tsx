import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, Utensils } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { z } from "zod";

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
  eaten_at: string;
}

const GrowthTracker = () => {
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showNewGrowth, setShowNewGrowth] = useState(false);
  const [showNewMeal, setShowNewMeal] = useState(false);
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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    fetchGrowthRecords();
    fetchMealLogs();
  };

  const fetchGrowthRecords = async () => {
    const { data, error } = await supabase
      .from("baby_growth")
      .select("*")
      .order("recorded_at", { ascending: true });

    if (error) {
      console.error("Error fetching growth records:", error);
      return;
    }

    setGrowthRecords(data || []);
  };

  const fetchMealLogs = async () => {
    const { data, error } = await supabase
      .from("meal_logs")
      .select("*")
      .order("eaten_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching meal logs:", error);
      return;
    }

    setMealLogs(data || []);
  };

  const handleAddGrowth = async () => {
    // Validate inputs
    const validation = growthSchema.safeParse({
      babyName,
      weight: parseFloat(weight),
      height: parseFloat(height),
      milestone: milestone || undefined,
      notes: notes || undefined,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
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
      toast({
        title: "Error",
        description: "Failed to add growth record",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Growth record added successfully!",
    });

    // Reset form
    setBabyName("");
    setWeight("");
    setHeight("");
    setMilestone("");
    setNotes("");
    setShowNewGrowth(false);
    fetchGrowthRecords();
  };

  const handleAddMeal = async () => {
    // Validate inputs
    const validation = mealSchema.safeParse({
      babyName,
      mealType,
      recipeTitle,
      calories: calories ? parseInt(calories) : undefined,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("meal_logs").insert({
      baby_name: validation.data.babyName,
      meal_type: validation.data.mealType,
      recipe_title: validation.data.recipeTitle,
      calories: validation.data.calories || null,
      eaten_at: new Date().toISOString(),
      user_id: user.id,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add meal log",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Meal logged successfully!",
    });

    // Reset form
    setBabyName("");
    setMealType("");
    setRecipeTitle("");
    setCalories("");
    setShowNewMeal(false);
    fetchMealLogs();
  };

  const growthChartData = growthRecords.map((record) => ({
    date: new Date(record.recorded_at).toLocaleDateString(),
    weight: record.weight_kg,
    height: record.height_cm,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background pt-20 pb-8">
      <div className="container max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-primary mb-2">Growth & Nutrition Tracker</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Monitor your baby's growth and track their meals
        </p>

        <Tabs defaultValue="growth" className="space-y-6">
          <TabsList>
            <TabsTrigger value="growth">
              <TrendingUp className="w-4 h-4 mr-2" />
              Growth
            </TabsTrigger>
            <TabsTrigger value="meals">
              <Utensils className="w-4 h-4 mr-2" />
              Meals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowNewGrowth(!showNewGrowth)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Growth Record
              </Button>
            </div>

            {showNewGrowth && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">New Growth Record</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="babyName">Baby Name *</Label>
                    <Input
                      id="babyName"
                      value={babyName}
                      onChange={(e) => setBabyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (cm) *</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="milestone">Milestone</Label>
                    <Input
                      id="milestone"
                      value={milestone}
                      onChange={(e) => setMilestone(e.target.value)}
                      placeholder="e.g., First tooth, crawling"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddGrowth}>Save</Button>
                  <Button variant="outline" onClick={() => setShowNewGrowth(false)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {growthRecords.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Growth Chart</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      name="Weight (kg)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="height"
                      stroke="hsl(var(--secondary))"
                      name="Height (cm)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            <div className="grid gap-4">
              {growthRecords.map((record) => (
                <Card key={record.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{record.baby_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.recorded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p>
                        <span className="font-semibold">{record.weight_kg}</span> kg
                      </p>
                      <p>
                        <span className="font-semibold">{record.height_cm}</span> cm
                      </p>
                    </div>
                  </div>
                  {record.milestone && (
                    <p className="mt-2 text-sm">
                      <span className="font-semibold">Milestone:</span> {record.milestone}
                    </p>
                  )}
                  {record.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{record.notes}</p>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="meals" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowNewMeal(!showNewMeal)}>
                <Plus className="w-4 h-4 mr-2" />
                Log Meal
              </Button>
            </div>

            {showNewMeal && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Log New Meal</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mealBabyName">Baby Name *</Label>
                    <Input
                      id="mealBabyName"
                      value={babyName}
                      onChange={(e) => setBabyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mealType">Meal Type *</Label>
                    <Input
                      id="mealType"
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      placeholder="e.g., Breakfast, Lunch, Snack"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipeTitle">Recipe/Food *</Label>
                    <Input
                      id="recipeTitle"
                      value={recipeTitle}
                      onChange={(e) => setRecipeTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="calories">Calories (optional)</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddMeal}>Save</Button>
                  <Button variant="outline" onClick={() => setShowNewMeal(false)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid gap-4">
              {mealLogs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{log.recipe_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {log.meal_type} • {new Date(log.eaten_at).toLocaleDateString()}
                      </p>
                    </div>
                    {log.calories && (
                      <div className="text-right">
                        <p className="text-sm">
                          <span className="font-semibold">{log.calories}</span> cal
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default GrowthTracker;
