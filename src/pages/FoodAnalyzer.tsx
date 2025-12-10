import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Upload, 
  Loader2, 
  CheckCircle2, 
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
  Trash2,
  Eye,
  Zap,
  Shield,
  Apple,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGamification } from "@/hooks/useGamification";
import AnalysisDetailDialog, { FullAnalysis } from "@/components/AnalysisDetailDialog";
import confetti from "canvas-confetti";

interface VitaminMineral {
  name: string;
  amount?: string;
  benefit?: string;
  daily_pct?: number;
}

interface SuggestedRecipe {
  name: string;
  description?: string;
  prep_time?: string;
  difficulty?: string;
}

interface AnalysisResult {
  identified_food: string;
  is_recommended: boolean;
  recommendation_reason: string;
  estimated_calories: number;
  estimated_protein_g: number;
  estimated_carbs_g: number;
  estimated_fats_g: number;
  vitamins: (string | VitaminMineral)[];
  minerals: (string | VitaminMineral)[];
  allergens: string[];
  choking_risk: string;
  choking_risk_level?: string;
  choking_risk_detail?: string;
  preparation_tips: string;
  suggested_recipes: (string | SuggestedRecipe)[];
  confidence_score: number;
}

interface AnalysisHistory {
  id: string;
  identified_food: string;
  is_recommended: boolean;
  baby_age_months: number;
  created_at: string;
}

const parseItem = (item: any): VitaminMineral | SuggestedRecipe | string => {
  if (typeof item === 'string') {
    if (item.startsWith('{') && item.endsWith('}')) {
      try { return JSON.parse(item); } catch { return item; }
    }
    return item;
  }
  return item;
};

const getDisplayName = (item: string | VitaminMineral | SuggestedRecipe): string => {
  const parsed = parseItem(item);
  if (typeof parsed === 'string') return parsed;
  return (parsed as VitaminMineral | SuggestedRecipe).name || 'Unknown';
};

