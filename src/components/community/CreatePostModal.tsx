import React, { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, ArrowLeft, ArrowRight, Music, Camera, ChevronDown, Check,
  Volume2, Sliders, Type, Layers, Sparkles, MapPin, Tag, BarChart2,
  HelpCircle, Film, Image as ImageIcon, Plus, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { COMMUNITY_LOCAL_POSTS_KEY } from "@/services/communityService";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
  currentUser?: {
    id: string;
    name: string;
    baby?: string;
    avatar?: string;
  };
}

const SAMPLE_GALLERY = [
  {
    id: "gal-1",
    type: "video" as const,
    duration: "0:19",
    thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    title: "Iron Rich lentil puree (5 month old)",
  },
  {
    id: "gal-2",
    type: "video" as const,
    duration: "0:25",
    thumbnail: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80",
    url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
    title: "BLW Avocado & banana breakfast",
  },
  {
    id: "gal-3",
    type: "image" as const,
    duration: "",
    thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80",
    url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
    title: "Fresh steamed carrot sticks & dip",
  },
  {
    id: "gal-4",
    type: "image" as const,
    duration: "",
    thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    title: "Mini blueberry oat finger pancakes",
  },
  {
    id: "gal-5",
    type: "video" as const,
    duration: "0:12",
    thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    title: "Baby tasting broccoli for the first time",
  },
];

