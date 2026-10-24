import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, AlertCircle, CheckCircle2, Clock, ChevronRight, Info, Heart, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export interface AllergenItem {
  id: string;
  name: string;
  emoji: string;
  recommendedAge: string;
  status: "not_introduced" | "testing" | "tolerated" | "reaction";
  testDate?: string;
  safetyTip: string;
  recommendedRecipeId?: string;
  recommendedRecipeTitle?: string;
}

const INITIAL_ALLERGENS: AllergenItem[] = [
  {
    id: "peanut",
    name: "Peanut",
    emoji: "🥜",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Never give whole peanuts (choking hazard). Thin 100% smooth peanut butter with breastmilk, formula, or warm water.",
    recommendedRecipeId: "recipe-337",
    recommendedRecipeTitle: "PB Banana Toast or Puree Swirl",
  },
  {
    id: "egg",
    name: "Egg",
    emoji: "🥚",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Cook egg thoroughly (no runny yolks). Start with hard-boiled yolk mashed into purees or soft cooked scrambled egg.",
    recommendedRecipeId: "recipe-328",
    recommendedRecipeTitle: "Spinach Egg Cups & Mashed Yolk",
  },
  {
    id: "dairy",
    name: "Cow's Milk (Dairy)",
    emoji: "🥛",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Whole milk as a main drink waits until 12m, but plain whole-milk unsweetened yogurt and pasteurized cheese are great from 6m.",
    recommendedRecipeId: "recipe-342",
    recommendedRecipeTitle: "Whole Milk Plain Greek Yogurt Swirl",
  },
  {
    id: "wheat",
    name: "Wheat & Gluten",
    emoji: "🌾",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Introduce via baby oatmeal containing wheat, soft cooked pasta stars, or lightly toasted infant bread fingers.",
    recommendedRecipeId: "recipe-322",
    recommendedRecipeTitle: "Soft Tiny Pasta with Veggie Sauce",
  },
  {
    id: "fish",
    name: "Fish",
    emoji: "🐟",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Choose low-mercury fish like wild salmon, cod, or light canned tuna. Double check and remove any tiny bones.",
    recommendedRecipeId: "recipe-326",
    recommendedRecipeTitle: "Salmon Sweet Potato Flakes",
  },
  {
    id: "tree-nuts",
    name: "Tree Nuts (Almond/Cashew)",
    emoji: "🌰",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Never whole nuts. Stir 1/4 teaspoon smooth almond butter or cashew cream into morning warm baby porridge.",
    recommendedRecipeId: "recipe-334",
    recommendedRecipeTitle: "Almond Butter Porridge Swirl",
  },
  {
    id: "sesame",
    name: "Sesame",
    emoji: "🌿",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Use smooth tahini (sesame paste) mixed into sweet potato puree or spread super thinly on toast strips.",
    recommendedRecipeId: "recipe-330",
    recommendedRecipeTitle: "Mild Tahini Sweet Potato Mash",
  },
  {
    id: "soy",
    name: "Soy",
    emoji: "🌱",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Steam soft silken tofu or offer mashed edamame beans blended completely smooth.",
    recommendedRecipeId: "recipe-319",
    recommendedRecipeTitle: "Silken Tofu Fruit Puree",
  },
  {
    id: "shellfish",
    name: "Shellfish",
    emoji: "🦐",
    recommendedAge: "From 7-8 months",
    status: "not_introduced",
    safetyTip: "Well-cooked shrimp finely minced or pureed into a gentle vegetable broth.",
    recommendedRecipeId: "recipe-324",
    recommendedRecipeTitle: "Finely Minced Shrimp Broth",
  },
];

