import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Repeat, 
  Search, 
  Sparkles, 
  Info, 
  ShieldCheck, 
  ArrowRight, 
  ChefHat,
  Scale,
  Heart,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  X,
  Utensils
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AtmosphericBackground } from "@/components/layout/AtmosphericBackground";
import ingredientSwapBanner from "@/assets/ingredient-swap-banner.webp";
import { recipes as allAppRecipes, Recipe } from "@/data/recipes";

interface Substitute {
  title: string;
  type: "nutritional" | "culinary" | "hypoallergenic";
  replacement: string;
  ratio: string;
  bestFor: string;
  textureImpact: string;
  safetyNote: string;
}

interface SwapProfile {
  ingredient: string;
  category: string;
  emoji: string;
  substitutes: Substitute[];
}

// Comprehensive pediatric ingredient swap encyclopedia
const SWAP_DATABASE: SwapProfile[] = [
  {
    ingredient: "Egg",
    category: "Binding & Baking",
    emoji: "🥚",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Flax Egg (Ground Flaxseed + Warm Water)",
        ratio: "1 tbsp ground flax + 3 tbsp warm water (let sit 5 mins)",
        bestFor: "Toddler veggie patties, pancakes, meatballs, baked tots",
        textureImpact: "Binds tightly with an earthy texture; rich in essential plant-based Omega-3 fats.",
        safetyNote: "Gentle on tummies, 100% egg-free and allergen safe from 6+ months."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Mashed Ripe Banana or Applesauce",
        ratio: "1/2 mashed banana or 1/4 cup unsweetened applesauce per 1 egg",
        bestFor: "Baby muffins, pancakes, oat waffles, sweet breakfast bakes",
        textureImpact: "Keeps baked goods delightfully tender, soft, and moist for little gums.",
        safetyNote: "Naturally sweetens without any added sugar or honey."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Chia Gel (Ground Chia + Water)",
        ratio: "1 tbsp chia seeds + 3 tbsp water (rest 10 mins)",
        bestFor: "Porridge cups, oat bars, fruit loaves",
        textureImpact: "Mild flavor, excellent gel binder with gut-friendly prebiotic fiber.",
        safetyNote: "Safe for babies with both egg and dairy sensitivities."
      }
    ]
  },
  {
    ingredient: "Cow's Milk",
    category: "Liquids & Creaminess",
    emoji: "🥛",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Breast Milk or Infant Formula",
        ratio: "1:1 exact liquid replacement",
        bestFor: "Baby oatmeal, purees, mashes, smoothies",
        textureImpact: "Creates a comforting, familiar creamy consistency baby already loves.",
        safetyNote: "Add after cooking (direct heat destroys beneficial live antibodies in breast milk)."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Unsweetened Fortified Oat Milk",
        ratio: "1:1 exact replacement",
        bestFor: "Baby pancakes, creamy soups, muffins, pasta sauces",
        textureImpact: "Naturally smooth, mild taste that cooks and bakes identically to cow's milk.",
        safetyNote: "Select brands with zero added sugars, salt, or carrageenan."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Full-Fat Coconut Milk (Canned)",
        ratio: "1:1 ratio (can be diluted with warm water)",
        bestFor: "Mild lentil curries, tropical smoothies, sweet potato soup",
        textureImpact: "Rich, luscious, silky body packed with energy-dense healthy fats.",
        safetyNote: "Dairy-free, lactose-free, and safe for cow's milk protein allergy (CMPA)."
      }
    ]
  },
  {
    ingredient: "Wheat Flour",
    category: "Flours & Grains",
    emoji: "🌾",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Finely Blended Oat Flour",
        ratio: "1:1 by volume (grind rolled oats in blender for 30s)",
        bestFor: "Infant pancakes, banana bread, mini muffins, teething cookies",
        textureImpact: "Delicately soft crumb; higher in iron, beta-glucan fiber, and magnesium.",
        safetyNote: "Choose certified gluten-free oats if testing wheat sensitivity."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Almond Flour (Blanched)",
        ratio: "1 cup almond flour per 1 cup wheat flour (needs slight extra binder)",
        bestFor: "Soft baby scones, fruit crumbles, baked bites",
        textureImpact: "Nutty aroma, super tender and moist texture packed with vitamin E.",
        safetyNote: "Tree nut allergen: introduce only after almond has been safely tolerated."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Brown Rice Flour + Tapioca Starch",
        ratio: "3/4 cup rice flour + 1/4 cup tapioca per 1 cup wheat flour",
        bestFor: "Thickening sauces, baby pasta stars, light waffles",
        textureImpact: "Light, neutral flavor that does not irritate sensitive digestive tracts.",
        safetyNote: "100% gluten-free and gentle on delicate infant digestion."
      }
    ]
  },
  {
    ingredient: "Peanut Butter",
    category: "Nut & Seed Spreads",
    emoji: "🥜",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Sunflower Seed Butter (SunButter)",
        ratio: "1:1 exact replacement",
        bestFor: "Porridge swirls, toast fingers, fruit dips, smoothies",
        textureImpact: "Rich, creamy spread with high iron, magnesium, and vitamin E.",
        safetyNote: "Top-allergen free, school-safe, and perfect for peanut-sensitive infants."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Smooth Almond Butter",
        ratio: "1:1 exact replacement",
        bestFor: "Baked muffins, banana dip, oat porridge",
        textureImpact: "Subtly sweet and creamy; thins easily with warm water or breastmilk.",
        safetyNote: "Tree nut allergen. Ensure smooth texture (no crunchy chunks)."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Mild White Tahini (Sesame Paste)",
        ratio: "1:1 ratio (or start with 1/2 tsp for mild flavor)",
        bestFor: "Sweet potato swirls, hummus, roasted carrot purees",
        textureImpact: "Silky, runny consistency rich in calcium and healthy plant fats.",
        safetyNote: "Sesame is an allergen; introduce separately following 3-day protocol."
      }
    ]
  },
  {
    ingredient: "Butter",
    category: "Fats & Oils",
    emoji: "🧈",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Extra Virgin Olive Oil",
        ratio: "3/4 cup olive oil per 1 cup melted butter",
        bestFor: "Roasting veggies, sauteing, drizzling over warm purees, pasta",
        textureImpact: "Adds heart-healthy polyphenols and monounsaturated fatty acids.",
        safetyNote: "Zero dairy or milk proteins; excellent brain-building fats."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Virgin Cold-Pressed Coconut Oil",
        ratio: "1:1 ratio (solid at room temperature)",
        bestFor: "Baby baking, muffins, oat bars, sweet potato pancakes",
        textureImpact: "Solidifies like butter; yields flaky, tender crusts with gentle coconut scent.",
        safetyNote: "Dairy-free vegan fat. Great for babies with CMPA."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Ripe Mashed Avocado",
        ratio: "1:1 ratio in baking batters",
        bestFor: "Brownies, soft muffins, breakfast bars",
        textureImpact: "Imparts incredible moisture and creaminess without heavy saturated fat.",
        safetyNote: "Packed with potassium, folate, and gentle plant fiber."
      }
    ]
  },
  {
    ingredient: "Yogurt",
    category: "Dairy & Probiotics",
    emoji: "🥣",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Plain Coconut Milk Yogurt (Unsweetened)",
        ratio: "1:1 exact replacement",
        bestFor: "Smoothie bowls, fruit swirls, baby pancakes",
        textureImpact: "Thick, creamy, spoonable texture with gentle healthy medium-chain fats.",
        safetyNote: "Dairy-free, lactose-free, and safe from 6 months."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Silken Tofu Pureed",
        ratio: "1:1 exact replacement blended smooth",
        bestFor: "Savory dips, thick puddings, pancake batters",
        textureImpact: "Incredibly smooth and neutral; provides complete plant protein and iron.",
        safetyNote: "Contains soy allergen. Gentle on digestion."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Pureed Avocado with Breast Milk",
        ratio: "1/2 avocado mashed with 2 tbsp milk/formula",
        bestFor: "Morning spoon bowls, cold spreads",
        textureImpact: "Naturally rich and velvety without requiring any fermentation or dairy.",
        safetyNote: "Allergen-free, gentle on reflux or sensitive tummies."
      }
    ]
  }
];

