import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Users,
  AlertCircle,
  AlertTriangle,
  Refrigerator,
  ArrowLeft,
  Calendar,
  FileDown,
  Share2,
  ChefHat,
  Timer,
  Plus,
  Minus,
  Play,
  Pause,
  RotateCcw,
  X,
  Heart,
  CheckCircle2,
  UtensilsCrossed,
  Flame,
  Sparkles,
  Leaf,
  ShieldCheck,
  Thermometer,
  Check,
  Baby,
  RotateCw,
  Lightbulb,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecipeHistory } from "@/hooks/useRecipeHistory";
import { useTodaysMealStatus } from "@/hooks/useTodaysMealStatus";
import { useAppRecipes } from "@/hooks/useAppRecipes";
import { recipes as staticRecipes, Recipe } from "@/data/recipes";
import { getRecipeDietaryTags } from "@/data/recipeDietaryTags";
import { DIETARY_OPTIONS } from "@/hooks/useDietaryPreferences";
import { exportRecipePDF } from "@/utils/recipePDFExport";
import SmartCombinationWarning from "@/components/SmartCombinationWarning";

const RecipeDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const { recipes } = useAppRecipes();
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromPlanner = location.state?.from === "planner";

  const recipe: Recipe | undefined =
    recipes?.find((r) => r.id === id) || staticRecipes.find((r) => r.id === id);

  const { toggleFavorite, isFavorite } = useFavorites();
  const { trackRecipeView } = useRecipeHistory();
  const {
    isInTodaysPlan,
    isPrepared,
    markAsPrepared,
    isLoading: mealStatusLoading,
  } = useTodaysMealStatus(id);

  // Servings state
  const originalServings = useMemo(() => {
    const parsed = parseInt(recipe?.servings || "1", 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }, [recipe?.servings]);

  const [servings, setServings] = useState<number>(originalServings);

  useEffect(() => {
    setServings(originalServings);
  }, [originalServings]);

  // Interactive checklists
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Cook Mode & Music
  const [cookMode, setCookMode] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  // Cooking Timer
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Track recipe view
  useEffect(() => {
    if (recipe?.id) {
      trackRecipeView(recipe.id);
    }
  }, [recipe?.id, trackRecipeView]);

  // Timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            toast.success("Timer Complete! 🔔", {
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

  useEffect(() => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    setTimerMinutes(mins);
    setTimerSeconds(secs);
  }, [totalSeconds]);

  // Background music in Cook Mode
  useEffect(() => {
    if (cookMode && musicRef.current) {
      musicRef.current.volume = 0.25;
      musicRef.current.play().catch(() => {});
      setMusicPlaying(true);
    } else if (!cookMode && musicRef.current) {
      musicRef.current.pause();
      setMusicPlaying(false);
    }
    return () => {
      if (musicRef.current) musicRef.current.pause();
    };
  }, [cookMode]);

  const toggleMusic = () => {
    if (musicRef.current) {
      if (musicPlaying) {
        musicRef.current.pause();
      } else {
        musicRef.current.play().catch(() => {});
      }
      setMusicPlaying(!musicPlaying);
    }
  };

  // Detect whether recipe involves boiling/steaming + blending/pureeing
  const isHotBlendingRecipe = useMemo(() => {
    if (!recipe) return false;
    const fullText = [
      recipe.title,
      recipe.description,
      ...(recipe.instructions || []),
    ]
      .join(" ")
      .toLowerCase();

    const hasHeat =
      /boil|steam|simmer|cook|roast|bake|saucepan|pot|heat|warm|tender/i.test(fullText);
    const hasBlending =
      /blend|blender|food processor|processor|puree|purée|pureeing|puréeing/i.test(fullText);

    return hasHeat && hasBlending;
  }, [recipe]);

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0f1411] px-4">
        <div className="text-center max-w-md p-8 bg-white dark:bg-[#161c18] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            Recipe not found
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mb-6 text-sm">
            This recipe might have been moved or updated. Let's head back to browse our collection!
          </p>
          <Button asChild className="rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white px-6">
            <Link to="/recipes">Back to Recipes</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Ingredient check toggle
  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Step check toggle
  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Timer controls
  const setPresetTimer = (minutes: number) => {
    setTotalSeconds(minutes * 60);
    setIsTimerRunning(true);
    toast.info(`Timer set for ${minutes} min`, {
      description: "Cooking countdown started",
    });
  };

  const startCustomTimer = () => {
    const input = prompt("Enter timer in minutes:", "10");
    const mins = parseInt(input || "0", 10);
    if (!isNaN(mins) && mins > 0) {
      setTotalSeconds(mins * 60);
      setIsTimerRunning(true);
    }
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTotalSeconds(0);
  };

  // Ingredient scaling
  const scaleIngredient = (ingredient: string): string => {
    const scale = servings / originalServings;
    if (scale === 1) return ingredient;
    return ingredient.replace(/(\d+(?:\.\d+)?)/g, (match) => {
      const num = parseFloat(match);
      const scaled = (num * scale).toFixed(1);
      return scaled.endsWith(".0") ? scaled.slice(0, -2) : scaled;
    });
  };

  // Actions
  const handleAddToPlanner = () => {
    toast.success("Added to Meal Plan!", {
      description: `${recipe.title} has been queued in your weekly schedule.`,
    });
  };

  const handleExportPDF = () => {
    try {
      exportRecipePDF(recipe);
      toast.success("Downloading PDF Guide!", {
        description: `${recipe.title} is ready for offline kitchen cooking.`,
      });
    } catch {
      toast.error("Export Failed", { description: "Could not generate PDF at this moment." });
    }
  };

  const handleShareWhatsApp = () => {
    let message = `🍽️ *${recipe.title}*\n\n📌 Category: ${recipe.category} | Age: ${recipe.ageGroup}\n⏱️ Prep Time: ${recipe.prepTime} | 👥 Servings: ${recipe.servings}\n\n${recipe.description}\n\n*Ingredients:*\n`;
    recipe.ingredients.forEach((ing) => {
      message += `• ${ing}\n`;
    });
    message += `\n*Instructions:*\n`;
    recipe.instructions.forEach((inst, i) => {
      message += `${i + 1}. ${inst}\n`;
    });
    message += `\n📱 Shared lovingly from BabyBites App`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    toast.success("Opening WhatsApp", { description: "Recipe message is prepared to share!" });
  };

  const nutritionCards = [
    {
      label: "Calories",
      value: recipe.nutrition.calories,
      unit: "kcal",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      icon: Flame,
    },
    {
      label: "Protein",
      value: recipe.nutrition.protein,
      unit: "g",
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      icon: ShieldCheck,
    },
    {
      label: "Carbs",
      value: recipe.nutrition.carbs,
      unit: "g",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      icon: Sparkles,
    },
    {
      label: "Healthy Fats",
      value: recipe.nutrition.fat,
      unit: "g",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      icon: Leaf,
    },
  ];

  // ==========================================
  // COOK MODE VIEW (High-contrast kitchen HUD)
  // ==========================================
  if (cookMode) {
    return (
      <div className="fixed inset-0 bg-[#0c120e] text-stone-100 z-50 overflow-y-auto pb-20">
        <audio
          ref={audioRef}
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE"
          preload="auto"
        />
        <audio
          ref={musicRef}
          src="https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3"
          loop
          preload="auto"
        />

        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-[#0c120e]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1E5E3A] flex items-center justify-center text-white">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                Cook Mode
              </p>
              <h1 className="text-lg md:text-xl font-bold truncate max-w-xs md:max-w-md">
                {recipe.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleMusic}
              variant="outline"
              size="sm"
              className="rounded-full bg-white/5 border-white/15 text-stone-200 hover:bg-white/10 text-xs"
            >
              {musicPlaying ? "🎵 Music Playing" : "🔇 Ambient Off"}
            </Button>
            <Button
              onClick={() => setCookMode(false)}
              variant="ghost"
              size="icon"
              className="rounded-full text-stone-300 hover:text-white hover:bg-white/10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Active Timer in Cook Mode */}
          <div className="bg-[#141d17] border border-emerald-500/20 rounded-[28px] p-6 text-center shadow-2xl">
            <p className="text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-2">
              Kitchen Timer
            </p>
            <div className="text-6xl font-black font-mono tracking-wider text-white mb-4">
              {String(timerMinutes).padStart(2, "0")}:{String(timerSeconds).padStart(2, "0")}
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {totalSeconds === 0 ? (
                <>
                  <Button
                    onClick={() => setPresetTimer(3)}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/20 bg-white/5 hover:bg-white/10"
                  >
                    3m
                  </Button>
                  <Button
                    onClick={() => setPresetTimer(5)}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/20 bg-white/5 hover:bg-white/10"
                  >
                    5m
                  </Button>
                  <Button
                    onClick={() => setPresetTimer(10)}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/20 bg-white/5 hover:bg-white/10"
                  >
                    10m
                  </Button>
                  <Button
                    onClick={() => setPresetTimer(15)}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/20 bg-white/5 hover:bg-white/10"
                  >
                    15m
                  </Button>
                  <Button
                    onClick={startCustomTimer}
                    size="sm"
                    className="rounded-full bg-[#1E5E3A] hover:bg-emerald-600 text-white"
                  >
                    Custom
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={toggleTimer}
                    className="rounded-full bg-[#1E5E3A] hover:bg-emerald-600 text-white px-6"
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" /> Resume
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={resetTimer}
                    variant="outline"
                    size="icon"
                    className="rounded-full border-white/20 bg-white/5"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Safety alert if hot blending */}
          {isHotBlendingRecipe && (
            <div className="p-5 rounded-[24px] bg-amber-500/15 border border-amber-500/30 text-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="font-bold text-base text-amber-300 mb-1">
                    Kitchen Safety: Let Hot Food Cool Before Blending
                  </h4>
                  <p className="text-sm text-amber-200/90 leading-relaxed">
                    Allow boiled or steamed ingredients to cool for 5–10 minutes before placing into
                    the blender. Hot steam creates sudden pressure that can blow the lid off and
                    cause severe burns. Always leave the lid's center cap vented and hold a kitchen
                    towel over it.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ingredients list */}
          <div className="bg-[#141d17] border border-white/10 rounded-[28px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🥗</span> Ingredients ({servings} {servings === 1 ? "serving" : "servings"})
              </h2>
              <span className="text-xs text-stone-400">
                {checkedIngredients.size}/{recipe.ingredients.length} checked
              </span>
            </div>
            <div className="space-y-2.5">
              {recipe.ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleIngredient(idx)}
                  className={`p-3.5 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer ${
                    checkedIngredients.has(idx)
                      ? "bg-white/5 text-stone-400 line-through"
                      : "bg-white/10 text-stone-100"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      checkedIngredients.has(idx)
                        ? "bg-[#1E5E3A] border-[#1E5E3A] text-white"
                        : "border-white/30"
                    }`}
                  >
                    {checkedIngredients.has(idx) && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <span className="text-base font-medium">{scaleIngredient(ing)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions step by step */}
          <div className="bg-[#141d17] border border-white/10 rounded-[28px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👩‍🍳</span> Cooking Steps
              </h2>
              <span className="text-xs text-stone-400">
                {completedSteps.size}/{recipe.instructions.length} completed
              </span>
            </div>
            <div className="space-y-4">
              {recipe.instructions.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    completedSteps.has(idx)
                      ? "bg-emerald-950/20 border-emerald-500/20 text-stone-400 line-through opacity-70"
                      : "bg-white/5 border-white/10 text-stone-100 hover:border-emerald-500/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        completedSteps.has(idx)
                          ? "bg-emerald-500 text-black"
                          : "bg-white/10 text-emerald-400"
                      }`}
                    >
                      {completedSteps.has(idx) ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                    </span>
                    <p className="text-base md:text-lg leading-relaxed pt-0.5">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN BOTANICAL RECIPE DETAIL VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0f1411] text-stone-900 dark:text-stone-100 pb-28 pt-3">
      {/* Audio alerts */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE"
        preload="auto"
      />
      <audio
        ref={musicRef}
        src="https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3"
        loop
        preload="auto"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* ========================================================== */}
        {/* HERO CARD (Rounded magazine cover with floating navigation) */}
        {/* ========================================================== */}
        <div className="relative rounded-[32px] md:rounded-[36px] overflow-hidden shadow-xl border border-black/[0.06] dark:border-white/[0.08] bg-stone-900 mb-6">
          <div className="relative h-[340px] sm:h-[420px] md:h-[460px] w-full">
            <img
              src={recipe.image}
              alt={recipe.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
            {/* Elegant botanical vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

            {/* Top Navigation Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                {cameFromPlanner ? (
                  <Button
                    onClick={() => navigate("/meal-planner")}
                    size="sm"
                    className="rounded-full bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black/80 backdrop-blur-md text-stone-900 dark:text-stone-100 shadow-md border border-white/20 text-xs px-3.5"
                  >
                    <UtensilsCrossed className="mr-1.5 h-3.5 w-3.5 text-[#1E5E3A] dark:text-emerald-400" />
                    Back to Planner
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="rounded-full bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black/80 backdrop-blur-md text-stone-900 dark:text-stone-100 shadow-md border border-white/20 text-xs px-3.5"
                  >
                    <Link to="/recipes">
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5 text-[#1E5E3A] dark:text-emerald-400" />
                      Recipes
                    </Link>
                  </Button>
                )}
              </div>

              {/* Floating Action Icons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleShareWhatsApp}
                  size="icon"
                  variant="secondary"
                  className="rounded-full bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black/80 backdrop-blur-md text-stone-900 dark:text-stone-100 shadow-md border border-white/20 h-10 w-10 transition-transform active:scale-95"
                  title="Share Recipe"
                >
                  <Share2 className="h-4 w-4 text-[#1E5E3A] dark:text-emerald-400" />
                </Button>
                <Button
                  onClick={handleExportPDF}
                  size="icon"
                  variant="secondary"
                  className="rounded-full bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black/80 backdrop-blur-md text-stone-900 dark:text-stone-100 shadow-md border border-white/20 h-10 w-10 transition-transform active:scale-95"
                  title="Save PDF"
                >
                  <FileDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </Button>
                <Button
                  onClick={() => toggleFavorite(recipe.id)}
                  size="icon"
                  variant="secondary"
                  className="rounded-full bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black/80 backdrop-blur-md shadow-md border border-white/20 h-10 w-10 transition-transform active:scale-90"
                  title="Add to Favorites"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      isFavorite(recipe.id) ? "fill-red-500 text-red-500" : "text-stone-700 dark:text-stone-200"
                    }`}
                  />
                </Button>
              </div>
            </div>

            {/* Bottom Overlay Title & Badges */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Categorical Pill Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className="rounded-full bg-[#1E5E3A] text-white hover:bg-[#1E5E3A] border-none px-3.5 py-1 text-xs font-semibold shadow-sm">
                    {recipe.category}
                  </Badge>
                  <Badge className="rounded-full bg-amber-500/90 text-stone-950 border-none px-3.5 py-1 text-xs font-bold shadow-sm">
                    {recipe.ageGroup}
                  </Badge>
                  {getRecipeDietaryTags(recipe.id).slice(0, 2).map((tag) => {
                    const opt = DIETARY_OPTIONS.find((o) => o.value === tag);
                    return (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="rounded-full bg-black/40 backdrop-blur-md text-white border-white/30 text-xs px-2.5 py-0.5"
                      >
                        {opt?.label || tag}
                      </Badge>
                    );
                  })}
                </div>

                {/* Recipe Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2 drop-shadow-sm">
                  {recipe.title}
                </h1>

                {/* Description */}
                <p className="text-stone-200/95 text-sm sm:text-base leading-relaxed line-clamp-3 max-w-3xl drop-shadow-sm font-normal">
                  {recipe.description}
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* QUICK METRICS RIBBON (Prep Time, Servings, Calories, Safety) */}
        {/* ========================================================== */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
          <div className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-3.5 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-[#1E5E3A] dark:text-emerald-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                {recipe.prepTime}
              </span>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
              Prep Time
            </span>
          </div>

          <div className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-3.5 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                {servings} {servings === 1 ? "portion" : "portions"}
              </span>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
              Servings
            </span>
          </div>

          <div className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-3.5 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-orange-500 dark:text-orange-400 mb-1">
              <Flame className="w-4 h-4" />
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                {recipe.nutrition.calories}
              </span>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
              Calories
            </span>
          </div>

          <div className="hidden sm:block bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-3.5 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-sky-600 dark:text-sky-400 mb-1">
              <Baby className="w-4 h-4" />
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                {recipe.ageGroup.replace("months", "mo")}
              </span>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
              Age Stage
            </span>
          </div>
        </div>

        {/* ========================================================== */}
        {/* PRIMARY CALL-TO-ACTION BUTTONS (Prepared, Cook Mode, Planner) */}
        {/* ========================================================== */}
        <div className="space-y-3 mb-8">
          {/* Priority banner if meal is in today's planner */}
          {isInTodaysPlan && !isPrepared && !mealStatusLoading && (
            <Button
              onClick={async () => {
                const success = await markAsPrepared();
                if (success && cameFromPlanner) {
                  toast.success("Meal Prepared! 🎉", {
                    description: "Would you like to return to your planner?",
                    action: {
                      label: "Back to Planner",
                      onClick: () => navigate("/meal-planner"),
                    },
                    duration: 5000,
                  });
                }
              }}
              size="lg"
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-6 text-base font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.99]"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Mark as Prepared for Today
            </Button>
          )}

          {isInTodaysPlan && isPrepared && (
            <div className="w-full rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 py-3.5 px-4 text-center font-semibold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Prepared today for baby!
            </div>
          )}

          {/* Enter Cook Mode */}
          <Button
            onClick={() => setCookMode(true)}
            size="lg"
            className="w-full rounded-2xl bg-[#1E5E3A] hover:bg-[#16472c] text-white py-6 text-base font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
          >
            <ChefHat className="mr-2 h-5 w-5 text-emerald-300" />
            Enter Interactive Cook Mode
          </Button>

          {/* Secondary Quick Action Row */}
          <div className="grid grid-cols-3 gap-2.5">
            <Button
              onClick={handleAddToPlanner}
              variant="outline"
              className="rounded-2xl py-4 h-auto bg-white dark:bg-[#161c18] border-black/[0.06] dark:border-white/[0.08] hover:bg-[#1E5E3A]/5 hover:border-[#1E5E3A]/30 flex flex-col items-center gap-1.5 shadow-sm transition-all"
            >
              <Calendar className="h-4 w-4 text-[#1E5E3A] dark:text-emerald-400" />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                Add to Plan
              </span>
            </Button>
            <Button
              onClick={handleShareWhatsApp}
              variant="outline"
              className="rounded-2xl py-4 h-auto bg-white dark:bg-[#161c18] border-black/[0.06] dark:border-white/[0.08] hover:bg-emerald-500/5 hover:border-emerald-500/30 flex flex-col items-center gap-1.5 shadow-sm transition-all"
            >
              <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                Share Recipe
              </span>
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="rounded-2xl py-4 h-auto bg-white dark:bg-[#161c18] border-black/[0.06] dark:border-white/[0.08] hover:bg-amber-500/5 hover:border-amber-500/30 flex flex-col items-center gap-1.5 shadow-sm transition-all"
            >
              <FileDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                Save PDF
              </span>
            </Button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* MANDATORY KITCHEN SAFETY WARNING: HOT BLENDING PRESSURE    */}
        {/* (Rendered when boiling/steaming + blending is detected)     */}
        {/* ========================================================== */}
        {isHotBlendingRecipe && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="rounded-[28px] border-2 border-amber-500/40 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-amber-100/50 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-stone-900 p-5 md:p-6 shadow-md relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-stone-950">
                      Important Safety Notice
                    </span>
                    <h3 className="font-extrabold text-base md:text-lg text-amber-950 dark:text-amber-200">
                      Allow Hot Ingredients to Cool Before Blending
                    </h3>
                  </div>

                  <p className="text-sm text-stone-800 dark:text-stone-300 leading-relaxed font-medium">
                    Allow boiled or steamed ingredients to cool for <strong>5–10 minutes</strong>{" "}
                    before placing them into the blender or food processor. Blending boiling-hot foods
                    creates trapped steam pressure that can pop the lid off forcefully, causing severe
                    scalding burns and appliance damage.
                  </p>

                  {/* Practical Safety Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-2 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>Cool 5–10 min until warm, not boiling</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-2 rounded-xl">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>Never fill blender past halfway mark</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-2 rounded-xl">
                      <Thermometer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>Remove center cap to let steam vent safely</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-2 rounded-xl">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>Hold folded kitchen towel loosely over lid</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================== */}
        {/* INGREDIENTS SECTION & PORTION SCALER                       */}
        {/* ========================================================== */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-[#1E5E3A] dark:text-emerald-400 flex items-center justify-center font-bold">
                🥗
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  Ingredients
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Tap to cross off as you prep in your kitchen
                </p>
              </div>
            </div>

            {/* Servings Scaler Widget */}
            <div className="flex items-center gap-2 bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-1.5 shadow-sm">
              <Button
                onClick={() => setServings((prev) => Math.max(1, prev - 1))}
                variant="ghost"
                size="icon"
                disabled={servings <= 1}
                className="h-8 w-8 rounded-xl text-stone-600 hover:text-stone-900 dark:text-stone-300"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <div className="text-center px-1">
                <span className="text-sm font-extrabold text-[#1E5E3A] dark:text-emerald-400">
                  {servings}
                </span>
                <span className="text-[10px] block text-stone-500 font-medium">
                  {servings === 1 ? "portion" : "portions"}
                </span>
              </div>
              <Button
                onClick={() => setServings((prev) => prev + 1)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-stone-600 hover:text-stone-900 dark:text-stone-300"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Interactive Checklist Card */}
          <div className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-[28px] overflow-hidden shadow-sm">
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {recipe.ingredients.map((ingredient, index) => {
                const isChecked = checkedIngredients.has(index);
                return (
                  <div
                    key={index}
                    onClick={() => toggleIngredient(index)}
                    className={`flex items-center gap-3.5 px-5 py-4 cursor-pointer transition-colors select-none ${
                      isChecked
                        ? "bg-emerald-50/40 dark:bg-emerald-950/10 text-stone-400 dark:text-stone-500"
                        : "hover:bg-stone-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 ${
                        isChecked
                          ? "bg-[#1E5E3A] border-[#1E5E3A] text-white"
                          : "border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span
                      className={`text-sm sm:text-base font-medium flex-1 ${
                        isChecked ? "line-through" : "text-stone-800 dark:text-stone-200"
                      }`}
                    >
                      {scaleIngredient(ingredient)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Checklist progress footer */}
            <div className="px-5 py-3 bg-stone-50/70 dark:bg-white/[0.02] border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>
                {checkedIngredients.size} of {recipe.ingredients.length} items checked
              </span>
              {checkedIngredients.size > 0 && (
                <button
                  onClick={() => setCheckedIngredients(new Set())}
                  className="text-[#1E5E3A] dark:text-emerald-400 font-semibold hover:underline"
                >
                  Reset Checklist
                </button>
              )}
            </div>
          </div>

          {/* Smart Food Combination Warning */}
          <div className="mt-4">
            <SmartCombinationWarning ingredients={recipe.ingredients} />
          </div>
        </div>

        {/* ========================================================== */}
        {/* INSTRUCTIONS STEP-BY-STEP (Interactive with timer)         */}
        {/* ========================================================== */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                👩‍🍳
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  Step-by-Step Instructions
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Follow carefully; tap each step to mark as finished
                </p>
              </div>
            </div>

            {completedSteps.size > 0 && (
              <Badge
                variant="outline"
                className="rounded-full bg-emerald-50 text-[#1E5E3A] dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/20 text-xs px-3"
              >
                {completedSteps.size} of {recipe.instructions.length} done
              </Badge>
            )}
          </div>

          {/* Step Cards List */}
          <div className="space-y-3">
            {recipe.instructions.map((instruction, index) => {
              const isDone = completedSteps.has(index);
              return (
                <div
                  key={index}
                  onClick={() => toggleStep(index)}
                  className={`rounded-[24px] border p-5 transition-all cursor-pointer ${
                    isDone
                      ? "bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-500/20 opacity-70"
                      : "bg-white dark:bg-[#161c18] border-black/[0.06] dark:border-white/[0.08] hover:shadow-md hover:border-emerald-500/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
                        isDone
                          ? "bg-[#1E5E3A] text-white"
                          : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm sm:text-base leading-relaxed ${
                          isDone
                            ? "line-through text-stone-400 dark:text-stone-500"
                            : "text-stone-800 dark:text-stone-200 font-medium"
                        }`}
                      >
                        {instruction}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cooking Timer Tool within Steps */}
          <div className="mt-5 bg-gradient-to-r from-stone-100/90 to-stone-50 dark:from-white/[0.04] dark:to-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] text-[#1E5E3A] dark:text-emerald-400 flex items-center justify-center shadow-sm">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Kitchen Timer
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Track boiling, steaming, or baking times
                </p>
              </div>
            </div>

            {totalSeconds === 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPresetTimer(5)}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs h-8 px-3"
                >
                  5 min
                </Button>
                <Button
                  onClick={() => setPresetTimer(10)}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs h-8 px-3"
                >
                  10 min
                </Button>
                <Button
                  onClick={startCustomTimer}
                  size="sm"
                  className="rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white text-xs h-8 px-3"
                >
                  Set Timer
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-lg font-black text-[#1E5E3A] dark:text-emerald-400">
                  {String(timerMinutes).padStart(2, "0")}:{String(timerSeconds).padStart(2, "0")}
                </span>
                <Button
                  onClick={toggleTimer}
                  size="icon"
                  variant="secondary"
                  className="rounded-full h-8 w-8"
                >
                  {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={resetTimer}
                  size="icon"
                  variant="outline"
                  className="rounded-full h-8 w-8"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================== */}
        {/* ESSENTIAL MOTHER'S KITCHEN & SAFETY GUIDANCE CARDS         */}
        {/* ========================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {/* Squish Test & Texture Safety */}
          <div className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#1E5E3A] dark:text-emerald-400 flex items-center justify-center">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                The Squish Test
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Always test cooked pieces between your thumb and index finger. It should easily squash
              flat with gentle pressure before serving to prevent choking.
            </p>
          </div>

          {/* Temperature Check */}
          <div className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Thermometer className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Wrist Temperature
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Test a small drop or spoonful on the sensitive skin of your inner wrist. It should feel
              lukewarm or body temperature, never uncomfortably warm.
            </p>
          </div>

          {/* Texture Adjustment */}
          <div className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Texture Adjustment
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Too thick? Thin effortlessly with 1–2 tbsp of breastmilk, formula, or reserved cooking
              steamer water. Too thin? Stir in a pinch of oatmeal or potato.
            </p>
          </div>
        </div>

        {/* ========================================================== */}
        {/* ALLERGEN ADVISORY CARD (If allergens present)               */}
        {/* ========================================================== */}
        {recipe.allergens && recipe.allergens.length > 0 && (
          <div className="mb-8 rounded-[28px] border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 p-5 md:p-6 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-rose-950 dark:text-rose-200 mb-1">
                  Allergen Advisory Notice
                </h3>
                <p className="text-xs sm:text-sm text-rose-900/80 dark:text-rose-300/80 mb-3 leading-relaxed">
                  This recipe contains common allergens. Introduce major allergens one at a time in
                  small amounts, preferably during morning meals, and observe baby for 2–3 hours.
                </p>
                <div className="flex flex-wrap gap-2">
                  {recipe.allergens.map((allergen) => (
                    <Badge
                      key={allergen}
                      variant="destructive"
                      className="rounded-full bg-rose-600 text-white border-none text-xs px-3 py-0.5"
                    >
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* PEDIATRIC GUIDANCE & BLW SERVING SECTION                   */}
        {/* ========================================================== */}
        <div className="mb-8 space-y-4">
          {/* Serving Guidance */}
          <div className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    Serving & Baby-Led Weaning Guide
                  </h3>
                  <Badge variant="outline" className="rounded-full text-[10px] uppercase font-bold">
                    {recipe.ageGroup}
                  </Badge>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                  {recipe.servingGuidance}
                </p>
              </div>
            </div>
          </div>

          {/* Health Benefits */}
          <div className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#1E5E3A] dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-1.5">
                  Pediatric Health & Developmental Benefits
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                  {recipe.healthBenefits}
                </p>
              </div>
            </div>
          </div>

          {/* Storage & Freezing Tips */}
          <div className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                <Refrigerator className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-1.5">
                  Safe Storage & Meal Prep Freezing
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                  {recipe.storage}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* NUTRITION FACTS GRID & VITAMINS                            */}
        {/* ========================================================== */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-bold">
              📊
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                Nutrition Profile
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Estimated values per standard infant portion
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {nutritionCards.map((item) => (
              <div
                key={item.label}
                className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-4 shadow-sm"
              >
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${item.color}`}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-stone-900 dark:text-stone-100">
                  {item.value}
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400 ml-1">
                    {item.unit}
                  </span>
                </div>
                <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-0.5">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {recipe.nutrition.vitamins && recipe.nutrition.vitamins.length > 0 && (
            <div className="mt-4 p-4 bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-[24px]">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
                Key Micronutrients & Vitamins
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recipe.nutrition.vitamins.map((vit) => (
                  <Badge
                    key={vit}
                    variant="outline"
                    className="rounded-full bg-emerald-500/10 text-[#1E5E3A] dark:text-emerald-300 border-emerald-500/20 text-xs px-3 py-1 font-semibold"
                  >
                    ✓ {vit}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;