export const AllergenTracker: React.FC = () => {
  const [allergens, setAllergens] = useState<AllergenItem[]>(() => {
    const saved = localStorage.getItem("babybites_allergens");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_ALLERGENS;
      }
    }
    return INITIAL_ALLERGENS;
  });

  useEffect(() => {
    localStorage.setItem("babybites_allergens", JSON.stringify(allergens));
  }, [allergens]);

  const updateStatus = (id: string, newStatus: AllergenItem["status"]) => {
    setAllergens((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            status: newStatus,
            testDate: newStatus !== "not_introduced" ? new Date().toISOString() : undefined,
          };
          if (newStatus === "tolerated") {
            toast.success(`🎉 Great milestone! ${item.name} marked as safe!`);
          } else if (newStatus === "reaction") {
            toast.warning(`Note recorded. Consult your pediatrician regarding ${item.name}.`);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const toleratedCount = allergens.filter((a) => a.status === "tolerated").length;
  const testingCount = allergens.filter((a) => a.status === "testing").length;

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-semibold tracking-wider uppercase text-[#48B774]">
          Pediatric Safety Protocol
        </span>
        <h1 className="text-3xl font-serif font-bold text-forest mt-0.5 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-[#48B774]" /> Top 9 Allergen Tracker
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Early, gentle exposure is recommended by pediatric guidelines to help prevent allergies. Track each one step-by-step.
        </p>
      </div>

      {/* Progress Card */}
      <div className="rounded-[28px] bg-white border border-[#EBE8DF] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif font-bold text-gray-900 text-sm">
            Allergen Introduction Progress
          </span>
          <span className="text-xs font-semibold text-forest">
            {toleratedCount} of 9 Tolerated
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#48B774] to-[#1E5E3A] transition-all duration-500 rounded-full"
            style={{ width: `${(toleratedCount / 9) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-[#F5F3EC]">
          <div>
            <span className="text-lg font-serif font-bold text-[#48B774]">
              {toleratedCount}
            </span>
            <span className="block text-[10px] text-gray-500">Safe & Tolerated</span>
          </div>
          <div>
            <span className="text-lg font-serif font-bold text-[#E28743]">
              {testingCount}
            </span>
            <span className="block text-[10px] text-gray-500">Currently Testing</span>
          </div>
          <div>
            <span className="text-lg font-serif font-bold text-gray-400">
              {9 - toleratedCount - testingCount}
            </span>
            <span className="block text-[10px] text-gray-500">Yet to Introduce</span>
          </div>
        </div>
      </div>

      {/* Pediatric Golden Rules Banner */}
      <div className="p-4 rounded-[22px] bg-[#EAF5EE] border border-[#CCE0D2] mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
        <div className="text-xs text-forest leading-relaxed">
          <strong>Pediatric Rules of Thumb:</strong> Introduce 1 new allergen at a time in the morning. Offer a tiny taste (1/4 tsp) and wait 3–5 days before introducing another new allergen to monitor for reactions.
        </div>
      </div>

      {/* Allergen Cards List */}
      <div className="space-y-4">
        {allergens.map((item) => (
          <div
            key={item.id}
            className="rounded-[24px] bg-white border border-[#EBE8DF] p-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] transition-all"
          >
            {/* Top row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <h3 className="font-serif font-bold text-gray-900 text-base leading-tight">
                    {item.name}
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Recommended: {item.recommendedAge}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                  item.status === "tolerated"
                    ? "bg-[#EAF5EE] text-[#1E5E3A]"
                    : item.status === "testing"
                    ? "bg-[#FFF6E5] text-[#B7791F]"
                    : item.status === "reaction"
                    ? "bg-[#FDF2F4] text-[#C53030]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {item.status === "tolerated"
                  ? "✓ Tolerated"
                  : item.status === "testing"
                  ? "⏳ Testing (Day 1-3)"
                  : item.status === "reaction"
                  ? "⚠️ Reaction Noted"
                  : "Not Introduced"}
              </span>
            </div>

            {/* Safety Guidance */}
            <p className="text-xs text-gray-600 bg-[#FAF9F5] p-3 rounded-2xl border border-[#F0ECE1] my-2 leading-relaxed">
              💡 {item.safetyTip}
            </p>

            {/* Recommended recipe shortcut */}
            {item.recommendedRecipeTitle && (
              <Link
                to="/recipes"
                className="inline-flex items-center gap-1.5 text-xs text-forest font-semibold hover:underline mb-3"
              >
                <span>Recommended recipe: {item.recommendedRecipeTitle}</span>
                <ArrowRight className="w-3 h-3 text-[#48B774]" />
              </Link>
            )}

            {/* Status Selector Buttons */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#F5F3EC]">
              <button
                onClick={() => updateStatus(item.id, "testing")}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-colors border ${
                  item.status === "testing"
                    ? "bg-[#FFF6E5] text-[#975A16] border-[#F6E05E]"
                    : "bg-white text-gray-600 border-[#EBE8DF] hover:bg-gray-50"
                }`}
              >
                Start Testing
              </button>

              <button
                onClick={() => updateStatus(item.id, "tolerated")}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-colors border ${
                  item.status === "tolerated"
                    ? "bg-[#EAF5EE] text-[#1E5E3A] border-[#48B774]"
                    : "bg-white text-gray-600 border-[#EBE8DF] hover:bg-[#EAF5EE]"
                }`}
              >
                ✓ Safe & Tolerated
              </button>

              <button
                onClick={() => updateStatus(item.id, "reaction")}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-colors border ${
                  item.status === "reaction"
                    ? "bg-[#FDF2F4] text-[#C53030] border-[#E53E3E]"
                    : "bg-white text-gray-600 border-[#EBE8DF] hover:bg-red-50"
                }`}
              >
                ⚠️ Reaction
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllergenTracker;
