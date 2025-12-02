import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Camera, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Baby,
  Sparkles,
  Flame,
  Beef,
  Cookie,
  Droplets,
  AlertCircle,
  ChefHat,
  History,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  identified_food: string;
  is_recommended: boolean;
  recommendation_reason: string;
  estimated_calories: number;
  estimated_protein_g: number;
  estimated_carbs_g: number;
  estimated_fats_g: number;
  vitamins: string[];
  minerals: string[];
  allergens: string[];
  choking_risk: string;
  preparation_tips: string;
  suggested_recipes: string[];
  confidence_score: number;
}

interface AnalysisHistory {
  id: string;
  identified_food: string;
  is_recommended: boolean;
  baby_age_months: number;
  created_at: string;
}

const FoodAnalyzer = () => {
  const [image, setImage] = useState<string | null>(null);
  const [babyAge, setBabyAge] = useState<number>(6);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      fetchHistory(session.user.id);
      
      // Try to get baby's birth date for auto-calculation
      const { data: profile } = await supabase
        .from("profiles")
        .select("baby_birth_date")
        .eq("id", session.user.id)
        .single();
      
      if (profile?.baby_birth_date) {
        const birthDate = new Date(profile.baby_birth_date);
        const now = new Date();
        const ageMonths = Math.floor((now.getTime() - birthDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
        if (ageMonths >= 4 && ageMonths <= 36) {
          setBabyAge(ageMonths);
        }
      }
    }
  };

  const fetchHistory = async (userId: string) => {
    const { data } = await supabase
      .from("food_analyses")
      .select("id, identified_food, is_recommended, baby_age_months, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (data) setHistory(data);
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select an image under 10MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFood = async () => {
    if (!image || !user) {
      toast({ title: "Error", description: "Please capture or upload an image first.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: { 
          image: image,
          babyAgeMonths: babyAge
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data);

      // Save to database
      await supabase.from("food_analyses").insert({
        user_id: user.id,
        image_url: image.substring(0, 500), // Store truncated for reference
        baby_age_months: babyAge,
        identified_food: data.identified_food,
        is_recommended: data.is_recommended,
        recommendation_reason: data.recommendation_reason,
        estimated_calories: data.estimated_calories,
        estimated_protein_g: data.estimated_protein_g,
        estimated_carbs_g: data.estimated_carbs_g,
        estimated_fats_g: data.estimated_fats_g,
        vitamins: data.vitamins,
        minerals: data.minerals,
        allergens: data.allergens,
        choking_risk: data.choking_risk,
        preparation_tips: data.preparation_tips,
        suggested_recipes: data.suggested_recipes,
        confidence_score: data.confidence_score,
      });

      // Refresh history
      fetchHistory(user.id);

      toast({
        title: "Analysis Complete!",
        description: `Identified: ${data.identified_food}`,
      });

    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze the food. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 pt-20 pb-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
            AI Food Analyzer
          </h1>
          <p className="text-lg text-muted-foreground">
            Take a photo of any food and get instant nutritional analysis for your baby
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Analysis Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Capture Card */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Capture Food Image
              </h2>

              {!image ? (
                <div 
                  className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-gradient-to-br from-primary/5 to-transparent"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Camera className="w-12 h-12 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Take Photo or Upload Image</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Capture or select a photo of the food/ingredient
                      </p>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <Button variant="outline" className="gap-2">
                        <Camera className="w-4 h-4" />
                        Camera
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Upload className="w-4 h-4" />
                        Gallery
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={image} 
                    alt="Food to analyze" 
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageCapture}
              />
            </Card>

            {/* Baby Age Selector */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Baby className="w-5 h-5 text-secondary" />
                Baby's Age
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Age in months:</span>
                  <span className="text-2xl font-bold text-primary">{babyAge} months</span>
                </div>
                <Slider
                  value={[babyAge]}
                  onValueChange={(value) => setBabyAge(value[0])}
                  min={4}
                  max={36}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>4 months</span>
                  <span>12 months</span>
                  <span>24 months</span>
                  <span>36 months</span>
                </div>
              </div>
            </Card>

            {/* Analyze Button */}
            <Button 
              onClick={analyzeFood}
              disabled={!image || isAnalyzing}
              className="w-full py-6 text-lg gap-2"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze Food
                </>
              )}
            </Button>

            {/* Results Card */}
            {result && (
              <Card className="p-6 animate-in slide-in-from-bottom-4">
                {/* Header with Recommendation Status */}
                <div className={`p-4 rounded-xl mb-6 ${result.is_recommended ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <div className="flex items-center gap-3">
                    {result.is_recommended ? (
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    ) : (
                      <XCircle className="w-10 h-10 text-red-500" />
                    )}
                    <div>
                      <h3 className="text-2xl font-bold">{result.identified_food}</h3>
                      <p className={`font-medium ${result.is_recommended ? 'text-green-600' : 'text-red-600'}`}>
                        {result.is_recommended 
                          ? `✓ Recommended for ${babyAge} month old` 
                          : `✗ Not recommended for ${babyAge} month old`
                        }
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm">{result.recommendation_reason}</p>
                  {result.confidence_score && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      AI Confidence: {(result.confidence_score * 100).toFixed(0)}%
                    </p>
                  )}
                </div>

                {/* Nutritional Information */}
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Estimated Nutrition (per serving)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-orange-500/10 text-center">
                    <Flame className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                    <p className="text-lg font-bold">{result.estimated_calories}</p>
                    <p className="text-xs text-muted-foreground">Calories</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 text-center">
                    <Beef className="w-5 h-5 mx-auto text-red-500 mb-1" />
                    <p className="text-lg font-bold">{result.estimated_protein_g}g</p>
                    <p className="text-xs text-muted-foreground">Protein</p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-500/10 text-center">
                    <Cookie className="w-5 h-5 mx-auto text-cyan-500 mb-1" />
                    <p className="text-lg font-bold">{result.estimated_carbs_g}g</p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/10 text-center">
                    <Droplets className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                    <p className="text-lg font-bold">{result.estimated_fats_g}g</p>
                    <p className="text-xs text-muted-foreground">Fats</p>
                  </div>
                </div>

                {/* Vitamins & Minerals */}
                {(result.vitamins?.length > 0 || result.minerals?.length > 0) && (
                  <div className="mb-6">
                    <h4 className="font-bold mb-2">Vitamins & Minerals</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.vitamins?.map((v, i) => (
                        <span key={i} className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-600">
                          {v}
                        </span>
                      ))}
                      {result.minerals?.map((m, i) => (
                        <span key={i} className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-600">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergens Warning */}
                {result.allergens?.length > 0 && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 mb-6">
                    <h4 className="font-bold mb-2 flex items-center gap-2 text-yellow-700">
                      <AlertTriangle className="w-4 h-4" />
                      Potential Allergens
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.allergens.map((a, i) => (
                        <span key={i} className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-700">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Choking Risk */}
                {result.choking_risk && (
                  <div className="p-4 rounded-lg bg-red-500/10 mb-6">
                    <h4 className="font-bold mb-2 flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      Choking Risk
                    </h4>
                    <p className="text-sm">{result.choking_risk}</p>
                  </div>
                )}

                {/* Preparation Tips */}
                {result.preparation_tips && (
                  <div className="p-4 rounded-lg bg-primary/5 mb-6">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-primary" />
                      Preparation Tips
                    </h4>
                    <p className="text-sm">{result.preparation_tips}</p>
                  </div>
                )}

                {/* Suggested Recipes */}
                {result.suggested_recipes?.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-2">Suggested Recipes</h4>
                    <div className="space-y-2">
                      {result.suggested_recipes.map((recipe, i) => (
                        <div key={i} className="p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer">
                          <p className="font-medium">{recipe}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-24">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <History className="w-4 h-4" />
                Recent Analyses
              </h3>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No analyses yet. Take your first food photo!
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {history.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-lg border ${item.is_recommended ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}
                    >
                      <div className="flex items-center gap-2">
                        {item.is_recommended ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">{item.identified_food}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.baby_age_months} months • {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default FoodAnalyzer;