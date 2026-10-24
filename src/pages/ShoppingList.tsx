import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, Download, Share2, Trash2, 
  Apple, Carrot, Beef, Wheat, Milk, Package,
  ChefHat, Sparkles, Check, Home, Plus, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { syncShoppingListFromMealPlans } from "@/utils/shoppingListSync";

interface ShoppingItem {
  id: string;
  ingredient: string;
  category: string;
  checked: boolean;
  inPantry?: boolean;
  fromRecipe?: string;
  quantity?: string;
}

const categoryConfig: { [key: string]: { icon: any; color: string; badge: string; border: string } } = {
  'Fruits': { icon: Apple, color: 'text-rose-700 bg-rose-50', badge: 'bg-rose-100 text-rose-800', border: 'border-rose-100' },
  'Vegetables': { icon: Carrot, color: 'text-emerald-700 bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-100' },
  'Proteins': { icon: Beef, color: 'text-amber-700 bg-amber-50', badge: 'bg-amber-100 text-amber-800', border: 'border-amber-100' },
  'Cereals & Grains': { icon: Wheat, color: 'text-yellow-700 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-100' },
  'Dairy': { icon: Milk, color: 'text-blue-700 bg-blue-50', badge: 'bg-blue-100 text-blue-800', border: 'border-blue-100' },
  'Pantry Essentials': { icon: Package, color: 'text-purple-700 bg-purple-50', badge: 'bg-purple-100 text-purple-800', border: 'border-purple-100' },
  'Other': { icon: Package, color: 'text-stone-700 bg-stone-50', badge: 'bg-stone-100 text-stone-800', border: 'border-stone-200' },
};

const DEFAULT_ITEMS: ShoppingItem[] = [
  { id: '1', ingredient: 'Ripe organic bananas', category: 'Fruits', checked: false, inPantry: false, fromRecipe: 'Baby Banana Oat Pancakes' },
  { id: '2', ingredient: 'Sweet potatoes (2 medium)', category: 'Vegetables', checked: false, inPantry: false, fromRecipe: 'Sweet Potato Apple Mash' },
  { id: '3', ingredient: 'Rolled baby oats', category: 'Cereals & Grains', checked: false, inPantry: true, fromRecipe: 'Pantry Stash' },
  { id: '4', ingredient: 'Pasture-raised eggs', category: 'Proteins', checked: true, inPantry: false, fromRecipe: 'Steamed Egg Custard' },
  { id: '5', ingredient: 'Cold-pressed olive oil', category: 'Pantry Essentials', checked: false, inPantry: true, fromRecipe: 'Home Staples' },
  { id: '6', ingredient: 'Organic full-fat Greek yogurt', category: 'Dairy', checked: false, inPantry: false, fromRecipe: 'Morning Berry Parfait' },
  { id: '7', ingredient: 'Fresh spinach leaves', category: 'Vegetables', checked: false, inPantry: false, fromRecipe: 'Green Iron Puree' },
];

const LOCAL_STORAGE_KEY = 'babybites_shopping_list_v2';

