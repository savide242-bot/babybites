import { useParams, Link, useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Clock,
  Users,
  ChefHat,
  Baby,
  Sparkles,
  Refrigerator,
  AlertTriangle,
  Clapperboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVideoRecipe } from "@/hooks/useVideoRecipes";
import { hapticFeedback } from "@/utils/haptic";

const VideoRecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recipe, loading } = useVideoRecipe(id);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-24 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen pt-24 pb-24 flex flex-col items-center justify-center text-center px-6">
        <Clapperboard className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Video recipe not found</h1>
        <Button onClick={() => navigate("/recipes")} className="mt-2">
          Back to Recipes
        </Button>
      </div>
    );
  }

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    hapticFeedback("light");
    if (video.paused) {
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          setIsPlaying(true);
          setHasStarted(true);
        }).catch((err) => {
          console.error('Video play() rejected:', err);
          setVideoError(`Playback failed: ${err?.message || 'unsupported format'}. Try a different browser, or re-upload the video as MP4 (H.264).`);
        });
      } else {
        setIsPlaying(true);
        setHasStarted(true);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const enterFullscreen = () => {
    const video = videoRef.current as any;
    const container = containerRef.current as any;
    hapticFeedback("light");
    // iOS Safari native fullscreen
    if (video?.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
      if (video.paused) {
        video.play();
        setIsPlaying(true);
        setHasStarted(true);
      }
      return;
    }
    if (container?.requestFullscreen) {
      container.requestFullscreen();
    } else if (container?.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  };

  const toggleIngredient = (index: number) => {
    hapticFeedback("light");
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="min-h-screen pt-16 pb-24 lg:pb-8 bg-gradient-to-b from-background via-peach/5 to-mint/5">
      <div className="container px-3 sm:px-4 max-w-3xl">
        {/* Back */}
        <div className="pt-4 mb-4">
          <Link
            to="/recipes"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Recipes
          </Link>
        </div>

        {/* Video Player */}
        <div
          ref={containerRef}
          className="relative mx-auto max-w-sm rounded-3xl overflow-hidden shadow-2xl shadow-gold/10 border border-gold/25 bg-black mb-6 [&:fullscreen]:max-w-none [&:fullscreen]:rounded-none [&:fullscreen]:flex [&:fullscreen]:items-center [&:fullscreen]:justify-center"
        >
          <div className="aspect-[9/16] relative w-full">
            <video
              ref={videoRef}
              src={recipe.videoUrl}
              poster={recipe.posterUrl}
              playsInline
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                setIsPlaying(false);
                setProgress(100);
              }}
              onClick={togglePlay}
              className="absolute inset-0 w-full h-full object-contain bg-black"
            />

            {/* Center play overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                aria-label="Play video"
                className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gold/50 blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full bg-white/25 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                    <Play className="h-7 w-7 text-white fill-white ml-1 drop-shadow-lg" />
                  </div>
                </div>
                {!hasStarted && (
                  <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none">
                    <span className="text-white/95 text-xs font-semibold bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      ▶ Watch the recipe · {recipe.videoDuration}
                    </span>
                  </div>
                )}
              </button>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <div
                className="h-1.5 rounded-full bg-white/25 cursor-pointer mb-2.5 overflow-hidden"
                onClick={handleSeek}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold to-amber-300 transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  onClick={enterFullscreen}
                  aria-label="Fullscreen"
                  className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Title & badges */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-gradient-to-r from-gold to-amber-400 text-gold-foreground text-[10px] px-2 py-0.5 flex items-center gap-1 shadow border-0 font-bold">
              <Play className="h-2.5 w-2.5 fill-current" />
              VIDEO RECIPE
            </Badge>
            <Badge className="bg-mint/20 text-mint-foreground text-[10px] px-2 py-0.5 border-0 flex items-center gap-1">
              <Baby className="h-2.5 w-2.5" />
              {recipe.ageLabel}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{recipe.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{recipe.description}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { icon: Clock, label: "Prep", value: recipe.prepTime },
            { icon: ChefHat, label: "Cook", value: recipe.cookTime },
            { icon: Users, label: "Makes", value: recipe.servings },
            { icon: Sparkles, label: "Level", value: recipe.difficulty },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-2xl bg-card/80 border border-border/40 p-2.5 text-center shadow-sm"
            >
              <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="text-[11px] sm:text-xs font-semibold text-foreground leading-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* Nutrition highlights */}
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.nutritionHighlights.map((h) => (
            <span
              key={h}
              className="text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full bg-mint/15 text-foreground border border-mint/30"
            >
              🌿 {h}
            </span>
          ))}
        </div>

        {/* Allergen note */}
        {recipe.allergenNote && (
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/90 leading-relaxed">{recipe.allergenNote}</p>
          </div>
        )}

        {/* Ingredients */}
        <div className="mb-6 rounded-3xl bg-card/80 border border-border/40 shadow-lg p-4 sm:p-5">
          <h2 className="font-bold text-base sm:text-lg mb-3 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10">
              <ChefHat className="h-4 w-4 text-primary" />
            </span>
            Ingredients
            <Badge variant="secondary" className="ml-auto rounded-full text-[10px]">
              {recipe.ingredients.length} items
            </Badge>
          </h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                <button
                  onClick={() => toggleIngredient(i)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                    checkedIngredients.has(i)
                      ? "bg-mint/10 border border-mint/30"
                      : "bg-background/60 border border-border/30 hover:border-primary/30"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checkedIngredients.has(i)
                        ? "bg-mint border-mint text-white"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {checkedIngredients.has(i) && <span className="text-[10px]">✓</span>}
                  </span>
                  <span
                    className={`text-sm ${
                      checkedIngredients.has(i)
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {ing}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="mb-6 rounded-3xl bg-card/80 border border-border/40 shadow-lg p-4 sm:p-5">
          <h2 className="font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-gold/15">
              <Clapperboard className="h-4 w-4 text-gold" />
            </span>
            Step by Step
          </h2>
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 shadow-md">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/90 leading-relaxed pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Storage */}
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-mint/10 to-secondary/10 border border-mint/25 flex gap-3">
          <div className="p-2 rounded-xl bg-mint/15 h-fit shrink-0">
            <Refrigerator className="h-4 w-4 text-mint" />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Storage</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{recipe.storage}</p>
          </div>
        </div>

        {/* Expert tip */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-gold/10 via-primary/5 to-peach/10 border border-gold/25 flex gap-3">
          <div className="p-2 rounded-xl bg-gold/15 h-fit shrink-0">
            <Sparkles className="h-4 w-4 text-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Dr. NutriExpert Tip</h3>
            <p className="text-xs text-foreground/85 leading-relaxed italic">"{recipe.expertTip}"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoRecipeDetail;
