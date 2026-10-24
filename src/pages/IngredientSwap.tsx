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
  Scale
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Substitute {
  replacement: string;
  ratio: string;
  bestFor: string;
  textureImpact: string;
  safetyNote: string;
}

interface SwapCategory {
  ingredient: string;
  category: string;
  emoji: string;
  commonIn: string;
  substitutes: Substitute[];
}

const INGREDIENT_SWAPS: SwapCategory[] = [
  {
    ingredient: "Egg",
    category: "Baking & Binding",
    emoji: "🥚",
    commonIn: "Pancakes, baby muffins, fritters, oat bites",
    substitutes: [
      {
        replacement: "Unsweetened Applesauce",
        ratio: "1/4 cup per 1 egg",
        bestFor: "Muffins, sweet oat bakes, pancakes",
        textureImpact: "Soft and very moist; slightly denser rise",
        safetyNote: "Gentle on sensitive tummies from 6+ months",
      },
      {
        replacement: "Mashed Ripe Banana",
        ratio: "1/2 medium banana per 1 egg",
        bestFor: "Pancakes, waffles, banana bread bites",
        textureImpact: "Naturally sweetens and binds well; adds banana flavor",
        safetyNote: "No allergens; high in potassium and fiber",
      },
      {
        replacement: "Flax Egg (Ground Flaxseed + Water)",
        ratio: "1 tbsp ground flax + 3 tbsp warm water (let sit 5 mins)",
        bestFor: "Savory veggie patties, toddler nuggets, meatballs",
        textureImpact: "Excellent earthy binder with neutral flavor",
        safetyNote: "Rich in plant-based Omega-3s (ALA)",
      },
      {
        replacement: "Plain Whole Milk Yogurt",
        ratio: "1/4 cup per 1 egg",
        bestFor: "Cakes, muffins, soft scones",
        textureImpact: "Creates very tender, fluffy crumb structure",
        safetyNote: "Contains dairy allergen; pasteurized whole milk only",
      },
    ],
  },
  {
    ingredient: "Cow's Milk",
    category: "Liquids & Moisture",
    emoji: "🥛",
    commonIn: "Baby oatmeal, smoothies, pancake batters, creamy purees",
    substitutes: [
      {
        replacement: "Breast Milk or Formula",
        ratio: "1:1 exact replacement",
        bestFor: "Porridge, purees, infant cereals",
        textureImpact: "Identical liquid balance, familiar comfort flavor",
        safetyNote: "Add after cooking (heat damages live antibodies in breast milk)",
      },
      {
        replacement: "Unsweetened Fortified Oat Milk",
        ratio: "1:1 exact replacement",
        bestFor: "Pancakes, muffins, creamy soups",
        textureImpact: "Naturally sweet and smooth; cooks cleanly",
        safetyNote: "Check label: no added sugars, salt, or carrageenan",
      },
      {
        replacement: "Full-Fat Coconut Milk (Canned)",
        ratio: "1:1 (or dilute slightly with water)",
        bestFor: "Curries, lentil dahl, tropical smoothie bowls",
        textureImpact: "Rich, luscious, thick creamy body",
        safetyNote: "High in healthy fats; introduce as single ingredient first",
      },
    ],
  },
  {
    ingredient: "Wheat Flour",
    category: "Flours & Grains",
    emoji: "🌾",
    commonIn: "Pancakes, toddler breads, finger food bites",
    substitutes: [
      {
        replacement: "Oat Flour (Blended Rolled Oats)",
        ratio: "1:1 by weight (or 1 cup wheat = 1 cup + 2 tbsp oat flour)",
        bestFor: "Pancakes, muffins, teething cookies",
        textureImpact: "Nutty, soft, slightly more absorbent",
        safetyNote: "Certified gluten-free oats if celiac or wheat-sensitive",
      },
      {
        replacement: "Buckwheat Flour",
        ratio: "1:1 for up to 50% of recipe, or 100% in baby crepes",
        bestFor: "Savory pancakes, galettes",
        textureImpact: "Earthy flavor, denser texture",
        safetyNote: "Despite the name, buckwheat is a naturally gluten-free seed",
      },
      {
        replacement: "Almond Flour",
        ratio: "1:1 (reduce liquid slightly by 1-2 tbsp)",
        bestFor: "Dense soft cookies, mini toddler cakes",
        textureImpact: "Moist, crumbly, rich texture",
        safetyNote: "Contains Tree Nut allergen; only after successful almond test",
      },
    ],
  },
  {
    ingredient: "Peanut Butter",
    category: "Spreads & Fats",
    emoji: "🥜",
    commonIn: "Smoothies, toast fingers, oat balls",
    substitutes: [
      {
        replacement: "Sunflower Seed Butter (SunButter)",
        ratio: "1:1 exact replacement",
        bestFor: "All daycare-safe snacks, baking, toast",
        textureImpact: "Almost identical creaminess and roasted flavor",
        safetyNote: "Top-9 allergen-free (school and daycare safe)",
      },
      {
        replacement: "Tahini (Pure Sesame Paste)",
        ratio: "1:1 exact replacement",
        bestFor: "Savory dips, smoothies, cookies",
        textureImpact: "Silky and smooth with nutty savory depth",
        safetyNote: "Sesame is an AAP Top-9 allergen; test carefully first",
      },
    ],
  },
  {
    ingredient: "Butter / Cooking Oil",
    category: "Healthy Fats",
    emoji: "🧈",
    commonIn: "Sautéing veggies, baking, baby grain bowls",
    substitutes: [
      {
        replacement: "Extra Virgin Olive Oil",
        ratio: "3/4 cup olive oil per 1 cup butter",
        bestFor: "Savory meals, roasting veggies, pasta sauces",
        textureImpact: "Heart-healthy monounsaturated fat; rich flavor",
        safetyNote: "Gold standard for baby brain and heart development",
      },
      {
        replacement: "Avocado Oil",
        ratio: "3/4 cup per 1 cup butter",
        bestFor: "High-heat cooking, baking without flavor change",
        textureImpact: "Completely neutral taste and high smoke point",
        safetyNote: "Packed with healthy oleic acid and vitamin E",
      },
      {
        replacement: "Mashed Ripe Avocado",
        ratio: "1:1 replacement in baking",
        bestFor: "Brownies, soft chocolate-avocado oat bites",
        textureImpact: "Fudgy and creamy with reduced saturated fat",
        safetyNote: "Rich in fiber and lutein for eye development",
      },
    ],
  },
];

