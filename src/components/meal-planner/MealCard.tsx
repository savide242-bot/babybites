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
        className="w-full h-24 rounded-[20px] border border-dashed border-[#DCD7CA] bg-[#FAF9F5]/70 hover:bg-white hover:border-[#48B774] transition-all duration-200 flex items-center justify-center gap-3 p-3 group text-left cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-white border border-[#E3DFD3] flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition-transform">
          {config.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-700 block group-hover:text-forest transition-colors">
            + Plan {config.label}
          </span>
          <span className="text-[11px] text-gray-400">Tap to pick a baby recipe</span>
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[20px] border p-3 transition-all duration-200 bg-white shadow-xs relative flex items-center gap-3",
        prepared
          ? "border-[#CCE0D2] bg-[#FAFDFB]"
          : "border-[#EBE8DF] hover:border-[#D0CBBF] hover:shadow-sm"
      )}
    >
      {/* Recipe Thumbnail */}
      <div
        onClick={onRecipeClick}
        className="w-16 h-16 rounded-[14px] overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer border border-[#EBE8DF]"
      >
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Recipe Info */}
      <div className="flex-1 min-w-0" onClick={onRecipeClick}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", config.tagColor)}>
            {config.emoji} {config.label}
          </span>
          {recipe.prepTime && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {recipe.prepTime}
            </span>
          )}
        </div>

        <h4 className="font-serif font-bold text-gray-900 text-xs sm:text-sm line-clamp-1 cursor-pointer hover:text-forest transition-colors">
          {recipe.title}
        </h4>

        {prepared && (
          <span className="text-[10px] text-[#2E7D32] font-semibold flex items-center gap-1 mt-0.5">
            <Check className="w-3 h-3 text-[#48B774]" /> Meal Prepared
          </span>
        )}
      </div>

      {/* Action Buttons: 1-Tap Swap, Check Prepared, and Remove */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Swap button */}
        <button
          onClick={onEdit}
          title="Swap recipe"
          className="w-7 h-7 rounded-full bg-[#FAF9F5] border border-[#E3DFD3] hover:bg-white text-gray-600 hover:text-forest flex items-center justify-center transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
        </button>

        {/* Check Prepared */}
        <button
          onClick={onTogglePrepared}
          title={prepared ? "Mark as unplanned" : "Mark as served/prepared"}
          className={cn(
            "w-7 h-7 rounded-full border flex items-center justify-center transition-all",
            prepared
              ? "bg-[#48B774] border-[#48B774] text-white"
              : "bg-white border-[#E3DFD3] text-gray-300 hover:text-[#48B774] hover:border-[#48B774]"
          )}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        {/* Remove */}
        <button
          onClick={onRemove}
          title="Remove from plan"
          className="w-7 h-7 rounded-full bg-white text-gray-300 hover:text-red-500 flex items-center justify-center transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default MealCard;
