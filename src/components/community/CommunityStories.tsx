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

const SAMPLE_STORIES: StoryItem[] = [
  {
    id: "story-1",
    author_name: "Sarah Jenkins",
    baby_name: "Noah",
    baby_age: "7m",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    story_image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    caption: "Golden sweet potato patties ready for lunch! Noah ate two all by himself 🍠✨",
    time_ago: "2h ago",
  },
  {
    id: "story-2",
    author_name: "Emily Rodriguez",
    baby_name: "Maya",
    baby_age: "11m",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    story_image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
    caption: "Batch of peanut butter & banana oat biscuits ready for the freezer! 🍌✨",
    time_ago: "4h ago",
  },
  {
    id: "story-3",
    author_name: "Clara Santos",
    baby_name: "Leo",
    baby_age: "9m",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    story_image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
    caption: "First avocado & steamed carrot morning bowl! He loves exploring textures 🥑🥕",
    time_ago: "6h ago",
  },
  {
    id: "story-4",
    author_name: "Jessica Miller",
    baby_name: "Oliver",
    baby_age: "14m",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    story_image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    caption: "Mini blueberry oat pancake stacks for Sunday breakfast! 🥞🫐",
    time_ago: "8h ago",
  },
];

const STORIES_STORAGE_KEY = "babybites_community_stories_v1";

interface CommunityStoriesProps {
  onAddStoryClick: () => void;
  customStories?: StoryItem[];
  followedMoms?: Record<string, boolean>;
  isAdminUser?: boolean;
  onAuthorClick?: (authorName: string) => void;
}

export const CommunityStories: React.FC<CommunityStoriesProps> = ({
  onAddStoryClick,
  customStories = [],
  followedMoms = {},
  isAdminUser = false,
  onAuthorClick,
}) => {
  const [allStories, setAllStories] = useState<StoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return SAMPLE_STORIES;
    } catch {
      return SAMPLE_STORIES;
    }
  });

  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Sync custom stories if published
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

  const visibleStories = allStories.length > 0 ? allStories : SAMPLE_STORIES;

  // Auto-progress stories
  useEffect(() => {
    if (activeStoryIdx === null) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIdx < visibleStories.length - 1) {
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
  }, [activeStoryIdx, visibleStories.length]);

  const currentStory = activeStoryIdx !== null ? visibleStories[activeStoryIdx] : null;

  return (
    <>
      {/* Horizontal Instagram Stories Carousel */}
      <div className="w-full max-w-full overflow-hidden mb-5">
        <div className="flex items-center gap-3.5 overflow-x-auto pb-2 no-scrollbar w-full max-w-full min-w-0 px-0.5">
          {/* Add My Story Button */}
          <button
            onClick={onAddStoryClick}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
          >
            <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-600 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-white dark:bg-stone-900 flex items-center justify-center border-2 border-white dark:border-stone-900 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-[#1E5E3A] dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-stone-300 max-w-[68px] truncate">
              Your Story
            </span>
          </button>

          {/* Followed / Community Stories */}
          {visibleStories.map((story, idx) => (
            <button
              key={story.id}
              onClick={() => {
                setActiveStoryIdx(idx);
                setProgress(0);
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            >
              {/* Instagram-style colorful gradient ring */}
              <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#F59E0B] via-[#E1306C] to-[#833AB4] shadow-xs group-hover:scale-105 transition-transform relative">
                <div className="w-full h-full rounded-full bg-white dark:bg-stone-900 p-0.5">
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
              <span className="text-[11px] font-medium text-gray-700 dark:text-stone-300 max-w-[68px] truncate text-center">
                {story.baby_name || story.author_name.split(" ")[0]}
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
                {visibleStories.map((s, i) => (
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
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setActiveStoryIdx(null);
                    onAuthorClick?.(currentStory.author_name);
                  }}
                >
                  <img
                    src={currentStory.avatar}
                    alt={currentStory.author_name}
                    className="w-8 h-8 rounded-full border border-white/50 object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold leading-tight drop-shadow-md">
                      {currentStory.author_name}
                    </p>
                    <p className="text-[10px] text-white/80 drop-shadow-xs">
                      {currentStory.baby_name} • {currentStory.baby_age} • {currentStory.time_ago}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStoryIdx(null)}
                  className="w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Story Image / Video */}
              <div className="w-full h-full flex items-center justify-center relative">
                {currentStory.media_type === "video" ? (
                  <video
                    src={currentStory.story_image}
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={currentStory.story_image}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Left/Right Tap Navigation */}
                <div
                  className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
                  onClick={() => {
                    if (activeStoryIdx > 0) {
                      setActiveStoryIdx(activeStoryIdx - 1);
                      setProgress(0);
                    }
                  }}
                />
                <div
                  className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
                  onClick={() => {
                    if (activeStoryIdx < visibleStories.length - 1) {
                      setActiveStoryIdx(activeStoryIdx + 1);
                      setProgress(0);
                    } else {
                      setActiveStoryIdx(null);
                    }
                  }}
                />
              </div>

              {/* Story Bottom Caption */}
              {currentStory.caption && (
                <div className="absolute bottom-4 left-3 right-3 z-30 p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-center">
                  <p className="text-xs text-white leading-relaxed">
                    {currentStory.caption}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CommunityStories;
