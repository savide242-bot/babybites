import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingCart, Download, Share2, Trash2, 
  Apple, Carrot, Beef, Wheat, Milk, Package,
  ChefHat, Sparkles, Check
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ShoppingItem {
  id: string;
  ingredient: string;
  category: string;
  checked: boolean;
  fromRecipe?: string;
}

const categoryConfig: { [key: string]: { icon: any; gradient: string; bgColor: string } } = {
  'Fruits': { icon: Apple, gradient: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-50 dark:bg-pink-950/30' },
  'Vegetables': { icon: Carrot, gradient: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  'Proteins': { icon: Beef, gradient: 'from-red-500 to-orange-500', bgColor: 'bg-red-50 dark:bg-red-950/30' },
  'Cereals & Grains': { icon: Wheat, gradient: 'from-amber-500 to-yellow-500', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
  'Dairy': { icon: Milk, gradient: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  'Pantry Essentials': { icon: Package, gradient: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
  'Other': { icon: Package, gradient: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-50 dark:bg-gray-950/30' },
};

const ShoppingList = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      loadShoppingList(user.id);
    }
  };

  const loadShoppingList = async (uid: string) => {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('user_id', uid)
      .order('category');

    if (error) {
      console.error('Error loading shopping list:', error);
      return;
    }

    if (data) {
      const mappedItems: ShoppingItem[] = data.map((item) => ({
        id: item.id,
        ingredient: item.ingredient,
        category: item.category,
        checked: item.checked || false,
        fromRecipe: item.from_recipe || undefined,
      }));
      setItems(mappedItems);
    }
  };

  const toggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newChecked = !item.checked;
    
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: newChecked } : i)));

    await supabase
      .from('shopping_list_items')
      .update({ checked: newChecked })
      .eq('id', id);
  };

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await supabase.from('shopping_list_items').delete().eq('id', id);
    toast({ title: "Item removed" });
  };

  const clearCheckedItems = async () => {
    const checkedIds = items.filter(i => i.checked).map(i => i.id);
    if (checkedIds.length === 0) return;
    
    setItems(prev => prev.filter(i => !i.checked));
    await supabase.from('shopping_list_items').delete().in('id', checkedIds);
    toast({ title: "Checked items cleared!" });
  };

  const handleExportPDF = () => {
    try {
      const uncheckedItems = items.filter(i => !i.checked);
      
      if (uncheckedItems.length === 0) {
        toast({ title: "Nothing to export", description: "All items are checked!", variant: "destructive" });
        return;
      }
      
      // Create a printable text version
      const categories = [...new Set(uncheckedItems.map(i => i.category))];
      let content = `🛒 BabyBites Shopping List\n`;
      content += `Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
      
      categories.forEach(category => {
        const categoryItems = uncheckedItems.filter(i => i.category === category);
        if (categoryItems.length > 0) {
          content += `📦 ${category} (${categoryItems.length})\n`;
          categoryItems.forEach(item => {
            content += `  ☐ ${item.ingredient}${item.fromRecipe ? ` (for ${item.fromRecipe})` : ''}\n`;
          });
          content += '\n';
        }
      });
      
      // Create and download text file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `babybites-shopping-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "✅ List Downloaded!", description: "Shopping list saved as text file" });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleShareWhatsApp = () => {
    const uncheckedItems = items.filter(i => !i.checked);
    
    if (uncheckedItems.length === 0) {
      toast({ title: "Nothing to share", description: "All items are checked!", variant: "destructive" });
      return;
    }
    
    const categories = [...new Set(uncheckedItems.map(i => i.category))];
    
    let message = "🛒 *BabyBites Shopping List*\n\n";
    categories.forEach(cat => {
      const categoryItems = uncheckedItems.filter(i => i.category === cat);
      if (categoryItems.length > 0) {
        message += `*${cat}*\n`;
        categoryItems.forEach(item => {
          message += `☐ ${item.ingredient}\n`;
        });
        message += "\n";
      }
    });
    
    message += `📱 BabyBites | ${new Date().toLocaleDateString()}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    toast({ title: "Opening WhatsApp" });
  };

  // Group items by recipe
  const itemsByRecipe = useMemo(() => {
    const grouped: { [recipe: string]: ShoppingItem[] } = {};
    items.forEach(item => {
      const recipe = item.fromRecipe || 'Other Items';
      if (!grouped[recipe]) grouped[recipe] = [];
      grouped[recipe].push(item);
    });
    return grouped;
  }, [items]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: { [category: string]: ShoppingItem[] } = {};
    items.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });
    return grouped;
  }, [items]);

  const completedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 pt-20 pb-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-secondary">
              <ShoppingCart className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Shopping List
              </h1>
              <p className="text-muted-foreground">
                Everything you need for your baby's meals
              </p>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        {items.length > 0 && (
          <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Shopping Progress</span>
                </div>
                <Badge variant={progress === 100 ? "default" : "secondary"} className="text-sm">
                  {completedCount} / {totalCount} items
                </Badge>
              </div>
              <Progress value={progress} className="h-3" />
              {progress === 100 && (
                <p className="text-sm text-primary mt-2 font-medium">
                  🎉 All done! Great job!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button onClick={handleShareWhatsApp} className="gap-2">
            <Share2 className="w-4 h-4" />
            Share WhatsApp
          </Button>
          {completedCount > 0 && (
            <Button onClick={clearCheckedItems} variant="ghost" className="gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Clear Checked
            </Button>
          )}
        </div>

        {/* Items by Category */}
        {Object.entries(itemsByCategory).map(([category, categoryItems]) => {
          const config = categoryConfig[category] || categoryConfig['Other'];
          const Icon = config.icon;
          const checkedInCategory = categoryItems.filter(i => i.checked).length;
          
          return (
            <Card key={category} className={`mb-4 border-0 shadow-md ${config.bgColor}`}>
              <CardContent className="p-5">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{category}</h2>
                      <p className="text-xs text-muted-foreground">
                        {checkedInCategory}/{categoryItems.length} items
                      </p>
                    </div>
                  </div>
                  {checkedInCategory === categoryItems.length && categoryItems.length > 0 && (
                    <Badge className="bg-green-500">
                      <Check className="w-3 h-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoryItems.map(item => (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer
                        ${item.checked 
                          ? 'bg-muted/50 opacity-60' 
                          : 'bg-background hover:bg-background/80 shadow-sm'
                        }`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <Checkbox 
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="h-5 w-5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                          {item.ingredient}
                        </p>
                        {item.fromRecipe && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <ChefHat className="w-3 h-3" />
                            {item.fromRecipe}
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State */}
        {items.length === 0 && (
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="py-16 text-center space-y-6">
              <div className="text-7xl animate-bounce">🛒</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Your Shopping List is Empty
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Add meals to your weekly planner and we'll automatically generate your shopping list!
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = "/planner"} 
                className="rounded-full px-8 py-6 text-lg"
              >
                <ChefHat className="mr-2 h-5 w-5" />
                Go to Meal Planner
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {items.length > 0 && (
          <Card className="mt-6 bg-gradient-to-r from-mint/10 to-secondary/10 border-mint/20">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-mint" />
                Shopping Tips
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Buy organic produce when possible for baby food</li>
                <li>• Check expiration dates on dairy and proteins</li>
                <li>• Prep and freeze portions for busy days</li>
                <li>• Store opened items properly to maintain freshness</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
};

export default ShoppingList;