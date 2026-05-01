import { AlertTriangle, Sparkles } from "lucide-react";
import {
  HIGH_IRON_FOODS,
  HIGH_CALCIUM_FOODS,
  VITAMIN_C_FOODS,
} from "@/data/hiddenMistakes";

interface SmartCombinationWarningProps {
  ingredients: string[];
}

const matches = (ingredient: string, list: string[]) => {
  const lower = ingredient.toLowerCase();
  return list.some((f) => lower.includes(f));
};

/**
 * Shows a warning card when a recipe combines iron + calcium (Mistake #1).
 * Shows a helpful tip when iron + vitamin C are paired (positive amplifier).
 */
const SmartCombinationWarning = ({ ingredients }: SmartCombinationWarningProps) => {
  if (!ingredients || ingredients.length === 0) return null;

  const hasIron = ingredients.some((i) => matches(i, HIGH_IRON_FOODS));
  const hasCalcium = ingredients.some((i) => matches(i, HIGH_CALCIUM_FOODS));
  const hasVitC = ingredients.some((i) => matches(i, VITAMIN_C_FOODS));

  // Mistake #1 alert
  if (hasIron && hasCalcium) {
    return (
      <div className="rounded-2xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">
            Smart Combination Alert
          </p>
          <p className="text-xs text-amber-700/90 dark:text-amber-300/90 leading-relaxed">
            This recipe pairs iron-rich foods with calcium-rich foods. They compete
            for the same gut transporter, reducing iron absorption. Consider serving
            the dairy as a snack 2 hours apart from this meal.
          </p>
        </div>
      </div>
    );
  }

  // Positive amplifier
  if (hasIron && hasVitC) {
    return (
      <div className="rounded-2xl border border-mint/40 bg-mint/10 p-4 flex gap-3">
        <Sparkles className="h-5 w-5 text-mint-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm text-mint-foreground">
            Smart Combination Boost
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">
            Excellent pairing — vitamin C in this recipe boosts iron absorption up to
            3x. Your baby will absorb significantly more from this meal.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default SmartCombinationWarning;
