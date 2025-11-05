import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Download, Share2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { recipes } from "@/data/recipes";

interface ShoppingItem {
  id: string;
  ingredient: string;
  category: string;
  checked: boolean;
  fromRecipe?: string;
}

const ShoppingList = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);

  useEffect(() => {
    // Load meal planner data from localStorage
    const mealPlanData = localStorage.getItem("mealPlan");
    if (mealPlanData) {
      try {
        const mealPlan = JSON.parse(mealPlanData);
        generateShoppingList(mealPlan);
      } catch (error) {
        console.error("Error loading meal plan:", error);
      }
    }
  }, []);

  const categorizeIngredient = (ingredient: string): string => {
    const lower = ingredient.toLowerCase();
    if (lower.includes("tomato") || lower.includes("carrot") || lower.includes("broccoli") || 
        lower.includes("spinach") || lower.includes("kale") || lower.includes("pepper") ||
        lower.includes("onion") || lower.includes("garlic")) {
      return t('shoppingList.categories.vegetables');
    }
    if (lower.includes("banana") || lower.includes("apple") || lower.includes("pear") || 
        lower.includes("strawberry") || lower.includes("mango") || lower.includes("avocado") ||
        lower.includes("watermelon") || lower.includes("orange")) {
      return t('shoppingList.categories.fruits');
    }
    if (lower.includes("chicken") || lower.includes("beef") || lower.includes("fish") || 
        lower.includes("salmon") || lower.includes("tuna") || lower.includes("turkey") ||
        lower.includes("egg")) {
      return t('shoppingList.categories.proteins');
    }
    if (lower.includes("rice") || lower.includes("pasta") || lower.includes("bread") || 
        lower.includes("oat") || lower.includes("quinoa") || lower.includes("cereal")) {
      return t('shoppingList.categories.cereals');
    }
    if (lower.includes("milk") || lower.includes("cheese") || lower.includes("yogurt") || 
        lower.includes("butter")) {
      return t('shoppingList.categories.dairy');
    }
    return t('shoppingList.categories.others');
  };

  const generateShoppingList = (mealPlan: any) => {
    const ingredientMap = new Map<string, ShoppingItem>();
    const usedRecipes = new Set<string>();

    // Extract all recipes from meal plan
    Object.values(mealPlan).forEach((day: any) => {
      Object.values(day).forEach((recipeId: any) => {
        if (recipeId) {
          usedRecipes.add(recipeId);
          const recipe = recipes.find(r => r.id === recipeId);
          if (recipe) {
            recipe.ingredients.forEach(ingredient => {
              const cleanIngredient = ingredient.split(',')[0].trim();
              if (!ingredientMap.has(cleanIngredient)) {
                ingredientMap.set(cleanIngredient, {
                  id: Math.random().toString(36).substr(2, 9),
                  ingredient: cleanIngredient,
                  category: categorizeIngredient(cleanIngredient),
                  checked: false,
                  fromRecipe: recipe.title
                });
              }
            });
          }
        }
      });
    });

    setSelectedRecipes(Array.from(usedRecipes));
    setItems(Array.from(ingredientMap.values()).sort((a, b) => a.category.localeCompare(b.category)));
  };

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleExportPDF = () => {
    toast({
      title: t('shoppingList.listExported'),
      description: t('shoppingList.listExportedDesc'),
    });
  };

  const handleShareWhatsApp = () => {
    const uncheckedItems = items.filter(i => !i.checked);
    const categories = [...new Set(uncheckedItems.map(i => i.category))];
    
    let message = "🛒 *Shopping List - BabyBites*\n\n";
    categories.forEach(cat => {
      const categoryItems = uncheckedItems.filter(i => i.category === cat);
      if (categoryItems.length > 0) {
        message += `*${cat}:*\n`;
        categoryItems.forEach(item => {
          message += `  • ${item.ingredient}\n`;
        });
        message += "\n";
      }
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleSuggestSubstitutions = (ingredient: string) => {
    const substitutions: { [key: string]: string[] } = {
      "milk": ["almond milk", "coconut milk", "oat milk"],
      "butter": ["olive oil", "coconut oil"],
      "sugar": ["honey (12+ months)", "applesauce", "mashed banana"],
      "wheat flour": ["oat flour", "rice flour"],
      "egg": ["ground flaxseed + water", "mashed banana"],
    };

    const lower = ingredient.toLowerCase();
    for (const [key, subs] of Object.entries(substitutions)) {
      if (lower.includes(key)) {
        toast({
          title: t('shoppingList.substitutions'),
          description: t('shoppingList.substitutionsFor').replace('{ingredient}', ingredient).replace('{subs}', subs.join(", ")),
          duration: 5000,
        });
        return;
      }
    }

    toast({
      title: t('shoppingList.noSubstitutions'),
      description: t('shoppingList.noSubstitutionsDesc'),
    });
  };

  const categories = [...new Set(items.map(i => i.category))];
  const completedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background pt-20 pb-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">{t('shoppingList.title')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('shoppingList.subtitle')}
            </p>
          </div>
          <ShoppingCart className="w-12 h-12 text-primary" />
        </div>

        {/* Progress */}
        {items.length > 0 && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('shoppingList.progress')}</span>
              <span className="text-sm text-muted-foreground">{completedCount} of {totalCount}</span>
            </div>
            <div className="w-full bg-secondary/20 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {t('shoppingList.exportPDF')}
          </Button>
          <Button onClick={handleShareWhatsApp}>
            <Share2 className="w-4 h-4 mr-2" />
            {t('shoppingList.shareWhatsApp')}
          </Button>
        </div>

        {/* Shopping List by Category */}
        {categories.map(category => {
          const categoryItems = items.filter(i => i.category === category);
          const checkedInCategory = categoryItems.filter(i => i.checked).length;
          
          return (
            <Card key={category} className="p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{category}</h2>
                <span className="text-sm text-muted-foreground">
                  {checkedInCategory}/{categoryItems.length}
                </span>
              </div>
              <div className="space-y-3">
                {categoryItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
                    <Checkbox 
                      checked={item.checked}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                        {item.ingredient}
                      </p>
                      {item.fromRecipe && (
                        <p className="text-xs text-muted-foreground">
                          {t('shoppingList.from')} {item.fromRecipe}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSuggestSubstitutions(item.ingredient)}
                    >
                      {t('shoppingList.substitute')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}

        {items.length === 0 && (
          <Card className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('shoppingList.emptyList')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('shoppingList.emptyListDesc')}
            </p>
            <Button onClick={() => window.location.href = "/planner"}>
              <Plus className="w-4 h-4 mr-2" />
              {t('shoppingList.goToPlanner')}
            </Button>
          </Card>
        )}

        {/* Tips */}
        <Card className="p-6 mt-6 bg-primary/5">
          <h3 className="font-semibold mb-3">💡 {t('shoppingList.tipsTitle')}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• {t('shoppingList.tip1')}</li>
            <li>• {t('shoppingList.tip2')}</li>
            <li>• {t('shoppingList.tip3')}</li>
            <li>• {t('shoppingList.tip4')}</li>
            <li>• {t('shoppingList.tip5')}</li>
          </ul>
        </Card>
      </div>
    </main>
  );
};

export default ShoppingList;
