import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Info, 
  Heart, 
  ArrowRight,
  Sparkles,
  Calendar,
  AlertTriangle,
  RotateCcw,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { AtmosphericBackground } from "@/components/layout/AtmosphericBackground";
import allergen3DayRuleBanner from "@/assets/allergen-3day-rule-banner.webp";

export interface AllergenItem {
  id: string;
  name: string;
  emoji: string;
  recommendedAge: string;
  status: "not_introduced" | "testing" | "tolerated" | "reaction";
  testDay?: 1 | 2 | 3;
  lastTestedDate?: string;
  safetyTip: string;
  preparationAdvice: string;
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
    safetyTip: "Never give whole peanuts (choking hazard). Mix smooth 100% peanut butter with warm breastmilk, formula, or banana puree.",
    preparationAdvice: "Day 1: 1/4 tsp smooth PB thinned with milk. Day 2: 1/2 tsp. Day 3: 1 tsp mixed into breakfast oatmeal.",
    recommendedRecipeId: "recipe-337",
    recommendedRecipeTitle: "PB Banana Puree Swirl",
  },
  {
    id: "egg",
    name: "Egg",
    emoji: "🥚",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Cook egg thoroughly (no runny yolk or raw egg). Start with well-cooked hard-boiled yolk or gentle egg ribbons.",
    preparationAdvice: "Day 1: 1/4 hard-boiled egg yolk mashed with breastmilk. Day 2: 1/2 yolk. Day 3: Soft scramble (whole egg fully cooked).",
    recommendedRecipeId: "recipe-328",
    recommendedRecipeTitle: "Spinach Egg Cups & Mashed Yolk",
  },
  {
    id: "dairy",
    name: "Cow's Milk (Dairy)",
    emoji: "🥛",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Whole cow's milk as a beverage is for 12m+, but whole-milk plain unsweetened Greek yogurt and pasteurized cheese are ideal from 6m.",
    preparationAdvice: "Day 1: 1 tsp plain whole Greek yogurt. Day 2: 1 tbsp with fruit. Day 3: 2 tbsp or grated mild pasteurized cheese.",
    recommendedRecipeId: "recipe-342",
    recommendedRecipeTitle: "Plain Greek Yogurt Berry Swirl",
  },
  {
    id: "wheat",
    name: "Wheat & Gluten",
    emoji: "🌾",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Introduce via single-grain baby cereal containing wheat, lightly toasted crust-free bread strips, or well-cooked soft tiny pasta.",
    preparationAdvice: "Day 1: 1 tsp baby wheat cereal in fruit puree. Day 2: 2 tbsp cereal. Day 3: Soft-cooked wheat pasta finger foods.",
    recommendedRecipeId: "recipe-322",
    recommendedRecipeTitle: "Soft Tiny Pasta with Veggie Sauce",
  },
  {
    id: "fish",
    name: "Fish",
    emoji: "🐟",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Choose low-mercury fish such as wild salmon, cod, or light flaked tuna. Double check meticulously for any pin bones.",
    preparationAdvice: "Day 1: 1/2 tsp flaked cooked salmon mixed into sweet potato. Day 2: 1 tsp. Day 3: 1-2 tbsp flaked fish fingers.",
    recommendedRecipeId: "recipe-326",
    recommendedRecipeTitle: "Salmon Sweet Potato Flakes",
  },
  {
    id: "tree-nuts",
    name: "Tree Nuts (Almond/Cashew)",
    emoji: "🌰",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Never whole nuts or big spoonfuls. Stir smooth raw almond butter or cashew butter smoothly into warm baby porridge.",
    preparationAdvice: "Day 1: 1/4 tsp almond butter melted into warm porridge. Day 2: 1/2 tsp. Day 3: 1 tsp in smoothie or oatmeal bowl.",
    recommendedRecipeId: "recipe-334",
    recommendedRecipeTitle: "Almond Butter Porridge Swirl",
  },
  {
    id: "sesame",
    name: "Sesame",
    emoji: "🌿",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Use 100% smooth pure tahini (sesame paste) mixed into mashed sweet potato, warm porridge, or spread ultra-thinly on soft toast.",
    preparationAdvice: "Day 1: 1/4 tsp tahini stirred into puree. Day 2: 1/2 tsp. Day 3: 1 tsp mixed into hummus or roasted squash dip.",
    recommendedRecipeId: "recipe-330",
    recommendedRecipeTitle: "Mild Tahini Sweet Potato Mash",
  },
  {
    id: "soy",
    name: "Soy",
    emoji: "🌱",
    recommendedAge: "From 6 months",
    status: "not_introduced",
    safetyTip: "Steam organic silken tofu or mash tender edamame beans completely until ultra-smooth without skins.",
    preparationAdvice: "Day 1: 1 cube (1 tbsp) steamed silken tofu mashed with avocado. Day 2: 2 tbsp. Day 3: Soft tofu finger sticks.",
    recommendedRecipeId: "recipe-319",
    recommendedRecipeTitle: "Silken Tofu Fruit Puree",
  },
  {
    id: "shellfish",
    name: "Shellfish (Shrimp)",
    emoji: "🦐",
    recommendedAge: "From 7-8 months",
    status: "not_introduced",
    safetyTip: "Thoroughly cook fresh shrimp, devein, and puree or mince extremely fine. Never serve chewy, rubbery whole shrimp.",
    preparationAdvice: "Day 1: 1/4 tsp finely pureed shrimp in warm veggie broth. Day 2: 1/2 tsp. Day 3: 1 tbsp minced shrimp baby cake.",
    recommendedRecipeId: "recipe-324",
    recommendedRecipeTitle: "Finely Minced Shrimp Broth",
  },
];

