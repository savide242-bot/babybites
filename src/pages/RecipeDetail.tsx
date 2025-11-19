import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, AlertCircle, Refrigerator, ArrowLeft, Calendar, FileDown, Share2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { recipes } from "@/data/recipes";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RecipeDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const recipe = recipes.find((r) => r.id === id);

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('recipes.recipeNotFound')}</h2>
          <Button asChild className="rounded-full">
            <Link to="/recipes">{t('recipes.backToRecipes')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToPlanner = () => {
    toast.success(t('recipes.addedToPlanner'), {
      description: `${recipe.title} ${t('recipes.addedToPlannerDesc')}`,
    });
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(24);
      doc.setTextColor(255, 105, 180);
      doc.text(recipe.title, 20, 25);
      
      // Add category and age group
      doc.setFontSize(10);
      doc.setTextColor(64, 224, 208);
      doc.text(`${recipe.category} | ${recipe.ageGroup}`, 20, 35);
      
      // Add separator line
      doc.setDrawColor(255, 182, 193);
      doc.setLineWidth(0.5);
      doc.line(20, 40, 190, 40);
      
      // Add description
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      const descLines = doc.splitTextToSize(recipe.description, 170);
      doc.text(descLines, 20, 48);
      
      let yPos = 48 + (descLines.length * 6) + 8;
      
      // Add prep time and servings
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`⏱️ Prep Time: ${recipe.prepTime}`, 20, yPos);
      doc.text(`👥 Servings: ${recipe.servings}`, 120, yPos);
      yPos += 12;
      
      // Add ingredients section
      doc.setFontSize(16);
      doc.setTextColor(255, 105, 180);
      doc.text('Ingredients', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      recipe.ingredients.forEach((ingredient) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${ingredient}`, 25, yPos);
        yPos += 6;
      });
      
      yPos += 8;
      
      // Add instructions section
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(255, 105, 180);
      doc.text('Instructions', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      recipe.instructions.forEach((instruction, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const stepLines = doc.splitTextToSize(`${index + 1}. ${instruction}`, 165);
        doc.text(stepLines, 25, yPos);
        yPos += (stepLines.length * 6) + 4;
      });
      
      // Add nutrition info
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += 8;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(255, 105, 180);
      doc.text('Nutrition Information', 20, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Nutrient', 'Amount']],
        body: [
          ['Calories', `${recipe.nutrition.calories} kcal`],
          ['Protein', `${recipe.nutrition.protein}g`],
          ['Carbs', `${recipe.nutrition.carbs}g`],
          ['Fats', `${recipe.nutrition.fat}g`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [255, 182, 193], textColor: [0, 0, 0] },
        margin: { left: 25 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Add allergens if present
      if (recipe.allergens && recipe.allergens.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(255, 99, 71);
        doc.text(`⚠️ Allergens: ${recipe.allergens.join(', ')}`, 20, yPos);
      }
      
      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} | BabyBites Recipe 💕`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Save PDF
      const fileName = `babybites-${recipe.title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      doc.save(fileName);
      
      toast.success("✅ Recipe Downloaded!", {
        description: `${recipe.title} has been saved as PDF`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("❌ Export Failed", {
        description: "Could not generate PDF. Please try again.",
      });
    }
  };

  const handleShareWhatsApp = () => {
    try {
      let message = `🍽️ *${recipe.title}*\n\n`;
      message += `📌 ${recipe.category} | ${recipe.ageGroup}\n`;
      message += `⏱️ ${recipe.prepTime} | 👥 ${recipe.servings}\n\n`;
      message += `${recipe.description}\n\n`;
      message += `*Ingredients:*\n`;
      recipe.ingredients.forEach(ing => {
        message += `• ${ing}\n`;
      });
      message += `\n📱 Shared from BabyBites`;
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      toast.success("✅ Opening WhatsApp", {
        description: "Recipe is ready to share!",
      });
    } catch (error) {
      console.error('WhatsApp sharing error:', error);
      toast.error("❌ Sharing Failed", {
        description: "Could not open WhatsApp. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-5xl">
        {/* Back Button */}
        <Button asChild variant="outline" className="mb-6 rounded-full">
          <Link to="/recipes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('recipes.backToRecipes')}
          </Link>
        </Button>

        {/* Recipe Header */}
        <div className="grid gap-8 lg:grid-cols-2 mb-12">
          <div className="aspect-video rounded-3xl overflow-hidden shadow-xl">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {recipe.category}
                </Badge>
                <Badge className="rounded-full px-3 py-1">
                  {recipe.ageGroup}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold mb-4">{recipe.title}</h1>
              <p className="text-lg text-muted-foreground">{recipe.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span className="font-medium">{recipe.prepTime}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span className="font-medium">{recipe.servings}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleAddToPlanner} size="lg" className="w-full rounded-full">
                <Calendar className="mr-2 h-5 w-5" />
                {t('recipes.addToPlanner')}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleExportPDF} variant="outline" size="lg" className="rounded-full">
                  <FileDown className="mr-2 h-5 w-5" />
                  Export PDF
                </Button>
                <Button onClick={handleShareWhatsApp} variant="outline" size="lg" className="rounded-full">
                  <Share2 className="mr-2 h-5 w-5" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{t('recipes.ingredients')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary mt-2 mr-3 flex-shrink-0" />
                  <span className="text-lg">{ingredient}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{t('recipes.instructions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </span>
                  <span className="text-lg pt-1">{instruction}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Nutrition Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{t('recipes.nutrition')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">{t('recipes.calories')}</div>
                <div className="text-2xl font-bold">{recipe.nutrition.calories}</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">{t('recipes.protein')}</div>
                <div className="text-2xl font-bold">{recipe.nutrition.protein}</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">{t('recipes.carbs')}</div>
                <div className="text-2xl font-bold">{recipe.nutrition.carbs}</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">{t('recipes.fat')}</div>
                <div className="text-2xl font-bold">{recipe.nutrition.fat}</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">{t('recipes.fiber')}</div>
                <div className="text-2xl font-bold">{recipe.nutrition.fiber}</div>
              </div>
            </div>
            
            {recipe.nutrition.vitamins.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">{t('recipes.vitamins')}</div>
                <div className="flex flex-wrap gap-2">
                  {recipe.nutrition.vitamins.map((vitamin) => (
                    <Badge key={vitamin} variant="outline" className="rounded-full">
                      {vitamin}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allergens & Storage */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {recipe.allergens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  {t('recipes.allergens')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('recipes.allergensDesc')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {recipe.allergens.map((allergen) => (
                    <Badge key={allergen} variant="destructive" className="rounded-full">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Refrigerator className="h-5 w-5" />
                {t('recipes.storage')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{recipe.storage}</p>
            </CardContent>
          </Card>
        </div>

        {/* Health Benefits */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <span className="text-2xl">✨</span>
              {t('recipes.healthBenefits')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{recipe.healthBenefits}</p>
          </CardContent>
        </Card>

        {/* Serving Guidance */}
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-6 w-6 text-accent" />
              {t('recipes.servingGuidance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{recipe.servingGuidance}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecipeDetail;
