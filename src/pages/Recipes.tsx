import { useState, useEffect, useMemo, memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Clock, Heart, Download, Loader2, ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { recipes as staticRecipes, getMealCategory, Recipe } from "@/data/recipes";
import { useAppRecipes } from "@/hooks/useAppRecipes";
import { useFavorites } from "@/hooks/useFavorites";
import { exportRecipeEbook } from "@/utils/recipeEbookExport";
import { toast } from "sonner";
import { AtmosphericBackground } from "@/components/layout/AtmosphericBackground";

// 6-8 Months Category Posters
import posterBreakfast68 from "@/assets/categories/breakfast-6-8m.webp";
import posterLunchDinner68 from "@/assets/categories/lunch-dinner-6-8m.webp";
import posterSnacks68 from "@/assets/categories/snacks-6-8m.webp";
import posterDesserts68 from "@/assets/categories/desserts-smoothies-6-8m.webp";

// 9-11 Months Category Posters
import posterBreakfast911 from "@/assets/categories/breakfast-9-11m.webp";
import posterLunchDinner911 from "@/assets/categories/lunch-dinner-9-11m.webp";
import posterSnacks911 from "@/assets/categories/snacks-9-11m.webp";
import posterDesserts911 from "@/assets/categories/desserts-smoothies-9-11m.webp";

// 12-23 Months Category Posters
import posterBreakfast1223 from "@/assets/categories/breakfast-12-23m.webp";
import posterLunchDinner1223 from "@/assets/categories/lunch-dinner-12-23m.webp";
import posterSnacks1223 from "@/assets/categories/snacks-12-23m.jpg";
import posterDesserts1223 from "@/assets/categories/desserts-smoothies-12-23m.webp";

// 24+ Months Category Posters
import posterBreakfast24 from "@/assets/categories/breakfast-24m.webp";
import posterLunchDinner24 from "@/assets/categories/lunch-dinner-24m.webp";
import posterSnacks24 from "@/assets/categories/snacks-24m.webp";
import posterDesserts24 from "@/assets/categories/desserts-smoothies-24m.webp";

const BATCH_SIZE = 24;

const OFFICIAL_AGE_OPTIONS = [
  { id: "All Ages", label: "👶 All Ages" },
  { id: "6-8 Months", label: "6–8 Months" },
  { id: "9-11 Months", label: "9–11 Months" },
  { id: "12-23 Months", label: "12–23 Months" },
  { id: "24+ Months", label: "24+ Months" },
];

const OFFICIAL_CATEGORY_OPTIONS = [
  { id: "All Categories", label: "🌟 All" },
  { id: "Breakfast", label: "🥞 Breakfast" },
  { id: "Lunch", label: "🥗 Lunch" },
  { id: "Dinner", label: "🍲 Dinner" },
  { id: "Snack", label: "🥕 Snack" },
  { id: "Dessert", label: "🍓 Desserts & Smoothies" },
];

// Helper to normalize age string
const matchesTargetAge = (recipeAge: string, targetAge: string): boolean => {
  if (targetAge === "All Ages") return true;
  const target = targetAge.toLowerCase();
  const rec = (recipeAge || "").toLowerCase();

  if (target.includes("6-8") || target.includes("6-9")) {
    return rec.includes("6-9") || rec.includes("6-8") || rec.includes("6 months");
  }
  if (target.includes("9-11") || target.includes("9-12")) {
    return rec.includes("9-12") || rec.includes("9-11") || rec.includes("9 months");
  }
  if (target.includes("12-23") || target.includes("12-18") || target.includes("18-24") || target.includes("12-24")) {
    return rec.includes("12-18") || rec.includes("18-24") || rec.includes("12-23");
  }
  if (target.includes("24+") || target.includes("24")) {
    return rec.includes("24+") || rec.includes("24 months") || rec.includes("18-24 months");
  }
  return rec === target;
};

// Recipe Card in Luxury Square Minimalist Editorial Style (Matches User Reference Image)
const RecipeCard = memo(({
  recipe,
  isFav,
  onToggleFavorite,
}: {
  recipe: Recipe;
  isFav: boolean;
  onToggleFavorite: (id: string) => void;
}) => {
  return (
    <div className="rounded-[20px] sm:rounded-[24px] overflow-hidden bg-stone-900 shadow-sm relative group aspect-square border border-[#EBE8DF]/40 dark:border-stone-800 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <Link to={`/recipe/${recipe.id}`} className="block w-full h-full relative">
        <img
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Dark gradient overlay at bottom for crystal clear legibility (as in reference image) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-2.5 sm:p-3.5">
          <h3 className="font-serif font-bold text-white text-xs sm:text-sm leading-snug line-clamp-2 drop-shadow-sm group-hover:text-emerald-200 transition-colors">
            {recipe.title}
          </h3>
        </div>

        {/* Favorite heart button top right */}
        <button
          aria-label="Save recipe"
          className={`absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 ${
            isFav
              ? "bg-white text-red-500 shadow-md"
              : "bg-black/35 text-white hover:bg-white hover:text-red-500 shadow-sm"
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(recipe.id);
          }}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
        </button>
      </Link>
    </div>
  );
});

RecipeCard.displayName = "RecipeCard";


// Helper to match category robustly
const matchesTargetCategory = (recipe: Recipe, targetCategory: string): boolean => {
  if (targetCategory === "All Categories") return true;

  const target = targetCategory.toLowerCase();
  const rawCat = (recipe.category || "").toLowerCase();
  const mealTime = (recipe.mealTime || "").toLowerCase();
  const title = (recipe.title || "").toLowerCase();
  const mealCat = getMealCategory(recipe).toLowerCase();

  if (target === "breakfast") {
    return (
      rawCat === "breakfast" ||
      mealTime === "breakfast" ||
      mealCat === "porridge" ||
      mealCat === "pancakes" ||
      /pancake|waffle|porridge|oatmeal|cereal|breakfast|parfait|scramble|frittata/.test(title)
    );
  }

  if (target === "lunch") {
    return (
      rawCat === "lunch" ||
      mealTime === "lunch" ||
      rawCat.includes("lunch") ||
      (mealTime !== "breakfast" && (mealCat === "soup" || mealCat === "pasta" || mealCat === "bowl" || mealCat === "puree" || mealCat === "mash"))
    );
  }

  if (target === "dinner") {
    return (
      rawCat === "dinner" ||
      mealTime === "dinner" ||
      rawCat.includes("dinner") ||
      (mealTime !== "breakfast" && (mealCat === "soup" || mealCat === "pasta" || mealCat === "bowl" || mealCat === "puree" || mealCat === "mash"))
    );
  }

  if (target === "snack") {
    return (
      rawCat === "snack" ||
      mealTime === "snack" ||
      mealCat === "bites" ||
      mealCat === "finger food" ||
      /snack|bites|tots|cookie|muffin|cracker|bar|pinwheel|finger|dip/.test(title)
    );
  }

  if (target === "dessert" || target.includes("dessert") || target.includes("smoothie")) {
    return (
      rawCat === "dessert" ||
      mealCat === "smoothie" ||
      /dessert|smoothie|pudding|parfait|popsicle|compote|nice cream|swirl/.test(title)
    );
  }

  return rawCat === target || mealTime === target || mealCat === target;
};

export const Recipes = () => {
  const { recipes } = useAppRecipes();
  const allRecipes = (recipes && recipes.length > 0) ? recipes : staticRecipes;
  const { toggleFavorite, isFavorite } = useFavorites();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAge, setSelectedAge] = useState<string>("All Ages");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isExporting, setIsExporting] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Sync URL parameters on load
  useEffect(() => {
    const ageParam = searchParams.get("age");
    if (ageParam) {
      const decoded = decodeURIComponent(ageParam).toLowerCase();
      if (decoded.includes("6-8") || decoded.includes("6-9")) {
        setSelectedAge("6-8 Months");
      } else if (decoded.includes("9-11") || decoded.includes("9-12")) {
        setSelectedAge("9-11 Months");
      } else if (decoded.includes("24")) {
        setSelectedAge("24+ Months");
      } else if (decoded.includes("12-23") || decoded.includes("12-18") || decoded.includes("18-24")) {
        setSelectedAge("12-23 Months");
      }
    }

    const catParam = searchParams.get("category") || searchParams.get("meal");
    if (catParam) {
      const decodedCat = decodeURIComponent(catParam).toLowerCase();
      if (decodedCat.includes("breakfast")) {
        setSelectedCategory("Breakfast");
      } else if (decodedCat.includes("lunch") && !decodedCat.includes("dinner")) {
        setSelectedCategory("Lunch");
      } else if (decodedCat.includes("dinner") && !decodedCat.includes("lunch")) {
        setSelectedCategory("Dinner");
      } else if (decodedCat.includes("lunch") && decodedCat.includes("dinner")) {
        setSelectedCategory("Lunch");
      } else if (decodedCat.includes("snack")) {
        setSelectedCategory("Snack");
      } else if (decodedCat.includes("dessert") || decodedCat.includes("smoothie")) {
        setSelectedCategory("Dessert");
      }
    }
  }, [searchParams]);

  // Reset count on filter change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [searchQuery, selectedAge, selectedCategory]);

  // STRICT & ACCURATE RECIPE FILTERING
  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((recipe) => {
      // 1. Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = recipe.title.toLowerCase().includes(q);
        const matchesDesc = (recipe.description || "").toLowerCase().includes(q);
        const matchesIng = (recipe.ingredients || []).some((i) => i.toLowerCase().includes(q));
        const matchesId = recipe.id.toLowerCase() === q || recipe.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesIng && !matchesId) return false;
      }

      // 2. Strict Age Matching
      if (selectedAge !== "All Ages") {
        if (!matchesTargetAge(recipe.ageGroup, selectedAge)) return false;
      }

      // 3. Category Matching
      if (selectedCategory !== "All Categories") {
        if (!matchesTargetCategory(recipe, selectedCategory)) return false;
      }

      return true;
    });
  }, [allRecipes, searchQuery, selectedAge, selectedCategory]);

  const visibleRecipes = useMemo(() => {
    return filteredRecipes.slice(0, visibleCount);
  }, [filteredRecipes, visibleCount]);

  const hasMore = visibleCount < filteredRecipes.length;

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredRecipes.length));
      }
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, filteredRecipes.length]);

  const handleExportEbook = async () => {
    setIsExporting(true);
    try {
      await exportRecipeEbook(filteredRecipes);
      toast.success("eBook exported successfully!");
    } catch {
      toast.error("Could not export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Dedicated Category Artwork Banner for all ages (6-8m, 9-11m, 12-23m, 24+m)
  // Strictly illustrative category descriptions (no individual recipe descriptions)
  const bannerInfo = useMemo(() => {
    const getDesc = (cat: string) => {
      if (cat === "Breakfast") return "Discover easy, healthy breakfast recipes for your little one, made with real ingredients and big love.";
      if (cat === "Lunch" || cat === "Lunch & Dinner") return "Discover easy, nourishing midday recipes for your little one, made with wholesome ingredients and big love.";
      if (cat === "Dinner") return "Discover comforting, soothing evening recipes for your little one, made with gentle ingredients and big love.";
      if (cat === "Snack") return "Discover quick, wholesome snack ideas for your little one, crafted for tiny fingers and big nutrition.";
      if (cat === "Dessert") return "Discover naturally sweet, gentle treats and smoothies for your little one, packed with vitamins and pure joy.";
      return "Discover easy, pediatrician-approved recipes for your little one, made with real ingredients and big love.";
    };

    if (selectedAge === "6-8 Months") {
      let img = posterBreakfast68;
      if (selectedCategory === "Lunch" || selectedCategory === "Dinner" || selectedCategory === "Lunch & Dinner") img = posterLunchDinner68;
      if (selectedCategory === "Snack") img = posterSnacks68;
      if (selectedCategory === "Dessert") img = posterDesserts68;

      return {
        image: img,
        title: selectedCategory !== "All Categories" ? selectedCategory : "6–8 Months Collection",
        subtitle: getDesc(selectedCategory),
        tag: `6–8 MONTHS • ${selectedCategory.toUpperCase()}`,
      };
    }

    if (selectedAge === "9-11 Months") {
      let img = posterBreakfast911;
      if (selectedCategory === "Lunch" || selectedCategory === "Dinner" || selectedCategory === "Lunch & Dinner") img = posterLunchDinner911;
      if (selectedCategory === "Snack") img = posterSnacks911;
      if (selectedCategory === "Dessert") img = posterDesserts911;

      return {
        image: img,
        title: selectedCategory !== "All Categories" ? selectedCategory : "9–11 Months Collection",
        subtitle: getDesc(selectedCategory),
        tag: `9–11 MONTHS • ${selectedCategory.toUpperCase()}`,
      };
    }

    if (selectedAge === "12-23 Months") {
      let img = posterBreakfast1223;
      if (selectedCategory === "Lunch" || selectedCategory === "Dinner" || selectedCategory === "Lunch & Dinner") img = posterLunchDinner1223;
      if (selectedCategory === "Snack") img = posterSnacks1223;
      if (selectedCategory === "Dessert") img = posterDesserts1223;

      return {
        image: img,
        title: selectedCategory !== "All Categories" ? selectedCategory : "12–23 Months Collection",
        subtitle: getDesc(selectedCategory),
        tag: `12–23 MONTHS • ${selectedCategory.toUpperCase()}`,
      };
    }

    if (selectedAge === "24+ Months") {
      let img = posterBreakfast24;
      if (selectedCategory === "Lunch & Dinner" || selectedCategory === "Lunch" || selectedCategory === "Dinner") img = posterLunchDinner24;
      if (selectedCategory === "Snack") img = posterSnacks24;
      if (selectedCategory === "Dessert") img = posterDesserts24;

      return {
        image: img,
        title: selectedCategory !== "All Categories" ? selectedCategory : "24+ Months Collection",
        subtitle: getDesc(selectedCategory),
        tag: `24+ MONTHS • ${selectedCategory.toUpperCase()}`,
      };
    }

    if (selectedCategory !== "All Categories") {
      return {
        image: posterBreakfast68,
        title: selectedCategory,
        subtitle: getDesc(selectedCategory),
        tag: selectedCategory.toUpperCase(),
      };
    }

    return null;
  }, [selectedAge, selectedCategory]);

  const isFromHome = Boolean(searchParams.get("age") || searchParams.get("category") || searchParams.get("meal"));

  return (
    <div className="relative min-h-screen bg-[#FAF9F5]/70 dark:bg-[#121614]/80 pb-24 pt-4 px-3 sm:px-4 max-w-2xl mx-auto w-full max-w-full overflow-x-hidden min-w-0 transition-colors">
      <AtmosphericBackground />
      <div className="relative z-10">
      
      {/* 1. When navigated from Home: Clean header with Back arrow, NO redundant filter pills or search clutter */}
      {isFromHome ? (
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-stone-800 border border-[#EBE8DF] dark:border-stone-700 text-xs font-semibold text-forest dark:text-emerald-400 hover:bg-[#F3F6F3] shadow-2xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportEbook}
            disabled={isExporting}
            className="rounded-full gap-1.5 border-[#EBE8DF] bg-white text-xs text-forest hover:bg-gray-50"
          >
            {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            <span>PDF Guide</span>
          </Button>
        </div>
      ) : (
        /* Standard Header when browsing Recipes generally */
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-[#48B774]">
                Recipe Collection
              </span>
              <h1 className="text-3xl font-serif font-bold text-forest mt-0.5">
                Baby Food Library
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Showing {filteredRecipes.length} recipes approved for babies
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportEbook}
              disabled={isExporting}
              className="rounded-full gap-1.5 border-[#EBE8DF] bg-white text-xs text-forest hover:bg-gray-50"
            >
              {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              <span>PDF Guide</span>
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search recipes, avocado, oats, bananas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full h-11 border-[#E3DFD3] bg-white text-sm shadow-xs focus-visible:ring-[#48B774]"
            />
          </div>

          {/* 1. Category Filter Pills */}
          <div className="mb-3 w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar w-full max-w-full min-w-0">
              {OFFICIAL_CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat.id
                      ? "bg-forest text-white shadow-xs"
                      : "bg-white text-gray-600 border border-[#EBE8DF] hover:bg-gray-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Age Filter Pills */}
          <div className="mb-5 w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar w-full max-w-full min-w-0">
              {OFFICIAL_AGE_OPTIONS.map((age) => (
                <button
                  key={age.id}
                  onClick={() => setSelectedAge(age.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedAge === age.id
                      ? "bg-[#48B774] text-white shadow-xs font-semibold"
                      : "bg-white text-gray-500 border border-[#EBE8DF] hover:bg-gray-50"
                  }`}
                >
                  {age.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Featured Category Artwork Banner - Full Illustrated Graphic Card (Exact to User Screenshot) */}
      {bannerInfo && (
        <div className="mb-5 rounded-[24px] sm:rounded-[28px] overflow-hidden shadow-sm border border-[#EBE8DF] dark:border-stone-800 bg-white dark:bg-stone-900 transition-all">
          <img
            src={bannerInfo.image}
            alt={bannerInfo.title}
            className="w-full h-auto object-cover block rounded-[24px] sm:rounded-[28px]"
            loading="eager"
          />
        </div>
      )}

      {/* Age Category Header */}
      <div className="mb-3 px-1 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-serif font-bold text-forest dark:text-emerald-400">
          {selectedAge !== "All Ages" ? selectedAge : "All Recipes"}
        </h2>
        <span className="text-xs text-gray-500 font-medium">
          {filteredRecipes.length} recipes
        </span>
      </div>

      {/* Quick 4-Category Carousel for 6-8 Months (Only shown when browsing general library) */}
      {!isFromHome && selectedAge === "6-8 Months" && selectedCategory === "All Categories" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
              Explore 6–8 Months Categories
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { title: "Breakfast", img: posterBreakfast68, cat: "Breakfast" },
              { title: "Lunch", img: posterLunchDinner68, cat: "Lunch" },
              { title: "Dinner", img: posterLunchDinner68, cat: "Dinner" },
              { title: "Snacks", img: posterSnacks68, cat: "Snack" },
              { title: "Desserts", img: posterDesserts68, cat: "Dessert" },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(item.cat)}
                className="text-left rounded-2xl bg-white border border-[#EBE8DF] overflow-hidden shadow-xs hover:shadow-md transition-all group"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#FAF9F5]">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2">
                  <span className="text-xs font-semibold text-gray-900 block group-hover:text-forest">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-gray-500">View recipes →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick 4-Category Carousel for 9-11 Months */}
      {!isFromHome && selectedAge === "9-11 Months" && selectedCategory === "All Categories" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
              Explore 9–11 Months Categories
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { title: "Breakfast", img: posterBreakfast911, cat: "Breakfast" },
              { title: "Lunch", img: posterLunchDinner911, cat: "Lunch" },
              { title: "Dinner", img: posterLunchDinner911, cat: "Dinner" },
              { title: "Snacks", img: posterSnacks911, cat: "Snack" },
              { title: "Desserts", img: posterDesserts911, cat: "Dessert" },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(item.cat)}
                className="text-left rounded-2xl bg-white border border-[#EBE8DF] overflow-hidden shadow-xs hover:shadow-md transition-all group"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#FAF9F5]">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2">
                  <span className="text-xs font-semibold text-gray-900 block group-hover:text-forest">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-gray-500">View recipes →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick 4-Category Carousel for 12-23 Months */}
      {!isFromHome && selectedAge === "12-23 Months" && selectedCategory === "All Categories" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
              Explore 12–23 Months Categories
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { title: "Breakfast", img: posterBreakfast1223, cat: "Breakfast" },
              { title: "Lunch", img: posterLunchDinner1223, cat: "Lunch" },
              { title: "Dinner", img: posterLunchDinner1223, cat: "Dinner" },
              { title: "Snacks", img: posterSnacks1223, cat: "Snack" },
              { title: "Desserts", img: posterDesserts1223, cat: "Dessert" },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(item.cat)}
                className="text-left rounded-2xl bg-white border border-[#EBE8DF] overflow-hidden shadow-xs hover:shadow-md transition-all group"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#FAF9F5]">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2">
                  <span className="text-xs font-semibold text-gray-900 block group-hover:text-forest">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-gray-500">View recipes →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick 4-Category Carousel for 24+ Months */}
      {!isFromHome && selectedAge === "24+ Months" && selectedCategory === "All Categories" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
              Explore 24+ Months Categories
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { title: "Breakfast", img: posterBreakfast24, cat: "Breakfast" },
              { title: "Lunch", img: posterLunchDinner24, cat: "Lunch" },
              { title: "Dinner", img: posterLunchDinner24, cat: "Dinner" },
              { title: "Snacks", img: posterSnacks24, cat: "Snack" },
              { title: "Desserts", img: posterDesserts24, cat: "Dessert" },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(item.cat)}
                className="text-left rounded-2xl bg-white border border-[#EBE8DF] overflow-hidden shadow-xs hover:shadow-md transition-all group"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#FAF9F5]">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2">
                  <span className="text-xs font-semibold text-gray-900 block group-hover:text-forest">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-gray-500">View recipes →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-[28px] border border-[#EBE8DF]">
          <span className="text-4xl block mb-2">🥑</span>
          <h3 className="font-serif font-bold text-gray-900 text-lg">No recipes found</h3>
          <p className="text-xs text-gray-500 mt-1">
            Try adjusting your age or category filters.
          </p>
          <Button
            onClick={() => {
              setSelectedAge("All Ages");
              setSelectedCategory("All Categories");
              setSearchQuery("");
            }}
            className="mt-4 rounded-full bg-[#48B774] text-white text-xs px-4 py-2"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {visibleRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFav={isFavorite(recipe.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-6 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#48B774]" />
        </div>
      )}
      </div>
    </div>
  );
};

export default Recipes;
