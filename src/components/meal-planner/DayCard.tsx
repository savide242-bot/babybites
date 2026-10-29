import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MealCard } from "./MealCard";
import { Copy, Trash2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { recipes as staticRecipes } from "@/data/recipes";
import { useAppRecipes } from "@/hooks/useAppRecipes";

interface MealSlot {
  recipeId: string;
  prepared: boolean;
  dbId?: string;
}

interface DayCardProps {
  day: string;
  dayIndex: number;
  meals: Record<string, MealSlot>;
  onAddMeal: (mealType: string) => void;
  onRemoveMeal: (mealType: string) => void;
  onTogglePrepared: (mealType: string) => void;
  onEditMeal: (mealType: string) => void;
  onCopyDay: () => void;
  onClearDay: () => void;
}

const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;

export const DayCard = ({
  day,
  dayIndex,
  meals,
  onAddMeal,
  onRemoveMeal,
  onTogglePrepared,
  onEditMeal,
  onCopyDay,
  onClearDay,
}: DayCardProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const { recipes: appRecipes } = useAppRecipes();

  const getRecipe = (recipeId: string) => {
    const pool = appRecipes && appRecipes.length > 0 ? appRecipes : staticRecipes;
    return pool.find((r) => String(r.id) === String(recipeId)) || staticRecipes.find((r) => String(r.id) === String(recipeId));
  };

  const plannedMeals = Object.keys(meals || {}).length;
  const preparedMeals = Object.values(meals || {}).filter((m) => m?.prepared).length;
  const isComplete = plannedMeals === 4 && preparedMeals === 4;

  return (
    <div className="rounded-[28px] bg-white border border-[#EBE8DF] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden mb-5 transition-all">
      {/* Day Header */}
      <div className="p-4 px-5 flex items-center justify-between border-b border-[#F5F3EC] bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#EAF5EE] border border-[#CCE0D2] flex items-center justify-center font-serif font-bold text-forest text-sm">
            {day.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-gray-900 text-lg leading-tight">
                {day}
              </h3>
              {isComplete && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#48B774] bg-[#EAF5EE] px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> All Done
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {plannedMeals}/4 meals planned • {preparedMeals} prepared
            </p>
          </div>
        </div>

        {/* Day Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onCopyDay}
            title="Copy meals to another day"
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClearDay}
            title="Clear day plan"
            className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Meals List */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-[#FCFCFA]">
          {mealTypes.map((mealType) => {
            const slot = meals[mealType];
            const recipe = slot ? getRecipe(slot.recipeId) : null;

            return (
              <MealCard
                key={mealType}
                mealType={mealType}
                recipe={
                  recipe
                    ? {
                        id: recipe.id,
                        title: recipe.title,
                        prepTime: recipe.prepTime,
                        image: recipe.image,
                      }
                    : null
                }
                prepared={slot?.prepared || false}
                onAdd={() => onAddMeal(mealType)}
                onRemove={() => onRemoveMeal(mealType)}
                onEdit={() => onEditMeal(mealType)}
                onTogglePrepared={() => onTogglePrepared(mealType)}
                onRecipeClick={() => recipe && navigate(`/recipe/${recipe.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DayCard;
