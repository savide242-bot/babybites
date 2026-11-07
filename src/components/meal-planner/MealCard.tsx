import React from "react";
import { Check, RefreshCw, Clock, Trash2 } from "lucide-react";
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
    emoji: "🌅",
    label: "Breakfast",
    badgeClass: "bg-[#F97316]/95 text-white shadow-xs",
  },
  lunch: {
    emoji: "🥗",
    label: "Lunch",
    badgeClass: "bg-[#10B981]/95 text-white shadow-xs",
  },
  dinner: {
    emoji: "🌙",
    label: "Dinner",
    badgeClass: "bg-[#8B5CF6]/95 text-white shadow-xs",
  },
  snack: {
    emoji: "🍎",
    label: "Snack",
    badgeClass: "bg-[#06B6D4]/95 text-white shadow-xs",
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

  // Empty slot to add a meal (matching compact aspect ratio)
  if (!recipe) {
    return (
      <button
        onClick={onAdd}
        type="button"
        className="w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl border-2 border-dashed border-[#DCD7CA] dark:border-stone-700 bg-white/70 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 hover:border-[#48B774] dark:hover:border-emerald-500 transition-all duration-200 flex flex-col items-center justify-center p-3 text-center group cursor-pointer shadow-2xs"
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAF9F5] dark:bg-stone-800 border border-[#E3DFD3] dark:border-stone-700 flex items-center justify-center text-base sm:text-lg shadow-2xs group-hover:scale-110 transition-transform mb-1.5">
          {config.emoji}
        </div>
        <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-stone-200 block group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors">
          + {config.label}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-stone-500">
          Tap to plan
        </span>
      </button>
    );
  }

  return (
    <div
      onClick={onRecipeClick}
      className={cn(
        "relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden shadow-sm border transition-all duration-200 group cursor-pointer select-none",
        prepared
          ? "ring-2 ring-emerald-500 border-emerald-500"
          : "border-stone-200/90 dark:border-stone-800 hover:shadow-md hover:border-stone-300"
      )}
    >
      {/* Background Image filling 100% of the card */}
      <img
        src={recipe.image}
        alt={recipe.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* Dark gradient overlay for crystal-clear readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/30 pointer-events-none" />

      {/* Top Floating Row: Meal Type Badge + Quick Action Icons */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
        {/* Category Badge (Breakfast, Lunch, Dinner, Snack) */}
        <span
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1 backdrop-blur-xs",
            config.badgeClass
          )}
        >
          <span className="text-xs">{config.emoji}</span>
          <span className="tracking-wide">{config.label}</span>
        </span>

        {/* Hover / Quick Actions: Swap & Remove */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-80 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            title="Swap recipe"
            className="w-6 h-6 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-xs"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={onRemove}
            title="Remove from plan"
            className="w-6 h-6 rounded-full bg-black/50 hover:bg-rose-600 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-xs"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Bottom Content Area: Title + Meta (Clock + Mark Done Button) */}
      <div className="absolute bottom-2 left-2.5 right-2.5 z-10 flex flex-col gap-1">
        {/* Title */}
        <h4 className="text-white font-bold text-xs sm:text-[13px] leading-tight truncate drop-shadow-md">
          {recipe.title}
        </h4>

        {/* Bottom Meta Row */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          {/* Prep Time with Clock Icon */}
          <span className="text-[10px] sm:text-[11px] text-white/90 font-medium flex items-center gap-1 drop-shadow-sm">
            <Clock className="w-3 h-3 text-white/80 shrink-0" />
            <span className="truncate">{recipe.prepTime || "15 mins"}</span>
          </span>

          {/* Mark Done Pill Button (Exact Layout from Image) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePrepared();
            }}
            title={prepared ? "Click to unmark" : "Mark as completed"}
            className={cn(
              "px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm transition-all active:scale-95 shrink-0 flex items-center gap-1",
              prepared
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-white/95 hover:bg-white text-stone-900"
            )}
          >
            {prepared ? (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Done</span>
              </>
            ) : (
              <span>Mark Done</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealCard;
