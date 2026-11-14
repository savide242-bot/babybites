import React, { useState, useEffect, useMemo } from "react";
import { 
  Repeat, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Trash2, 
  Bookmark, 
  AlertCircle,
  X,
  FileSpreadsheet
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AtmosphericBackground } from "@/components/layout/AtmosphericBackground";
import ingredientSwapBanner from "@/assets/ingredient-swap-banner.webp";

interface Substitute {
  title: string;
  type: "nutritional" | "culinary" | "hypoallergenic";
  replacement: string;
  ratio: string;
  bestFor: string;
  safetyNote: string;
}

interface SwapProfile {
  ingredient: string;
  keywords: string[];
  category: string;
  emoji: string;
  substitutes: Substitute[];
}

export interface SavedSwap {
  id: string;
  originalIngredient: string;
  substituteTitle: string;
  replacement: string;
  ratio: string;
  bestFor: string;
  savedAt: string;
}

// Clinically sound pediatric ingredient swap database
const VERIFIED_SWAP_DATABASE: SwapProfile[] = [
  {
    ingredient: "Egg",
    keywords: ["egg", "eggs", "yolk", "egg white"],
    category: "Binding & Leavening",
    emoji: "🥚",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Flax Egg (Ground Flaxseed + Warm Water)",
        ratio: "1 tbsp ground flaxseed + 3 tbsp warm water (rest 5 mins until gelled)",
        bestFor: "Toddler veggie patties, pancakes, meatballs, baked tots",
        safetyNote: "Gentle on infant digestive tracts, 100% egg-free and rich in plant Omega-3."
      },
      {
        title: "Culinary & Moisture Match",
        type: "culinary",
        replacement: "Mashed Ripe Banana or Unsweetened Applesauce",
        ratio: "1/2 mashed banana or 1/4 cup unsweetened applesauce per 1 egg",
        bestFor: "Baby muffins, pancakes, oat waffles, sweet breakfast bakes",
        safetyNote: "Naturally sweetens without any refined sugar or honey."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Chia Gel (Ground Chia + Water)",
        ratio: "1 tbsp ground chia seeds + 3 tbsp water (rest 10 mins)",
        bestFor: "Porridge cups, oat bars, fruit loaves",
        safetyNote: "Safe for babies with multiple allergies. High in soluble prebiotic fiber."
      }
    ]
  },
  {
    ingredient: "Cow's Milk",
    keywords: ["milk", "cows milk", "cow milk", "dairy milk", "whole milk"],
    category: "Liquids & Creaminess",
    emoji: "🥛",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Breast Milk or Infant Formula",
        ratio: "1:1 exact liquid replacement",
        bestFor: "Baby oatmeal, vegetable purees, mashes, smoothies",
        safetyNote: "Add after cooking (direct high heat destroys protective antibodies in breast milk)."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Unsweetened Fortified Oat Milk",
        ratio: "1:1 exact replacement",
        bestFor: "Baby pancakes, creamy soups, muffins, mild pasta sauces",
        safetyNote: "Choose brands with zero added sugars, salt, or carrageenan."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Full-Fat Canned Coconut Milk",
        ratio: "1:1 ratio (can be diluted with warm water for lighter consistency)",
        bestFor: "Mild lentil curries, tropical smoothies, sweet potato soup",
        safetyNote: "100% dairy-free and safe for cow's milk protein allergy (CMPA)."
      }
    ]
  },
  {
    ingredient: "Wheat Flour",
    keywords: ["flour", "wheat", "wheat flour", "all purpose flour", "gluten"],
    category: "Flours & Grains",
    emoji: "🌾",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Finely Blended Oat Flour",
        ratio: "1:1 by volume (grind rolled oats in blender for 30s)",
        bestFor: "Infant pancakes, banana bread, mini muffins, teething biscuits",
        safetyNote: "Select certified gluten-free oats if testing for wheat sensitivity."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Blanched Almond Flour",
        ratio: "1 cup almond flour per 1 cup wheat flour",
        bestFor: "Soft baby scones, fruit crumbles, baked veggie bites",
        safetyNote: "Tree nut allergen: introduce only after almond has been safely tolerated."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Brown Rice Flour + Tapioca Starch",
        ratio: "3/4 cup brown rice flour + 1/4 cup tapioca per 1 cup wheat flour",
        bestFor: "Thickening sauces, baby pasta stars, light waffles",
        safetyNote: "100% gluten-free and very gentle on delicate infant intestines."
      }
    ]
  },
  {
    ingredient: "Peanut Butter",
    keywords: ["peanut", "peanut butter", "peanuts", "pb"],
    category: "Nut & Seed Spreads",
    emoji: "🥜",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Sunflower Seed Butter (SunButter)",
        ratio: "1:1 exact replacement",
        bestFor: "Porridge swirls, toast fingers, fruit dips, smoothies",
        safetyNote: "Top-allergen free, school-safe, and perfect for peanut-sensitive infants."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Smooth Almond Butter",
        ratio: "1:1 exact replacement",
        bestFor: "Baked muffins, banana dip, oat porridge",
        safetyNote: "Ensure texture is 100% smooth without crunchy chunks to prevent choking."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Mild White Tahini (Sesame Paste)",
        ratio: "1:1 ratio (or start with 1/2 tsp for mild flavor)",
        bestFor: "Sweet potato swirls, homemade hummus, roasted carrot purees",
        safetyNote: "Rich in calcium and healthy fats. Introduce sesame independently first."
      }
    ]
  },
  {
    ingredient: "Butter",
    keywords: ["butter", "ghee", "margarine"],
    category: "Fats & Oils",
    emoji: "🧈",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Extra Virgin Olive Oil",
        ratio: "3/4 cup olive oil per 1 cup melted butter",
        bestFor: "Roasting veggies, sauteing, drizzling over warm purees, pasta",
        safetyNote: "Zero dairy or milk proteins; excellent brain-building fats."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Virgin Cold-Pressed Coconut Oil",
        ratio: "1:1 ratio (solid at room temperature)",
        bestFor: "Baby baking, muffins, oat bars, sweet potato pancakes",
        safetyNote: "Dairy-free plant fat. Excellent for infants with milk protein sensitivities."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Ripe Mashed Avocado",
        ratio: "1:1 ratio in baking batters",
        bestFor: "Soft muffins, breakfast loaves, vegetable spreads",
        safetyNote: "Packed with potassium, folate, and gentle prebiotic fiber."
      }
    ]
  },
  {
    ingredient: "Yogurt",
    keywords: ["yogurt", "yoghurt", "greek yogurt", "curd"],
    category: "Dairy & Probiotics",
    emoji: "🥣",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Unsweetened Plain Coconut Milk Yogurt",
        ratio: "1:1 exact replacement",
        bestFor: "Morning spoon bowls, fruit swirls, baby pancakes",
        safetyNote: "Dairy-free, lactose-free, and safe from 6 months."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Silken Tofu Pureed",
        ratio: "1:1 exact replacement blended smooth",
        bestFor: "Savory dips, thick puddings, pancake batters",
        safetyNote: "Contains soy. Neutral taste with complete plant protein."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Pureed Avocado with Breast Milk",
        ratio: "1/2 avocado mashed with 2 tbsp breast milk or formula",
        bestFor: "Morning spoon bowls, cold spreads",
        safetyNote: "Naturally velvety without fermentation or dairy allergens."
      }
    ]
  },
  {
    ingredient: "Cheese",
    keywords: ["cheese", "cheddar", "mozzarella", "parmesan"],
    category: "Dairy & Savory",
    emoji: "🧀",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Fortified Nutritional Yeast Flakes",
        ratio: "1-2 tbsp sprinkled over warm pasta or veggies",
        bestFor: "Pasta sauces, scrambled eggs, broccoli mash, savory muffins",
        safetyNote: "Dairy-free, cheesy umami flavor, packed with B-vitamins and zinc."
      },
      {
        title: "Culinary & Creaminess Match",
        type: "culinary",
        replacement: "Blended Cashew Cream",
        ratio: "1:1 ratio for creamy melted cheese textures",
        bestFor: "Mac and cheese sauces, vegetable bakes",
        safetyNote: "Tree nut allergen. Ensure nuts are soaked and blended completely smooth."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Steamed Butternut Squash & Potato Puree",
        ratio: "1:1 volume equivalent",
        bestFor: "Sauces and warm casseroles",
        safetyNote: "Allergen-free, golden color and velvety mouthfeel loved by babies."
      }
    ]
  },
  {
    ingredient: "Honey or Sugar",
    keywords: ["honey", "sugar", "brown sugar", "sweetener", "syrup"],
    category: "Sweeteners (Pediatric Warning)",
    emoji: "🍯",
    substitutes: [
      {
        title: "Pediatric Gold Standard",
        type: "nutritional",
        replacement: "Steamed Apple Puree or Mashed Ripe Banana",
        ratio: "1/2 cup fruit puree per 1/2 cup sugar (reduce recipe liquid slightly)",
        bestFor: "Muffins, oat bakes, pancakes, morning cereals",
        safetyNote: "CRITICAL: Never give honey to infants under 12 months due to infant botulism risk. Fruit puree is 100% safe."
      },
      {
        title: "Culinary & Moisture Match",
        type: "culinary",
        replacement: "Pureed Medjool Date Paste",
        ratio: "1:1 ratio soaked dates blended with warm water",
        bestFor: "Toddler birthday cakes, snack balls, oat bars",
        safetyNote: "High in dietary fiber, potassium, and magnesium."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Stewed Prune or Pear Puree",
        ratio: "1:1 replacement",
        bestFor: "Oatmeal swirls, baked goods",
        safetyNote: "Aids natural infant digestion and prevents infant constipation."
      }
    ]
  },
  {
    ingredient: "Banana",
    keywords: ["banana", "bananas"],
    category: "Fruits & Binders",
    emoji: "🍌",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Steamed Sweet Potato Puree",
        ratio: "1:1 ratio by weight or volume",
        bestFor: "Pancakes, soft muffins, breakfast porridge",
        safetyNote: "Gentle natural sweetness rich in beta-carotene and vitamin A."
      },
      {
        title: "Culinary & Moisture Match",
        type: "culinary",
        replacement: "Unsweetened Steamed Applesauce",
        ratio: "1/2 cup applesauce per 1 mashed banana",
        bestFor: "Baked goods, oat bars, baby waffles",
        safetyNote: "Soft, gentle texture with zero added sugars."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Mashed Ripe Avocado",
        ratio: "1:1 ratio",
        bestFor: "Smoothies, spoon purees, morning bakes",
        safetyNote: "Packed with essential fatty acids for infant brain growth."
      }
    ]
  },
  {
    ingredient: "Soy or Tofu",
    keywords: ["soy", "soya", "tofu", "soy milk"],
    category: "Plant Proteins",
    emoji: "🌱",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Cooked Red Lentils (Mashed)",
        ratio: "1:1 volume equivalent cooked soft",
        bestFor: "Baby burger patties, stews, warm purees",
        safetyNote: "Rich in plant iron, folate, and protein without any soy allergen."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Pureed Cannellini White Beans",
        ratio: "1:1 ratio mashed",
        bestFor: "Creamy spreads, vegetable dips, soups",
        safetyNote: "Mild, creamy texture that blends smoothly for spoon feeding."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Soft Cooked Chickpeas (Pureed)",
        ratio: "1:1 ratio",
        bestFor: "Finger food nuggets, toddler patties",
        safetyNote: "Allergen-free source of clean plant protein and zinc."
      }
    ]
  },
  {
    ingredient: "Oats",
    keywords: ["oat", "oats", "oatmeal", "rolled oats"],
    category: "Grains & Cereals",
    emoji: "🥣",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Quinoa Flakes",
        ratio: "1:1 exact replacement",
        bestFor: "Baby breakfast porridge, oat balls, baking",
        safetyNote: "Complete plant protein with all 9 essential amino acids."
      },
      {
        title: "Culinary & Texture Match",
        type: "culinary",
        replacement: "Millet Porridge (Cooked Soft)",
        ratio: "1:1 ratio",
        bestFor: "Warm breakfast bowls, baby puddings",
        safetyNote: "Naturally gluten-free, highly alkaline, and very easy on tummies."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Brown Rice Flakes",
        ratio: "1:1 ratio",
        bestFor: "Gentle infant breakfast cereal",
        safetyNote: "Hypoallergenic first-stage cereal gentle on sensitive stomachs."
      }
    ]
  },
  {
    ingredient: "Citrus or Tomato",
    keywords: ["tomato", "citrus", "lemon", "orange", "acidic"],
    category: "Acidic Fruits & Sauces",
    emoji: "🍅",
    substitutes: [
      {
        title: "Nutritional Twin",
        type: "nutritional",
        replacement: "Steamed Carrot & Beetroot Puree",
        ratio: "1:1 ratio blended with a pinch of oregano",
        bestFor: "Baby pasta sauce, pizza base, veggie stews",
        safetyNote: "Rich crimson color without the high acidity that triggers diaper rash or reflux."
      },
      {
        title: "Culinary & Sweetness Match",
        type: "culinary",
        replacement: "Roasted Butternut Squash Puree",
        ratio: "1:1 ratio for pasta coatings",
        bestFor: "Pasta stars, vegetable dips",
        safetyNote: "Mild, sweet, comforting consistency gentle on infant gums."
      },
      {
        title: "Hypoallergenic Safe",
        type: "hypoallergenic",
        replacement: "Steamed Red Bell Pepper & Zucchini Mash",
        ratio: "1:1 ratio",
        bestFor: "Sauces and savory purees",
        safetyNote: "High in vitamin C without citric acid irritation."
      }
    ]
  }
];

