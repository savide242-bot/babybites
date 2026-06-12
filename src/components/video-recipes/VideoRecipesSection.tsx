import { Link } from "react-router-dom";
import { Play, Clapperboard, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { videoRecipes } from "@/data/videoRecipes";
import { hapticFeedback } from "@/utils/haptic";

const VideoRecipesSection = () => {
  return (
    <div className="mb-6 sm:mb-8 animate-fade-in">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-gold/20 to-primary/15">
            <Clapperboard className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-foreground via-gold to-foreground bg-clip-text text-transparent bg-[length:200%] animate-[shimmer_3s_ease-in-out_infinite]">
              Video Recipes
            </h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground -mt-0.5">
              Watch & cook step by step
            </p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-gold to-amber-400 text-gold-foreground text-[9px] sm:text-[10px] px-2 py-0.5 shadow-lg border-0 animate-pulse">
          ✨ NEW
        </Badge>
      </div>

      {/* Horizontal scroll of video cards */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-2">
          {videoRecipes.map((recipe, index) => (
            <Link
              key={recipe.id}
              to={`/video-recipe/${recipe.id}`}
              onClick={() => hapticFeedback("light")}
              className="flex-shrink-0 w-36 sm:w-44 group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="overflow-hidden rounded-2xl shadow-lg border border-gold/25 bg-card/80 backdrop-blur-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:shadow-gold/20 active:scale-[0.97] ring-1 ring-gold/20">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={recipe.posterUrl}
                    alt={recipe.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  {/* VIDEO badge */}
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-gradient-to-r from-gold to-amber-400 text-gold-foreground text-[9px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-lg border-0 font-bold">
                      <Play className="h-2.5 w-2.5 fill-current" />
                      VIDEO
                    </Badge>
                  </div>

                  {/* Age badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/90 backdrop-blur-sm text-foreground/80 text-[9px] px-1.5 py-0.5 shadow-lg border-0">
                      {recipe.ageLabel}
                    </Badge>
                  </div>

                  {/* Glowing play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gold/40 blur-md animate-pulse" />
                      <div className="relative w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        <Play className="h-5 w-5 text-white fill-white ml-0.5 drop-shadow-lg" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-bold text-xs sm:text-sm line-clamp-2 leading-tight mb-1.5 drop-shadow-lg">
                      {recipe.shortTitle}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 text-[9px] text-white/90 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{recipe.totalTime}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-white/90 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                        <Play className="h-2.5 w-2.5 fill-current" />
                        <span>{recipe.videoDuration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoRecipesSection;
