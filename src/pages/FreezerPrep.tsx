import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Snowflake, 
  Calendar, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Info,
  ChefHat,
  ArrowRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { recipes } from "@/data/recipes";

interface StashItem {
  id: string;
  foodName: string;
  portions: number;
  frozenDate: string; // YYYY-MM-DD
  maxMonths: number;
}

const STORAGE_RULES = [
  {
    category: "Vegetable & Fruit Purees",
    maxDuration: "Up to 3 months",
    months: 3,
    emoji: "🥦",
    tip: "Freeze in silicone 1-oz / 30ml cubes. Once solid, pop into labeled freezer bags.",
  },
  {
    category: "Cooked Meat, Chicken & Fish",
    maxDuration: "1 to 2 months",
    months: 2,
    emoji: "🍗",
    tip: "Ensure thoroughly cooked before blending. Label with the exact day of cooking.",
  },
  {
    category: "Baby Muffins, Tots & Oat Fingers",
    maxDuration: "Up to 2 months",
    months: 2,
    emoji: "🥞",
    tip: "Flash-freeze spaced on parchment paper for 1 hour before bagging together.",
  },
  {
    category: "Soups, Bone Broths & Baby Stews",
    maxDuration: "Up to 2 months",
    months: 2,
    emoji: "🥣",
    tip: "Leave 1/2 inch of space at the top of containers for natural freezing expansion.",
  },
];

const STORAGE_KEY = "babybites_freezer_stash_v2";

