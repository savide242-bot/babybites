import React, { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, ArrowLeft, ArrowRight, Camera, 
  MapPin, Image as ImageIcon, Smartphone
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

const SUGGESTED_LOCATIONS = [
  "Home Kitchen",
  "Nursery",
  "High Chair Corner",
  "Family Dining Table",
  "Garden Picnic",
  "Grandma's House",
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
  // Step 1: Media selector, Step 2: Post Details
  const [step, setStep] = useState<"media" | "details">("media");
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<"image" | "video">("image");
  const [selectedItemTitle, setSelectedItemTitle] = useState<string>("");

  // Details fields
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [audioTrack, setAudioTrack] = useState<string | null>(null);
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

  const handleShare = async () => {
    if (!selectedMediaUrl && !caption.trim()) {
      toast.error("Please select a photo/video or write a caption.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const newPostId = "post-" + Date.now();
      const finalTitle = caption.slice(0, 40) || selectedItemTitle || "BabyBites Moment";
      
      const newPostObj = {
        id: newPostId,
        user_id: session?.user?.id || currentUser.id,
        author_name: currentUser.name,
        author_baby: currentUser.baby || "Mom of Baby",
        author_avatar: currentUser.avatar,
        title: finalTitle,
        content: caption || selectedItemTitle || "Sharing our latest weaning milestone with the community! ✨",
        media_type: selectedMediaType,
        media_url: selectedMediaUrl || undefined,
        image_urls: selectedMediaUrl && selectedMediaType === "image" ? [selectedMediaUrl] : [],
        video_url: selectedMediaUrl && selectedMediaType === "video" ? selectedMediaUrl : undefined,
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
            content: newPostObj.content,
            topic: "BLW & Weaning",
            image_urls: newPostObj.image_urls,
            video_url: newPostObj.video_url || null,
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
      toast.success("Post shared with the BabyBites Community! 🎉");
      
      // Reset
      setStep("media");
      setSelectedMediaUrl(null);
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

  const handleClose = () => {
    setSelectedMediaUrl(null);
    setCaption("");
    setLocation(null);
    setStep("media");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm sm:max-w-md w-full p-0 overflow-hidden bg-stone-950 text-white border-0 rounded-[32px] shadow-2xl h-[88vh] max-h-[820px] flex flex-col justify-between">
        {/* Real Device Native File Pickers */}
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

        {/* ================= STEP 1: Media Selection ================= */}
        {step === "media" && (
          <div className="flex-1 flex flex-col justify-between bg-black text-white h-full overflow-hidden">
            {/* Top Bar */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between z-10 shrink-0 border-b border-stone-800">
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-stone-900/90 flex items-center justify-center hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <h3 className="text-sm font-bold text-white tracking-wide">
                New Post
              </h3>

              <div className="w-9" />
            </div>

            {/* Main Selection Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 overflow-y-auto">
              {selectedMediaUrl ? (
                /* Selected Media Preview */
                <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                  <div className="relative w-full max-h-[50vh] rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 flex items-center justify-center shadow-lg">
                    {selectedMediaType === "video" ? (
                      <video
                        src={selectedMediaUrl}
                        controls
                        playsInline
                        className="w-full max-h-[48vh] object-contain"
                      />
                    ) : (
                      <img
                        src={selectedMediaUrl}
                        alt="Preview"
                        className="w-full max-h-[48vh] object-contain"
                      />
                    )}
                  </div>

                  {/* Change Media Buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-sky-400" />
                      <span>Choose Different File</span>
                    </button>
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Retake with Camera</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Device Picker Prompt */
                <div className="w-full max-w-xs text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 via-sky-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                    <Smartphone className="w-10 h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-lg font-bold text-white">
                      Select from Your Phone
                    </h4>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Choose a photo or video directly from your device gallery to share with other moms.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-2xl bg-gradient-to-r from-[#1E5E3A] to-[#2e7d32] hover:from-[#184e30] hover:to-[#256d29] text-white font-bold h-12 flex items-center justify-center gap-2.5 shadow-lg active:scale-98 transition-all"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span>Open Phone Gallery</span>
                    </Button>

                    <Button
                      onClick={() => cameraInputRef.current?.click()}
                      variant="outline"
                      className="w-full rounded-2xl border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-200 font-semibold h-12 flex items-center justify-center gap-2.5 active:scale-98 transition-all"
                    >
                      <Camera className="w-5 h-5 text-emerald-400" />
                      <span>Take Photo or Record Video</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="shrink-0 px-4 py-3 bg-stone-950 border-t border-stone-900 flex items-center justify-between">
              <span className="text-xs text-stone-400">
                {selectedMediaUrl ? "Media selected" : "Select a photo or video"}
              </span>

              <Button
                onClick={() => {
                  if (!selectedMediaUrl) {
                    fileInputRef.current?.click();
                  } else {
                    setStep("details");
                  }
                }}
                disabled={!selectedMediaUrl}
                className="rounded-full bg-[#0095F6] hover:bg-[#1877F2] disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold text-sm px-6 h-10 shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: Post Details ================= */}
        {step === "details" && (
          <div className="flex-1 flex flex-col justify-between bg-black text-white h-full overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-stone-900 shrink-0">
              <button
                onClick={() => setStep("media")}
                className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center hover:bg-stone-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-base font-bold text-white tracking-wide">
                New Post
              </h2>
              <div className="w-9" />
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
              {/* Media Thumbnail + Caption Input */}
              <div className="flex gap-3">
                {selectedMediaUrl && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-900 border border-stone-800 shrink-0 flex items-center justify-center">
                    {selectedMediaType === "video" ? (
                      <video
                        src={selectedMediaUrl}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={selectedMediaUrl}
                        alt="Media Preview"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <Textarea
                    placeholder="Write a caption... share how this meal went or give baby tips!"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full bg-transparent border-0 text-white placeholder:text-stone-500 resize-none text-sm p-0 focus-visible:ring-0 min-h-[72px]"
                  />
                </div>
              </div>

              {/* Location Picker */}
              <div className="pt-2 border-t border-stone-900">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-stone-300">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Add Location</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_LOCATIONS.map((loc) => {
                    const isSelected = location === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocation(isSelected ? null : loc)}
                        className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                          isSelected
                            ? "bg-[#0095F6] border-[#0095F6] text-white font-bold"
                            : "bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800"
                        }`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Bar: Publish Button */}
            <div className="shrink-0 p-4 border-t border-stone-900 bg-stone-950 flex items-center justify-between">
              <button
                onClick={() => setStep("media")}
                className="text-xs text-stone-400 hover:text-white"
              >
                Back to photo
              </button>

              <Button
                onClick={handleShare}
                disabled={isSubmitting}
                className="rounded-full bg-[#0095F6] hover:bg-[#1877F2] text-white font-bold text-sm px-7 h-11 shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                {isSubmitting ? "Publishing..." : "Share Post"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
