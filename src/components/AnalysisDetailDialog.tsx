import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  XCircle,
  Flame,
  Beef,
  Cookie,
  Droplets,
  AlertTriangle,
  AlertCircle,
  ChefHat
} from "lucide-react";

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

export interface FullAnalysis {
  id: string;
  identified_food: string;
  is_recommended: boolean;
  recommendation_reason: string | null;
  baby_age_months: number;
  estimated_calories: number | null;
  estimated_protein_g: number | null;
  estimated_carbs_g: number | null;
  estimated_fats_g: number | null;
  vitamins: (string | VitaminMineral)[] | null;
  minerals: (string | VitaminMineral)[] | null;
  allergens: string[] | null;
  choking_risk: string | null;
  preparation_tips: string | null;
  suggested_recipes: (string | SuggestedRecipe)[] | null;
  confidence_score: number | null;
  created_at: string;
}

interface AnalysisDetailDialogProps {
  analysis: FullAnalysis | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getDisplayName = (item: string | VitaminMineral | SuggestedRecipe): string => {
  if (typeof item === 'string') return item;
  return item.name || 'Unknown';
};

const AnalysisDetailDialog = ({ analysis, open, onOpenChange }: AnalysisDetailDialogProps) => {
  if (!analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Analysis Details</DialogTitle>
        </DialogHeader>
        
        {/* Header with Recommendation Status */}
        <div className={`p-4 rounded-xl ${analysis.is_recommended ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <div className="flex items-center gap-3">
            {analysis.is_recommended ? (
              <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            )}
            <div>
              <h3 className="text-xl font-bold">{analysis.identified_food}</h3>
              <p className={`font-medium ${analysis.is_recommended ? 'text-green-600' : 'text-red-600'}`}>
                {analysis.is_recommended 
                  ? `✓ Recommended for ${analysis.baby_age_months} month old` 
                  : `✗ Not recommended for ${analysis.baby_age_months} month old`
                }
              </p>
            </div>
          </div>
          {analysis.recommendation_reason && (
            <p className="mt-3 text-sm">{analysis.recommendation_reason}</p>
          )}
          {analysis.confidence_score && (
            <p className="mt-2 text-xs text-muted-foreground">
              AI Confidence: {(analysis.confidence_score * 100).toFixed(0)}%
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Analyzed on {new Date(analysis.created_at).toLocaleDateString()} at {new Date(analysis.created_at).toLocaleTimeString()}
          </p>
        </div>

        {/* Nutritional Information */}
        {(analysis.estimated_calories || analysis.estimated_protein_g || analysis.estimated_carbs_g || analysis.estimated_fats_g) && (
          <>
            <h4 className="font-bold flex items-center gap-2 mt-4">
              <Flame className="w-4 h-4 text-orange-500" />
              Estimated Nutrition (per serving)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-orange-500/10 text-center">
                <Flame className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                <p className="text-lg font-bold">{analysis.estimated_calories || 0}</p>
                <p className="text-xs text-muted-foreground">Calories</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 text-center">
                <Beef className="w-5 h-5 mx-auto text-red-500 mb-1" />
                <p className="text-lg font-bold">{analysis.estimated_protein_g || 0}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/10 text-center">
                <Cookie className="w-5 h-5 mx-auto text-cyan-500 mb-1" />
                <p className="text-lg font-bold">{analysis.estimated_carbs_g || 0}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 text-center">
                <Droplets className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                <p className="text-lg font-bold">{analysis.estimated_fats_g || 0}g</p>
                <p className="text-xs text-muted-foreground">Fats</p>
              </div>
            </div>
          </>
        )}

        {/* Vitamins & Minerals */}
        {((analysis.vitamins && analysis.vitamins.length > 0) || (analysis.minerals && analysis.minerals.length > 0)) && (
          <div className="mt-4">
            <h4 className="font-bold mb-2">Vitamins & Minerals</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.vitamins?.map((v, i) => (
                <span key={`v-${i}`} className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-600">
                  {getDisplayName(v)}
                </span>
              ))}
              {analysis.minerals?.map((m, i) => (
                <span key={`m-${i}`} className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-600">
                  {getDisplayName(m)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allergens Warning */}
        {analysis.allergens && analysis.allergens.length > 0 && analysis.allergens[0] !== "None identified" && (
          <div className="p-4 rounded-lg bg-yellow-500/10 mt-4">
            <h4 className="font-bold mb-2 flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-4 h-4" />
              Potential Allergens
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.allergens.map((a, i) => (
                <span key={i} className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-700">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Choking Risk */}
        {analysis.choking_risk && (
          <div className="p-4 rounded-lg bg-red-500/10 mt-4">
            <h4 className="font-bold mb-2 flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              Choking Risk
            </h4>
            <p className="text-sm">{analysis.choking_risk}</p>
          </div>
        )}

        {/* Preparation Tips */}
        {analysis.preparation_tips && (
          <div className="p-4 rounded-lg bg-primary/5 mt-4">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-primary" />
              Preparation Tips
            </h4>
            <p className="text-sm whitespace-pre-line">{analysis.preparation_tips}</p>
          </div>
        )}

        {/* Suggested Recipes */}
        {analysis.suggested_recipes && analysis.suggested_recipes.length > 0 && (
          <div className="mt-4">
            <h4 className="font-bold mb-2">Suggested Recipes</h4>
            <div className="space-y-2">
              {analysis.suggested_recipes.map((recipe, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/10">
                  <p className="font-medium">{getDisplayName(recipe)}</p>
                  {typeof recipe === 'object' && recipe.description && (
                    <p className="text-xs text-muted-foreground mt-1">{recipe.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisDetailDialog;
