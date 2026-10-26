import React, { useState, useEffect } from "react";
import { Plus, X, Heart, Sparkles, ChevronRight, ChevronLeft, Film } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface StoryItem {
  id: string;
  author_name: string;
  baby_name: string;
  baby_age: string;
  avatar: string;
  story_image: string;
  media_type?: "image" | "video";
  caption: string;
  time_ago: string;
}

const DEFAULT_STORIES: StoryItem[] = [
  {
    id: "story-1",
    author_name: "Sarah Jenkins",
    baby_name: "Noah",
    baby_age: "7m",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    story_image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    caption: "Noah experimentou brócolos cozidos no vapor hoje! Vejam só esta carinha curiosa 🥦💚",
    time_ago: "2h atrás",
  },
  {
    id: "story-2",
    author_name: "Emily Rodriguez",
    baby_name: "Maya",
    baby_age: "11m",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    story_image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
    caption: "Fornada de biscoitos de banana e aveia pronta para congelar! 🍌✨",
    time_ago: "4h atrás",
  },
  {
    id: "story-3",
    author_name: "Jessica Taylor",
    baby_name: "Leo",
    baby_age: "6m",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    story_image: "https://images.unsplash.com/photo-1505253758473-96b3015f21c9?auto=format&fit=crop&w=800&q=80",
    caption: "1º dia de puré de batata doce. Ele engoliu 3 colheres cheias sem cuspir! 🎉",
    time_ago: "5h atrás",
  },
  {
    id: "story-4",
    author_name: "Amanda Brooks",
    baby_name: "Oliver",
    baby_age: "10m",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    story_image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80",
    caption: "Mãozinhas sujas = barriga feliz. Puré de abacate na testa inteira 🥑😂",
    time_ago: "7h atrás",
  },
  {
    id: "story-5",
    author_name: "Elena Gomez",
    baby_name: "Sofia",
    baby_age: "14m",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    story_image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    caption: "Mini fatia de pizza integral para almoço de toddler! Comeu tudo 🍕",
    time_ago: "9h atrás",
  },
];

const STORIES_STORAGE_KEY = "babybites_community_stories_v1";

interface CommunityStoriesProps {
  onAddStoryClick: () => void;
  customStories?: StoryItem[];
  onAuthorClick?: (authorName: string) => void;
}

export const CommunityStories: React.FC<CommunityStoriesProps> = ({
  onAddStoryClick,
  customStories = [],
  onAuthorClick,
}) => {
  const [allStories, setAllStories] = useState<StoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_STORIES;
    } catch {
      return DEFAULT_STORIES;
    }
  });

  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Sync custom stories if passed
  useEffect(() => {
    if (customStories.length > 0) {
      setAllStories((prev) => {
        const merged = [...customStories, ...prev.filter((p) => !customStories.some((c) => c.id === p.id))];
        try {
          localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(merged));
        } catch (e) {
          console.error(e);
        }
        return merged;
      });
    }
  }, [customStories]);

  // Auto-progress stories
  useEffect(() => {
    if (activeStoryIdx === null) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIdx < allStories.length - 1) {
            setActiveStoryIdx((idx) => (idx !== null ? idx + 1 : null));
            return 0;
          } else {
            setActiveStoryIdx(null);
            return 0;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIdx, allStories.length]);

  const currentStory = activeStoryIdx !== null ? allStories[activeStoryIdx] : null;

  return (
    <>
      {/* Horizontal Stories Carousel */}
      <div className="w-full max-w-full overflow-hidden mb-6">
        <div className="flex items-center gap-3.5 overflow-x-auto pb-2 no-scrollbar w-full max-w-full min-w-0 px-0.5">
          {/* Add My Story Button */}
          <button
            onClick={onAddStoryClick}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
          >
            <div className="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-stone-200 to-stone-300 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center border-2 border-white shadow-xs">
                <div className="w-7 h-7 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-gray-700 max-w-[68px] truncate">
              Seu Story
            </span>
          </button>

          {/* Fellow Moms Stories */}
          {allStories.map((story, idx) => (
            <button
              key={story.id}
              onClick={() => {
                setActiveStoryIdx(idx);
                setProgress(0);
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            >
              {/* Instagram-style botanical gradient ring */}
              <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#1E5E3A] via-[#48B774] to-[#F3A847] shadow-xs group-hover:scale-105 transition-transform relative">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <img
                    src={story.avatar}
                    alt={story.author_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                {story.media_type === "video" && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center text-[8px] border border-white">
                    <Film className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-gray-700 max-w-[68px] truncate text-center">
                {story.baby_name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Full-Screen Instagram Story Viewer Modal */}
      {currentStory && (
        <Dialog open={activeStoryIdx !== null} onOpenChange={() => setActiveStoryIdx(null)}>
          <DialogContent className="max-w-sm sm:max-w-md p-0 overflow-hidden bg-black text-white border-0 rounded-[28px] shadow-2xl">
            <div className="relative w-full aspect-[9/16] bg-black flex flex-col justify-between">
              {/* Top Progress Bars */}
              <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1">
                {allStories.map((s, i) => (
                  <div key={s.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-100"
                      style={{
                        width:
                          i < (activeStoryIdx || 0)
                            ? "100%"
                            : i === activeStoryIdx
                            ? `${progress}%`
                            : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Story Header (Author & Baby) */}
              <div className="absolute top-7 left-3 right-3 z-30 flex items-center justify-between">
                <div
                  className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => {
                    if (onAuthorClick) {
                      setActiveStoryIdx(null);
                      onAuthorClick(currentStory.author_name);
                    }
                  }}
                >
                  <img
                    src={currentStory.avatar}
                    alt={currentStory.author_name}
                    className="w-9 h-9 rounded-full object-cover border border-white/60"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white">
                        {currentStory.author_name}
                      </span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white/90 font-medium">
                        {currentStory.baby_name} • {currentStory.baby_age}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/70">{currentStory.time_ago}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStoryIdx(null)}
                  className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Story Main Media (Photo or Video) */}
              <div className="w-full h-full relative">
                {currentStory.media_type === "video" ? (
                  <video
                    src={currentStory.story_image}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={currentStory.story_image}
                    alt={currentStory.caption}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />
              </div>

              {/* Story Navigation Tap Zones */}
              <div
                className="absolute inset-y-16 left-0 w-1/3 z-20 cursor-pointer"
                onClick={() => {
                  if (activeStoryIdx !== null && activeStoryIdx > 0) {
                    setActiveStoryIdx(activeStoryIdx - 1);
                    setProgress(0);
                  }
                }}
              />
              <div
                className="absolute inset-y-16 right-0 w-1/3 z-20 cursor-pointer"
                onClick={() => {
                  if (activeStoryIdx !== null && activeStoryIdx < allStories.length - 1) {
                    setActiveStoryIdx(activeStoryIdx + 1);
                    setProgress(0);
                  } else {
                    setActiveStoryIdx(null);
                  }
                }}
              />

              {/* Story Caption at Bottom */}
              <div className="absolute bottom-4 left-4 right-4 z-30">
                <p className="text-sm font-medium text-white/95 drop-shadow-md leading-relaxed">
                  {currentStory.caption}
                </p>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/20">
                  <span className="text-xs text-white/80">Enviar carinho:</span>
                  <div className="flex gap-2 text-lg">
                    <span>❤️</span>
                    <span>👏</span>
                    <span>🥰</span>
                    <span>🥦</span>
                    <span>🥑</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CommunityStories;
