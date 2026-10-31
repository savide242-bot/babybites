import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Image as ImageIcon, Video, X, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import { StoryItem } from "./CommunityStories";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (newStory: StoryItem) => void;
}

const MILESTONE_STICKERS = [
  "🥦 1st BLW Bite",
  "🥑 Loved Avocado",
  "🎉 Celebrated 6 Months!",
  "✨ BabyBites Recipe",
  "🍓 New Fruit Day",
  "🥣 Finished The Whole Bowl!",
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
}) => {
  const [caption, setCaption] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "image");

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishStory = () => {
    if (!mediaPreview) {
      toast.error("Please take a photo or select an image/video from your gallery!");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullCaption = selectedSticker ? `${selectedSticker} — ${caption}` : caption;
      const newStory: StoryItem = {
        id: "my-story-" + Date.now(),
        author_name: "You (Mom)",
        baby_name: "My Baby",
        baby_age: "7m",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        story_image: mediaPreview,
        media_type: mediaType,
        caption: fullCaption || "Delicious weaning moment shared on BabyBites! 👶✨",
        time_ago: "Just now",
      };

      onStoryCreated(newStory);
      toast.success("Story posted for 24 hours! 🌟");
      setMediaPreview(null);
      setCaption("");
      setSelectedSticker(null);
      onClose();
    } catch (e) {
      toast.error("Could not post story.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full rounded-[28px] p-5 bg-white dark:bg-[#161c18] border border-[#EBE8DF] dark:border-stone-800 text-stone-900 dark:text-stone-100">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-forest flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#48B774]" />
            <span>Add to Story (24h)</span>
          </DialogTitle>
        </DialogHeader>

        {/* Hidden File Inputs */}
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*,video/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="space-y-4 pt-2">
          {/* Media Preview or Picker */}
          {mediaPreview ? (
            <div className="relative rounded-2xl overflow-hidden aspect-[9/14] bg-stone-900 flex items-center justify-center">
              {mediaType === "video" ? (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Story preview"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Floating Sticker badge overlay if chosen */}
              {selectedSticker && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-forest shadow-lg">
                  {selectedSticker}
                </div>
              )}

              <button
                onClick={() => setMediaPreview(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#E3DFD3] rounded-2xl p-6 text-center space-y-3 bg-[#FAF9F5]">
              <div className="w-12 h-12 rounded-full bg-[#EAF5EF] text-[#1E5E3A] flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Share your baby's meal or funny face</p>
                <p className="text-xs text-gray-500 mt-0.5">Take a quick picture, record a short clip, or pick from your gallery</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="rounded-xl bg-[#1E5E3A] hover:bg-[#16472c] text-white text-xs h-12 flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Camera / Video</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border-[#E3DFD3] text-gray-700 text-xs h-12 flex items-center justify-center gap-1.5 hover:bg-[#EAF5EF]/40"
                >
                  <ImageIcon className="w-4 h-4 text-[#1E5E3A]" />
                  <span>Gallery</span>
                </Button>
              </div>
            </div>
          )}

          {/* Milestone Stickers */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Choose a Milestone Tag (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MILESTONE_STICKERS.map((sticker) => (
                <button
                  key={sticker}
                  type="button"
                  onClick={() =>
                    setSelectedSticker(selectedSticker === sticker ? null : sticker)
                  }
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                    selectedSticker === sticker
                      ? "bg-[#1E5E3A] text-white shadow-xs"
                      : "bg-[#FAF9F5] text-gray-700 border border-[#EBE8DF] hover:bg-stone-100"
                  }`}
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Story Caption
            </label>
            <Textarea
              placeholder="Write a sweet caption about this moment..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="rounded-xl border-[#E3DFD3] text-xs"
            />
          </div>

          <Button
            onClick={handlePublishStory}
            disabled={isSubmitting || !mediaPreview}
            className="w-full rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white font-semibold py-3 shadow-md"
          >
            {isSubmitting ? "Publishing..." : "Publish Story (24 Hours) 🌟"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryModal;