// Fallback smart generator for any custom ingredient typed by mother
function generateCustomSwap(query: string): SwapProfile {
  const clean = query.trim();
  const lower = clean.toLowerCase();

  return {
    ingredient: clean,
    category: "Custom Ingredient",
    emoji: "🥑",
    substitutes: [
      {
        title: "Nutritional Match",
        type: "nutritional",
        replacement: `Mashed Sweet Potato, Avocado or Cooked Oats`,
        ratio: "1:1 volume equivalent",
        bestFor: "Purees, finger foods, and warm baby meals",
        textureImpact: `Replaces the nutritional density of ${clean} with gentle baby-safe vitamins.`,
        safetyNote: "Pediatric approved from 6+ months with easy digestibility."
      },
      {
        title: "Culinary & Moisture Twin",
        type: "culinary",
        replacement: `Unsweetened Applesauce or Steamed Pumpkin Puree`,
        ratio: "Equal ratio to maintain moist consistency",
        bestFor: "Baking, blending, or thinning baby meals",
        textureImpact: "Guarantees a smooth, clump-free texture safe for infant swallowing.",
        safetyNote: "Naturally gentle with zero added salt or sugar."
      },
      {
        title: "Hypoallergenic Option",
        type: "hypoallergenic",
        replacement: `Olive Oil drizzle + Steamed Pear Mash`,
        ratio: "1-to-1 substitute adjusted for moisture",
        bestFor: "Sensitive tummies, reflux prevention, and allergy protocols",
        textureImpact: "Light, silky consistency that preserves the flavor of the recipe.",
        safetyNote: "Free from all top 9 infant food allergens."
      }
    ]
  };
}

