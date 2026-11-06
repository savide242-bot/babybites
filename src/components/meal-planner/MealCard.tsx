import { useState } from "react";
import { Check, RefreshCw, Plus, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Recipe {
  id: string;
  title: string;
  prepTime: string;
  calories?: number;
  image?: string;
}

interface MealCardProps {
  recipe: Recipe | null;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  prepared: boolean;
  onTogglePrepared: () => void;
  onRemove: () => void;
  onEdit: () => void;
  onAdd: () => void;
  onRecipeClick?: () => void;
}

const mealTypeConfig = {
  breakfast: {
    emoji: "🥞",
    label: "Breakfast",
    tagColor: "bg-[#FFF6E5] text-[#975A16]",
  },
  lunch: {
    emoji: "🥑",
    label: "Lunch",
    tagColor: "bg-[#EAF5EE] text-[#1E5E3A]",
  },
  dinner: {
    emoji: "🥕",
    label: "Dinner",
    tagColor: "bg-[#EBF8FF] text-[#2B6CB0]",
  },
  snack: {
    emoji: "🍓",
    label: "Snack",
    tagColor: "bg-[#FDF2F4] text-[#C53030]",
  },
};

export const MealCard = ({
  recipe,
  mealType,
  prepared,
  onTogglePrepared,
  onRemove,
  onEdit,
  onAdd,
  onRecipeClick,
}: MealCardProps) => {
  const config = mealTypeConfig[mealType];

  // Empty slot to add a meal
  if (!recipe) {
    return (
      <button
        onClick={onAdd}
        className="w-full h-24 rounded-[22px] border border-dashed border-[#DCD7CA] dark:border-stone-700 bg-[#FAF9F5]/70 dark:bg-stone-800/40 hover:bg-white dark:hover:bg-stone-800 hover:border-[#48B774] dark:hover:border-emerald-500 transition-all duration-200 flex items-center justify-center gap-3 p-3 group text-left cursor-pointer"
      >
        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 border border-[#E3DFD3] dark:border-stone-700 flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition-transform">
          {config.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-gray-700 dark:text-stone-200 block group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors">
            + Plan {config.label}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-stone-500">Tap to pick recipe</span>
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[22px] border p-2.5 sm:p-3 transition-all duration-200 bg-white dark:bg-stone-900 shadow-xs relative flex items-center gap-2.5 sm:gap-3",
        prepared
          ? "border-emerald-400/80 dark:border-emerald-700 bg-[#FAFDFB] dark:bg-emerald-950/25"
          : "border-[#EBE8DF] dark:border-stone-800 hover:border-emerald-300 dark:hover:border-stone-700 hover:shadow-xs"
      )}
    >
      {/* Recipe Thumbnail */}
      <div
        onClick={onRecipeClick}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-stone-800 flex-shrink-0 cursor-pointer border border-[#EBE8DF] dark:border-stone-700"
      >
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Recipe Info */}
      <div className="flex-1 min-w-0" onClick={onRecipeClick}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", config.tagColor)}>
            {config.emoji} {config.label}
          </span>
          {recipe.prepTime && (
            <span className="text-[10px] text-gray-400 dark:text-stone-500 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {recipe.prepTime}
            </span>
          )}
        </div>

        <h4 className="font-serif font-bold text-gray-900 dark:text-stone-100 text-xs sm:text-sm line-clamp-1 cursor-pointer hover:text-forest dark:hover:text-emerald-400 transition-colors">
          {recipe.title}
        </h4>

        {prepared && (
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
            <Check className="w-3 h-3 text-[#48B774]" /> Served ✓
          </span>
        )}
      </div>

      {/* Action Buttons: 1-Tap Swap, Check Prepared, and Remove */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Swap button */}
        <button
          onClick={onEdit}
          title="Swap recipe"
          className="w-7 h-7 rounded-full bg-[#FAF9F5] dark:bg-stone-800 border border-[#E3DFD3] dark:border-stone-700 hover:bg-white text-gray-600 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400 flex items-center justify-center transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3 h-3" />
        </button>

        {/* Check Prepared */}
        <button
          onClick={onTogglePrepared}
          title={prepared ? "Mark as unplanned" : "Mark as served/prepared"}
          className={cn(
            "w-7 h-7 rounded-full border flex items-center justify-center transition-all shadow-2xs",
            prepared
              ? "bg-[#48B774] border-[#48B774] text-white"
              : "bg-white dark:bg-stone-800 border-[#E3DFD3] dark:border-stone-700 text-gray-300 hover:text-[#48B774] hover:border-[#48B774]"
          )}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        {/* Remove */}
        <button
          onClick={onRemove}
          title="Remove from plan"
          className="w-7 h-7 rounded-full bg-white dark:bg-stone-800 text-gray-300 hover:text-red-500 flex items-center justify-center transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default MealCard;
