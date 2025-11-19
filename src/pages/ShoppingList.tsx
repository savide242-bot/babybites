import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Download, Share2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { recipes } from "@/data/recipes";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
        checked: item.checked,
        fromRecipe: item.from_recipe || undefined,
      }));
      setItems(mappedItems);
    }
  };

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
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title with vibrant colors
      doc.setFontSize(24);
      doc.setTextColor(255, 105, 180); // Pink
      doc.text('🛒 BabyBites Shopping List', 20, 25);
      
      // Add date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 20, 35);
      
      // Add line separator
      doc.setDrawColor(255, 182, 193);
      doc.setLineWidth(0.5);
      doc.line(20, 40, 190, 40);
      
      // Prepare data by category
      const uncheckedItems = items.filter(i => !i.checked);
      
      if (uncheckedItems.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text('All items are checked off! 🎉', 20, 55);
      } else {
        const categories = [...new Set(uncheckedItems.map(i => i.category))];
        let yPosition = 50;
        
        categories.forEach((category, index) => {
          const categoryItems = uncheckedItems.filter(i => i.category === category);
          if (categoryItems.length > 0) {
            // Category header
            doc.setFontSize(14);
            doc.setTextColor(64, 224, 208); // Turquoise
            doc.text(`${category} (${categoryItems.length} items)`, 20, yPosition);
            yPosition += 8;
            
            // Items as table
            const tableData = categoryItems.map(item => [
              '☐',
              item.ingredient,
              item.fromRecipe || '-'
            ]);
            
            autoTable(doc, {
              startY: yPosition,
              head: [['✓', 'Ingredient', 'From Recipe']],
              body: tableData,
              theme: 'striped',
              headStyles: { 
                fillColor: [255, 182, 193], // Light pink
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 11
              },
              bodyStyles: {
                fontSize: 10
              },
              alternateRowStyles: {
                fillColor: [255, 245, 250] // Very light pink
              },
              margin: { left: 25, right: 20 },
              columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 80 },
                2: { cellWidth: 65, fontStyle: 'italic', textColor: [100, 100, 100] }
              }
            });
            
            yPosition = (doc as any).lastAutoTable.finalY + 10;
            
            // Add page break if needed
            if (yPosition > 250 && index < categories.length - 1) {
              doc.addPage();
              yPosition = 20;
            }
          }
        });
      }
      
      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} | Created with BabyBites 💕`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Save PDF
      const fileName = `babybites-shopping-list-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // Show success popup
      toast({
        title: "✅ PDF Downloaded!",
        description: `Your shopping list has been saved as ${fileName}`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "❌ Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShareWhatsApp = () => {
    try {
      const uncheckedItems = items.filter(i => !i.checked);
      
      if (uncheckedItems.length === 0) {
        toast({
          title: "Nothing to Share",
          description: "All items are already checked off! ✓",
          variant: "destructive"
        });
        return;
      }
      
      const categories = [...new Set(uncheckedItems.map(i => i.category))];
      
      let message = "🛒 *Shopping List - BabyBites*\n\n";
      categories.forEach(cat => {
        const categoryItems = uncheckedItems.filter(i => i.category === cat);
        if (categoryItems.length > 0) {
          message += `*${cat}* (${categoryItems.length} items):\n`;
          categoryItems.forEach(item => {
            message += `  ☐ ${item.ingredient}`;
            if (item.fromRecipe) {
              message += ` _(from ${item.fromRecipe})_`;
            }
            message += `\n`;
          });
          message += "\n";
        }
      });
      
      message += `📱 Generated by BabyBites\n${new Date().toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      })}`;
      
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "✅ Opening WhatsApp",
        description: "Your shopping list is ready to share!",
      });
    } catch (error) {
      console.error('WhatsApp sharing error:', error);
      toast({
        title: "❌ Sharing Failed",
        description: "Could not open WhatsApp. Please try again.",
        variant: "destructive"
      });
    }
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