const SUGGESTED_LOCATIONS = [
  "Matola",
  "Maputo-Moçambique-Africa",
  "Maputo",
  "Polana Cimento",
  "Costa do Sol",
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  currentUser = {
    id: "guest",
    name: "Loving Mom",
    baby: "Mom of Baby",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
}) => {
  // Step 1: Media selector (Image 3), Step 2: Post Details (Image 4)
  const [step, setStep] = useState<"media" | "details">("media");
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>(SAMPLE_GALLERY[0].url);
  const [selectedMediaType, setSelectedMediaType] = useState<"image" | "video">("video");
  const [selectedItemTitle, setSelectedItemTitle] = useState<string>(SAMPLE_GALLERY[0].title);

  // Details fields (Image 4)
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
  const [audioTrack, setAudioTrack] = useState<string | null>("Boy • Tested, Audio");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDeviceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith("video/");
    setSelectedMediaType(isVid ? "video" : "image");
    setSelectedItemTitle(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedMediaUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectRecent = (item: typeof SAMPLE_GALLERY[0]) => {
    setSelectedMediaUrl(item.url);
    setSelectedMediaType(item.type);
    setSelectedItemTitle(item.title);
  };

  const handleShare = async () => {
    if (!caption.trim() && !selectedItemTitle) {
      toast.error("Please add a caption to share your post.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const newPostId = "post-" + Date.now();
      const finalTitle = caption.slice(0, 40) || selectedItemTitle || "Baby Feeding Moment";
      
      const newPostObj = {
        id: newPostId,
        user_id: session?.user?.id || currentUser.id,
        author_name: currentUser.name,
        author_baby: currentUser.baby || "Mom of Baby",
        author_avatar: currentUser.avatar,
        title: finalTitle,
        content: caption || selectedItemTitle,
        media_type: selectedMediaType,
        media_url: selectedMediaUrl,
        image_urls: selectedMediaType === "image" ? [selectedMediaUrl] : [],
        video_url: selectedMediaType === "video" ? selectedMediaUrl : undefined,
        topic: "🥦 BLW & Weaning",
        age_tag: "6-8 Months",
        location: location || undefined,
        audio_track: audioTrack || undefined,
        likes_count: 1,
        comments_count: 0,
        views_count: 1,
        created_at: new Date().toISOString(),
        verified: true,
      };

      // 1. Save in Supabase
      if (session?.user) {
        try {
          await supabase.from("forum_posts").insert({
            user_id: session.user.id,
            author_name: currentUser.name,
            author_baby: currentUser.baby,
            title: finalTitle,
            content: caption || selectedItemTitle,
            topic: "BLW & Weaning",
            image_urls: selectedMediaType === "image" ? [selectedMediaUrl] : [],
            video_url: selectedMediaType === "video" ? selectedMediaUrl : null,
            status: "published",
          });
        } catch (err) {
          console.warn("Could not save to Supabase directly, persisting locally:", err);
        }
      }

      // 2. Persist in local storage
      try {
        const saved = localStorage.getItem(COMMUNITY_LOCAL_POSTS_KEY);
        const existing = saved ? JSON.parse(saved) : [];
        localStorage.setItem(
          COMMUNITY_LOCAL_POSTS_KEY,
          JSON.stringify([newPostObj, ...existing])
        );
      } catch (e) {
        console.error(e);
      }

      onPostCreated(newPostObj);
      toast.success("Post shared with the BabyGram community! 🎉");
      
      // Reset
      setStep("media");
      setCaption("");
      setLocation(null);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Could not publish post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm sm:max-w-md w-full p-0 overflow-hidden bg-black text-white border-0 rounded-[32px] shadow-2xl h-[88vh] max-h-[820px] flex flex-col justify-between">
        {/* Hidden File Inputs */}
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

        {/* ================= STEP 1: Media Selection (Image 3) ================= */}
        {step === "media" && (
          <div className="flex-1 flex flex-col justify-between bg-black text-white h-full overflow-hidden">
            {/* Top Bar: X, Suggested audio pill, Close */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between z-10 shrink-0">
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-stone-900/80 flex items-center justify-center hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Audio Pill in Header */}
              {audioTrack && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-xs max-w-[200px]">
                  <Music className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />
                  <span className="truncate text-[11px] font-medium">{audioTrack}</span>
                </div>
              )}

              <div className="w-9" />
            </div>

            {/* Recents dropdown & Select button */}
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
                <span>Select from Phone</span>
              </button>
            </div>

            {/* Media Grid: Camera + Thumbnails (Image 3) */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 grid grid-cols-3 gap-1.5 pb-2">
              {/* Tile 1: Live Camera */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="aspect-[4/5] rounded-xl bg-stone-900 border border-stone-800 flex flex-col items-center justify-center gap-2 hover:bg-stone-800 transition-colors group relative overflow-hidden"
              >
                <div className="w-11 h-11 rounded-full bg-stone-800 group-hover:scale-110 transition-transform flex items-center justify-center border border-stone-700">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="text-[11px] font-medium text-stone-300">Camera</span>
              </button>

              {/* Gallery Items */}
              {SAMPLE_GALLERY.map((item) => {
                const isSelected = selectedMediaUrl === item.url;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectRecent(item)}
                    className={`aspect-[4/5] rounded-xl overflow-hidden bg-stone-900 relative cursor-pointer group border transition-all ${
                      isSelected
                        ? "border-[#0095F6] ring-2 ring-[#0095F6]/40"
                        : "border-stone-800/80"
                    }`}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0095F6] flex items-center justify-center text-white shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    {item.type === "video" && item.duration && (
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-white backdrop-blur-xs">
                        {item.duration}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Row (Image 3: Audio, Text, Overlay, Filter, Edit, Ratio) */}
            <div className="shrink-0 px-3 py-2 border-t border-stone-800/80 bg-stone-950 flex items-center justify-around text-stone-400">
              <button 
                onClick={() => toast.info("Audio tool active")}
                className="flex flex-col items-center gap-1 text-[10px] hover:text-white"
              >
                <Music className="w-4 h-4" />
                <span>Audio</span>
              </button>
              <button 
                onClick={() => toast.info("Text tool ready")}
                className="flex flex-col items-center gap-1 text-[10px] hover:text-white"
              >
                <Type className="w-4 h-4" />
                <span>Text</span>
              </button>
              <button 
                onClick={() => toast.info("Overlay mode enabled")}
                className="flex flex-col items-center gap-1 text-[10px] hover:text-white"
              >
                <Layers className="w-4 h-4" />
                <span>Overlay</span>
              </button>
              <button 
                onClick={() => toast.info("Filters ready")}
                className="flex flex-col items-center gap-1 text-[10px] hover:text-white"
              >
                <Sparkles className="w-4 h-4" />
                <span>Filter</span>
              </button>
              <button 
                onClick={() => toast.info("Editing tool ready")}
                className="flex flex-col items-center gap-1 text-[10px] hover:text-white"
              >
                <Sliders className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>

            {/* Bottom Navigation Strip: Preview Thumbnail + Next Button (Image 3) */}
            <div className="shrink-0 px-4 py-3 bg-black border-t border-stone-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedMediaUrl && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-stone-700 bg-stone-900">
                    <img src={selectedMediaUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Blue Next Button (Image 3: Next ->) */}
              <Button
                onClick={() => setStep("details")}
                className="rounded-full bg-[#0095F6] hover:bg-[#1877F2] text-white font-bold text-sm px-6 h-10 shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: Post Details (Image 4) ================= */}
        {step === "details" && (
          <div className="flex-1 flex flex-col justify-between bg-black text-white h-full overflow-hidden">
            {/* Header: <- Back, "New post" */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-stone-900 shrink-0">
              <button
                onClick={() => setStep("media")}
                className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center hover:bg-stone-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-base font-bold text-white tracking-wide">
                New post
              </h2>
              <div className="w-9" />
            </div>

            {/* Scrollable details form */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
              {/* Media Preview & Caption Textarea (Image 4 top section) */}
              <div className="flex gap-3 items-start">
                {/* Media Thumbnail */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-900 shrink-0 border border-stone-800 relative">
                  {selectedMediaType === "video" ? (
                    <video src={selectedMediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={selectedMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  {selectedMediaType === "video" && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-bold text-white">
                      Video
                    </span>
                  )}
                </div>

                {/* Caption Input */}
                <div className="flex-1 min-w-0">
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    rows={3}
                    className="w-full bg-transparent border-0 text-white placeholder-stone-500 resize-none text-sm p-0 focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Quick Helper Chips (Image 4: Poll, Prompt) */}
              <div className="flex items-center gap-2 pt-1 border-b border-stone-900 pb-3">
                <button
                  type="button"
                  onClick={() => setCaption((c) => (c ? `${c}\n\n📊 Poll: Did your baby like this texture?` : "📊 Poll: Did your baby like this texture?"))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-xs font-semibold text-stone-300"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Poll</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCaption((c) => (c ? `${c}\n\n💬 Prompt: Share your baby's reaction below!` : "💬 Prompt: Share your baby's reaction below!"))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-xs font-semibold text-stone-300"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Prompt</span>
                </button>
              </div>

              {/* Options List (Image 4) */}
              <div className="space-y-3 divide-y divide-stone-900 text-sm">
                {/* 1. Add Audio */}
                <div className="pt-2">
                  <div className="flex items-center justify-between py-1 cursor-pointer hover:text-stone-300">
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 text-stone-400" />
                      <span className="font-medium text-stone-200">Add audio</span>
                    </div>
                    <span className="text-xs text-stone-500">›</span>
                  </div>
                  {audioTrack && (
                    <div className="mt-2 p-2 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center">
                          <Music className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-stone-300 truncate">{audioTrack}</span>
                      </div>
                      <button onClick={() => setAudioTrack(null)} className="text-stone-500 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Tag People */}
                <div 
                  onClick={() => toast.info("Tag mothers feature active")}
                  className="pt-3 flex items-center justify-between cursor-pointer hover:text-stone-300"
                >
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-stone-400" />
                    <span className="font-medium text-stone-200">Tag people</span>
                  </div>
                  <span className="text-xs text-stone-500">›</span>
                </div>

                {/* 3. Add Location (Image 4 with chips) */}
                <div className="pt-3 space-y-2">
                  <div className="flex items-center justify-between cursor-pointer hover:text-stone-300">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-stone-400" />
                      <span className="font-medium text-stone-200">
                        {location ? location : "Add location"}
                      </span>
                    </div>
                    <span className="text-xs text-stone-500">›</span>
                  </div>

                  {/* Quick Location Chips (Image 4: Matola, Maputo-Moçambique-Africa, Maputo...) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {SUGGESTED_LOCATIONS.map((loc) => {
                      const isSel = location === loc;
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setLocation(isSel ? null : loc)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                            isSel
                              ? "bg-[#0095F6] text-white"
                              : "bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800"
                          }`}
                        >
                          {loc}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-stone-500 leading-tight pt-1">
                    People you share this content with can see the location tags.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Button: Share (Image 4 prominent blue button) */}
            <div className="p-4 bg-black border-t border-stone-900 shrink-0">
              <Button
                onClick={handleShare}
                disabled={isSubmitting}
                className="w-full h-11 rounded-full bg-[#0095F6] hover:bg-[#1877F2] text-white font-bold text-sm shadow-xl transition-transform active:scale-98"
              >
                {isSubmitting ? "Sharing..." : "Share"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