const FoodAnalyzer = () => {
  const [image, setImage] = useState<string | null>(null);
  const [babyAge, setBabyAge] = useState<number>(9);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<FullAnalysis | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { logActivity } = useGamification();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      fetchHistory(session.user.id);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("baby_birth_date")
        .eq("id", session.user.id)
        .maybeSingle();
      
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

  const fetchFullAnalysis = async (analysisId: string) => {
    setLoadingDetail(analysisId);
    try {
      const { data, error } = await supabase
        .from("food_analyses")
        .select("*")
        .eq("id", analysisId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setSelectedAnalysis(data as FullAnalysis);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not load analysis details.", variant: "destructive" });
    } finally {
      setLoadingDetail(null);
    }
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
      return;
    }

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
        body: { image, babyAgeMonths: babyAge }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const normalizedResult: AnalysisResult = {
        ...data,
        choking_risk: data.choking_risk || data.choking_risk_detail || null,
        vitamins: data.vitamins || [],
        minerals: data.minerals || [],
        allergens: data.allergens || [],
        suggested_recipes: data.suggested_recipes || [],
      };

      setResult(normalizedResult);

      if (normalizedResult.is_recommended) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      await supabase.from("food_analyses").insert({
        user_id: user.id,
        image_url: image.substring(0, 500),
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
        choking_risk: data.choking_risk || data.choking_risk_detail,
        preparation_tips: data.preparation_tips,
        suggested_recipes: data.suggested_recipes,
        confidence_score: data.confidence_score,
      });

      fetchHistory(user.id);
      logActivity('food_analysis');

      toast({ title: "Analysis Complete!", description: `Identified: ${data.identified_food}` });

    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({ title: "Analysis Failed", description: error.message || "Could not analyze the food.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5 pt-20 pb-8">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Hero Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 mb-4 animate-pulse">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-3">
            AI Food Analyzer
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Your baby's personal nutritionist. Take a photo of any food and get expert-level analysis instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Analysis Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Capture Card */}
            <Card className="border-2 border-primary/20 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Capture Food Image
                </h2>
              </div>
              <CardContent className="p-6">
                {!image ? (
                  <div className="border-2 border-dashed border-primary/30 rounded-2xl p-10 text-center bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center gap-5">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-xl opacity-30 animate-pulse" />
                        <div className="relative p-5 rounded-full bg-gradient-to-br from-primary to-secondary">
                          <Camera className="w-10 h-10 text-primary-foreground" />
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-xl">Take Photo or Upload</p>
                        <p className="text-muted-foreground mt-1">
                          Capture or select a food image for analysis
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          size="lg"
                          variant="outline" 
                          className="gap-2 rounded-full"
                          onClick={() => cameraInputRef.current?.click()}
                        >
                          <Camera className="w-5 h-5" />
                          Take Photo
                        </Button>
                        <Button 
                          size="lg"
                          className="gap-2 rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                          onClick={() => galleryInputRef.current?.click()}
                        >
                          <Upload className="w-5 h-5" />
                          Upload Image
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl" />
                    <img 
                      src={image} 
                      alt="Food to analyze" 
                      className="relative w-full h-72 object-cover rounded-2xl shadow-lg"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-background/80 rounded-2xl flex items-center justify-center">
                        <div className="text-center space-y-3">
                          <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary/30 rounded-full animate-spin border-t-primary" />
                            <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          </div>
                          <p className="font-semibold text-primary">Analyzing with AI...</p>
                        </div>
                      </div>
                    )}
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-3 right-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={clearImage}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
                <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageCapture} />
              </CardContent>
            </Card>

            {/* Baby Age Selector */}
            <Card className="border-2 border-secondary/20">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Baby className="w-5 h-5 text-secondary" />
                  Baby's Age
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Age in months:</span>
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                      {babyAge} months
                    </Badge>
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
                    <span>4 mo</span>
                    <span>12 mo</span>
                    <span>24 mo</span>
                    <span>36 mo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analyze Button */}
            <Button 
              onClick={analyzeFood}
              disabled={!image || isAnalyzing}
              className="w-full py-7 text-lg gap-3 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 shadow-lg"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  Analyze Food
                </>
              )}
            </Button>

            {/* Results */}
            {result && (
              <Card className="border-2 overflow-hidden animate-in slide-in-from-bottom-4">
                {/* Status Header */}
                <div className={`p-6 ${result.is_recommended 
                  ? 'bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20' 
                  : 'bg-gradient-to-r from-red-500/20 via-rose-500/20 to-pink-500/20'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${result.is_recommended ? 'bg-green-500' : 'bg-red-500'}`}>
                      {result.is_recommended ? (
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      ) : (
                        <XCircle className="w-10 h-10 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold">{result.identified_food}</h3>
                      <p className={`font-semibold ${result.is_recommended ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {result.is_recommended 
                          ? `✓ Recommended for ${babyAge} month old` 
                          : `✗ Not recommended for ${babyAge} month old`
                        }
                      </p>
                    </div>
                    {result.confidence_score && (
                      <Badge variant="outline" className="text-sm">
                        <Star className="w-3 h-3 mr-1" />
                        {(result.confidence_score * 100).toFixed(0)}% confident
                      </Badge>
                    )}
                  </div>
                  {result.recommendation_reason && (
                    <p className="mt-4 text-sm bg-background/50 rounded-xl p-3">{result.recommendation_reason}</p>
                  )}
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Nutrition Grid */}
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Apple className="w-4 h-4 text-primary" />
                      Nutritional Information (per serving)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 text-center">
                        <Flame className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                        <p className="text-2xl font-bold">{result.estimated_calories || 0}</p>
                        <p className="text-xs text-muted-foreground">Calories</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 text-center">
                        <Beef className="w-6 h-6 mx-auto text-red-500 mb-2" />
                        <p className="text-2xl font-bold">{result.estimated_protein_g || 0}g</p>
                        <p className="text-xs text-muted-foreground">Protein</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-center">
                        <Cookie className="w-6 h-6 mx-auto text-cyan-500 mb-2" />
                        <p className="text-2xl font-bold">{result.estimated_carbs_g || 0}g</p>
                        <p className="text-xs text-muted-foreground">Carbs</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 text-center">
                        <Droplets className="w-6 h-6 mx-auto text-purple-500 mb-2" />
                        <p className="text-2xl font-bold">{result.estimated_fats_g || 0}g</p>
                        <p className="text-xs text-muted-foreground">Fats</p>
                      </div>
                    </div>
                  </div>

                  {/* Allergens */}
                  {result.allergens && result.allergens.length > 0 && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                      <h4 className="font-bold mb-2 flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        Allergen Alert
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.allergens.map((allergen, idx) => (
                          <Badge key={idx} variant="destructive">{getDisplayName(allergen)}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Choking Risk */}
                  {result.choking_risk && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <h4 className="font-bold mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Shield className="w-4 h-4" />
                        Choking Risk Assessment
                      </h4>
                      <p className="text-sm">{result.choking_risk}</p>
                    </div>
                  )}

                  {/* Preparation Tips */}
                  {result.preparation_tips && (
                    <div className="p-4 rounded-xl bg-mint/10 border border-mint/20">
                      <h4 className="font-bold mb-2 flex items-center gap-2 text-mint">
                        <ChefHat className="w-4 h-4" />
                        Expert Preparation Tips
                      </h4>
                      <p className="text-sm">{result.preparation_tips}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - History */}
          <div className="space-y-6">
            <Card className="border-2 border-accent/20">
              <div className="bg-gradient-to-r from-accent/10 to-primary/10 p-4 border-b">
                <h3 className="font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-accent" />
                  Recent Analyses
                </h3>
              </div>
              <CardContent className="p-4">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No analyses yet. Start by analyzing a food!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => fetchFullAnalysis(item.id)}
                      >
                        <div className={`p-2 rounded-lg ${item.is_recommended ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {item.is_recommended ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.identified_food}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.baby_age_months}mo • {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {loadingDetail === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-0">
              <CardContent className="p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Tips for Best Results
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Use good lighting for clearer analysis
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Focus on single foods for accuracy
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Include the whole food in frame
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Always verify with your pediatrician
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AnalysisDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        analysis={selectedAnalysis}
      />
    </main>
  );
};

export default FoodAnalyzer;