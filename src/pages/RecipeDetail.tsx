import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, AlertCircle, Refrigerator, ArrowLeft, Calendar, FileDown, Share2, ChefHat, Timer, Plus, Minus, Play, Pause, RotateCcw, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { recipes } from "@/data/recipes";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState, useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const RecipeDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const recipe = recipes.find((r) => r.id === id);
  
  // State management
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [cookMode, setCookMode] = useState(false);
  const [servings, setServings] = useState(() => {
    const parsed = parseInt(recipe?.servings || "1");
    return isNaN(parsed) ? 1 : parsed;
  });
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            // Play sound notification
            if (audioRef.current) {
              audioRef.current.play();
            }
            toast.success("Timer Complete!", {
              description: "Your cooking timer has finished!",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, totalSeconds]);

  // Update display seconds
  useEffect(() => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    setTimerMinutes(mins);
    setTimerSeconds(secs);
  }, [totalSeconds]);

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

  const toggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedSteps(newCompleted);
  };

  const startTimer = () => {
    const mins = parseInt(prompt("Enter minutes:") || "0");
    if (mins > 0) {
      setTotalSeconds(mins * 60);
      setIsTimerRunning(true);
    }
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTotalSeconds(0);
  };

  const scaleIngredient = (ingredient: string): string => {
    if (!recipe) return ingredient;
    const originalServings = parseInt(recipe.servings) || 1;
    const scale = servings / originalServings;
    if (scale === 1) return ingredient;
    
    // Extract numbers and multiply them
    return ingredient.replace(/(\d+(?:\.\d+)?)/g, (match) => {
      const num = parseFloat(match);
      const scaled = (num * scale).toFixed(1);
      return scaled.endsWith('.0') ? scaled.slice(0, -2) : scaled;
    });
  };

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

  // Cook Mode View
  if (cookMode) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white z-50 overflow-y-auto">
        <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE" preload="auto" />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{recipe.title}</h1>
            <Button 
              onClick={() => setCookMode(false)} 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Timer in Cook Mode */}
          {totalSeconds > 0 && (
            <Card className="mb-6 bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-4">
                    {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={toggleTimer} variant="secondary" size="lg">
                      {isTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button onClick={resetTimer} variant="outline" size="lg">
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ingredients in Cook Mode */}
          <Card className="mb-6 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Ingredients ({servings} servings)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-xl text-gray-200">
                    • {scaleIngredient(ingredient)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Instructions in Cook Mode */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recipe.instructions.map((instruction, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 p-4 rounded-lg transition-all ${
                      completedSteps.has(index) ? 'bg-primary/20 opacity-60' : 'bg-gray-700/50'
                    }`}
                  >
                    <Checkbox
                      id={`step-cook-${index}`}
                      checked={completedSteps.has(index)}
                      onCheckedChange={() => toggleStep(index)}
                      className="mt-1 h-6 w-6"
                    />
                    <label
                      htmlFor={`step-cook-${index}`}
                      className={`text-xl cursor-pointer ${
                        completedSteps.has(index) ? 'line-through' : ''
                      }`}
                    >
                      <span className="font-bold text-primary mr-2">Step {index + 1}:</span>
                      {instruction}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

              <Button 
                onClick={() => setCookMode(true)} 
                size="lg" 
                className="w-full rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                <ChefHat className="mr-2 h-5 w-5" />
                Cook Mode
              </Button>
            </div>
          </div>
        </div>

        {/* Timer and Servings Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Timer Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                Cooking Timer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalSeconds === 0 ? (
                <Button onClick={startTimer} className="w-full rounded-full">
                  <Play className="mr-2 h-4 w-4" />
                  Start Timer
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="text-center text-4xl font-bold text-primary">
                    {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={toggleTimer} variant="secondary" className="flex-1 rounded-full">
                      {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button onClick={resetTimer} variant="outline" className="flex-1 rounded-full">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Servings Scaler Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Adjust Servings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  variant="outline"
                  size="icon"
                  className="rounded-full h-12 w-12"
                  disabled={servings <= 1}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{servings}</div>
                  <div className="text-sm text-muted-foreground">
                    {servings === 1 ? 'serving' : 'servings'}
                  </div>
                </div>
                <Button
                  onClick={() => setServings(servings + 1)}
                  variant="outline"
                  size="icon"
                  className="rounded-full h-12 w-12"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              {servings !== parseInt(recipe.servings) && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Ingredients adjusted from original {recipe.servings}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hidden audio element for timer notification */}
        <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE" preload="auto" />

        {/* Ingredients */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                {t('recipes.ingredients')}
              </span>
              <span className="text-lg text-muted-foreground">
                {servings} {servings === 1 ? 'serving' : 'servings'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary mt-2 mr-3 flex-shrink-0" />
                  <span className="text-lg">{scaleIngredient(ingredient)}</span>
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
            <div className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <div
                  key={index}
                  className={`flex gap-3 p-3 rounded-lg transition-all ${
                    completedSteps.has(index) ? 'bg-primary/10' : 'hover:bg-accent/50'
                  }`}
                >
                  <Checkbox
                    id={`step-${index}`}
                    checked={completedSteps.has(index)}
                    onCheckedChange={() => toggleStep(index)}
                    className="mt-1"
                  />
                  <label
                    htmlFor={`step-${index}`}
                    className={`flex-1 cursor-pointer ${
                      completedSteps.has(index) ? 'line-through opacity-60' : ''
                    }`}
                  >
                    <span className="font-semibold text-primary mr-2">{index + 1}.</span>
                    <span className="text-lg">{instruction}</span>
                  </label>
                </div>
              ))}
            </div>
            {completedSteps.size > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  {completedSteps.size} of {recipe.instructions.length} steps completed
                </p>
              </div>
            )}
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
