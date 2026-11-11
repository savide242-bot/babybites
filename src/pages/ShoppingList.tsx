import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingCart, Download, Share2, Trash2, 
  Apple, Carrot, Beef, Wheat, Milk, Package,
  ChefHat, Sparkles, Check, Home, Plus, ChevronDown, 
  ChevronUp, CheckCircle2, Search, Filter,
  ShoppingBag, Store
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { syncShoppingListFromMealPlans } from "@/utils/shoppingListSync";
import { AtmosphericBackground } from "@/components/layout/AtmosphericBackground";

interface ShoppingItem {
  id: string;
  ingredient: string;
  category: string;
  checked: boolean;
  inPantry?: boolean;
  fromRecipe?: string;
  quantity?: string;
}

const CATEGORY_MAP: { [key: string]: { label: string; icon: any; color: string; badge: string; bg: string; border: string } } = {
  'Vegetables': { 
    label: 'Vegetables & Greens', 
    icon: Carrot, 
    color: 'text-emerald-700 dark:text-emerald-300', 
    badge: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', 
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-100 dark:border-emerald-900/40' 
  },
  'Fruits': { 
    label: 'Fresh Fruits', 
    icon: Apple, 
    color: 'text-rose-700 dark:text-rose-300', 
    badge: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800', 
    bg: 'bg-rose-500/10',
    border: 'border-rose-100 dark:border-rose-900/40' 
  },
  'Proteins': { 
    label: 'Proteins & Meats', 
    icon: Beef, 
    color: 'text-amber-700 dark:text-amber-300', 
    badge: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800', 
    bg: 'bg-amber-500/10',
    border: 'border-amber-100 dark:border-amber-900/40' 
  },
  'Cereals & Grains': { 
    label: 'Grains & Cereals', 
    icon: Wheat, 
    color: 'text-yellow-700 dark:text-yellow-300', 
    badge: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800', 
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-100 dark:border-yellow-900/40' 
  },
  'Dairy': { 
    label: 'Dairy & Eggs', 
    icon: Milk, 
    color: 'text-sky-700 dark:text-sky-300', 
    badge: 'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800', 
    bg: 'bg-sky-500/10',
    border: 'border-sky-100 dark:border-sky-900/40' 
  },
  'Pantry Essentials': { 
    label: 'Pantry & Spices', 
    icon: Package, 
    color: 'text-purple-700 dark:text-purple-300', 
    badge: 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800', 
    bg: 'bg-purple-500/10',
    border: 'border-purple-100 dark:border-purple-900/40' 
  },
  'Other': { 
    label: 'Other Items', 
    icon: ShoppingBag, 
    color: 'text-stone-700 dark:text-stone-300', 
    badge: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700', 
    bg: 'bg-stone-500/10',
    border: 'border-stone-200 dark:border-stone-800' 
  },
};

const QUICK_SUGGESTIONS = [
  { name: "Avocado", category: "Fruits" },
  { name: "Banana", category: "Fruits" },
  { name: "Sweet Potato", category: "Vegetables" },
  { name: "Carrots", category: "Vegetables" },
  { name: "Broccoli", category: "Vegetables" },
  { name: "Eggs", category: "Dairy" },
  { name: "Rolled Oats", category: "Cereals & Grains" },
  { name: "Olive Oil", category: "Pantry Essentials" },
];

const LOCAL_STORAGE_KEY_BASE = 'babybites_shopping_list_v4';
const getStorageKey = (uid?: string | null) => uid ? `${LOCAL_STORAGE_KEY_BASE}_${uid}` : LOCAL_STORAGE_KEY_BASE;