const ShoppingList = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [newCategory, setNewCategory] = useState("Vegetables");
  const [showPantrySection, setShowPantrySection] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const saveLocal = (updated: ShoppingItem[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
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
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          setItems(JSON.parse(saved));
        } else {
          setItems(DEFAULT_ITEMS);
          saveLocal(DEFAULT_ITEMS);
        }
        setIsLoading(false);
      }
    } catch {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      setItems(saved ? JSON.parse(saved) : DEFAULT_ITEMS);
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
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        setItems(saved ? JSON.parse(saved) : DEFAULT_ITEMS);
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
          title: nextState ? "Marked as in pantry!" : "Moved to shopping list",
          description: nextState 
            ? `Excluded from your supermarket trip (you already have this at home).`
            : `Added back to needed grocery items.`
        });
        return { ...item, inPantry: nextState };
      }
      return item;
    });
    setItems(updated);
    saveLocal(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      ingredient: newItemText.trim(),
      category: newCategory,
      checked: false,
      inPantry: false,
      fromRecipe: "Manual add"
    };

    const updated = [newItem, ...items];
    setItems(updated);
    saveLocal(updated);
    setNewItemText("");
    toast({ title: "Item added to your shopping list" });
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
    toast({ title: "Checked shopping items cleared!" });
  };

  // Needed items vs items already at home
  const activeShoppingItems = useMemo(() => items.filter(i => !i.inPantry), [items]);
  const pantryItems = useMemo(() => items.filter(i => i.inPantry), [items]);

  const handleExportText = () => {
    const neededUnchecked = activeShoppingItems.filter(i => !i.checked);
    
    if (neededUnchecked.length === 0 && pantryItems.length === 0) {
      toast({ title: "Nothing to export", description: "All grocery items are already completed!" });
      return;
    }
    
    let content = `🛒 BabyBites Shopping & Grocery List\n`;
    content += `Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;
    
    content += `--- NEEDED GROCERIES (${neededUnchecked.length} items) ---\n`;
    const categories = [...new Set(neededUnchecked.map(i => i.category))];
    categories.forEach(category => {
      const catItems = neededUnchecked.filter(i => i.category === category);
      content += `\n[${category.toUpperCase()}]\n`;
      catItems.forEach(item => {
        content += ` ☐ ${item.ingredient}${item.fromRecipe ? ` (${item.fromRecipe})` : ''}\n`;
      });
    });

    if (pantryItems.length > 0) {
      content += `\n--- ALREADY IN PANTRY (Do NOT Buy) ---\n`;
      pantryItems.forEach(item => {
        content += ` ✔ ${item.ingredient} [In Stock]\n`;
      });
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `babybites-groceries-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "List Downloaded!", description: "Grocery checklist saved to your device." });
  };

  const handleShareWhatsApp = () => {
    const neededUnchecked = activeShoppingItems.filter(i => !i.checked);
    
    if (neededUnchecked.length === 0) {
      toast({ title: "Nothing to share", description: "All items are completed or in pantry!" });
      return;
    }
    
    const categories = [...new Set(neededUnchecked.map(i => i.category))];
    let message = "🛒 *BabyBites Grocery List*\n\n";
    categories.forEach(cat => {
      const catItems = neededUnchecked.filter(i => i.category === cat);
      if (catItems.length > 0) {
        message += `*${cat}*\n`;
        catItems.forEach(item => {
          message += `☐ ${item.ingredient}\n`;
        });
        message += "\n";
      }
    });

    if (pantryItems.length > 0) {
      message += `*(Already at Home / In Pantry: ${pantryItems.length} items verified)*\n\n`;
    }
    
    message += `📱 *BabyBites* | Nutritious meal preparation made simple`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Group active shopping items by category
  const activeByCategory = useMemo(() => {
    const grouped: { [category: string]: ShoppingItem[] } = {};
    activeShoppingItems.forEach(item => {
      const cat = item.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  }, [activeShoppingItems]);

  const completedCount = activeShoppingItems.filter(i => i.checked).length;
  const totalNeededCount = activeShoppingItems.length;
  const progress = totalNeededCount > 0 ? Math.round((completedCount / totalNeededCount) * 100) : 0;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FAF9F5] pt-24 pb-16">
        <div className="container max-w-3xl mx-auto px-4 space-y-4">
          <Skeleton className="h-12 w-3/4 rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F5] text-stone-900 pt-20 pb-20 selection:bg-[#1E5E3A]/20">
      <div className="container max-w-3xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-6 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-widest uppercase bg-[#1E5E3A]/10 text-[#1E5E3A] px-2.5 py-1 rounded-full">
              Smart Kitchen Companion
            </span>
            <span className="text-xs text-stone-500 font-serif italic">
              • Meal Plan Auto-Sync
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
                Shopping & Pantry
              </h1>
              <p className="text-stone-600 text-sm mt-1">
                Ingredients compiled from baby's weekly recipes, with home pantry exclusions.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleExportText} 
                variant="outline" 
                size="sm"
                className="bg-white border-stone-200 hover:bg-stone-50 text-stone-700 rounded-full h-9"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
                Export
              </Button>
              <Button 
                onClick={handleShareWhatsApp} 
                size="sm"
                className="bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full h-9 font-medium shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Add custom item form */}
        <form onSubmit={handleAddItem} className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/80 shadow-sm mb-6 flex flex-col sm:flex-row gap-2">
          <Input 
            placeholder="Add an ingredient (e.g. Avocado, Chia seeds, Spinach)..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="flex-1 bg-stone-50 border-stone-200 rounded-xl focus-visible:ring-[#1E5E3A]"
          />
          <select 
            value={newCategory} 
            onChange={(e) => setNewCategory(e.target.value)}
            className="text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 focus:outline-none"
          >
            {Object.keys(categoryConfig).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Button 
            type="submit" 
            className="bg-[#1E5E3A] hover:bg-[#16472c] text-white rounded-xl shrink-0"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </form>

        {/* Progress & Stash Banner */}
        {totalNeededCount > 0 && (
          <div className="bg-[#1E5E3A]/5 border border-[#1E5E3A]/20 rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#1E5E3A]" />
                <span className="font-serif font-bold text-stone-900 text-sm">
                  Supermarket Checklist Progress
                </span>
              </div>
              <span className="text-xs font-semibold bg-[#1E5E3A] text-white px-2.5 py-0.5 rounded-full">
                {completedCount} of {totalNeededCount} collected ({progress}%)
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-stone-200 [&>div]:bg-[#1E5E3A]" />
            
            <div className="flex items-center justify-between mt-3 text-xs text-stone-600">
              <span>{pantryItems.length} ingredients already verified in home pantry</span>
              {completedCount > 0 && (
                <button 
                  onClick={clearCheckedItems} 
                  className="text-stone-500 hover:text-red-600 underline font-medium"
                >
                  Clear checked items
                </button>
              )}
            </div>
          </div>
        )}

        {/* Needed Groceries Categories */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <span>To Buy at Supermarket</span>
              <span className="text-xs font-sans font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                {totalNeededCount}
              </span>
            </h2>
          </div>

          {totalNeededCount === 0 ? (
            <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center">
              <Check className="w-10 h-10 text-emerald-600 mx-auto mb-2 bg-emerald-50 p-2 rounded-full" />
              <p className="font-serif font-bold text-stone-800">All set for grocery shopping!</p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                No pending items left to buy. Add meals to your weekly planner or type in custom ingredients above.
              </p>
            </div>
          ) : (
            Object.entries(activeByCategory).map(([category, catItems]) => {
              const config = categoryConfig[category] || categoryConfig['Other'];
              const Icon = config.icon;
              const checkedInCat = catItems.filter(i => i.checked).length;

              return (
                <div key={category} className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs">
                  {/* Category Header */}
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-stone-900 text-sm">{category}</h3>
                        <span className="text-[11px] text-stone-500">
                          {checkedInCat} of {catItems.length} checked
                        </span>
                      </div>
                    </div>
                    {checkedInCat === catItems.length && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5">
                    {catItems.map(item => (
                      <div 
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                          item.checked ? 'bg-stone-50/80 opacity-60' : 'hover:bg-stone-50'
                        }`}
                      >
                        <div 
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          onClick={() => toggleItem(item.id)}
                        >
                          <Checkbox 
                            checked={item.checked} 
                            onCheckedChange={() => toggleItem(item.id)} 
                            className="h-4 w-4 rounded-md border-stone-300 data-[state=checked]:bg-[#1E5E3A] data-[state=checked]:border-[#1E5E3A]"
                          />
                          <div className="min-w-0">
                            <p className={`text-sm font-medium leading-tight truncate ${item.checked ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                              {item.ingredient}
                            </p>
                            {item.fromRecipe && (
                              <p className="text-[11px] text-stone-400 truncate flex items-center gap-1 mt-0.5">
                                <ChefHat className="w-2.5 h-2.5" />
                                {item.fromRecipe}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => togglePantry(item.id)}
                            title="I have this at home (move to Pantry)"
                            className="h-7 px-2 text-[11px] text-stone-600 hover:text-[#1E5E3A] hover:bg-[#1E5E3A]/10 rounded-lg gap-1"
                          >
                            <Home className="w-3 h-3 text-[#1E5E3A]" />
                            <span className="hidden sm:inline">Already at home</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeItem(item.id)}
                            className="h-7 w-7 text-stone-400 hover:text-red-500 rounded-lg"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Already at Home / In Pantry Section */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 mb-8">
          <div 
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setShowPantrySection(!showPantrySection)}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 flex items-center justify-center">
                <Home className="w-3.5 h-3.5 text-stone-700" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-sm">
                  Already at Home / In Pantry ({pantryItems.length})
                </h3>
                <p className="text-[11px] text-stone-500">
                  These items are excluded from your supermarket buying list to avoid double purchases.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-stone-500">
              {showPantrySection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {showPantrySection && (
            <div className="mt-4 pt-3 border-t border-stone-200/60 space-y-1.5">
              {pantryItems.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-2 text-center">
                  No items marked as already at home yet. Click "Already at home" on any grocery item to save it here.
                </p>
              ) : (
                pantryItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-xs font-medium text-stone-700 truncate">{item.ingredient}</span>
                      <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePantry(item.id)}
                        className="h-6 px-2 text-[10px] text-stone-600 hover:text-[#1E5E3A] hover:bg-stone-100 rounded-md gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        Move back to buy
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-6 w-6 text-stone-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Pediatric Pantry Tips */}
        <div className="bg-[#1E5E3A]/5 border border-[#1E5E3A]/20 rounded-2xl p-5 text-stone-700 text-xs space-y-2">
          <div className="flex items-center gap-2 font-serif font-bold text-[#1E5E3A] text-sm">
            <Sparkles className="w-4 h-4" />
            Smart Shopping for Baby Food
          </div>
          <p>
            • <strong>Bulk prep:</strong> When buying sweet potatoes, carrots, or broccoli, cook larger batches and freeze in silicone trays to save hours of kitchen work.
          </p>
          <p>
            • <strong>Pantry rotation:</strong> Keep certified allergen-free rolled oats, chia seeds, and unsweetened nut butter clearly labeled and rotated by date.
          </p>
        </div>

      </div>
    </main>
  );
};

export default ShoppingList;