export const IngredientSwap: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState<string>("Egg");

  const filteredSwaps = useMemo(() => {
    if (!searchQuery.trim()) return INGREDIENT_SWAPS;
    const q = searchQuery.toLowerCase();
    return INGREDIENT_SWAPS.filter(
      (item) =>
        item.ingredient.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.substitutes.some((s) => s.replacement.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const activeCategory = useMemo(() => {
    return INGREDIENT_SWAPS.find((i) => i.ingredient === selectedIngredient) || INGREDIENT_SWAPS[0];
  }, [selectedIngredient]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <span className="text-xs font-semibold tracking-wider uppercase text-[#48B774]">
          Kitchen Substitutions & Allergy Swaps
        </span>
        <h1 className="text-3xl font-serif font-bold text-forest mt-0.5 flex items-center gap-2">
          <Repeat className="w-8 h-8 text-[#48B774]" /> Ingredient Swap
        </h1>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          Missing an ingredient or avoiding an allergen? Discover verified, baby-safe substitutions that preserve recipe texture, baking ratios, and nutritional balance.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ingredient to replace (e.g. egg, milk, flour, butter)..."
          className="pl-9 h-11 rounded-full border border-[#D5D0C3] bg-white text-xs text-gray-800 focus-visible:ring-[#48B774]"
        />
      </div>

      {/* Ingredient Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {INGREDIENT_SWAPS.map((item) => (
          <button
            key={item.ingredient}
            onClick={() => setSelectedIngredient(item.ingredient)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedIngredient === item.ingredient
                ? "bg-forest text-white shadow-xs"
                : "bg-white text-gray-600 border border-[#EBE8DF] hover:bg-gray-50"
            }`}
          >
            <span>{item.emoji}</span>
            <span>Replace {item.ingredient}</span>
          </button>
        ))}
      </div>

      {/* Selected Ingredient Details */}
      {activeCategory && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Card */}
          <div className="bg-white rounded-[28px] border border-[#EBE8DF] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-[#FAF9F5] rounded-2xl border border-[#EBE8DF]">
                  {activeCategory.emoji}
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#48B774]">
                    {activeCategory.category}
                  </span>
                  <h2 className="font-serif font-bold text-forest text-xl">
                    Replacing {activeCategory.ingredient}
                  </h2>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Commonly used in: <span className="text-gray-700 font-medium">{activeCategory.commonIn}</span>
            </p>
          </div>

          {/* Substitutes List */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-forest text-base px-1">
              Best Safe Alternatives ({activeCategory.substitutes.length})
            </h3>

            {activeCategory.substitutes.map((sub, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[24px] border border-[#EBE8DF] p-4 sm:p-5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif font-bold text-gray-900 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#1E5E3A] flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    {sub.replacement}
                  </h4>
                  <span className="px-2.5 py-1 rounded-full bg-[#FAF9F5] border border-[#EBE8DF] text-forest text-[11px] font-bold whitespace-nowrap">
                    Ratio: {sub.ratio}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-[#F1EFEA]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                      Best For
                    </span>
                    <span className="text-gray-700 font-medium">{sub.bestFor}</span>
                  </div>

                  <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-[#F1EFEA]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                      Texture & Flavor
                    </span>
                    <span className="text-gray-700 font-medium">{sub.textureImpact}</span>
                  </div>
                </div>

                <div className="bg-[#F3F8F4] p-2.5 rounded-xl border border-[#CCE0D2] flex items-center gap-2 text-xs text-forest">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-[#48B774]" />
                  <span>{sub.safetyNote}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick link to Pantry Helper */}
          <div className="mt-6 p-4 rounded-[22px] bg-[#EAF5EE] border border-[#CCE0D2] flex items-center justify-between">
            <div>
              <h4 className="font-serif font-bold text-forest text-sm">
                Have other random ingredients?
              </h4>
              <p className="text-xs text-forest/80 mt-0.5">
                Use our interactive Pantry Helper to cook with whatever is in your fridge.
              </p>
            </div>
            <Link
              to="/pantry"
              className="px-3 py-1.5 rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white text-xs font-semibold whitespace-nowrap shadow-xs ml-3"
            >
              Pantry Helper →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientSwap;
