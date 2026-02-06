import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import { getRecipeImageById } from "@/data/recipeImages";
import { useRecipeImageOverrides } from "@/hooks/useRecipeImageOverrides";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface DuplicateGroup {
  hash: string;
  recipeIds: string[];
  imageSrc: string;
}

interface AnalysisResult {
  totalRecipes: number;
  uniqueImages: number;
  duplicateGroups: DuplicateGroup[];
  analyzing: boolean;
  progress: number;
}

const AdminRecipeImages = () => {
  const navigate = useNavigate();
  const { overrides, loading: overridesLoading, getImageWithOverride } = useRecipeImageOverrides();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    totalRecipes: recipes.length,
    uniqueImages: 0,
    duplicateGroups: [],
    analyzing: false,
    progress: 0,
  });
  const [fixing, setFixing] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate("/auth", { replace: true });
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          toast.error("Admin access required");
          navigate("/", { replace: true });
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error checking admin:", error);
        navigate("/", { replace: true });
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  // Compute SHA-256 hash of image bytes
  const computeImageHash = async (imageSrc: string): Promise<string | null> => {
    try {
      const response = await fetch(imageSrc);
      if (!response.ok) return null;
      
      const arrayBuffer = await response.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      return null;
    }
  };

  // Analyze all recipe images for duplicates
  const analyzeImages = async () => {
    setAnalysis((prev) => ({ ...prev, analyzing: true, progress: 0 }));

    const imageHashes: Map<string, { recipeIds: string[]; imageSrc: string }> = new Map();
    const total = recipes.length;

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const fallbackSrc = getRecipeImageById(recipe.id);
      const imageSrc = getImageWithOverride(recipe.id, fallbackSrc);
      
      const hash = await computeImageHash(imageSrc);
      
      if (hash) {
        const existing = imageHashes.get(hash);
        if (existing) {
          existing.recipeIds.push(recipe.id);
        } else {
          imageHashes.set(hash, { recipeIds: [recipe.id], imageSrc });
        }
      }

      setAnalysis((prev) => ({
        ...prev,
        progress: Math.round(((i + 1) / total) * 100),
      }));
    }

    // Find duplicates (groups with more than 1 recipe)
    const duplicateGroups: DuplicateGroup[] = [];
    imageHashes.forEach((value, hash) => {
      if (value.recipeIds.length > 1) {
        duplicateGroups.push({
          hash: hash.substring(0, 12),
          recipeIds: value.recipeIds,
          imageSrc: value.imageSrc,
        });
      }
    });

    // Sort by number of duplicates (most first)
    duplicateGroups.sort((a, b) => b.recipeIds.length - a.recipeIds.length);

    setAnalysis({
      totalRecipes: recipes.length,
      uniqueImages: imageHashes.size,
      duplicateGroups,
      analyzing: false,
      progress: 100,
    });
  };

  // Fix duplicates by regenerating images
  const fixDuplicates = async () => {
    if (analysis.duplicateGroups.length === 0) {
      toast.info("No duplicates to fix!");
      return;
    }

    setFixing(true);
    setFixProgress(0);

    // Collect all recipes that need new images (all but the first in each group)
    const recipesToFix: { id: string; title: string; ingredients: string[] }[] = [];
    
    analysis.duplicateGroups.forEach((group) => {
      // Keep the first one, regenerate the rest
      group.recipeIds.slice(1).forEach((recipeId) => {
        const recipe = recipes.find((r) => r.id === recipeId);
        if (recipe) {
          recipesToFix.push({
            id: recipe.id,
            title: recipe.title,
            ingredients: recipe.ingredients.slice(0, 5),
          });
        }
      });
    });

    if (recipesToFix.length === 0) {
      toast.info("No recipes to fix");
      setFixing(false);
      return;
    }

    // Process in batches of 5
    const batchSize = 5;
    let processed = 0;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < recipesToFix.length; i += batchSize) {
      const batch = recipesToFix.slice(i, i + batchSize);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Session expired");
          break;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fix-recipe-images`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recipes: batch,
              maxCount: batchSize,
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          successCount += result.results?.filter((r: any) => r.success).length || 0;
          failCount += result.results?.filter((r: any) => !r.success).length || 0;
        } else {
          failCount += batch.length;
        }
      } catch (error) {
        console.error("Error fixing batch:", error);
        failCount += batch.length;
      }

      processed += batch.length;
      setFixProgress(Math.round((processed / recipesToFix.length) * 100));
    }

    setFixing(false);
    toast.success(`Fixed ${successCount} images, ${failCount} failed`);
    
    // Re-analyze after fixing
    if (successCount > 0) {
      setTimeout(() => analyzeImages(), 2000);
    }
  };

  if (checkingAdmin || overridesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-24 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Recipe Image Auditor</h1>
            <p className="text-muted-foreground">Detect and fix duplicate recipe images</p>
          </div>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Image Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold">{analysis.totalRecipes}</div>
                <div className="text-sm text-muted-foreground">Total Recipes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500">{analysis.uniqueImages}</div>
                <div className="text-sm text-muted-foreground">Unique Images</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-500">{analysis.duplicateGroups.length}</div>
                <div className="text-sm text-muted-foreground">Duplicate Groups</div>
              </div>
            </div>

            {analysis.analyzing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing images... {analysis.progress}%
                </div>
                <Progress value={analysis.progress} />
              </div>
            )}

            {fixing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Regenerating images... {fixProgress}%
                </div>
                <Progress value={fixProgress} />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={analyzeImages}
                disabled={analysis.analyzing || fixing}
                className="flex-1"
              >
                {analysis.analyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Scan for Duplicates
              </Button>
              <Button
                onClick={fixDuplicates}
                disabled={analysis.analyzing || fixing || analysis.duplicateGroups.length === 0}
                variant="destructive"
                className="flex-1"
              >
                Fix All Duplicates
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overrides Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Active Overrides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {Object.keys(overrides).length} recipes have regenerated images stored in the database.
            </p>
          </CardContent>
        </Card>

        {/* Duplicate Groups */}
        {analysis.duplicateGroups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Duplicate Image Groups ({analysis.duplicateGroups.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.duplicateGroups.map((group) => (
                <div
                  key={group.hash}
                  className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg"
                >
                  <img
                    src={group.imageSrc}
                    alt="Duplicate"
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Hash: {group.hash}</Badge>
                      <Badge variant="destructive">{group.recipeIds.length} recipes</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.recipeIds.map((id) => {
                        const recipe = recipes.find((r) => r.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="text-xs">
                            #{id}: {recipe?.title?.substring(0, 25) || "Unknown"}...
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {analysis.duplicateGroups.length === 0 && analysis.uniqueImages > 0 && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="flex items-center gap-4 py-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400">
                  All Images Unique!
                </h3>
                <p className="text-sm text-muted-foreground">
                  No duplicate images detected across {analysis.totalRecipes} recipes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminRecipeImages;