export const FreezerPrep: React.FC = () => {
  const [stash, setStash] = useState<StashItem[]>(() => {
    try {
      // Clear legacy sample stash
      localStorage.removeItem("babybites_freezer_stash");
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newFoodName, setNewFoodName] = useState("");
  const [newPortions, setNewPortions] = useState("4");
  const [newMonths, setNewMonths] = useState(3);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<"stash" | "recipes" | "rules">("stash");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stash));
    } catch (e) {
      console.error(e);
    }
  }, [stash]);

  const handleAddStash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName.trim()) return;

    const newItem: StashItem = {
      id: "stash-" + Date.now(),
      foodName: newFoodName.trim(),
      portions: parseInt(newPortions, 10) || 1,
      frozenDate: new Date().toISOString().split("T")[0],
      maxMonths: newMonths,
    };

    setStash([newItem, ...stash]);
    setNewFoodName("");
    setNewPortions("4");
    setIsAdding(false);
    toast.success(`Added ${newItem.foodName} to your Freezer Stash! ❄️`);
  };

  const updatePortions = (id: string, delta: number) => {
    setStash((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const next = item.portions + delta;
            return next > 0 ? { ...item, portions: next } : null;
          }
          return item;
        })
        .filter((item): item is StashItem => item !== null)
    );
  };

  const removeItem = (id: string) => {
    setStash((prev) => prev.filter((i) => i.id !== id));
    toast.info("Portion removed from stash");
  };

  // Calculate expiry status
  const getExpiryInfo = (item: StashItem) => {
    const frozen = new Date(item.frozenDate);
    const expires = new Date(frozen);
    expires.setMonth(expires.getMonth() + item.maxMonths);

    const now = new Date();
    const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: "expired", label: "Expired", color: "text-red-500 bg-red-50 border-red-200" };
    }
    if (diffDays <= 14) {
      return { status: "soon", label: `Use in ${diffDays}d`, color: "text-amber-600 bg-amber-50 border-amber-200" };
    }
    return { status: "good", label: `Good for ${diffDays}d`, color: "text-forest bg-[#F3F6F3] border-[#CCE0D2]" };
  };

  // Filter recipes ideal for batch freezing
  const freezerRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const text = (r.title + " " + r.description + " " + r.instructions.join(" ")).toLowerCase();
      return (
        text.includes("freeze") ||
        text.includes("batch") ||
        text.includes("muffin") ||
        text.includes("puree") ||
        text.includes("tots") ||
        text.includes("patties") ||
        text.includes("soup")
      );
    }).slice(0, 18);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-3.5 sm:px-4 w-full max-w-2xl mx-auto min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-5 w-full min-w-0">
        <span className="text-xs font-semibold tracking-wider uppercase text-[#48B774]">
          Batch Cooking & Meal Prep
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-0.5 flex items-center gap-2">
          <Snowflake className="w-7 h-7 sm:w-8 sm:h-8 text-[#48B774] shrink-0" /> Freezer-Friendly Meals
        </h1>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          Cook once, feed multiple days! Track portions stored in your freezer, discover batch recipes, and follow pediatric safety thawing rules.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-[#EFECE4] p-1.5 rounded-2xl mb-6 w-full min-w-0">
        <button
          onClick={() => setActiveTab("stash")}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "stash"
              ? "bg-white text-forest shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          My Freezer ({stash.length})
        </button>
        <button
          onClick={() => setActiveTab("recipes")}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "recipes"
              ? "bg-white text-forest shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Batch Recipes ({freezerRecipes.length})
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "rules"
              ? "bg-white text-forest shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Safety Rules 🛡️
        </button>
      </div>

      {/* TAB 1: MY FREEZER STASH */}
      {activeTab === "stash" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-serif font-bold text-forest">
              Portions Stored in Freezer
            </h2>
            <Button
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              className="rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white text-xs h-8 px-3"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Batch Portion
            </Button>
          </div>

          {/* Add Portion Form Card */}
          {isAdding && (
            <form
              onSubmit={handleAddStash}
              className="bg-white rounded-[24px] border border-[#EBE8DF] p-4 shadow-sm space-y-3 animate-fade-in"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-forest block">
                Record New Freezer Batch
              </span>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                  Recipe / Food Name
                </label>
                <Input
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  placeholder="e.g. Butternut Squash & Apple Mash"
                  className="rounded-xl h-10 text-xs border-[#EBE8DF]"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                    Portions / Cubes
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={newPortions}
                    onChange={(e) => setNewPortions(e.target.value)}
                    className="rounded-xl h-10 text-xs border-[#EBE8DF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                    Storage Limit
                  </label>
                  <select
                    value={newMonths}
                    onChange={(e) => setNewMonths(parseInt(e.target.value, 10))}
                    className="w-full h-10 rounded-xl border border-[#EBE8DF] px-3 bg-white text-xs text-gray-700"
                  >
                    <option value={3}>3 Months (Veg / Fruit Purees)</option>
                    <option value={2}>2 Months (Meat / Fish / Muffins)</option>
                    <option value={1}>1 Month (High Dairy Blends)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1 rounded-xl bg-[#48B774] hover:bg-[#3ca465] text-white text-xs h-9"
                >
                  Save to Stash ❄️
                </Button>
              </div>
            </form>
          )}

          {/* Stash Items List */}
          {stash.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-[28px] border border-[#EBE8DF]">
              <Snowflake className="w-10 h-10 mx-auto text-[#48B774] opacity-50 mb-2" />
              <h3 className="font-serif font-bold text-gray-900 text-base">
                Your freezer stash is empty
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Next time you cook a puree or batch muffins, click "Add Batch Portion" above to track portions and safe expiry dates!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stash.map((item) => {
                const expiry = getExpiryInfo(item);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white rounded-[22px] border border-[#EBE8DF] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${expiry.color}`}>
                          {expiry.label}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Frozen on {item.frozenDate}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-gray-900 text-sm truncate">
                        {item.foodName}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        <span className="font-bold text-forest">{item.portions}</span> {item.portions === 1 ? "portion" : "portions"} remaining
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updatePortions(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-[#FAF9F5] border border-[#EBE8DF] hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                        title="Use 1 portion"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updatePortions(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-[#FAF9F5] border border-[#EBE8DF] hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                        title="Add 1 portion"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors ml-1"
                        title="Delete from stash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BATCH RECIPES */}
      {activeTab === "recipes" && (
        <div className="space-y-3">
          <div className="bg-[#EAF5EE] rounded-2xl p-3.5 border border-[#CCE0D2] flex items-center gap-2.5 text-xs text-forest">
            <Info className="w-4 h-4 flex-shrink-0 text-[#48B774]" />
            <span>
              All recipes below can be made in large batches, frozen in cubes or silicone cups, and thawed safely.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {freezerRecipes.map((r) => (
              <Link
                key={r.id}
                to={`/recipe/${r.id}`}
                className="rounded-[22px] bg-white border border-[#EBE8DF] overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 relative">
                  <img
                    src={r.image}
                    alt={r.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold flex items-center gap-1 backdrop-blur-md">
                      <Snowflake className="w-2.5 h-2.5 text-[#48B774]" /> Freeze-Safe
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <span className="text-[10px] font-medium text-[#48B774] block mb-0.5">
                    {r.ageGroup}
                  </span>
                  <h4 className="font-serif font-bold text-gray-900 text-xs sm:text-sm line-clamp-1 group-hover:text-forest">
                    {r.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                    {r.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SAFETY RULES & THAWING GUIDELINES */}
      {activeTab === "rules" && (
        <div className="space-y-4 animate-fade-in">
          {/* Storage duration cards */}
          <div className="space-y-2.5">
            <h3 className="font-serif font-bold text-forest text-base px-1">
              Pediatric Freezer Storage Timelines
            </h3>
            {STORAGE_RULES.map((rule, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[22px] border border-[#EBE8DF] p-4 shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span>{rule.emoji}</span>
                    <span>{rule.category}</span>
                  </span>
                  <span className="text-[11px] font-bold text-forest bg-[#F3F6F3] px-2 py-0.5 rounded-full">
                    {rule.maxDuration}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {rule.tip}
                </p>
              </div>
            ))}
          </div>

          {/* Golden Safety Rules Card */}
          <div className="bg-[#FFF8E6] border border-[#FBE0A1] rounded-[24px] p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <h4 className="font-serif font-bold text-sm">
                Essential Pediatric Safety Protocols
              </h4>
            </div>

            <ul className="space-y-2 text-xs text-amber-900/90 leading-relaxed list-disc list-inside">
              <li>
                <strong>Never Refreeze:</strong> Once a baby food cube has thawed, bacteria multiply rapidly if re-frozen. Use within 24 hours or discard.
              </li>
              <li>
                <strong>Saliva Contamination:</strong> Never freeze leftovers from a bowl that has already touched the baby's spoon or saliva.
              </li>
              <li>
                <strong>Thawing Safely:</strong> Thaw overnight in the refrigerator (safest) or in a sealed container immersed in lukewarm water. Never leave on kitchen counter.
              </li>
              <li>
                <strong>Reheating:</strong> Reheat until steaming hot all the way through, then stir thoroughly to eliminate microwave hot spots, and let cool to body temperature before offering.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreezerPrep;
