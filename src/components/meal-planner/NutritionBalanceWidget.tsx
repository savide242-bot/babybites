import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  CheckCircle2, 
  Beef, 
  Wheat, 
  Milk, 
  Flame, 
  Leaf, 
  Lightbulb, 
  Apple,
  HeartHandshake
} from "lucide-react";
import { recipes } from "@/data/recipes";
import { cn } from "@/lib/utils";

interface MealSlot {
  recipeId: string;
  prepared: boolean;
  dbId?: string;
}

interface MealPlan {
  [day: string]: {
    [mealType: string]: MealSlot;
  };
}

interface NutritionBalanceWidgetProps {
  mealPlan: MealPlan;
}

const nutritionTargets = {
  calories: { min: 700, max: 1000, label: "Calories", unit: "cal/day" },
  protein: { min: 15, max: 25, label: "Protein", unit: "g/day" },
};

const foodCategories = [
  { 
    id: "proteins", 
    icon: Beef, 
    color: "text-rose-600", 
    bgColor: "bg-rose-50/80 border-rose-100", 
    barColor: "bg-rose-500",
    label: "Proteins", 
    sublabel: "Iron & tissue growth",
    keywords: ["chicken", "beef", "turkey", "salmon", "fish", "egg", "meat", "lentil", "bean", "tofu", "chickpea"] 
  },
  { 
    id: "vegetables", 
    icon: Apple, 
    color: "text-emerald-700", 
    bgColor: "bg-emerald-50/80 border-emerald-100", 
    barColor: "bg-emerald-600",
    label: "Vegetables", 
    sublabel: "Vitamins & digestion",
    keywords: ["carrot", "broccoli", "spinach", "pea", "sweet potato", "vegetable", "zucchini", "pumpkin", "kale", "avocado", "cauliflower", "squash"] 
  },
  { 
    id: "grains", 
    icon: Wheat, 
    color: "text-amber-700", 
    bgColor: "bg-amber-50/80 border-amber-100", 
    barColor: "bg-amber-500",
    label: "Grains", 
    sublabel: "Sustained daily energy",
    keywords: ["rice", "oat", "quinoa", "pasta", "bread", "cereal", "wheat", "barley", "couscous", "millet"] 
  },
  { 
    id: "dairy", 
    icon: Milk, 
    color: "text-sky-700", 
    bgColor: "bg-sky-50/80 border-sky-100", 
    barColor: "bg-sky-500",
    label: "Dairy & Fats", 
    sublabel: "Brain & bone health",
    keywords: ["milk", "cheese", "yogurt", "cream", "butter", "formula", "breast milk", "avocado", "olive oil"] 
  }
];

