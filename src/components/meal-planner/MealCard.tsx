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
    tagColor: "bg-[#FFF6E5] text-[#975A16] dark:bg-amber-950/60 dark:text-amber-300",
  },
  lunch: {
    emoji: "🥑",
    label: "Lunch",
    tagColor: "bg-[#EAF5EE] text-[#1E5E3A] dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  dinner: {
    emoji: "🥕",
    label: "Dinner",
    tagColor: "bg-[#EBF8FF] text-[#2B6CB0] dark:bg-sky-950/60 dark:text-sky-300",
  },
  snack: {
    emoji: "🍓",
    label: "Snack",
    tagColor: "bg-[#FDF2F4] text-[#C53030] dark:bg-rose-950/60 dark:text-rose-300",
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

  // Empty slot to add a meal (2-column side by side optimized)
  if (!recipe) {
    return (
      <button
        onClick={onAdd}
        className="w-full h-full min-h-[140px] sm:min-h-[160px] rounded-[20px] sm:rounded-[22px] border border-dashed border-[#DCD7CA] dark:border-stone-700 bg-white/70 dark:bg-stone-900/50 hover:bg-white dark:hover:bg-stone-800 hover:border-[#48B774] dark:hover:border-emerald-500 transition-all duration-200 flex flex-col items-center justify-center p-2.5 sm:p-3 text-center group cursor-pointer shadow-2xs"
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-[#FAF9F5] dark:bg-stone-800 border border-[#E3DFD3] dark:border-stone-700 flex items-center justify-center text-sm sm:text-lg shadow-2xs group-hover:scale-110 transition-transform mb-1.5">
          {config.emoji}
        </div>
        <span className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-stone-200 block group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors">
          + {config.label}
        </span>
        <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-stone-500 mt-0.5">
          Tap to plan
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[20px] sm:rounded-[22px] border transition-all duration-200 bg-white dark:bg-stone-900 shadow-2xs relative flex flex-col overflow-hidden group",
        prepared
          ? "border-emerald-400/80 dark:border-emerald-700 bg-[#FAFDFB] dark:bg-emerald-950/25"
          : "border-[#EBE8DF] dark:border-stone-800 hover:border-emerald-300 dark:hover:border-stone-700 hover:shadow-xs"
      )}
    >
      {/* Top Image Banner with Floating Meal Badge */}
      <div 
        onClick={onRecipeClick}
        className="w-full h-22 sm:h-28 relative overflow-hidden bg-gray-100 dark:bg-stone-800 cursor-pointer"
      >
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Floating Category Badge */}
        <div className="absolute top-1.5 left-1.5 z-10">
          <span className={cn("px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold backdrop-blur-md shadow-2xs flex items-center gap-1", config.tagColor)}>
            <span>{config.emoji}</span>
            <span className="truncate max-w-[60px] sm:max-w-none">{config.label}</span>
          </span>
        </div>

        {/* Served Indicator pill */}
        {prepared && (
          <div className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center gap-0.5 shadow-xs">
            <Check className="w-2.5 h-2.5 stroke-[3]" /> Served
          </div>
        )}
      </div>

      {/* Middle: Title & Prep Time */}
      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between" onClick={onRecipeClick}>
        <div>
          <h4 className="font-serif font-bold text-gray-900 dark:text-stone-100 text-[11px] sm:text-xs leading-snug line-clamp-2 cursor-pointer hover:text-forest dark:hover:text-emerald-400 transition-colors">
            {recipe.title}
          </h4>
          {recipe.prepTime && (
            <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-stone-500 flex items-center gap-0.5 mt-1">
              <Clock className="w-2.5 h-2.5" />
              {recipe.prepTime}
            </span>
          )}
        </div>

        {/* Bottom Actions Row: Swap, Remove & Serve Check */}
        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-100 dark:border-stone-800/80" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {/* Swap Button */}
            <button
              onClick={onEdit}
              title="Swap recipe"
              className="w-6 h-6 rounded-full bg-[#FAF9F5] dark:bg-stone-800 border border-[#E3DFD3] dark:border-stone-700 hover:bg-white text-gray-600 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400 flex items-center justify-center transition-colors shadow-2xs"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>

            {/* Remove Button */}
            <button
              onClick={onRemove}
              title="Remove from plan"
              className="w-6 h-6 rounded-full text-gray-300 hover:text-red-500 flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Toggle Prepared / Serve Button */}
          <button
            onClick={onTogglePrepared}
            title={prepared ? "Mark as unplanned" : "Mark as served"}
            className={cn(
              "px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border flex items-center gap-0.5 transition-all shadow-2xs",
              prepared
                ? "bg-[#48B774] border-[#48B774] text-white"
                : "bg-white dark:bg-stone-800 border-[#E3DFD3] dark:border-stone-700 text-gray-600 dark:text-stone-300 hover:text-[#48B774] hover:border-[#48B774]"
            )}
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
            <span>{prepared ? "Done" : "Serve"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealCard;
