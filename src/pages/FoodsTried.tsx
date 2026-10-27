import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Apple, 
  Carrot, 
  Egg, 
  Wheat, 
  Search, 
  Check, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Calendar, 
  Plus, 
  ChevronRight,
  Info,
  ShieldCheck,
  Heart,
  TrendingUp,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  category: "Fruits" | "Vegetables" | "Proteins" | "Grains & Pantry";
  status: "not_tried" | "tried" | "reaction";
  triedDate?: string;
  preparation?: string;
  notes?: string;
}

const DEFAULT_100_FOODS: FoodItem[] = [
  // FRUITS (25)
  { id: "banana", name: "Banana", emoji: "🍌", category: "Fruits", status: "not_tried" },
  { id: "avocado", name: "Avocado", emoji: "🥑", category: "Fruits", status: "not_tried" },
  { id: "apple", name: "Apple", emoji: "🍎", category: "Fruits", status: "not_tried" },
  { id: "pear", name: "Pear", emoji: "🍐", category: "Fruits", status: "not_tried" },
  { id: "mango", name: "Mango", emoji: "🥭", category: "Fruits", status: "not_tried" },
  { id: "blueberries", name: "Blueberries", emoji: "🫐", category: "Fruits", status: "not_tried" },
  { id: "strawberries", name: "Strawberries", emoji: "🍓", category: "Fruits", status: "not_tried" },
  { id: "peach", name: "Peach", emoji: "🍑", category: "Fruits", status: "not_tried" },
  { id: "plum", name: "Plum", emoji: "🟣", category: "Fruits", status: "not_tried" },
  { id: "papaya", name: "Papaya", emoji: "🧡", category: "Fruits", status: "not_tried" },
  { id: "watermelon", name: "Watermelon", emoji: "🍉", category: "Fruits", status: "not_tried" },
  { id: "cantaloupe", name: "Cantaloupe", emoji: "🍈", category: "Fruits", status: "not_tried" },
  { id: "kiwi", name: "Kiwi", emoji: "🥝", category: "Fruits", status: "not_tried" },
  { id: "pineapple", name: "Pineapple", emoji: "🍍", category: "Fruits", status: "not_tried" },
  { id: "raspberries", name: "Raspberries", emoji: "❤️", category: "Fruits", status: "not_tried" },
  { id: "cherries", name: "Cherries (pitted & halved)", emoji: "🍒", category: "Fruits", status: "not_tried" },
  { id: "apricot", name: "Apricot", emoji: "🟠", category: "Fruits", status: "not_tried" },
  { id: "figs", name: "Figs", emoji: "🟤", category: "Fruits", status: "not_tried" },
  { id: "grapes", name: "Grapes (quartered lengthwise)", emoji: "🍇", category: "Fruits", status: "not_tried" },
  { id: "oranges", name: "Orange segments", emoji: "🍊", category: "Fruits", status: "not_tried" },
  { id: "blackberries", name: "Blackberries", emoji: "🫐", category: "Fruits", status: "not_tried" },
  { id: "guava", name: "Guava", emoji: "🌸", category: "Fruits", status: "not_tried" },
  { id: "coconut", name: "Coconut flakes / cream", emoji: "🥥", category: "Fruits", status: "not_tried" },
  { id: "prunes", name: "Prunes / Dried Plums", emoji: "🟣", category: "Fruits", status: "not_tried" },
  { id: "nectarine", name: "Nectarine", emoji: "🍑", category: "Fruits", status: "not_tried" },

  // VEGETABLES (25)
  { id: "sweet_potato", name: "Sweet Potato", emoji: "🍠", category: "Vegetables", status: "not_tried" },
  { id: "carrot", name: "Carrot", emoji: "🥕", category: "Vegetables", status: "not_tried" },
  { id: "broccoli", name: "Broccoli", emoji: "🥦", category: "Vegetables", status: "not_tried" },
  { id: "butternut_squash", name: "Butternut Squash", emoji: "🎃", category: "Vegetables", status: "not_tried" },
  { id: "peas", name: "Green Peas (smashed)", emoji: "🟢", category: "Vegetables", status: "not_tried" },
  { id: "zucchini", name: "Zucchini", emoji: "🥒", category: "Vegetables", status: "not_tried" },
  { id: "spinach", name: "Spinach (pureed / finely chopped)", emoji: "🥬", category: "Vegetables", status: "not_tried" },
  { id: "cauliflower", name: "Cauliflower", emoji: "🤍", category: "Vegetables", status: "not_tried" },
  { id: "potato", name: "Potato", emoji: "🥔", category: "Vegetables", status: "not_tried" },
  { id: "green_beans", name: "Green Beans", emoji: "🫘", category: "Vegetables", status: "not_tried" },
  { id: "pumpkin", name: "Pumpkin", emoji: "🎃", category: "Vegetables", status: "not_tried" },
  { id: "asparagus", name: "Asparagus spears", emoji: "🌱", category: "Vegetables", status: "not_tried" },
  { id: "beetroot", name: "Beetroot", emoji: "🟣", category: "Vegetables", status: "not_tried" },
  { id: "bell_pepper", name: "Bell Pepper (roasted & peeled)", emoji: "🫑", category: "Vegetables", status: "not_tried" },
  { id: "parsnip", name: "Parsnip", emoji: "🤍", category: "Vegetables", status: "not_tried" },
  { id: "kale", name: "Kale (tender massaged)", emoji: "🥬", category: "Vegetables", status: "not_tried" },
  { id: "eggplant", name: "Eggplant (roasted soft)", emoji: "🍆", category: "Vegetables", status: "not_tried" },
  { id: "cucumber", name: "Cucumber spears", emoji: "🥒", category: "Vegetables", status: "not_tried" },
  { id: "corn", name: "Sweet Corn (pureed / on cob)", emoji: "🌽", category: "Vegetables", status: "not_tried" },
  { id: "tomato", name: "Tomato (cooked & seeded)", emoji: "🍅", category: "Vegetables", status: "not_tried" },
  { id: "leek", name: "Leek (melted in olive oil)", emoji: "🧅", category: "Vegetables", status: "not_tried" },
  { id: "mushroom", name: "Mushroom (sautéed tender)", emoji: "🍄", category: "Vegetables", status: "not_tried" },
  { id: "cabbage", name: "Cabbage", emoji: "🥬", category: "Vegetables", status: "not_tried" },
  { id: "fennel", name: "Fennel (steamed soft)", emoji: "🌿", category: "Vegetables", status: "not_tried" },
  { id: "turnip", name: "Turnip", emoji: "🤍", category: "Vegetables", status: "not_tried" },

  // PROTEINS (25)
  { id: "egg_yolk", name: "Egg (well-cooked)", emoji: "🥚", category: "Proteins", status: "not_tried" },
  { id: "chicken", name: "Chicken", emoji: "🍗", category: "Proteins", status: "not_tried" },
  { id: "salmon", name: "Salmon (flaked & debuned)", emoji: "🐟", category: "Proteins", status: "not_tried" },
  { id: "white_fish", name: "White Fish (Cod / Haddock)", emoji: "🐟", category: "Proteins", status: "not_tried" },
  { id: "beef", name: "Beef (tender minced)", emoji: "🥩", category: "Proteins", status: "not_tried" },
  { id: "turkey", name: "Turkey", emoji: "🦃", category: "Proteins", status: "not_tried" },
  { id: "lentils_red", name: "Red Lentils (dahl)", emoji: "🫘", category: "Proteins", status: "not_tried" },
  { id: "chickpeas", name: "Chickpeas (mashed hummus)", emoji: "🧆", category: "Proteins", status: "not_tried" },
  { id: "tofu", name: "Tofu (silken / firm spears)", emoji: "🧊", category: "Proteins", status: "not_tried" },
  { id: "black_beans", name: "Black Beans (mashed)", emoji: "🫘", category: "Proteins", status: "not_tried" },
  { id: "kidney_beans", name: "Kidney Beans", emoji: "🫘", category: "Proteins", status: "not_tried" },
  { id: "lamb", name: "Lamb (stewed soft)", emoji: "🍖", category: "Proteins", status: "not_tried" },
  { id: "pork", name: "Pork (tender pulled)", emoji: "🥩", category: "Proteins", status: "not_tried" },
  { id: "edamame", name: "Edamame (mashed paste)", emoji: "🟢", category: "Proteins", status: "not_tried" },
  { id: "sardines", name: "Canned Sardines (boneless)", emoji: "🐟", category: "Proteins", status: "not_tried" },
  { id: "greek_yogurt", name: "Whole Milk Plain Greek Yogurt", emoji: "🥛", category: "Proteins", status: "not_tried" },
  { id: "cottage_cheese", name: "Cottage Cheese (pasteurized)", emoji: "🧀", category: "Proteins", status: "not_tried" },
  { id: "cheddar", name: "Mild Cheddar Cheese (shredded)", emoji: "🧀", category: "Proteins", status: "not_tried" },
  { id: "ricotta", name: "Ricotta Cheese", emoji: "🧀", category: "Proteins", status: "not_tried" },
  { id: "chia_seeds", name: "Chia Seeds (soaked / pudding)", emoji: "✨", category: "Proteins", status: "not_tried" },
  { id: "hemp_hearts", name: "Hemp Hearts", emoji: "🌿", category: "Proteins", status: "not_tried" },
  { id: "peanut_butter", name: "Peanut Butter (thinned with warm water)", emoji: "🥜", category: "Proteins", status: "not_tried" },
  { id: "almond_butter", name: "Almond Butter (thinned)", emoji: "🌰", category: "Proteins", status: "not_tried" },
  { id: "tahini", name: "Tahini (Sesame paste thinned)", emoji: "🫙", category: "Proteins", status: "not_tried" },
  { id: "sunflower_butter", name: "Sunflower Seed Butter", emoji: "🌻", category: "Proteins", status: "not_tried" },

  // GRAINS & PANTRY (25)
  { id: "oats", name: "Rolled Oats (Porridge)", emoji: "🌾", category: "Grains & Pantry", status: "not_tried" },
  { id: "rice", name: "Brown / White Rice", emoji: "🍚", category: "Grains & Pantry", status: "not_tried" },
  { id: "quinoa", name: "Quinoa", emoji: "🌾", category: "Grains & Pantry", status: "not_tried" },
  { id: "pasta_wheat", name: "Wheat Pasta (fusilli / penne)", emoji: "🍝", category: "Grains & Pantry", status: "not_tried" },
  { id: "barley", name: "Barley", emoji: "🌾", category: "Grains & Pantry", status: "not_tried" },
  { id: "millet", name: "Millet", emoji: "🌾", category: "Grains & Pantry", status: "not_tried" },
  { id: "buckwheat", name: "Buckwheat", emoji: "🥞", category: "Grains & Pantry", status: "not_tried" },
  { id: "couscous", name: "Couscous", emoji: "🥣", category: "Grains & Pantry", status: "not_tried" },
  { id: "polenta", name: "Polenta / Cornmeal", emoji: "🌽", category: "Grains & Pantry", status: "not_tried" },
  { id: "sourdough", name: "Toasted Sourdough crust", emoji: "🍞", category: "Grains & Pantry", status: "not_tried" },
  { id: "olive_oil", name: "Extra Virgin Olive Oil", emoji: "🫒", category: "Grains & Pantry", status: "not_tried" },
  { id: "avocado_oil", name: "Avocado Oil", emoji: "🥑", category: "Grains & Pantry", status: "not_tried" },
  { id: "cinnamon", name: "Ceylon Cinnamon (dash)", emoji: "🪵", category: "Grains & Pantry", status: "not_tried" },
  { id: "cumin", name: "Cumin", emoji: "🧂", category: "Grains & Pantry", status: "not_tried" },
  { id: "turmeric", name: "Turmeric", emoji: "🟡", category: "Grains & Pantry", status: "not_tried" },
  { id: "garlic", name: "Garlic (cooked mild)", emoji: "🧄", category: "Grains & Pantry", status: "not_tried" },
  { id: "ginger", name: "Ginger (cooked)", emoji: "🫚", category: "Grains & Pantry", status: "not_tried" },
  { id: "basil", name: "Fresh Basil", emoji: "🌿", category: "Grains & Pantry", status: "not_tried" },
  { id: "oregano", name: "Oregano", emoji: "🌿", category: "Grains & Pantry", status: "not_tried" },
  { id: "thyme", name: "Thyme", emoji: "🌿", category: "Grains & Pantry", status: "not_tried" },
  { id: "nutritional_yeast", name: "Nutritional Yeast (cheesy sprinkle)", emoji: "🧀", category: "Grains & Pantry", status: "not_tried" },
  { id: "flaxseed", name: "Ground Flaxseed", emoji: "🌾", category: "Grains & Pantry", status: "not_tried" },
  { id: "sesame_seeds", name: "Sesame Seeds (crushed)", emoji: "⚪", category: "Grains & Pantry", status: "not_tried" },
  { id: "amaranth", name: "Amaranth", emoji: "🌾", category: "Grains & Pantry", status: "not_tried" },
  { id: "cardamom", name: "Cardamom (dash)", emoji: "✨", category: "Grains & Pantry", status: "not_tried" },
];