export const NutritionBalanceWidget = ({ mealPlan }: NutritionBalanceWidgetProps) => {
  const stats = useMemo(() => {
    const weeklyStats = {
      totalCalories: 0,
      totalProtein: 0,
      totalMeals: 0,
      activeDays: 0,
      categories: {} as Record<string, number>
    };

    foodCategories.forEach(cat => {
      weeklyStats.categories[cat.id] = 0;
    });

    if (!mealPlan || typeof mealPlan !== "object") return weeklyStats;

    let activeDaysCount = 0;

    Object.values(mealPlan).forEach(dayMeals => {
      if (!dayMeals || typeof dayMeals !== "object") return;
      
      let dayHasMeal = false;

      Object.values(dayMeals).forEach(slot => {
        if (!slot?.recipeId) return;
        const recipe = recipes.find(r => String(r.id) === String(slot.recipeId));
        if (recipe) {
          weeklyStats.totalMeals++;
          dayHasMeal = true;

          // Safe numeric parsing for calories and protein
          const calNum = parseInt(String(recipe.nutrition?.calories || "").replace(/[^0-9]/g, ""), 10);
          const proteinNum = parseInt(String(recipe.nutrition?.protein || "").replace(/[^0-9]/g, ""), 10);

          if (!isNaN(calNum)) weeklyStats.totalCalories += calNum;
          if (!isNaN(proteinNum)) weeklyStats.totalProtein += proteinNum;

          // Categorize ingredients
          const ingredientsLower = (recipe.ingredients || []).join(" ").toLowerCase() + " " + recipe.title.toLowerCase();
          foodCategories.forEach(cat => {
            if (cat.keywords.some(kw => ingredientsLower.includes(kw))) {
              weeklyStats.categories[cat.id]++;
            }
          });
        }
      });

      if (dayHasMeal) {
        activeDaysCount++;
      }
    });

    weeklyStats.activeDays = activeDaysCount;
    return weeklyStats;
  }, [mealPlan]);

  // Daily averages computed across active days
  const activeDivisor = Math.max(1, stats.activeDays);
  const avgCalories = stats.totalMeals > 0 ? Math.round(stats.totalCalories / activeDivisor) : 0;
  const avgProtein = stats.totalMeals > 0 ? Math.round(stats.totalProtein / activeDivisor) : 0;

  const totalCategoryOccurrences = Object.values(stats.categories).reduce((a, b) => a + b, 0);

  const getBalanceStatus = () => {
    if (stats.totalMeals === 0) return [];
    
    const tips: string[] = [];
    
    if (avgCalories > 0 && avgCalories < nutritionTargets.calories.min) {
      tips.push("Add calorie-dense items like pureed sweet potato or ripe avocado.");
    }
    if (avgProtein > 0 && avgProtein < nutritionTargets.protein.min) {
      tips.push("Include gentle protein sources like eggs, lentils, or soft chicken.");
    }

    if (stats.totalMeals >= 4) {
      if (stats.categories.vegetables === 0) {
        tips.push("Add colorful steamed vegetables for essential beta-carotene and vitamins.");
      }
      if (stats.categories.proteins === 0) {
        tips.push("Plan an iron-rich protein meal to support cognitive growth.");
      }
      if (stats.categories.grains === 0) {
        tips.push("Incorporate gentle grains like warm oatmeal or soft baby pasta.");
      }
    }

    if (tips.length === 0 && stats.totalMeals >= 6) {
      tips.push("Excellent variety! All key baby food groups are well-represented this week.");
    }

    return tips;
  };

  const issues = getBalanceStatus();
  const isBalanced = issues.length === 1 && issues[0].startsWith("Excellent") && stats.totalMeals >= 6;

  return (
    <div className="rounded-[24px] bg-white border border-[#EBE8DF] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300">
      {/* Botanical Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#F4F8F4] to-[#FAF9F5] border-b border-[#ECE8DE]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF5EE] border border-[#CCE0D2] flex items-center justify-center text-forest shrink-0">
              <Leaf className="w-5 h-5 text-[#1E5E3A]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-gray-900 text-base leading-tight">
                Weekly Nutrition Balance
              </h3>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                Pediatric food groups & daily goals
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {stats.totalMeals === 0 ? (
              <Badge variant="outline" className="border-[#D8D2C2] text-gray-500 bg-white/80 text-[11px] font-normal py-0.5">
                Awaiting Meals
              </Badge>
            ) : isBalanced ? (
              <Badge className="bg-[#EAF5EE] hover:bg-[#EAF5EE] text-[#1E5E3A] border border-[#CCE0D2] text-[11px] font-medium py-0.5">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Balanced
              </Badge>
            ) : (
              <Badge className="bg-[#FFF6E5] hover:bg-[#FFF6E5] text-[#975A16] border border-[#F6E0B5] text-[11px] font-medium py-0.5">
                <Sparkles className="h-3 w-3 mr-1" />
                {issues.length} {issues.length === 1 ? 'tip' : 'tips'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Daily Averages */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Daily Estimated Targets
            </span>
            <span className="text-[11px] text-gray-400">
              {stats.activeDays > 0 ? `${stats.activeDays} planned ${stats.activeDays === 1 ? 'day' : 'days'}` : 'Based on planned days'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Calories Card */}
            <div className="p-3.5 rounded-[18px] bg-[#FAF9F5] border border-[#EBE8DF] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Calories
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    ~{nutritionTargets.calories.min}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 my-1">
                  <span className={cn(
                    "text-xl font-bold font-serif leading-none",
                    stats.totalMeals === 0 ? "text-gray-400" :
                    avgCalories >= nutritionTargets.calories.min ? "text-[#1E5E3A]" : "text-amber-700"
                  )}>
                    {avgCalories}
                  </span>
                  <span className="text-[11px] text-gray-500">cal/day</span>
                </div>
              </div>

              <div className="mt-2.5">
                <div className="w-full h-1.5 bg-[#E8EDE4] rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      avgCalories >= nutritionTargets.calories.min ? "bg-[#48B774]" : "bg-amber-400"
                    )}
                    style={{ width: `${Math.min((avgCalories / nutritionTargets.calories.max) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Goal: 700 - 1,000 cal</p>
              </div>
            </div>

            {/* Protein Card */}
            <div className="p-3.5 rounded-[18px] bg-[#FAF9F5] border border-[#EBE8DF] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
                    <Beef className="w-3.5 h-3.5 text-rose-500" />
                    Protein
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    ~{nutritionTargets.protein.min}g
                  </span>
                </div>
                <div className="flex items-baseline gap-1 my-1">
                  <span className={cn(
                    "text-xl font-bold font-serif leading-none",
                    stats.totalMeals === 0 ? "text-gray-400" :
                    avgProtein >= nutritionTargets.protein.min ? "text-[#1E5E3A]" : "text-amber-700"
                  )}>
                    {avgProtein}
                  </span>
                  <span className="text-[11px] text-gray-500">g/day</span>
                </div>
              </div>

              <div className="mt-2.5">
                <div className="w-full h-1.5 bg-[#E8EDE4] rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      avgProtein >= nutritionTargets.protein.min ? "bg-[#48B774]" : "bg-amber-400"
                    )}
                    style={{ width: `${Math.min((avgProtein / nutritionTargets.protein.max) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Goal: 15 - 25g/day</p>
              </div>
            </div>
          </div>
        </div>

        {/* Food Groups Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Food Group Distribution
            </span>
            <span className="text-[11px] text-gray-400">
              {stats.totalMeals > 0 ? `${stats.totalMeals} meals planned` : 'Pediatric mix'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {foodCategories.map(cat => {
              const Icon = cat.icon;
              const count = stats.categories[cat.id] || 0;
              const percentage = totalCategoryOccurrences > 0 
                ? Math.round((count / totalCategoryOccurrences) * 100) 
                : 0;

              return (
                <div
                  key={cat.id}
                  className={cn(
                    "p-3 rounded-[16px] border transition-all flex flex-col justify-between",
                    cat.bgColor
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-white/90 border border-black/5 flex items-center justify-center shrink-0">
                        <Icon className={cn("w-3.5 h-3.5", cat.color)} />
                      </div>
                      <span className="text-xs font-semibold text-gray-800 truncate">
                        {cat.label}
                      </span>
                    </div>
                    <span className={cn("text-xs font-bold shrink-0", cat.color)}>
                      {percentage}%
                    </span>
                  </div>

                  <div>
                    <div className="w-full h-1 bg-white/70 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", cat.barColor)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">
                      {cat.sublabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pediatric Guidance / Status Banner */}
        {stats.totalMeals === 0 ? (
          <div className="p-4 rounded-[18px] bg-[#F7FAF7] border border-[#CCE0D2] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#EAF5EE] border border-[#CCE0D2] flex items-center justify-center text-[#1E5E3A] shrink-0 mt-0.5">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 leading-snug">
                Start Planning Your Baby's Meals
              </h4>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                Add breakfasts, lunches, and dinners to unlock live calorie estimates, protein goals, and pediatric food balance.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-[18px] bg-[#FDFBF7] border border-[#ECE5D8] space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FFF6E5] border border-[#F6E0B5] flex items-center justify-center text-amber-700 shrink-0">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-gray-800">
                Pediatric Nutrition Guidance
              </h4>
            </div>
            <ul className="space-y-1.5 pl-1">
              {issues.map((tip, idx) => (
                <li key={idx} className="text-xs text-gray-700 leading-snug flex items-start gap-2">
                  <span className="text-[#48B774] font-bold mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
