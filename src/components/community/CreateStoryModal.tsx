import React, { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Camera, Settings, ChevronDown, Check, Music, Sparkles, 
  Smile, Type, Users, X, ArrowRight, Play, Film, Star,
  Compass, Layers, Image as ImageIcon, Smartphone
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

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
  currentUserAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  currentUserName = "Loving Mom",
}) => {
  // Step 1 = Gallery Selector, Step 2 = Story Editor
  const [step, setStep] = useState<"gallery" | "editor">("gallery");
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");

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

  const handlePublishStory = () => {
    if (!selectedMediaUrl) {
      toast.error("Selecione uma foto ou vídeo para o story.");
      return;
    }

    const newStory: StoryItem = {
      id: "story-" + Date.now(),
      author_name: currentUserName,
      baby_name: "Baby",
      baby_age: "8m",
      avatar: currentUserAvatar,
      story_image: selectedMediaUrl,
      media_type: selectedMediaType,
      caption: caption || "Momento de hoje! 🥑",
      time_ago: "Agora",
    };

    onStoryCreated(newStory);
    toast.success("Story compartilhado com sucesso! ✨");
    setSelectedMediaUrl(null);
    setCaption("");
    setStep("gallery");
    onClose();
  };

  const handleClose = () => {
    setSelectedMediaUrl(null);
    setCaption("");
    setStep("gallery");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm sm:max-w-md w-full p-0 overflow-hidden bg-black text-white border-0 rounded-[32px] shadow-2xl h-[88vh] max-h-[820px] flex flex-col justify-between">
        {/* Device file inputs */}
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

        {/* STEP 1: Gallery / Camera Selector */}
        {step === "gallery" && (
          <div className="flex-1 flex flex-col justify-between bg-black text-white h-full overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-stone-800">
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center hover:bg-stone-800"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <h3 className="text-sm font-bold text-white">Criar Story</h3>
              <div className="w-9" />
            </div>

            {/* Selection Options */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Smartphone className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-white">
                  Selecione da sua Galeria
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Adicione uma foto ou vídeo recente do seu bebê para publicar no Story de 24 horas.
                </p>
              </div>

              <div className="w-full max-w-xs space-y-3 pt-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#1E5E3A] to-[#2e7d32] hover:from-[#184e30] text-white font-bold h-12 flex items-center justify-center gap-2.5 shadow-lg active:scale-98 transition-all"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>Galeria do Telefone</span>
                </Button>

                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  variant="outline"
                  className="w-full rounded-2xl border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-200 font-semibold h-12 flex items-center justify-center gap-2.5 active:scale-98 transition-all"
                >
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span>Tirar com a Câmera</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Story Editor */}
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
            </div>

            {/* Top Toolbar */}
            <div className="relative z-20 px-3 pt-3 flex items-center justify-between gap-2">
              <button
                onClick={() => setStep("gallery")}
                className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/60 border border-white/20 text-white">
                Pré-visualização
              </span>

              <div className="w-9" />
            </div>

            {/* Bottom Caption + Share */}
            <div className="relative z-20 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-3">
              <input
                type="text"
                placeholder="Adicione uma legenda rápida (opcional)..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-stone-400 focus:outline-none focus:border-white/50"
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep("gallery")}
                  className="text-xs text-stone-300 hover:text-white"
                >
                  Trocar foto
                </button>

                <Button
                  onClick={handlePublishStory}
                  className="rounded-full bg-gradient-to-r from-[#1E5E3A] to-[#2e7d32] text-white font-bold text-xs px-6 h-10 shadow-lg flex items-center gap-1.5"
                >
                  <span>Publicar Story</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryModal;