const STORAGE_KEY = "babybites_100_foods_v3";

export const FoodsTried: React.FC = () => {
  const [foods, setFoods] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);

      // Check legacy storage and clean any mock data
      const legacy = localStorage.getItem("babybites_100_foods");
      if (legacy) {
        const parsed: FoodItem[] = JSON.parse(legacy);
        const hasLegacyMock = parsed.some(f => f.triedDate === "2026-10-12" || f.notes === "Loved it instantly!");
        if (hasLegacyMock) {
          localStorage.removeItem("babybites_100_foods");
          return DEFAULT_100_FOODS;
        }
        return parsed;
      }
      return DEFAULT_100_FOODS;
    } catch {
      return DEFAULT_100_FOODS;
    }
  });

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"checklist" | "timeline">("checklist");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // Form states for logging a food
  const [logStatus, setLogStatus] = useState<"not_tried" | "tried" | "reaction">("tried");
  const [logDate, setLogDate] = useState("");
  const [logPrep, setLogPrep] = useState("");
  const [logNotes, setLogNotes] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(foods));
    } catch (e) {
      console.error(e);
    }
  }, [foods]);

  const openLogModal = (food: FoodItem) => {
    setSelectedFood(food);
    setLogStatus(food.status === "not_tried" ? "tried" : food.status);
    setLogDate(food.triedDate || new Date().toISOString().split("T")[0]);
    setLogPrep(food.preparation || "");
    setLogNotes(food.notes || "");
  };

  const handleSaveLog = () => {
    if (!selectedFood) return;

    setFoods((prev) =>
      prev.map((item) => {
        if (item.id === selectedFood.id) {
          return {
            ...item,
            status: logStatus,
            triedDate: logStatus !== "not_tried" ? logDate : undefined,
            preparation: logStatus !== "not_tried" ? logPrep : undefined,
            notes: logStatus !== "not_tried" ? logNotes : undefined,
          };
        }
        return item;
      })
    );

    toast.success(`Updated ${selectedFood.name}! ✨`);
    setSelectedFood(null);
  };

  // Stats
  const triedCount = useMemo(() => foods.filter((f) => f.status === "tried").length, [foods]);
  const reactionCount = useMemo(() => foods.filter((f) => f.status === "reaction").length, [foods]);
  const progressPercent = Math.round((triedCount / foods.length) * 100);

  // Filtered foods for checklist
  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      if (activeCategory !== "All" && f.category !== activeCategory) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [foods, activeCategory, searchQuery]);

  // Timeline list (sorted newest first)
  const timelineFoods = useMemo(() => {
    return foods
      .filter((f) => f.status !== "not_tried" && f.triedDate)
      .sort((a, b) => new Date(b.triedDate!).getTime() - new Date(a.triedDate!).getTime());
  }, [foods]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-3.5 sm:px-4 w-full max-w-2xl mx-auto min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-5 w-full min-w-0">
        <span className="text-xs font-semibold tracking-wider uppercase text-[#48B774]">
          Feeding Milestones & Progress
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-0.5 flex items-center gap-2">
          <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-[#48B774] fill-[#48B774]/20 shrink-0" /> 100 Foods Before One
        </h1>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          Track every first flavor, safe preparation style, and milestone reaction as your baby builds a lifetime of joyful, adventurous eating.
        </p>
      </div>

      {/* Motivational Progress Card */}
      <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-[#EBE8DF] p-4 sm:p-5 shadow-[0_8px_24px_-6px_rgba(30,94,58,0.08)] mb-6 w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Food Adventure Progress
            </span>
            <h2 className="text-2xl font-serif font-bold text-forest mt-0.5">
              {triedCount} <span className="text-sm font-sans font-normal text-gray-400">/ {foods.length} Foods Explored</span>
            </h2>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#EAF5EE] border-4 border-[#CCE0D2] flex items-center justify-center text-forest font-bold text-sm">
            {progressPercent}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#FAF9F5] h-3 rounded-full overflow-hidden border border-[#EBE8DF] p-0.5 mt-2">
          <div
            className="h-full bg-gradient-to-r from-[#1E5E3A] to-[#48B774] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-3 pt-2 border-t border-[#F5F3EC]">
          <span className="flex items-center gap-1.5 text-forest font-medium">
            <span className="w-2 h-2 rounded-full bg-[#48B774]" /> {triedCount} Safe & Loved
          </span>
          {reactionCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500" /> {reactionCount} Reactions Observed
            </span>
          )}
          <span>{foods.length - triedCount - reactionCount} Remaining</span>
        </div>
      </div>

      {/* View Switcher (Checklist vs Food Journey Timeline) */}
      <div className="grid grid-cols-2 gap-2 bg-[#EFECE4] p-1.5 rounded-2xl mb-5">
        <button
          onClick={() => setViewMode("checklist")}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            viewMode === "checklist"
              ? "bg-white text-forest shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          100 Foods Checklist
        </button>
        <button
          onClick={() => setViewMode("timeline")}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            viewMode === "timeline"
              ? "bg-white text-forest shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Food Journey Timeline 📖
        </button>
      </div>

      {/* CHECKLIST VIEW */}
      {viewMode === "checklist" && (
        <div className="space-y-4">
          {/* Search & Filter pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food (e.g. avocado, egg, oats)..."
                className="w-full h-10 pl-9 pr-4 rounded-full border border-[#D5D0C3] bg-white text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#48B774]"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full max-w-full min-w-0">
              {["All", "Fruits", "Vegetables", "Proteins", "Grains & Pantry"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? "bg-forest text-white shadow-xs"
                      : "bg-white text-gray-500 border border-[#EBE8DF] hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Foods Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredFoods.map((food) => {
              const isTried = food.status === "tried";
              const isReaction = food.status === "reaction";

              return (
                <button
                  key={food.id}
                  onClick={() => openLogModal(food)}
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group active:scale-98 ${
                    isTried
                      ? "bg-[#F3F8F4] border-[#CCE0D2] shadow-xs hover:border-[#48B774]"
                      : isReaction
                      ? "bg-red-50 border-red-200 shadow-xs"
                      : "bg-white border-[#EBE8DF] hover:border-gray-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl block mb-1">{food.emoji}</span>
                    {isTried && (
                      <span className="w-5 h-5 rounded-full bg-[#48B774] text-white flex items-center justify-center text-xs shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    {isReaction && (
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow-xs">
                        <AlertTriangle className="w-3 h-3" />
                      </span>
                    )}
                    {!isTried && !isReaction && (
                      <span className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-gray-300 group-hover:border-forest group-hover:text-forest">
                        <Plus className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-gray-900 text-xs sm:text-sm line-clamp-1 group-hover:text-forest">
                      {food.name}
                    </h4>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {isTried ? `Tried ${food.triedDate?.split("-").slice(1).join("/")}` : isReaction ? "Reaction noted" : "Not tried yet"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TIMELINE / FOOD JOURNEY VIEW */}
      {viewMode === "timeline" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-[#EAF5EE] rounded-2xl p-3.5 border border-[#CCE0D2] flex items-center gap-2.5 text-xs text-forest">
            <Info className="w-4 h-4 flex-shrink-0 text-[#48B774]" />
            <span>
              Your baby's chronological tasting journal. Every entry preserves texture styles, dates, and milestone reactions.
            </span>
          </div>

          {timelineFoods.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-[28px] border border-[#EBE8DF]">
              <Sparkles className="w-8 h-8 text-[#48B774] mx-auto mb-2" />
              <h3 className="font-serif font-bold text-gray-900 text-base">
                No food experiences recorded yet
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Switch to the "Checklist" tab and tap any ingredient your baby has tasted to build their journey timeline!
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D6E3D8]">
              {timelineFoods.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 top-3 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                      item.status === "reaction" ? "bg-red-500 text-white" : "bg-[#48B774] text-white"
                    }`}
                  >
                    {item.status === "reaction" ? (
                      <AlertTriangle className="w-2.5 h-2.5" />
                    ) : (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    )}
                  </div>

                  {/* Card */}
                  <div
                    onClick={() => openLogModal(item)}
                    className="p-4 rounded-[22px] bg-white border border-[#EBE8DF] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.emoji}</span>
                        <h4 className="font-serif font-bold text-gray-900 text-sm">
                          {item.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-forest bg-[#F3F6F3] px-2 py-0.5 rounded-full">
                        {item.triedDate}
                      </span>
                    </div>

                    {item.preparation && (
                      <p className="text-xs text-gray-600 font-medium">
                        🥣 Prep: <span className="font-normal">{item.preparation}</span>
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic leading-relaxed">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LOG FOOD MODAL */}
      <Dialog open={!!selectedFood} onOpenChange={(open) => !open && setSelectedFood(null)}>
        <DialogContent className="max-w-md bg-white rounded-[32px] p-6 border-[#EBE8DF]">
          {selectedFood && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-[#FAF9F5] rounded-2xl border border-[#EBE8DF]">
                    {selectedFood.emoji}
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#48B774]">
                      {selectedFood.category}
                    </span>
                    <DialogTitle className="font-serif font-bold text-forest text-xl">
                      {selectedFood.name}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Tasting Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLogStatus("tried")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      logStatus === "tried"
                        ? "bg-[#EAF5EE] border-[#48B774] text-forest shadow-xs"
                        : "bg-[#FAF9F5] border-[#EBE8DF] text-gray-600"
                    }`}
                  >
                    🟢 Tried & Safe
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogStatus("reaction")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      logStatus === "reaction"
                        ? "bg-red-50 border-red-400 text-red-600 shadow-xs"
                        : "bg-[#FAF9F5] border-[#EBE8DF] text-gray-600"
                    }`}
                  >
                    🔴 Reaction
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogStatus("not_tried")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      logStatus === "not_tried"
                        ? "bg-gray-100 border-gray-400 text-gray-800 shadow-xs"
                        : "bg-[#FAF9F5] border-[#EBE8DF] text-gray-400"
                    }`}
                  >
                    ⚪ Reset
                  </button>
                </div>
              </div>

              {logStatus !== "not_tried" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Date Tried
                    </label>
                    <Input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="rounded-xl text-xs h-10 border-[#EBE8DF]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Preparation & Texture
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Steamed soft spear, mashed with olive oil..."
                      value={logPrep}
                      onChange={(e) => setLogPrep(e.target.value)}
                      className="rounded-xl text-xs h-10 border-[#EBE8DF]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Baby's Reaction & Notes
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="e.g. Loved it, smiled and reached for more! No skin redness or tummy issues."
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      className="rounded-xl text-xs border-[#EBE8DF] resize-none"
                    />
                  </div>
                </>
              )}

              {/* Safety notice */}
              <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#EBE8DF] flex items-start gap-2 text-[11px] text-gray-500 leading-relaxed">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-[#48B774] mt-0.5" />
                <span>
                  Logging a food helps build your baby's nutrition journey. If any severe reaction or breathing difficulty occurs, contact emergency services immediately.
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedFood(null)}
                  className="flex-1 rounded-full text-xs h-10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveLog}
                  className="flex-1 rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white text-xs h-10"
                >
                  Save Entry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodsTried;
