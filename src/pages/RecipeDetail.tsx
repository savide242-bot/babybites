import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, AlertCircle, Refrigerator, ArrowLeft, Calendar, FileDown, Share2, ChefHat, Timer, Plus, Minus, Play, Pause, RotateCcw, X, Heart, CheckCircle2, UtensilsCrossed, Flame, Sparkles, Leaf, ShieldCheck } from "lucide-react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { recipes } from "@/data/recipes";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecipeHistory } from "@/hooks/useRecipeHistory";
import { getRecipeDietaryTags } from "@/data/recipeDietaryTags";
import { DIETARY_OPTIONS } from "@/hooks/useDietaryPreferences";
import { useTodaysMealStatus } from "@/hooks/useTodaysMealStatus";
import { motion } from "framer-motion";
import { exportRecipePDF } from "@/utils/recipePDFExport";
import SmartCombinationWarning from "@/components/SmartCombinationWarning";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { tr, translateAgeGroup, translateCategory, translateDietaryLabel, translatePrepTime } from "@/utils/spanishDisplay";

const RecipeDetail = () => {
  const { language } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromPlanner = location.state?.from === 'planner';
  const recipe = recipes.find((r) => r.id === id);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { trackRecipeView } = useRecipeHistory();
  const { isInTodaysPlan, isPrepared, mealType, markAsPrepared, isLoading: mealStatusLoading } = useTodaysMealStatus(id);

  // Build translation items for this recipe (title, description, ingredients, instructions)
  const translationItems = recipe ? [
    { key: `recipe:${recipe.id}:title`, text: recipe.title },
    { key: `recipe:${recipe.id}:description`, text: recipe.description },
    { key: `recipe:${recipe.id}:healthBenefits`, text: recipe.healthBenefits },
    { key: `recipe:${recipe.id}:storage`, text: recipe.storage },
    { key: `recipe:${recipe.id}:servingGuidance`, text: recipe.servingGuidance },
    ...recipe.ingredients.map((ing, i) => ({ key: `recipe:${recipe.id}:ing:${i}`, text: ing })),
    ...recipe.instructions.map((ins, i) => ({ key: `recipe:${recipe.id}:ins:${i}`, text: ins })),
    ...recipe.allergens.map((allergen, i) => ({ key: `recipe:${recipe.id}:allergen:${i}`, text: allergen })),
  ] : [];
  const { map: tx } = useTranslatedContent(translationItems);
  const tt = (key: string, fallback: string) => tx[key] || fallback;
  
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
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (audioRef.current) {
              audioRef.current.play();
            }
            toast.success(tr(language, "Timer Complete!", "¡Temporizador terminado!"), {
              description: tr(language, "Your cooking timer has finished!", "Tu temporizador de cocina ha finalizado."),
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, totalSeconds]);

  useEffect(() => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    setTimerMinutes(mins);
    setTimerSeconds(secs);
  }, [totalSeconds]);

  useEffect(() => {
    if (recipe?.id) {
      trackRecipeView(recipe.id);
    }
  }, [recipe?.id]);

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{tr(language, "Recipe not found", "Receta no encontrada")}</h2>
          <Button asChild className="rounded-full">
            <Link to="/recipes">{tr(language, "Back to Recipes", "Volver a recetas")}</Link>
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
    const mins = parseInt(prompt(tr(language, "Enter minutes:", "Introduce los minutos:")) || "0");
    if (mins > 0) {
      setTotalSeconds(mins * 60);
      setIsTimerRunning(true);
    }
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTotalSeconds(0);
  };

  const scaleIngredient = (ingredient: string): string => {
    if (!recipe) return ingredient;
    const originalServings = parseInt(recipe.servings) || 1;
    const scale = servings / originalServings;
    if (scale === 1) return ingredient;
    return ingredient.replace(/(\d+(?:\.\d+)?)/g, (match) => {
      const num = parseFloat(match);
      const scaled = (num * scale).toFixed(1);
      return scaled.endsWith('.0') ? scaled.slice(0, -2) : scaled;
    });
  };

  const handleAddToPlanner = () => {
    toast.success(tr(language, "Added to Planner!", "¡Añadido al plan!"), {
      description: tr(language, `${tt(`recipe:${recipe.id}:title`, recipe.title)} has been added to your meal plan`, `${tt(`recipe:${recipe.id}:title`, recipe.title)} se ha añadido a tu plan de comidas`),
    });
  };

  const handleExportPDF = () => {
    try {
      exportRecipePDF(recipe);
      toast.success(tr(language, "Downloading PDF!", "¡Descargando PDF!"), { description: tr(language, `${tt(`recipe:${recipe.id}:title`, recipe.title)} is being saved`, `${tt(`recipe:${recipe.id}:title`, recipe.title)} se está guardando`) });
    } catch (error) {
      toast.error(tr(language, "Export Failed", "Error al exportar"), { description: tr(language, "Could not generate PDF.", "No se pudo generar el PDF.") });
    }
  };

  const handleShareWhatsApp = () => {
    let message = `🍽️ *${tt(`recipe:${recipe.id}:title`, recipe.title)}*\n\n📌 ${translateCategory(recipe.category, language)} | ${translateAgeGroup(recipe.ageGroup, language)}\n⏱️ ${translatePrepTime(recipe.prepTime, language)} | 👥 ${recipe.servings}\n\n${tt(`recipe:${recipe.id}:description`, recipe.description)}\n\n*${tr(language, 'Ingredients', 'Ingredientes')}:*\n`;
    recipe.ingredients.forEach((ing, index) => { message += `• ${tt(`recipe:${recipe.id}:ing:${index}`, ing)}\n`; });
    message += `\n📱 ${tr(language, 'Shared from BabyBites', 'Compartido desde BabyBites')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    toast.success(tr(language, "Opening WhatsApp", "Abriendo WhatsApp"), { description: tr(language, "Recipe is ready to share!", "¡La receta está lista para compartir!") });
  };

  const [musicPlaying, setMusicPlaying] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (cookMode && musicRef.current) {
      musicRef.current.volume = 0.3;
      musicRef.current.play().catch(() => {});
      setMusicPlaying(true);
    } else if (!cookMode && musicRef.current) {
      musicRef.current.pause();
      setMusicPlaying(false);
    }
    return () => { if (musicRef.current) musicRef.current.pause(); };
  }, [cookMode]);
  
  const toggleMusic = () => {
    if (musicRef.current) {
      if (musicPlaying) musicRef.current.pause();
      else musicRef.current.play().catch(() => {});
      setMusicPlaying(!musicPlaying);
    }
  };

  // Cook Mode View
  if (cookMode) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white z-50 overflow-y-auto">
        <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE" preload="auto" />
        <audio ref={musicRef} src="https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3" loop preload="auto" />
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{tt(`recipe:${recipe.id}:title`, recipe.title)}</h1>
            <div className="flex items-center gap-3">
              <Button onClick={toggleMusic} variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-2">
                {musicPlaying ? <>🎵 {tr(language, 'Music On', 'Música activa')}</> : <>🔇 {tr(language, 'Music Off', 'Música apagada')}</>}
              </Button>
              <Button onClick={() => setCookMode(false)} variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
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
                    <Button onClick={resetTimer} variant="outline" size="lg"><RotateCcw className="h-5 w-5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="mb-6 bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">{tr(language, 'Ingredients', 'Ingredientes')} ({servings} {tr(language, 'servings', 'porciones')})</h2>
              <ul className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-xl text-gray-200">• {scaleIngredient(tt(`recipe:${recipe.id}:ing:${index}`, ingredient))}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">{tr(language, 'Instructions', 'Instrucciones')}</h2>
              <div className="space-y-6">
                {recipe.instructions.map((instruction, index) => (
                  <div key={index} className={`flex gap-4 p-4 rounded-lg transition-all ${completedSteps.has(index) ? 'bg-primary/20 opacity-60' : 'bg-gray-700/50'}`}>
                    <Checkbox id={`step-cook-${index}`} checked={completedSteps.has(index)} onCheckedChange={() => toggleStep(index)} className="mt-1 h-6 w-6" />
                    <label htmlFor={`step-cook-${index}`} className={`text-xl cursor-pointer text-white ${completedSteps.has(index) ? 'line-through opacity-60' : ''}`}>
                      <span className="font-bold text-primary mr-2">{tr(language, 'Step', 'Paso')} {index + 1}:</span>{tt(`recipe:${recipe.id}:ins:${index}`, instruction)}
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

  const nutritionItems = [
    { label: tr(language, 'Calories', 'Calorías'), value: recipe.nutrition.calories, unit: 'kcal', color: 'from-orange-400 to-red-500', icon: Flame },
    { label: tr(language, 'Protein', 'Proteína'), value: recipe.nutrition.protein, unit: 'g', color: 'from-blue-400 to-cyan-500', icon: ShieldCheck },
    { label: tr(language, 'Carbs', 'Carbohidratos'), value: recipe.nutrition.carbs, unit: 'g', color: 'from-amber-400 to-yellow-500', icon: Sparkles },
    { label: tr(language, 'Fat', 'Grasa'), value: recipe.nutrition.fat, unit: 'g', color: 'from-purple-400 to-pink-500', icon: Leaf },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24 lg:pb-8">
      {/* Hero Section */}
      <div className="relative h-[45vh] min-h-[350px] overflow-hidden">
        <img src={recipe.image} alt={recipe.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Navigation */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            {cameFromPlanner && (
              <Button onClick={() => navigate('/meal-planner')} size="sm" className="rounded-full bg-primary/90 backdrop-blur-sm shadow-lg">
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                {tr(language, 'Back to Planner', 'Volver al plan')}
              </Button>
            )}
            <Button asChild variant="secondary" size="sm" className="rounded-full backdrop-blur-sm shadow-lg">
              <Link to="/recipes"><ArrowLeft className="mr-2 h-4 w-4" />{tr(language, 'Recipes', 'Recetas')}</Link>
            </Button>
          </div>
          <Button onClick={() => toggleFavorite(recipe.id)} size="icon" variant="secondary" className="rounded-full backdrop-blur-sm shadow-lg h-10 w-10">
            <Heart className={`h-5 w-5 ${isFavorite(recipe.id) ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        {/* Recipe Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="rounded-full bg-primary/90 text-primary-foreground px-3 py-1">{recipe.category}</Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">{recipe.ageGroup}</Badge>
              {getRecipeDietaryTags(recipe.id).map((tag) => {
                const option = DIETARY_OPTIONS.find(o => o.value === tag);
                return <Badge key={tag} variant="outline" className={`rounded-full bg-white/10 backdrop-blur-sm ${option?.color || ''}`}>{option?.label}</Badge>;
              })}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{tt(`recipe:${recipe.id}:title`, recipe.title)}</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">{tt(`recipe:${recipe.id}:description`, recipe.description)}</p>
          </motion.div>
        </div>
      </div>

      <div className="container max-w-4xl px-4 -mt-6 relative z-10">
        {/* Quick Stats Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card rounded-2xl shadow-xl border p-4 mb-6"
        >
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{recipe.prepTime}</span>
              </div>
              <span className="text-xs text-muted-foreground">Prep Time</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Users className="h-4 w-4" />
                <span className="font-semibold">{recipe.servings}</span>
              </div>
              <span className="text-xs text-muted-foreground">Servings</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Flame className="h-4 w-4" />
                <span className="font-semibold">{recipe.nutrition.calories}</span>
              </div>
              <span className="text-xs text-muted-foreground">Calories</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3 mb-8"
        >
          {/* Mark as Prepared - Priority when in plan */}
          {isInTodaysPlan && !isPrepared && !mealStatusLoading && (
            <Button 
              onClick={async () => {
                const success = await markAsPrepared();
                if (success && cameFromPlanner) {
                  toast.success("Meal Prepared!", {
                    description: "Back to planner?",
                    action: { label: "Back to Planner", onClick: () => navigate('/meal-planner') },
                    duration: 5000,
                  });
                }
              }}
              size="lg"
              className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all animate-pulse"
            >
              <CheckCircle2 className="mr-2 h-6 w-6" />
              Mark as Prepared
            </Button>
          )}

          {isInTodaysPlan && isPrepared && (
            <div className="w-full rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 py-4 text-center font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Meal Already Prepared!
            </div>
          )}

          <Button onClick={() => setCookMode(true)} size="lg" className="w-full rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
            <ChefHat className="mr-2 h-6 w-6" />
            Enter Cook Mode
          </Button>

          <div className="grid grid-cols-3 gap-2">
            <Button onClick={handleAddToPlanner} variant="outline" size="lg" className="rounded-2xl py-5 bg-card hover:bg-primary/5 border-primary/20 flex flex-col items-center gap-1.5 h-auto">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-medium">Add to Plan</span>
            </Button>
            <Button onClick={handleShareWhatsApp} variant="outline" size="lg" className="rounded-2xl py-5 bg-card hover:bg-mint/5 border-mint/20 flex flex-col items-center gap-1.5 h-auto">
              <Share2 className="h-5 w-5 text-mint" />
              <span className="text-[11px] font-medium">Share</span>
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="lg" className="rounded-2xl py-5 bg-card hover:bg-gold/5 border-gold/20 flex flex-col items-center gap-1.5 h-auto">
              <FileDown className="h-5 w-5 text-gold" />
              <span className="text-[11px] font-medium">Save PDF</span>
            </Button>
          </div>
        </motion.div>

        {/* Servings Adjuster */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-card rounded-2xl shadow-lg border p-5 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Adjust Servings</h3>
              <p className="text-sm text-muted-foreground">Scale ingredients automatically</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => setServings(Math.max(1, servings - 1))} variant="outline" size="icon" className="rounded-full h-10 w-10" disabled={servings <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-2xl font-bold text-primary w-8 text-center">{servings}</span>
              <Button onClick={() => setServings(servings + 1)} variant="outline" size="icon" className="rounded-full h-10 w-10">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Ingredients Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-lg">🥗</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Ingredients</h2>
          </div>
          <Card className="rounded-2xl shadow-lg border-0 bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className={`flex items-center gap-4 px-5 py-4 ${index !== recipe.ingredients.length - 1 ? 'border-b border-border/50' : ''}`}>
                  <div className="h-3 w-3 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0" />
                  <span className="text-foreground">{scaleIngredient(tt(`recipe:${recipe.id}:ing:${index}`, ingredient))}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="mt-4">
            <SmartCombinationWarning ingredients={recipe.ingredients} />
          </div>
        </motion.div>

        {/* Instructions Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
              <span className="text-lg">👩‍🍳</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Instructions</h2>
          </div>
          <div className="space-y-3">
            {recipe.instructions.map((instruction, index) => (
              <Card key={index} className={`rounded-2xl shadow-md border-0 transition-all cursor-pointer ${completedSteps.has(index) ? 'bg-primary/10 border-primary/20' : 'bg-card hover:shadow-lg'}`} onClick={() => toggleStep(index)}>
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${completedSteps.has(index) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {completedSteps.has(index) ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                    </div>
                    <p className={`text-foreground leading-relaxed ${completedSteps.has(index) ? 'line-through opacity-60' : ''}`}>{tt(`recipe:${recipe.id}:ins:${index}`, instruction)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {completedSteps.size > 0 && (
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="rounded-full px-4 py-1">
                {completedSteps.size} of {recipe.instructions.length} steps completed
              </Badge>
            </div>
          )}
        </motion.div>

        {/* Nutrition Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <span className="text-lg">✨</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Nutrition Facts</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {nutritionItems.map((item) => (
              <Card key={item.label} className="rounded-2xl shadow-md border-0 bg-card overflow-hidden">
                <CardContent className="p-4">
                  <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${item.color} mb-2`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{item.value}<span className="text-sm font-normal text-muted-foreground ml-1">{item.unit}</span></div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          {recipe.nutrition.vitamins.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Vitamins & Minerals</p>
              <div className="flex flex-wrap gap-2">
                {recipe.nutrition.vitamins.map((vitamin) => (
                  <Badge key={vitamin} variant="outline" className="rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">{vitamin}</Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Allergens Warning */}
        {recipe.allergens.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mb-6"
          >
            <Card className="rounded-2xl shadow-md border-destructive/30 bg-destructive/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-destructive mb-2">Allergen Warning</h3>
                    <div className="flex flex-wrap gap-2">
                      {recipe.allergens.map((allergen) => (
                        <Badge key={allergen} variant="destructive" className="rounded-full">{allergen}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Health Benefits & Storage */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid gap-4 mb-8"
        >
          <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Health Benefits</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{recipe.healthBenefits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md border-0 bg-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Refrigerator className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Storage Tips</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{recipe.storage}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-accent/5 to-primary/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Serving Guidance</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{recipe.servingGuidance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timer Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mb-12"
        >
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-muted/50 to-muted">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Timer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Cooking Timer</h3>
                    <p className="text-sm text-muted-foreground">Track your cooking time</p>
                  </div>
                </div>
                {totalSeconds === 0 ? (
                  <Button onClick={startTimer} className="rounded-full"><Play className="mr-2 h-4 w-4" />Start</Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">{String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}</span>
                    <Button onClick={toggleTimer} size="icon" variant="secondary" className="rounded-full h-10 w-10">
                      {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button onClick={resetTimer} size="icon" variant="outline" className="rounded-full h-10 w-10">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE" preload="auto" />
      </div>
    </div>
  );
};

export default RecipeDetail;