export const ShoppingList: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [newCategory, setNewCategory] = useState("Vegetables");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "collected">("all");
  const [showPantrySection, setShowPantrySection] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const saveLocal = (updated: ShoppingItem[], uid?: string | null) => {
    try {
      localStorage.setItem(getStorageKey(uid ?? userId), JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await syncShoppingListFromMealPlans(user.id);
        await loadShoppingList(user.id);
      } else {
        const saved = localStorage.getItem(getStorageKey(null));
        setItems(saved ? JSON.parse(saved) : []);
        setIsLoading(false);
      }
    } catch {
      const saved = localStorage.getItem(getStorageKey(null));
      setItems(saved ? JSON.parse(saved) : []);
      setIsLoading(false);
    }
  };

  const loadShoppingList = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('user_id', uid)
        .order('category');

      if (error || !data || data.length === 0) {
        const saved = localStorage.getItem(getStorageKey(uid));
        setItems(saved ? JSON.parse(saved) : []);
      } else {
        const mappedItems: ShoppingItem[] = data.map((item) => ({
          id: item.id,
          ingredient: item.ingredient,
          category: item.category || 'Other',
          checked: item.checked || false,
          inPantry: false,
          fromRecipe: item.from_recipe || undefined,
        }));
        setItems(mappedItems);
        saveLocal(mappedItems);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newChecked = !item.checked;
    const updated = items.map((i) => (i.id === id ? { ...i, checked: newChecked } : i));
    setItems(updated);
    saveLocal(updated);

    if (userId) {
      await supabase
        .from('shopping_list_items')
        .update({ checked: newChecked })
        .eq('id', id);
    }
  };

  const togglePantry = (id: string) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const nextState = !item.inPantry;
        toast({
          title: nextState ? "Marked as In Pantry!" : "Moved back to Shopping List",
          description: nextState 
            ? `You already have ${item.ingredient} at home. Excluded from your supermarket trip.`
            : `${item.ingredient} added back to supermarket shopping list.`
        });
        return { ...item, inPantry: nextState, checked: false };
      }
      return item;
    });
    setItems(updated);
    saveLocal(updated);
  };

  const handleAddItem = (e?: React.FormEvent, customName?: string, customCat?: string) => {
    if (e) e.preventDefault();
    const textToAdd = (customName || newItemText).trim();
    if (!textToAdd) return;

    const newItem: ShoppingItem = {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      ingredient: textToAdd,
      category: customCat || newCategory,
      checked: false,
      inPantry: false,
      fromRecipe: "Added manually"
    };

    const updated = [newItem, ...items];
    setItems(updated);
    saveLocal(updated);
    setNewItemText("");
    toast({ title: "Item added!", description: `${textToAdd} added to your shopping list.` });
  };

  const removeItem = async (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    saveLocal(updated);
    if (userId) {
      await supabase.from('shopping_list_items').delete().eq('id', id);
    }
    toast({ title: "Item removed" });
  };

  const clearCheckedItems = async () => {
    const checkedIds = items.filter(i => i.checked && !i.inPantry).map(i => i.id);
    if (checkedIds.length === 0) return;
    
    const updated = items.filter(i => !(i.checked && !i.inPantry));
    setItems(updated);
    saveLocal(updated);

    if (userId) {
      await supabase.from('shopping_list_items').delete().in('id', checkedIds);
    }
    toast({ title: "Purchased items cleared successfully!" });
  };

  // Active supermarket items vs items already at home
  const activeShoppingItems = useMemo(() => items.filter(i => !i.inPantry), [items]);
  const pantryItems = useMemo(() => items.filter(i => i.inPantry), [items]);

  const completedCount = activeShoppingItems.filter(i => i.checked).length;
  const totalNeededCount = activeShoppingItems.length;
  const pendingCount = totalNeededCount - completedCount;
  const progress = totalNeededCount > 0 ? Math.round((completedCount / totalNeededCount) * 100) : 0;

  // Filtered list
  const filteredActiveItems = useMemo(() => {
    return activeShoppingItems.filter(item => {
      const matchesSearch = item.ingredient.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.fromRecipe && item.fromRecipe.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
      if (activeFilter === "pending") return !item.checked;
      if (activeFilter === "collected") return item.checked;
      return true;
    });
  }, [activeShoppingItems, searchQuery, activeFilter]);

  // Group by category
  const activeByCategory = useMemo(() => {
    const grouped: { [category: string]: ShoppingItem[] } = {};
    filteredActiveItems.forEach(item => {
      const cat = item.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  }, [filteredActiveItems]);

  const handleExportText = () => {
    const neededUnchecked = activeShoppingItems.filter(i => !i.checked);
    
    if (neededUnchecked.length === 0 && pantryItems.length === 0) {
      toast({ title: "All set!", description: "All grocery items have already been checked." });
      return;
    }
    
    let content = `🛒 BabyBites - Baby's Grocery & Shopping List\n`;
    content += `Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;
    
    content += `--- NEEDED SUPERMARKET GROCERIES (${neededUnchecked.length}) ---\n`;
    const categories = [...new Set(neededUnchecked.map(i => i.category))];
    categories.forEach(category => {
      const config = CATEGORY_MAP[category] || CATEGORY_MAP['Other'];
      const catItems = neededUnchecked.filter(i => i.category === category);
      content += `\n[${config.label.toUpperCase()}]\n`;
      catItems.forEach(item => {
        content += ` ☐ ${item.ingredient}${item.fromRecipe ? ` (${item.fromRecipe})` : ''}\n`;
      });
    });

    if (pantryItems.length > 0) {
      content += `\n--- ALREADY IN PANTRY (DO NOT BUY) (${pantryItems.length}) ---\n`;
      pantryItems.forEach(item => {
        content += ` ✔ ${item.ingredient}\n`;
      });
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `babybites-groceries-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "List Exported!", description: "Checklist file saved to your device." });
  };

  const handleShareWhatsApp = () => {
    const neededUnchecked = activeShoppingItems.filter(i => !i.checked);
    
    if (neededUnchecked.length === 0 && pantryItems.length === 0) {
      toast({ title: "List empty", description: "Add items before sharing." });
      return;
    }
    
    let message = `🛒 *BabyBites - Baby's Grocery List*\n`;
    message += `📅 ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n\n`;
    
    const categories = [...new Set(neededUnchecked.map(i => i.category))];
    categories.forEach(cat => {
      const config = CATEGORY_MAP[cat] || CATEGORY_MAP['Other'];
      const catItems = neededUnchecked.filter(i => i.category === cat);
      if (catItems.length > 0) {
        message += `*${config.label}:*\n`;
        catItems.forEach(item => {
          message += `• ${item.ingredient}\n`;
        });
        message += "\n";
      }
    });

    if (pantryItems.length > 0) {
      message += `*(Already at Home / In Pantry: ${pantryItems.length} items verified)*\n\n`;
    }
    
    message += `👶 Compiled with BabyBites`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FAF9F5] dark:bg-[#121614] pt-24 pb-16">
        <div className="container max-w-3xl mx-auto px-4 space-y-4">
          <Skeleton className="h-14 w-2/3 rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#FAF9F5] dark:bg-[#121614] text-stone-900 dark:text-stone-100 pt-16 pb-24 selection:bg-[#1E5E3A]/20 transition-colors">
      <AtmosphericBackground />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
        {/* ================= HERO HEADER ================= */}
        <div className="pt-4 pb-6 border-b border-stone-200/80 dark:border-stone-800/80 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E5E3A]/10 dark:bg-emerald-950/80 text-[#1E5E3A] dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-[#1E5E3A]/15 dark:border-emerald-800/40">
                  <Store className="w-3.5 h-3.5" />
                  Supermarket
                </span>
                <span className="text-xs text-stone-500 font-serif italic">
                  • Meal Plan Auto-Sync
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#1E5E3A] dark:text-emerald-400 tracking-tight">
                Shopping & Pantry
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-lg">
                Supermarket ingredients organized by aisle, excluding what you already have in your kitchen pantry.
              </p>
            </div>

            {/* Quick Share / Export Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleExportText}
                variant="outline"
                size="sm"
                className="h-10 rounded-full px-4 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 shadow-xs text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                size="sm"
                className="h-10 rounded-full px-5 bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-md text-xs font-bold transition-transform active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* ================= PROGRESS & STATS CARD ================= */}
        <div className="bg-gradient-to-br from-white via-white to-stone-50/80 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl p-5 border border-stone-200/90 dark:border-stone-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1E5E3A]/10 dark:bg-emerald-950/80 text-[#1E5E3A] dark:text-emerald-400 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100">
                  Supermarket Progress
                </h3>
                <span className="text-[11px] text-stone-500">
                  {completedCount} of {totalNeededCount} items in cart
                </span>
              </div>
            </div>

            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#1E5E3A] text-white shadow-xs">
              {progress}% Completed
            </span>
          </div>

          <Progress value={progress} className="h-2.5 bg-stone-100 dark:bg-stone-800 [&>div]:bg-gradient-to-r [&>div]:from-[#1E5E3A] [&>div]:to-emerald-500 rounded-full" />

          {/* 3 Metric Pills */}
          <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-stone-100 dark:border-stone-800/80 text-center">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="block text-lg font-extrabold text-amber-700 dark:text-amber-400">{pendingCount}</span>
              <span className="text-[10px] uppercase font-bold text-amber-800/70 dark:text-amber-300">To Buy</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="block text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{completedCount}</span>
              <span className="text-[10px] uppercase font-bold text-emerald-800/70 dark:text-emerald-300">In Cart</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
              <span className="block text-lg font-extrabold text-sky-700 dark:text-sky-400">{pantryItems.length}</span>
              <span className="text-[10px] uppercase font-bold text-sky-800/70 dark:text-sky-300">In Pantry</span>
            </div>
          </div>

          {completedCount > 0 && (
            <div className="flex justify-end mt-3">
              <button
                onClick={clearCheckedItems}
                className="text-xs text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 underline font-medium transition-colors"
              >
                Clear checked items
              </button>
            </div>
          )}
        </div>

        {/* ================= QUICK ADD INGREDIENT FORM ================= */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 border border-stone-200/90 dark:border-stone-800 shadow-sm mb-6">
          <form onSubmit={(e) => handleAddItem(e)} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Input
                placeholder="Add ingredient (e.g. Spinach, Chia Seeds, Avocado)..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="h-12 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 rounded-2xl text-xs sm:text-sm pl-4 pr-10 focus-visible:ring-[#1E5E3A]"
              />
            </div>

            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="h-12 text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 text-stone-700 dark:text-stone-300 focus:outline-none"
            >
              {Object.entries(CATEGORY_MAP).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            <Button
              type="submit"
              className="h-12 px-6 rounded-2xl bg-[#1E5E3A] hover:bg-[#16472c] text-white font-bold text-xs shrink-0 shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              Add
            </Button>
          </form>

          {/* Quick Suggestions Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 mt-1">
            <span className="text-[11px] text-stone-400 font-medium shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Quick Add:
            </span>
            {QUICK_SUGGESTIONS.map((sug) => (
              <button
                key={sug.name}
                type="button"
                onClick={() => handleAddItem(undefined, sug.name, sug.category)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 shrink-0 border border-stone-200/60 dark:border-stone-700/60 transition-colors"
              >
                + {sug.name}
              </button>
            ))}
          </div>
        </div>

        {/* ================= SEARCH & FILTER TABS ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search ingredient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 rounded-full bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-xs"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-stone-200/60 dark:bg-stone-800/80 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === "all"
                  ? "bg-white dark:bg-stone-900 text-[#1E5E3A] dark:text-emerald-400 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              All ({totalNeededCount})
            </button>
            <button
              onClick={() => setActiveFilter("pending")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === "pending"
                  ? "bg-white dark:bg-stone-900 text-amber-600 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              To Buy ({pendingCount})
            </button>
            <button
              onClick={() => setActiveFilter("collected")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === "collected"
                  ? "bg-white dark:bg-stone-900 text-emerald-600 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              In Cart ({completedCount})
            </button>
          </div>
        </div>

        {/* ================= CATEGORIZED SHOPPING LIST ================= */}
        <div className="space-y-4 mb-8">
          {totalNeededCount === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                All Set for Grocery Shopping!
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                No pending grocery items left. Add meals to your weekly planner or type custom ingredients above to generate your market checklist.
              </p>
            </div>
          ) : Object.keys(activeByCategory).length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 text-center border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
              No ingredients found matching the selected filter.
            </div>
          ) : (
            Object.entries(activeByCategory).map(([category, catItems]) => {
              const config = CATEGORY_MAP[category] || CATEGORY_MAP['Other'];
              const Icon = config.icon;
              const checkedInCat = catItems.filter(i => i.checked).length;
              const allDone = checkedInCat === catItems.length && catItems.length > 0;

              return (
                <div
                  key={category}
                  className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs transition-all hover:border-stone-300 dark:hover:border-stone-700"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${config.bg} ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm">
                          {config.label}
                        </h3>
                        <span className="text-[11px] text-stone-500">
                          {checkedInCat} of {catItems.length} in cart
                        </span>
                      </div>
                    </div>

                    {allDone && (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Completed
                      </span>
                    )}
                  </div>

                  {/* Items Rows */}
                  <div className="space-y-1.5">
                    {catItems.map((item) => {
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                            item.checked
                              ? 'bg-stone-100/70 dark:bg-stone-800/40 opacity-60'
                              : 'bg-stone-50/50 dark:bg-stone-800/20 hover:bg-stone-100/80 dark:hover:bg-stone-800/60'
                          }`}
                        >
                          {/* Toggle Checkbox + Label */}
                          <div
                            onClick={() => toggleItem(item.id)}
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                          >
                            <div
                              className={`w-6 h-6 rounded-xl flex items-center justify-center border transition-all ${
                                item.checked
                                  ? 'bg-[#1E5E3A] border-[#1E5E3A] text-white shadow-xs'
                                  : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 hover:border-[#1E5E3A]'
                              }`}
                            >
                              {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="min-w-0">
                              <p className={`text-xs sm:text-sm font-semibold leading-tight truncate ${
                                item.checked ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-800 dark:text-stone-100'
                              }`}>
                                {item.ingredient}
                              </p>
                              {item.fromRecipe && (
                                <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5 truncate">
                                  <ChefHat className="w-3 h-3 text-[#1E5E3A]" />
                                  <span>{item.fromRecipe}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => togglePantry(item.id)}
                              title="I have this in my pantry (don't need to buy)"
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-[#1E5E3A] dark:bg-stone-800 dark:hover:bg-emerald-950/60 dark:text-stone-300 dark:hover:text-emerald-300 border border-stone-200/80 dark:border-stone-700/80 flex items-center gap-1 transition-colors"
                            >
                              <Home className="w-3 h-3 text-[#1E5E3A]" />
                              <span className="hidden sm:inline">Already at home</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              title="Remove"
                              className="w-7 h-7 rounded-xl flex items-center justify-center text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================= ALREADY AT HOME / PANTRY ACCORDION ================= */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl p-5 shadow-xs">
          <button
            onClick={() => setShowPantrySection(!showPantrySection)}
            className="w-full flex items-center justify-between focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#1E5E3A]/10 dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-400 flex items-center justify-center">
                <Home className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                  <span>Already in Kitchen Pantry</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {pantryItems.length} in stock
                  </span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Ingredients verified at home that do not need to be purchased.
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
              {showPantrySection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showPantrySection && (
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
              {pantryItems.length === 0 ? (
                <p className="text-xs text-stone-400 italic text-center py-4">
                  No ingredients marked as already in pantry yet.
                </p>
              ) : (
                pantryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#1E5E3A] dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                        {item.ingredient}
                      </span>
                    </div>

                    <button
                      onClick={() => togglePantry(item.id)}
                      className="text-[11px] font-semibold text-[#1E5E3A] dark:text-emerald-400 hover:underline px-2 py-1"
                    >
                      Move to Shopping
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ShoppingList;