export const AllergenTracker: React.FC = () => {
  const [allergens, setAllergens] = useState<AllergenItem[]>(() => {
    const saved = localStorage.getItem("babybites_allergens_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_ALLERGENS;
      }
    }
    // Fallback to legacy key if available
    const legacy = localStorage.getItem("babybites_allergens");
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        return INITIAL_ALLERGENS.map((item) => {
          const matched = parsed.find((p: any) => p.id === item.id);
          return matched ? { ...item, status: matched.status, lastTestedDate: matched.testDate } : item;
        });
      } catch (e) {
        return INITIAL_ALLERGENS;
      }
    }
    return INITIAL_ALLERGENS;
  });

  const [activeFilter, setActiveFilter] = useState<"all" | "tolerated" | "testing" | "pending">("all");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("babybites_allergens_v2", JSON.stringify(allergens));
  }, [allergens]);

  const updateItemStatus = (id: string, status: AllergenItem["status"], testDay?: 1 | 2 | 3) => {
    setAllergens((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated: AllergenItem = {
            ...item,
            status,
            testDay: testDay !== undefined ? testDay : (status === "testing" ? 1 : undefined),
            lastTestedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          };
          if (status === "tolerated") {
            toast.success(`🎉 Milestone Unlocked! ${item.name} is now verified safe & tolerated.`);
          } else if (status === "reaction") {
            toast.error(`Reaction noted for ${item.name}. Stop serving and contact your pediatrician.`);
          } else if (status === "testing") {
            toast.info(`Step recorded! Day ${testDay || 1} test logged for ${item.name}.`);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const toleratedCount = allergens.filter((a) => a.status === "tolerated").length;
  const testingCount = allergens.filter((a) => a.status === "testing").length;
  const reactionCount = allergens.filter((a) => a.status === "reaction").length;
  const pendingCount = 9 - toleratedCount - testingCount - reactionCount;

  const filteredAllergens = allergens.filter((item) => {
    if (activeFilter === "tolerated") return item.status === "tolerated";
    if (activeFilter === "testing") return item.status === "testing";
    if (activeFilter === "pending") return item.status === "not_introduced";
    return true;
  });

  const percentage = Math.round((toleratedCount / 9) * 100);

  return (
    <div className="relative min-h-screen bg-[#FAF9F5]/70 dark:bg-[#121614]/80 pb-28 pt-4 px-3.5 sm:px-6 w-full max-w-3xl mx-auto transition-colors">
      <AtmosphericBackground />
      <div className="relative z-10">
      {/* Editorial Luxury Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Pediatric Safety Protocol
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          Top 9 Allergen Roadmap
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xl leading-relaxed">
          Early, structured micro-dosing helps prevent food sensitivities. Track the pediatric 3-Day Rule with calm confidence.
        </p>
      </div>

      {/* Progress & Milestone Overview Card */}
      <div className="rounded-3xl bg-white dark:bg-stone-900/90 border border-[#EBE8DF] dark:border-stone-800 p-5 sm:p-6 shadow-sm mb-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F4F1EA] dark:border-stone-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Baby Immunity Journey
            </span>
            <h2 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-200 mt-0.5">
              {toleratedCount === 9
                ? "🌟 All 9 Core Allergens Successfully Introduced!"
                : `${toleratedCount} of 9 Introduced Safely`}
            </h2>
          </div>

          {/* Pill Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="w-24 sm:w-32 h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              {percentage}% Complete
            </span>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2.5 pt-4 text-center">
          <button 
            onClick={() => setActiveFilter("tolerated")}
            className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 transition-all text-left sm:text-center"
          >
            <span className="block text-xl sm:text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400">
              {toleratedCount}
            </span>
            <span className="text-[11px] font-medium text-emerald-800/80 dark:text-emerald-300/80">
              Safe & Tolerated
            </span>
          </button>

          <button 
            onClick={() => setActiveFilter("testing")}
            className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 hover:border-amber-300 transition-all text-left sm:text-center"
          >
            <span className="block text-xl sm:text-2xl font-serif font-bold text-amber-700 dark:text-amber-400">
              {testingCount}
            </span>
            <span className="text-[11px] font-medium text-amber-800/80 dark:text-amber-300/80">
              In 3-Day Test
            </span>
          </button>

          <button 
            onClick={() => setActiveFilter("pending")}
            className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/50 hover:border-stone-300 transition-all text-left sm:text-center"
          >
            <span className="block text-xl sm:text-2xl font-serif font-bold text-stone-600 dark:text-stone-300">
              {pendingCount}
            </span>
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
              Ready to Start
            </span>
          </button>
        </div>
      </div>

      {/* Pediatric 3-Day Rule Guide (High-Res Visual Banner) */}
      <div className="mb-6 rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-sm border border-[#EBE8DF] dark:border-stone-800 bg-white dark:bg-stone-900 transition-all">
        <img
          src={allergen3DayRuleBanner}
          alt="The Pediatric 3-Day Exposure Rule - Gentle, Step-by-Step Introduction"
          className="w-full h-auto object-cover block rounded-[24px] sm:rounded-[32px]"
          loading="eager"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {[
          { key: "all", label: `All (${allergens.length})` },
          { key: "tolerated", label: `✓ Tolerated (${toleratedCount})` },
          { key: "testing", label: `⏳ Testing (${testingCount})` },
          { key: "pending", label: `🌱 Needs Intro (${pendingCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              activeFilter === tab.key
                ? "bg-forest dark:bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-[#EBE8DF] dark:border-stone-700 hover:border-stone-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Allergen Cards */}
      <div className="space-y-3.5">
        {filteredAllergens.map((item) => {
          const isExpanded = expandedCard === item.id;
          const isTolerated = item.status === "tolerated";
          const isTesting = item.status === "testing";
          const isReaction = item.status === "reaction";

          return (
            <div
              key={item.id}
              className={`rounded-3xl bg-white dark:bg-stone-900 border transition-all duration-200 overflow-hidden ${
                isTolerated
                  ? "border-emerald-200/80 dark:border-emerald-800/40 shadow-xs"
                  : isTesting
                  ? "border-amber-300 dark:border-amber-700/60 shadow-xs ring-1 ring-amber-200/50"
                  : isReaction
                  ? "border-rose-300 dark:border-rose-800/60"
                  : "border-[#EBE8DF] dark:border-stone-800 hover:border-stone-300"
              }`}
            >
              {/* Card Main Bar */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700/60 flex items-center justify-center text-2xl shadow-2xs shrink-0">
                      {item.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base sm:text-lg leading-tight">
                          {item.name}
                        </h3>
                        {isTolerated && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                        {item.recommendedAge}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-tight shrink-0 ${
                      isTolerated
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60"
                        : isTesting
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 animate-pulse"
                        : isReaction
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/60"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    {isTolerated
                      ? "✓ Tolerated"
                      : isTesting
                      ? `⏳ Testing (Day ${item.testDay || 1})`
                      : isReaction
                      ? "⚠️ Reaction Noted"
                      : "🌱 Not Introduced"}
                  </span>
                </div>

                {/* 3-Day Stepper Interactive Bar */}
                <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-stone-800/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                      3-Day Protocol Status:
                    </span>
                    {item.lastTestedDate && (
                      <span className="text-[10px] text-stone-400">
                        Updated {item.lastTestedDate}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((dayNum) => {
                      const isDone = isTolerated || (isTesting && (item.testDay || 1) >= dayNum);
                      const isCurrent = isTesting && (item.testDay || 1) === dayNum;

                      return (
                        <button
                          key={dayNum}
                          onClick={() => updateItemStatus(item.id, "testing", dayNum as 1 | 2 | 3)}
                          className={`py-2 px-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                            isDone
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold"
                              : "bg-stone-50/80 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700/60 text-stone-400 dark:text-stone-500 hover:border-emerald-300"
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider">Day {dayNum}</span>
                          <span className="text-xs font-semibold">
                            {dayNum === 1 ? "1/4 Tsp" : dayNum === 2 ? "1/2 Tsp" : "Full Tsp"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Safe Preparation Advice */}
                <div className="mt-3.5 p-3 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  <strong className="text-amber-800 dark:text-amber-400 font-medium block mb-0.5">
                    💡 Pediatric Prep:
                  </strong>
                  {item.preparationAdvice}
                </div>

                {/* Action Buttons: Mark Safe, Recipe Link, Reaction */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => updateItemStatus(item.id, "tolerated")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isTolerated
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isTolerated ? "Verified Safe" : "Mark as Safe & Tolerated"}
                  </button>

                  {item.recommendedRecipeTitle && (
                    <Link
                      to="/recipes"
                      className="px-3.5 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3 text-stone-500" />
                      Recipe: {item.recommendedRecipeTitle}
                    </Link>
                  )}

                  {/* Reset or Reaction toggle */}
                  <div className="ml-auto flex items-center gap-1.5">
                    {item.status !== "not_introduced" && (
                      <button
                        onClick={() => updateItemStatus(item.id, "not_introduced")}
                        className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                        title="Reset introduction status"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => updateItemStatus(item.id, "reaction")}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                        isReaction
                          ? "bg-rose-600 text-white"
                          : "text-rose-600/80 dark:text-rose-400/80 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      }`}
                    >
                      Report Reaction
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default AllergenTracker;