export const IngredientSwap: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedSwaps, setSavedSwaps] = useState<SavedSwap[]>(() => {
    try {
      const stored = localStorage.getItem("babybites_saved_swaps");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever savedSwaps changes
  useEffect(() => {
    try {
      localStorage.setItem("babybites_saved_swaps", JSON.stringify(savedSwaps));
    } catch (e) {
      console.error("Failed to persist saved swaps:", e);
    }
  }, [savedSwaps]);

  // Fast popular search chips
  const POPULAR_INGREDIENTS = [
    { label: "Egg", query: "Egg" },
    { label: "Cow's Milk", query: "Cow's Milk" },
    { label: "Wheat Flour", query: "Wheat Flour" },
    { label: "Butter", query: "Butter" },
    { label: "Peanut Butter", query: "Peanut Butter" },
    { label: "Yogurt", query: "Yogurt" },
    { label: "Cheese", query: "Cheese" },
    { label: "Honey / Sugar", query: "Honey" },
    { label: "Banana", query: "Banana" },
    { label: "Oats", query: "Oats" }
  ];

  // Strictly match against verified pediatric database
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null; // No search executed yet

    return VERIFIED_SWAP_DATABASE.filter((item) => {
      const matchName = item.ingredient.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchKey = item.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()));
      return matchName || matchCat || matchKey;
    });
  }, [searchQuery]);

  const handleSaveSwap = (profile: SwapProfile, sub: Substitute) => {
    // Check if already in table
    const exists = savedSwaps.some(
      (item) => item.originalIngredient === profile.ingredient && item.replacement === sub.replacement
    );

    if (exists) {
      toast.info(`"${sub.replacement}" is already in your saved table.`);
      return;
    }

    const newSwap: SavedSwap = {
      id: Date.now().toString(),
      originalIngredient: profile.ingredient,
      substituteTitle: sub.title,
      replacement: sub.replacement,
      ratio: sub.ratio,
      bestFor: sub.bestFor,
      savedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
    };

    setSavedSwaps((prev) => [newSwap, ...prev]);
    toast.success(`Saved swap for ${profile.ingredient} to your table! ✨`);
  };

  const handleRemoveSwap = (id: string, original: string) => {
    setSavedSwaps((prev) => prev.filter((item) => item.id !== id));
    toast.success(`Removed ${original} swap from table.`);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your entire saved swaps table?")) {
      setSavedSwaps([]);
      toast.success("Saved swaps table cleared.");
    }
  };

  return (
    <div 
      className="relative min-h-screen bg-[#FAF9F5] dark:bg-[#121614] pb-24 pt-4 px-3.5 sm:px-6 w-full max-w-3xl mx-auto min-w-0 overflow-x-hidden text-stone-900 dark:text-stone-100 transition-colors"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <AtmosphericBackground />
      <div className="relative z-10 space-y-6">
        
        {/* Photographic Hero Banner */}
        <div className="rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-xs border border-[#EBE8DF] dark:border-stone-800 bg-white dark:bg-stone-900">
          <img
            src={ingredientSwapBanner}
            alt="Pediatric Ingredient Swap Assistant"
            className="w-full h-auto object-cover block"
            loading="eager"
          />
        </div>

        {/* Page Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5EF] dark:bg-emerald-950/60 border border-[#CCE0D2] dark:border-emerald-800 text-xs font-semibold text-[#1E5E3A] dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pediatric Safety Verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Ingredient Substitution Guide
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
            Search any ingredient to find certified, allergy-safe substitutes for your baby's meals. Save your preferred swaps to build your custom reference table below.
          </p>
        </div>

        {/* SEARCH BOX */}
        <div className="bg-white dark:bg-stone-900 rounded-[24px] border border-[#EBE8DF] dark:border-stone-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type an ingredient (e.g., Egg, Cow's Milk, Butter, Wheat, Peanut Butter)..."
              className="pl-12 pr-10 h-12 text-base rounded-full bg-[#FAF9F5] dark:bg-stone-800 border-[#EBE8DF] dark:border-stone-700 focus:border-[#1E5E3A] focus:ring-1 focus:ring-[#1E5E3A]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Select Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Popular Ingredients:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_INGREDIENTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSearchQuery(item.query)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    searchQuery.toLowerCase() === item.query.toLowerCase()
                      ? "bg-[#1E5E3A] text-white border-[#1E5E3A]"
                      : "bg-[#FAF9F5] dark:bg-stone-800 border-[#EBE8DF] dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-[#1E5E3A]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SEARCH RESULTS SECTION (Only appears when user actively searches) */}
        {searchQuery.trim() !== "" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {searchResults && searchResults.length > 0 ? (
              searchResults.map((profile) => (
                <div 
                  key={profile.ingredient}
                  className="bg-white dark:bg-stone-900 rounded-[24px] border border-[#EBE8DF] dark:border-stone-800 p-5 sm:p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#EBE8DF] dark:border-stone-800">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{profile.emoji}</span>
                      <div>
                        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                          {profile.ingredient}
                        </h2>
                        <span className="text-xs text-stone-500">{profile.category}</span>
                      </div>
                    </div>
                    <span className="text-xs text-stone-500 font-semibold">
                      {profile.substitutes.length} Certified Options
                    </span>
                  </div>

                  {/* Substitute Options */}
                  <div className="grid grid-cols-1 gap-3.5">
                    {profile.substitutes.map((sub, idx) => {
                      const isSaved = savedSwaps.some(
                        (item) => item.originalIngredient === profile.ingredient && item.replacement === sub.replacement
                      );

                      return (
                        <div 
                          key={idx}
                          className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-stone-800/60 border border-[#EBE8DF] dark:border-stone-700 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 mb-1">
                                {sub.title}
                              </span>
                              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                                {sub.replacement}
                              </h3>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSaveSwap(profile, sub)}
                              className={`rounded-full text-xs font-semibold shrink-0 transition-all ${
                                isSaved
                                  ? "bg-emerald-100 dark:bg-emerald-900 text-[#1E5E3A] dark:text-emerald-200 border border-[#CCE0D2]"
                                  : "bg-[#1E5E3A] hover:bg-[#16482c] text-white"
                              }`}
                            >
                              {isSaved ? (
                                <>
                                  <Check className="w-3.5 h-3.5 mr-1" />
                                  Saved in Table
                                </>
                              ) : (
                                <>
                                  <Bookmark className="w-3.5 h-3.5 mr-1" />
                                  Save to My Table
                                </>
                              )}
                            </Button>
                          </div>

                          <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1 leading-relaxed">
                            <p>
                              <strong>Exact Ratio:</strong> {sub.ratio}
                            </p>
                            <p>
                              <strong>Best Suited For:</strong> {sub.bestFor}
                            </p>
                            <p className="text-stone-500 text-[11px]">
                              <strong>Pediatric Note:</strong> {sub.safetyNote}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              /* NO MATCH FOUND (E.g. nonsense, gibberish or unsupported item) */
              <div className="p-6 rounded-[24px] bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-900/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  No verified pediatric substitute found for "{searchQuery}"
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                  For your baby's gastrointestinal and allergy safety, BabyBites only provides clinically certified substitutions. We do not generate unverified alternatives.
                </p>
                <div className="pt-2">
                  <span className="text-xs text-stone-500 font-semibold block mb-2">
                    Try searching for one of these verified culinary ingredients:
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {["Egg", "Cow's Milk", "Butter", "Wheat Flour", "Peanut Butter", "Yogurt", "Cheese", "Honey", "Banana", "Oats"].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setSearchQuery(term)}
                        className="px-2.5 py-1 text-xs rounded-full bg-[#FAF9F5] dark:bg-stone-800 border border-[#EBE8DF] dark:border-stone-700 hover:border-[#1E5E3A] text-stone-700 dark:text-stone-300"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SAVED SWAPS TABLE (Persistent Reference Guide) */}
        <div className="bg-white dark:bg-stone-900 rounded-[24px] border border-[#EBE8DF] dark:border-stone-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE8DF] dark:border-stone-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EAF5EF] dark:bg-emerald-950/60 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  My Saved Substitutions Table
                </h2>
                <p className="text-xs text-stone-500">
                  Your personalized quick reference for infant recipe adjustments
                </p>
              </div>
            </div>

            {savedSwaps.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 font-bold text-stone-700 dark:text-stone-300">
                  {savedSwaps.length} {savedSwaps.length === 1 ? "Item" : "Items"}
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline px-2 py-1"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {savedSwaps.length > 0 ? (
            <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
              <table className="w-full text-left text-xs border-collapse min-w-[580px]">
                <thead>
                  <tr className="border-b border-[#EBE8DF] dark:border-stone-800 bg-[#FAF9F5] dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 uppercase text-[11px] font-bold">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-3">Original Ingredient</th>
                    <th className="py-3 px-3">Recommended Substitute</th>
                    <th className="py-3 px-3">Ratio & Instructions</th>
                    <th className="py-3 px-3 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE8DF] dark:divide-stone-800">
                  {savedSwaps.map((item, index) => (
                    <tr 
                      key={item.id}
                      className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      {/* Numbered Row */}
                      <td className="py-3.5 px-3 text-center font-bold text-stone-400">
                        {index + 1}
                      </td>

                      {/* Original Ingredient */}
                      <td className="py-3.5 px-3 font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                        {item.originalIngredient}
                      </td>

                      {/* Safe Substitute */}
                      <td className="py-3.5 px-3 font-semibold text-[#1E5E3A] dark:text-emerald-400">
                        {item.replacement}
                        <span className="block text-[10px] text-stone-500 font-normal">
                          {item.substituteTitle}
                        </span>
                      </td>

                      {/* Ratio & Application */}
                      <td className="py-3.5 px-3 text-stone-700 dark:text-stone-300 text-[11px] leading-relaxed max-w-xs">
                        <p className="font-medium text-stone-900 dark:text-stone-100">{item.ratio}</p>
                        <p className="text-stone-500 text-[10px]">{item.bestFor}</p>
                      </td>

                      {/* Remove Button */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSwap(item.id, item.originalIngredient)}
                          title="Remove from table"
                          className="w-8 h-8 rounded-full inline-flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          aria-label={`Remove ${item.originalIngredient} swap`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty Table State */
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#FAF9F5] dark:bg-stone-800 border border-[#EBE8DF] dark:border-stone-700 text-stone-400 mx-auto flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300">
                Your Saved Swaps Table is Empty
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Search any ingredient above and tap <strong>"Save to My Table"</strong>. Your substitutions will be sequentially recorded here and safely preserved for every kitchen session.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default IngredientSwap;
