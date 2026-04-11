import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { recipes } from "@/data/recipes";
import { RefreshCw, ChefHat, Clock } from "lucide-react";
import { getRecipeImageById } from "@/data/recipeImages";

interface WhatToCookWidgetProps {
  babyAgeMonths: number;
  babyName: string;
}

const getMealTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 10) return "breakfast";
  if (hour < 14) return "lunch";
  if (hour < 17) return "snack";
  return "dinner";
};

const WhatToCookWidget = ({ babyAgeMonths, babyName }: WhatToCookWidgetProps) => {
  const [shuffleCount, setShuffleCount] = useState(0);
  const navigate = useNavigate();

  const mealTime = getMealTimeOfDay();
  const displayName = babyName || "your baby";

  const recommendation = useMemo(() => {
    if (babyAgeMonths < 6) return null;

    let ageGroup = "6-9 months";
    if (babyAgeMonths >= 9 && babyAgeMonths < 12) ageGroup = "9-12 months";
    else if (babyAgeMonths >= 12 && babyAgeMonths < 18) ageGroup = "12-18 months";
    else if (babyAgeMonths >= 18) ageGroup = "18-24 months";

    const ageRecipes = recipes.filter((r) => {
      if (r.ageGroup === ageGroup) return true;
      if (babyAgeMonths >= 9 && r.ageGroup === "6-9 months") return true;
      if (babyAgeMonths >= 12 && r.ageGroup === "9-12 months") return true;
      return false;
    });

    // Score by meal time relevance
    const scored = ageRecipes.map((recipe) => {
      let score = 0;
      const title = recipe.title.toLowerCase();
      if (mealTime === "breakfast" && (title.includes("pancake") || title.includes("oatmeal") || title.includes("egg") || title.includes("porridge"))) score += 3;
      if ((mealTime === "lunch" || mealTime === "dinner") && (title.includes("chicken") || title.includes("salmon") || title.includes("pasta") || title.includes("rice"))) score += 3;
      if (mealTime === "snack" && (title.includes("puree") || title.includes("fruit") || title.includes("yogurt") || title.includes("bites"))) score += 3;
      return { recipe, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Pick from top candidates based on shuffle
    const topCandidates = scored.slice(0, Math.max(10, scored.length));
    const index = (shuffleCount + new Date().getDate()) % topCandidates.length;
    return topCandidates[index]?.recipe;
  }, [babyAgeMonths, mealTime, shuffleCount]);

  if (!recommendation || babyAgeMonths < 6) return null;

  const imageUrl = getRecipeImageById(recommendation.id);
  const mealTimeLabel = mealTime.charAt(0).toUpperCase() + mealTime.slice(1);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border border-primary/20 p-4">
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-[glow-pulse_3s_ease-in-out_infinite] pointer-events-none" />

      <div className="flex items-center gap-2 mb-3">
        <ChefHat className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground text-sm">
          What should I cook for {mealTimeLabel.toLowerCase()}?
        </h3>
      </div>

      <div className="flex gap-3 items-center">
        {/* Recipe image */}
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          <img
            src={imageUrl}
            alt={recommendation.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Recipe info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
            {recommendation.title}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{recommendation.prepTime}</span>
            <span>•</span>
            <span>{recommendation.nutrition?.calories || "—"} cal</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Perfect for {displayName} at {babyAgeMonths} months
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          className="flex-1 gap-1"
          onClick={() => navigate(`/recipe/${recommendation.id}`)}
        >
          Let's Cook This! 🍳
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShuffleCount((p) => p + 1)}
          className="gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Another
        </Button>
      </div>
    </div>
  );
};

export default WhatToCookWidget;
