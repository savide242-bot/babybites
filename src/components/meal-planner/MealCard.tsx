import { useState } from "react";
import { Check, X, Edit2, Clock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRecipeImageById } from "@/data/recipeImages";

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
    gradient: "from-amber-400 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    icon: "🌅",
    label: "Breakfast"
  },
  lunch: {
    gradient: "from-green-400 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
    icon: "🥗",
    label: "Lunch"
  },
  dinner: {
    gradient: "from-purple-400 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30",
    icon: "🌙",
    label: "Dinner"
  },
  snack: {
    gradient: "from-cyan-400 to-teal-500",
    bgGradient: "from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30",
    icon: "🍎",
    label: "Snack"
  }
};

export const MealCard = ({
  recipe,
  mealType,
  prepared,
  onTogglePrepared,
  onRemove,
  onEdit,
  onAdd,
  onRecipeClick
}: MealCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const config = mealTypeConfig[mealType];

  if (!recipe) {
    return (
      <button
        onClick={onAdd}
        className={cn(
          "relative w-full h-32 rounded-xl border-2 border-dashed transition-all duration-300",
          "flex flex-col items-center justify-center gap-2",
          "hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
          `bg-gradient-to-br ${config.bgGradient} border-muted-foreground/30 hover:border-primary/50`
        )}
      >
        <div className="text-3xl group-hover:scale-110 transition-transform animate-pulse">
          {config.icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          Add {config.label}
        </span>
        <div className={cn(
          "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity",
          `bg-gradient-to-br ${config.gradient} blur-xl -z-10`
        )} style={{ opacity: 0.2 }} />
      </button>
    );
  }

  const recipeImage = getRecipeImageById(recipe.id);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    if (onRecipeClick) {
      onRecipeClick();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "relative w-full h-32 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer",
        "hover:scale-[1.02] hover:shadow-xl group",
        prepared && "ring-2 ring-green-500 ring-offset-2 ring-offset-background"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={recipeImage}
          alt={recipe.title}
          loading="lazy"
          decoding="async"
          className={cn(
            "w-full h-full object-cover transition-transform duration-500",
            isHovered && "scale-110"
          )}
        />
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
        )} />
      </div>

      {/* Meal Type Badge */}
      <div className={cn(
        "absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white",
        `bg-gradient-to-r ${config.gradient}`
      )}>
        {config.icon} {config.label}
      </div>

      {/* Action Buttons */}
      <div className={cn(
        "absolute top-2 right-2 flex gap-1 transition-opacity duration-200",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        <Button
          size="icon"
          variant="secondary"
          className="h-6 w-6 bg-white/90 hover:bg-white text-foreground"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-6 w-6"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h4 className="text-white font-semibold text-sm line-clamp-1 mb-1">
          {recipe.title}
        </h4>
        <div className="flex items-center gap-3 text-white/80 text-xs">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {recipe.prepTime}
          </span>
          {recipe.calories && (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {recipe.calories} cal
            </span>
          )}
        </div>
      </div>

      {/* Prepared Overlay */}
      {prepared && (
        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
          <div className="bg-green-500 rounded-full p-2 animate-scale-in">
            <Check className="h-6 w-6 text-white" />
          </div>
        </div>
      )}

      {/* Toggle Prepared Button */}
      <button
        onClick={onTogglePrepared}
        className={cn(
          "absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs font-medium transition-all",
          prepared
            ? "bg-green-500 text-white"
            : "bg-white/90 text-foreground hover:bg-white"
        )}
      >
        {prepared ? "✓ Done" : "Mark Done"}
      </button>
    </div>
  );
};
