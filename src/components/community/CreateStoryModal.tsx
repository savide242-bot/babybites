import React, { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Camera, Settings, ChevronDown, Check, Music, Sparkles, 
  Smile, Type, Users, X, ArrowRight, Play, Film, Star,
  Compass, Layers
} from "lucide-react";
import { toast } from "sonner";
import { StoryItem } from "./CommunityStories";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (newStory: StoryItem) => void;
  currentUserAvatar?: string;
  currentUserName?: string;
}

// Sample recent media items for gallery selector (Image 1)
const RECENT_MEDIA_ITEMS = [
  {
    id: "rec-1",
    type: "video" as const,
    duration: "0:19",
    thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    title: "Iron Rich lentil puree",
  },
  {
    id: "rec-2",
    type: "video" as const,
    duration: "0:25",
    thumbnail: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80",
    url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
    title: "BLW Avocado & banana morning",
  },
  {
    id: "rec-3",
    type: "image" as const,
    duration: "",
    thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80",
    url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
    title: "Fresh fruits platter",
  },
  {
    id: "rec-4",
    type: "image" as const,
    duration: "",
    thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    title: "Oat pancakes",
  },
  {
    id: "rec-5",
    type: "video" as const,
    duration: "0:15",
    thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    title: "Steamed broccoli finger food",
  },
];