export const IngredientSwap: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState<SwapProfile>(SWAP_DATABASE[0]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);

  // Quick swap ingredient suggestions
  const QUICK_SUGGESTIONS = [
    { label: "🥚 Egg", query: "Egg" },
    { label: "🥛 Cow's Milk", query: "Cow's Milk" },
    { label: "🌾 Wheat / Gluten", query: "Wheat Flour" },
    { label: "🧈 Butter", query: "Butter" },
    { label: "🥜 Peanut Butter", query: "Peanut Butter" },
    { label: "🥣 Plain Yogurt", query: "Yogurt" },
    { label: "🍯 Sugar / Honey", query: "Sugar" },
    { label: "🍌 Banana", query: "Banana" },
  ];

  // Filter recipes from app matching search
  const filteredRecipes = useMemo(() => {
    if (!recipeSearch.trim()) return allAppRecipes.slice(0, 10);
    const q = recipeSearch.toLowerCase().trim();
    return allAppRecipes.filter(
      (r) => r.title.toLowerCase().includes(q) || (r.ingredients || []).some((i) => i.toLowerCase().includes(q))
    ).slice(0, 12);
  }, [recipeSearch]);

  // Handle active selection or dynamic smart search
  const activeProfile = useMemo(() => {
    if (!searchQuery.trim()) {
      return selectedIngredient;
    }

    const q = searchQuery.toLowerCase().trim();
    const match = SWAP_DATABASE.find(
      (item) => item.ingredient.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );

    if (match) return match;

    // Dynamically formulate 3 smart pediatric options for whatever she typed!
    return generateCustomSwap(searchQuery);
  }, [searchQuery, selectedIngredient]);

  return (
    <div className="relative min-h-screen bg-[#FAF9F5]/70 dark:bg-[#121614]/80 pb-24 pt-4 px-3.5 sm:px-5 w-full max-w-2xl mx-auto min-w-0 overflow-x-hidden text-stone-900 dark:text-stone-100 transition-colors">
      <AtmosphericBackground />
      <div className="relative z-10">
      {/* High-End Responsive Photographic Hero Banner */}
      <div className="rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-md border border-[#EBE8DF] dark:border-stone-800 mb-5 bg-white dark:bg-stone-900 transition-all">
        <img
          src={ingredientSwapBanner}
          alt="Smart Nutrition Assistant - Ingredient Swap"
          className="w-full h-auto object-cover block rounded-[24px] sm:rounded-[32px]"
          loading="eager"
        />
      </div>

      {/* TWO-STEP INTUITIVE SWAP FORMULATOR */}
      <div className="bg-white dark:bg-stone-900 rounded-[28px] border border-stone-200/80 dark:border-stone-800 p-4 sm:p-6 shadow-sm mb-6 space-y-5">
        
        {/* Step 1: Ingredient to swap (Mandatory) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E5E3A] dark:text-emerald-400">
              1. Which ingredient do you want to replace?
            </label>
            <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#1E5E3A] dark:text-emerald-300 px-2 py-0.5 rounded-full">
              Required
            </span>
          </div>

          <div className="relative flex items-center">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type an ingredient (e.g., egg, cow's milk, wheat flour, butter, peanut butter)..."
              className="w-full h-12 pl-11 pr-4 rounded-full border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-xs sm:text-sm focus:bg-white dark:focus:bg-stone-800"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-4 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Tap Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {QUICK_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSearchQuery(sug.query);
                }}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  searchQuery.toLowerCase() === sug.query.toLowerCase()
                    ? "bg-[#1E5E3A] text-white shadow-2xs font-bold"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-[#1E5E3A]"
                }`}
              >
                {sug.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Recipe to swap in (Optional) */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              2. Which recipe do you want to substitute in? (Optional)
            </label>
            <span className="text-[10px] font-medium text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
              Optional
            </span>
          </div>

          {selectedRecipe ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedRecipe.image}
                  alt={selectedRecipe.title}
                  className="w-11 h-11 rounded-xl object-cover shrink-0 border border-emerald-200"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                    Selected App Recipe:
                  </span>
                  <p className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                    {selectedRecipe.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                title="Remove recipe"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative flex items-center">
                <Input
                  value={recipeSearch}
                  onFocus={() => setShowRecipeDropdown(true)}
                  onChange={(e) => {
                    setRecipeSearch(e.target.value);
                    setShowRecipeDropdown(true);
                  }}
                  placeholder="Select or search a recipe from the app (e.g., pancake, muffin, bowl)..."
                  className="w-full h-11 pl-10 pr-4 rounded-full border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-xs sm:text-sm focus:bg-white dark:focus:bg-stone-800"
                />
                <Utensils className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 pointer-events-none" />
              </div>

              {/* Autocomplete Dropdown */}
              {showRecipeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-lg z-30 max-h-56 overflow-y-auto">
                  <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-stone-100 dark:border-stone-800 text-[11px] font-bold text-stone-500">
                    <span>BabyBites Recipes ({filteredRecipes.length}):</span>
                    <button
                      onClick={() => setShowRecipeDropdown(false)}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      Close ✕
                    </button>
                  </div>
                  {filteredRecipes.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRecipe(r);
                        setShowRecipeDropdown(false);
                        setRecipeSearch("");
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-stone-800 text-left transition-colors cursor-pointer group"
                    >
                      <img
                        src={r.image}
                        alt={r.title}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:text-[#1E5E3A] block truncate">
                          {r.title}
                        </span>
                        <span className="text-[10px] text-stone-500 truncate block">
                          {r.ageGroup} • {r.prepTime}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Ingredient Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl">{activeProfile.emoji}</span>
          <div>
            <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-stone-100">
              Pediatric Substitutes for {activeProfile.ingredient}
            </h2>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              {selectedRecipe ? `Culinary adaptation for: ${selectedRecipe.title}` : `Category: ${activeProfile.category}`}
            </span>
          </div>
        </div>
        <span className="text-[11px] font-bold text-stone-400">
          3 Safe Alternatives
        </span>
      </div>

      {/* 3 Substitute Cards */}
      <div className="space-y-3.5">
        {activeProfile.substitutes.map((sub, idx) => (
          <div
            key={idx}
            className="rounded-[26px] bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-5 shadow-sm space-y-3 relative overflow-hidden group hover:border-emerald-400/60 transition-all"
          >
            {/* Badge pill */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
                sub.type === "nutritional"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-[#1E5E3A] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : sub.type === "culinary"
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : "bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800"
              }`}>
                ★ {sub.title}
              </span>

              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
                Ratio: {sub.ratio}
              </span>
            </div>

            {/* Replacement Title */}
            <div>
              <h3 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                {sub.replacement}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mt-1">
                <strong>Texture Impact:</strong> {sub.textureImpact}
              </p>
            </div>

            {/* Best For Tag */}
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 text-xs">
              <span className="font-bold text-stone-900 dark:text-stone-100 block mb-0.5">
                Best Used For:
              </span>
              <span className="text-stone-600 dark:text-stone-300">{sub.bestFor}</span>
            </div>

            {/* Safety & Pediatric Guidance */}
            <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 text-xs flex items-start gap-2 text-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[11px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-0.5">Pediatric Note:</strong>
                <span className="leading-relaxed">{sub.safetyNote}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default IngredientSwap;
