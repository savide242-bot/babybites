import { useState, useEffect, useMemo, memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Clock, Heart, Download, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { recipes, getMealCategory } from "@/data/recipes";
import { useFavorites } from "@/hooks/useFavorites";
import { exportRecipeEbook } from "@/utils/recipeEbookExport";
import { toast } from "sonner";

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
  { id: "Lunch & Dinner", label: "🥑 Lunch & Dinner" },
  { id: "Snack", label: "🥕 Snack" },
  { id: "Dessert", label: "🍓 Dessert & Smoothies" },
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

// Recipe Card in Botanical The Solids Club Style
const RecipeCard = memo(({
  recipe,
  isFav,
  onToggleFavorite,
}: {
  recipe: typeof recipes[0];
  isFav: boolean;
  onToggleFavorite: (id: string) => void;
}) => {
  const mealCat = getMealCategory(recipe);

  return (
    <div className="rounded-[24px] bg-white border border-[#EBE8DF] shadow-[0_4px_16px_-4px_rgba(30,94,58,0.06)] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
      <Link to={`/recipe/${recipe.id}`} className="block relative">
        <div className="aspect-[4/3] w-full overflow-hidden bg-[#FAF9F5] relative">
          <img
            src={recipe.image}
            alt={recipe.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <button
            aria-label="Save recipe"
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              isFav
                ? "bg-white text-red-500 shadow-md"
                : "bg-white/80 text-gray-500 hover:bg-white hover:text-red-500 shadow-sm"
            }`}
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(recipe.id);
            }}
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
          </button>

          <div className="absolute bottom-2.5 left-2.5">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide">
              {mealCat}
            </span>
          </div>
        </div>

        <div className="p-3.5 pb-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#48B774] font-medium mb-1">
            <span>💚</span>
            <span>{recipe.ageGroup}</span>
          </div>
          <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-forest transition-colors">
            {recipe.title}
          </h3>
          <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {recipe.description}
          </p>
        </div>
      </Link>

      <div className="px-3.5 pb-3 pt-1 border-t border-[#F3F1EB] flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{recipe.prepTime}</span>
        </div>
        <span className="font-medium text-gray-600">
          {recipe.ingredients.length} ingr.
        </span>
      </div>
    </div>
  );
});

RecipeCard.displayName = "RecipeCard";

export const Recipes = () => {
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
      } else if (decodedCat.includes("lunch") || decodedCat.includes("dinner")) {
        setSelectedCategory("Lunch & Dinner");
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
    return recipes.filter((recipe) => {
      // 1. Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesTitle = recipe.title.toLowerCase().includes(q);
        const matchesDesc = recipe.description.toLowerCase().includes(q);
        const matchesIng = recipe.ingredients.some((i) => i.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesIng) return false;
      }

      // 2. Strict Age Matching
      if (selectedAge !== "All Ages") {
        if (!matchesTargetAge(recipe.ageGroup, selectedAge)) return false;
      }

      // 3. Strict Category Matching
      if (selectedCategory !== "All Categories") {
        const mealCat = getMealCategory(recipe);
        if (mealCat !== selectedCategory) return false;
      }

      return true;
    });
  }, [searchQuery, selectedAge, selectedCategory]);

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

  // Dedicated Category Artwork Banner for 6-8 and 9-11 Months
  const bannerInfo = useMemo(() => {
    if (selectedAge === "6-8 Months") {
      if (selectedCategory === "Breakfast") {
        return {
          image: posterBreakfast68,
          title: "Breakfast: Little Morning Moments",
          subtitle: "Gentle iron-rich oats, soft fruit mashes, and wholesome first morning meals.",
          tag: "6–8 MONTHS • BREAKFAST",
        };
      }
      if (selectedCategory === "Lunch & Dinner") {
        return {
          image: posterLunchDinner68,
          title: "Lunch & Dinner: Nourishing Moments",
          subtitle: "Soft steamed vegetable purees, mild lentil dahl, and tender poultry blends.",
          tag: "6–8 MONTHS • LUNCH & DINNER",
        };
      }
      if (selectedCategory === "Snack") {
        return {
          image: posterSnacks68,
          title: "Snacks: Tiny Bites, Happy Days",
          subtitle: "Easy-to-grasp soft finger foods, steamed florets, and refreshing fruit teethers.",
          tag: "6–8 MONTHS • SNACKS",
        };
      }
      if (selectedCategory === "Dessert") {
        return {
          image: posterDesserts68,
          title: "Desserts & Smoothies: Soft & Wholesome",
          subtitle: "Smooth whole milk yogurt swirls, ripe berry purees, and gentle smoothies.",
          tag: "6–8 MONTHS • DESSERTS & SMOOTHIES",
        };
      }
    }

    if (selectedAge === "9-11 Months") {
      if (selectedCategory === "Breakfast") {
        return {
          image: posterBreakfast911,
          title: "Breakfast: Little Morning Moments",
          subtitle: "Fluffy banana pancakes, soft scrambled eggs, and diced avocado toast fingers.",
          tag: "9–11 MONTHS • BREAKFAST",
        };
      }
      if (selectedCategory === "Lunch & Dinner") {
        return {
          image: posterLunchDinner911,
          title: "Lunch & Dinner: Nourishing Moments",
          subtitle: "Soft spiral pasta with chicken and sweet peas, mild vegetable curries & grain bowls.",
          tag: "9–11 MONTHS • LUNCH & DINNER",
        };
      }
      if (selectedCategory === "Snack") {
        return {
          image: posterSnacks911,
          title: "Snacks: Tiny Bites, Happy Days",
          subtitle: "Oat & banana fritters, steamed carrot sticks, broccoli trees with natural dip.",
          tag: "9–11 MONTHS • SNACKS",
        };
      }
      if (selectedCategory === "Dessert") {
        return {
          image: posterDesserts911,
          title: "Desserts & Smoothies: Sweet, Soft & Wholesome",
          subtitle: "Berry nicecream cups, spiced warm apple compote, and mango chia puddings.",
          tag: "9–11 MONTHS • DESSERTS & SMOOTHIES",
        };
      }
    }

    return null;
  }, [selectedAge, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-4 max-w-2xl mx-auto">
      {/* Title & PDF Export */}
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
      <div className="mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-4 px-4 no-scrollbar">
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
      <div className="mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-4 px-4 no-scrollbar">
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

      {/* Featured Category Artwork Banner (6-8m and 9-11m) */}
      {bannerInfo && (
        <div className="mb-6 rounded-[24px] overflow-hidden bg-white border border-[#EBE8DF] shadow-[0_8px_24px_-6px_rgba(30,94,58,0.08)]">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-2/5 aspect-[4/3] sm:aspect-[3/4] max-h-56 sm:max-h-none overflow-hidden bg-[#FAF9F5]">
              <img
                src={bannerInfo.image}
                alt={bannerInfo.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 sm:p-5 flex flex-col justify-center sm:w-3/5">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#48B774]">
                {bannerInfo.tag}
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-forest mt-1 leading-snug">
                {bannerInfo.title}
              </h2>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                {bannerInfo.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick 4-Category Carousel for 6-8 Months (when on All Categories) */}
      {selectedAge === "6-8 Months" && selectedCategory === "All Categories" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
              Explore 6–8 Months Categories
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { title: "Breakfast", img: posterBreakfast68, cat: "Breakfast" },
              { title: "Lunch & Dinner", img: posterLunchDinner68, cat: "Lunch & Dinner" },
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

      {/* Quick 4-Category Carousel for 9-11 Months (when on All Categories) */}
      {selectedAge === "9-11 Months" && selectedCategory === "All Categories" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
              Explore 9–11 Months Categories
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { title: "Breakfast", img: posterBreakfast911, cat: "Breakfast" },
              { title: "Lunch & Dinner", img: posterLunchDinner911, cat: "Lunch & Dinner" },
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
  );
};

export default Recipes;