const SUGGESTED_AUDIO = "Kendrick Lamar, SZA - All The Stars";

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
  currentUserAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  currentUserName = "Loving Mom",
}) => {
  // Step 1 = Gallery Selector (Image 1), Step 2 = Story Editor (Image 2)
  const [step, setStep] = useState<"gallery" | "editor">("gallery");
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [activeAudio, setActiveAudio] = useState<string | null>(SUGGESTED_AUDIO);
  const [activeEffect, setActiveEffect] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDeviceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith("video/");
    setSelectedMediaType(isVid ? "video" : "image");

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedMediaUrl(event.target?.result as string);
      setStep("editor");
    };
    reader.readAsDataURL(file);
  };

  const handleSelectRecent = (item: typeof RECENT_MEDIA_ITEMS[0]) => {
    setSelectedMediaUrl(item.url);
    setSelectedMediaType(item.type);
    setStep("editor");
  };

  const handleOpenDeviceCamera = () => {
    cameraInputRef.current?.click();
  };

  const handlePublish = (target: "everyone" | "close_friends" = "everyone") => {
    if (!selectedMediaUrl) {
      toast.error("Please select a photo or video for your story.");
      return;
    }

    const newStory: StoryItem = {
      id: "my-story-" + Date.now(),
      author_name: currentUserName,
      baby_name: "Baby",
      baby_age: "8m",
      avatar: currentUserAvatar,
      story_image: selectedMediaUrl,
      media_type: selectedMediaType,
      caption: caption || (target === "close_friends" ? "⭐ Close Friends Only" : "Baby weaning story ✨"),
      time_ago: "Just now",
    };

    onStoryCreated(newStory);
    toast.success(target === "close_friends" ? "Shared with Close Friends! ⭐" : "Story published to your profile! 🌟");
    
    // Reset and close
    setStep("gallery");
    setSelectedMediaUrl(null);
    setCaption("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm sm:max-w-md w-full p-0 overflow-hidden bg-black text-white border-0 rounded-[32px] shadow-2xl h-[88vh] max-h-[820px] flex flex-col justify-between">
        {/* Hidden Device Inputs */}
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleDeviceUpload}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*,video/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleDeviceUpload}
          className="hidden"
        />

        {/* STEP 1: Add to Story - Gallery Selector (Image 1) */}
        {step === "gallery" && (
          <div className="flex-1 flex flex-col justify-between bg-black text-white h-full overflow-hidden">
            {/* Top Bar: X, Add to story, Settings gear */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between z-10 shrink-0">
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-stone-900/80 flex items-center justify-center hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-base font-bold text-white tracking-wide">
                Add to story
              </h2>
              <button className="w-9 h-9 rounded-full bg-stone-900/80 flex items-center justify-center hover:bg-stone-800 transition-colors">
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Sticker / Feature Buttons Carousel (Image 1 top pills) */}
            <div className="px-4 py-2 overflow-x-auto no-scrollbar flex items-center gap-2.5 shrink-0">
              <button 
                onClick={() => toast.info("Add Yours sticker will be active on your story.")}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-stone-900 border border-stone-800 hover:bg-stone-800 transition-colors text-xs font-semibold shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <span>Add Yours</span>
              </button>

              <button 
                onClick={() => {
                  setActiveEffect(activeEffect ? null : "vintage");
                  toast.success("Effects filter ready.");
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-stone-900 border border-stone-800 hover:bg-stone-800 transition-colors text-xs font-semibold shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <span>Effects</span>
              </button>

              <button 
                onClick={() => toast.info(`Current audio: ${activeAudio}`)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-stone-900 border border-stone-800 hover:bg-stone-800 transition-colors text-xs font-semibold shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Music className="w-3 h-3 text-purple-400" />
                </div>
                <span>Music</span>
              </button>

              <button 
                onClick={() => toast.info("Collab sticker enabled.")}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-stone-900 border border-stone-800 hover:bg-stone-800 transition-colors text-xs font-semibold shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smile className="w-3 h-3 text-emerald-400" />
                </div>
                <span>Collab</span>
              </button>
            </div>

            {/* Recents Dropdown & Select Button */}
            <div className="px-4 py-2 flex items-center justify-between shrink-0">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-stone-300"
              >
                <span>Recents</span>
                <ChevronDown className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-xs font-semibold hover:bg-stone-800"
              >
                <Layers className="w-3.5 h-3.5 text-stone-300" />
                <span>Upload File</span>
              </button>
            </div>

            {/* Gallery Media Grid (3 Columns) with Live Camera */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4 grid grid-cols-3 gap-1.5">
              {/* Tile 1: Live Camera Tile */}
              <button
                onClick={handleOpenDeviceCamera}
                className="aspect-[4/5] rounded-xl bg-stone-900 border border-stone-800 flex flex-col items-center justify-center gap-2 hover:bg-stone-800 transition-colors group relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-full bg-stone-800 group-hover:scale-110 transition-transform flex items-center justify-center border border-stone-700">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-stone-300">Camera</span>
              </button>

              {/* Gallery Items */}
              {RECENT_MEDIA_ITEMS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectRecent(item)}
                  className="aspect-[4/5] rounded-xl overflow-hidden bg-stone-900 relative cursor-pointer group border border-stone-800/80"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Duration Tag if Video */}
                  {item.type === "video" && item.duration && (
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-white backdrop-blur-xs flex items-center gap-1">
                      {item.duration}
                    </span>
                  )}
                </div>
              ))}

              {/* Extra device gallery trigger tile */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[4/5] rounded-xl bg-stone-900/60 border border-dashed border-stone-700 flex flex-col items-center justify-center gap-2 text-stone-400 hover:text-white hover:border-stone-500 transition-colors"
              >
                <Film className="w-6 h-6 text-stone-500" />
                <span className="text-[11px] font-medium text-center px-2">Browse All Photos</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Story Editor / Preview (Image 2) */}
        {step === "editor" && selectedMediaUrl && (
          <div className="flex-1 flex flex-col justify-between bg-black text-white h-full relative overflow-hidden">
            {/* Background Media */}
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              {selectedMediaType === "video" ? (
                <video
                  src={selectedMediaUrl}
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={selectedMediaUrl}
                  alt="Story preview"
                  className="w-full h-full object-contain"
                />
              )}
              {/* Optional Subtle Overlay Effect */}
              {activeEffect && (
                <div className="absolute inset-0 bg-amber-500/10 pointer-events-none mix-blend-overlay" />
              )}
            </div>

            {/* Top Toolbar (Image 2: X, Suggested audio pill, Aa, Stickers, Music, Sparkles, More) */}
            <div className="relative z-20 px-3 pt-3 flex items-center justify-between gap-2">
              <button
                onClick={() => setStep("gallery")}
                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Suggested Audio Pill */}
              {activeAudio && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-medium max-w-[180px]">
                  <Music className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />
                  <span className="truncate text-[11px]">{activeAudio}</span>
                  <button 
                    onClick={() => setActiveAudio(null)}
                    className="ml-1 hover:text-stone-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Action Icons: Aa, Stickers, Music, Sparkles, Down Chevron */}
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10">
                <button
                  type="button"
                  onClick={() => toast.info("Text tool ready. Tap caption to type.")}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Text"
                >
                  <Type className="w-4 h-4 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Stickers tray opened.")}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Stickers"
                >
                  <Smile className="w-4 h-4 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const musicTrack = activeAudio ? null : SUGGESTED_AUDIO;
                    setActiveAudio(musicTrack);
                    toast.info(musicTrack ? "Audio added 🎵" : "Audio removed");
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Music"
                >
                  <Music className="w-4 h-4 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveEffect(activeEffect ? null : "glow");
                    toast.success("Effects toggled ✨");
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Effects"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("More story options")}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="More"
                >
                  <ChevronDown className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Bottom Toolbar (Image 2: Add a caption, Your story, Close Friends, Blue arrow) */}
            <div className="relative z-20 px-3 pb-4 pt-2 space-y-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              {/* Caption Input */}
              <div className="w-full">
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full px-4 py-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white placeholder-white/70 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>

              {/* Action Buttons: "Your story", "Close Friends", "Next ->" */}
              <div className="flex items-center justify-between gap-2">
                {/* 1-tap "Your story" with user avatar */}
                <button
                  onClick={() => handlePublish("everyone")}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-xs font-semibold transition-transform active:scale-95 shrink-0"
                >
                  <img
                    src={currentUserAvatar}
                    alt={currentUserName}
                    className="w-5 h-5 rounded-full object-cover border border-white/50"
                  />
                  <span>Your story</span>
                </button>

                {/* "Close Friends" Button */}
                <button
                  onClick={() => handlePublish("close_friends")}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#10b981]/20 hover:bg-[#10b981]/30 backdrop-blur-md border border-[#10b981]/40 text-emerald-300 text-xs font-semibold transition-transform active:scale-95 shrink-0"
                >
                  <div className="w-4 h-4 rounded-full bg-[#10b981] flex items-center justify-center text-white">
                    <Star className="w-2.5 h-2.5 fill-white" />
                  </div>
                  <span>Close Friends</span>
                </button>

                {/* Blue Circular Next Button (->) */}
                <button
                  onClick={() => handlePublish("everyone")}
                  className="w-10 h-10 rounded-full bg-[#0095F6] hover:bg-[#1877F2] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0"
                  title="Share Story"
                >
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryModal;
