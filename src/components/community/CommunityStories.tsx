import React, { useState, useEffect } from "react";
import { Plus, X, Heart, Sparkles, ChevronRight, ChevronLeft, Film } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getViewedStoryIds, markStoryAsViewed } from "@/services/communityService";

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

const SAMPLE_STORIES: StoryItem[] = [];

const STORIES_STORAGE_KEY = "babybites_community_stories_v2";

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
      return [];
    } catch {
      return [];
    }
  });

  const [viewedStoryIds, setViewedStoryIds] = useState<string[]>(() => getViewedStoryIds());
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

  // Listen to viewed story events
  useEffect(() => {
    const handleStoryViewed = () => {
      setViewedStoryIds(getViewedStoryIds());
    };
    window.addEventListener("babygram:story_viewed", handleStoryViewed);
    return () => window.removeEventListener("babygram:story_viewed", handleStoryViewed);
  }, []);

  const rawStories = allStories.length > 0 ? allStories : SAMPLE_STORIES;

  // Requirement 4: Unviewed stories appear FIRST, viewed stories pass to the LAST
  const visibleStories = [...rawStories].sort((a, b) => {
    const aViewed = viewedStoryIds.includes(a.id);
    const bViewed = viewedStoryIds.includes(b.id);
    if (!aViewed && bViewed) return -1;
    if (aViewed && !bViewed) return 1;
    return 0;
  });

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
            const nextIdx = activeStoryIdx + 1;
            const nextStory = visibleStories[nextIdx];
            if (nextStory) {
              markStoryAsViewed(nextStory.id);
              setViewedStoryIds((v) => (v.includes(nextStory.id) ? v : [...v, nextStory.id]));
            }
            setActiveStoryIdx(nextIdx);
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
  }, [activeStoryIdx, visibleStories]);

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
          {visibleStories.map((story, idx) => {
            const isViewed = viewedStoryIds.includes(story.id);

            return (
              <button
                key={story.id}
                onClick={() => {
                  setActiveStoryIdx(idx);
                  setProgress(0);
                  markStoryAsViewed(story.id);
                  setViewedStoryIds((v) => (v.includes(story.id) ? v : [...v, story.id]));
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                {/* 
                  Requirement 4: 
                  - Unviewed: Vibrant Instagram colorful gradient ring
                  - Viewed: Subtle gray ring, no red/colorful border 
                */}
                <div
                  className={`w-16 h-16 rounded-full group-hover:scale-105 transition-all relative ${
                    isViewed
                      ? "p-[2px] bg-stone-300 dark:bg-stone-700 shadow-none opacity-85"
                      : "p-[2.5px] bg-gradient-to-tr from-[#F59E0B] via-[#E1306C] to-[#833AB4] shadow-xs"
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-white dark:bg-stone-900 p-0.5">
                    <img
                      src={story.avatar}
                      alt={story.author_name}
                      className={`w-full h-full rounded-full object-cover ${
                        isViewed ? "grayscale-[15%]" : ""
                      }`}
                    />
                  </div>
                  {story.media_type === "video" && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center text-[8px] border border-white">
                      <Film className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <span
                  className={`text-[11px] max-w-[68px] truncate text-center ${
                    isViewed
                      ? "text-stone-400 dark:text-stone-500 font-normal"
                      : "text-gray-800 dark:text-stone-200 font-semibold"
                  }`}
                >
                  {story.baby_name || story.author_name.split(" ")[0]}
                </span>
              </button>
            );
          })}
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
                      const prevIdx = activeStoryIdx - 1;
                      setActiveStoryIdx(prevIdx);
                      setProgress(0);
                    }
                  }}
                />
                <div
                  className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
                  onClick={() => {
                    if (activeStoryIdx < visibleStories.length - 1) {
                      const nextIdx = activeStoryIdx + 1;
                      const nextStory = visibleStories[nextIdx];
                      if (nextStory) {
                        markStoryAsViewed(nextStory.id);
                        setViewedStoryIds((v) => (v.includes(nextStory.id) ? v : [...v, nextStory.id]));
                      }
                      setActiveStoryIdx(nextIdx);
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
