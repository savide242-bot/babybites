import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share2, Twitter, Facebook, Copy, Check, MessageCircle } from "lucide-react";

interface ShareAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: {
    type: 'badge' | 'streak' | 'points' | 'challenge';
    title: string;
    value?: number | string;
    icon?: string;
  };
}

const ShareAchievementModal = ({ isOpen, onClose, achievement }: ShareAchievementModalProps) => {
  const [copied, setCopied] = useState(false);

  const getShareText = () => {
    switch (achievement.type) {
      case 'badge':
        return `🏆 Acabei de ganhar o badge "${achievement.title}" no BabyBites! Estou a cuidar da alimentação do meu bebé com amor! 💕 #BabyBites #BabyNutrition`;
      case 'streak':
        return `🔥 Estou com ${achievement.value} dias de streak no BabyBites! Consistência é a chave para uma alimentação saudável! 💪 #BabyBites #MãeDedicada`;
      case 'points':
        return `⭐ Já conquistei ${achievement.value} pontos no BabyBites! A jornada de nutrição do meu bebé está a correr super bem! 🌟 #BabyBites`;
      case 'challenge':
        return `🎯 Completei o desafio "${achievement.title}" no BabyBites! Mais um passo na jornada de alimentação saudável! 🎉 #BabyBites`;
      default:
        return `Estou a usar o BabyBites para cuidar da alimentação do meu bebé! 💕 #BabyBites`;
    }
  };

  const shareText = getShareText();
  const shareUrl = "https://babybites.app";

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toast.success("A abrir Twitter/X...");
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toast.success("A abrir Facebook...");
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
    window.open(url, '_blank');
    toast.success("A abrir WhatsApp...");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText + '\n\n' + shareUrl);
      setCopied(true);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Minha conquista no BabyBites!',
          text: shareText,
          url: shareUrl,
        });
        toast.success("Partilhado com sucesso!");
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Partilhar Conquista
          </DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="bg-gradient-to-br from-primary/10 to-mint/10 rounded-xl p-4 border border-primary/20">
          <div className="text-center space-y-2">
            {achievement.icon && (
              <span className="text-4xl">{achievement.icon}</span>
            )}
            <p className="font-semibold text-foreground">{achievement.title}</p>
            {achievement.value && (
              <p className="text-2xl font-bold text-primary">{achievement.value}</p>
            )}
          </div>
        </div>

        {/* Share Text Preview */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          {shareText}
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Native Share (mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <Button
              onClick={handleNativeShare}
              className="col-span-2 bg-gradient-to-r from-primary to-mint text-white"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Partilhar
            </Button>
          )}

          <Button
            onClick={shareToTwitter}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Twitter className="h-4 w-4" />
            Twitter/X
          </Button>

          <Button
            onClick={shareToFacebook}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Facebook className="h-4 w-4" />
            Facebook
          </Button>

          <Button
            onClick={shareToWhatsApp}
            variant="outline"
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>

          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareAchievementModal;
