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
        return `🏆 I just earned the "${achievement.title}" badge on BabyBites! Taking care of my baby's nutrition with love! 💕 #BabyBites #BabyNutrition`;
      case 'streak':
        return `🔥 I'm on a ${achievement.value} day streak on BabyBites! Consistency is key for healthy nutrition! 💪 #BabyBites #DedicatedMom`;
      case 'points':
        return `⭐ I've earned ${achievement.value} points on BabyBites! My baby's nutrition journey is going great! 🌟 #BabyBites`;
      case 'challenge':
        return `🎯 I completed the "${achievement.title}" challenge on BabyBites! Another step in the healthy eating journey! 🎉 #BabyBites`;
      default:
        return `I'm using BabyBites to take care of my baby's nutrition! 💕 #BabyBites`;
    }
  };

  const shareText = getShareText();

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toast.success("Opening Twitter/X...");
  };

  const shareToFacebook = () => {
    // Facebook share without URL - just the quote
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toast.success("Opening Facebook...");
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    toast.success("Opening WhatsApp...");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My BabyBites Achievement!',
          text: shareText,
        });
        toast.success("Shared successfully!");
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
            Share Achievement
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
              Share
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
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareAchievementModal;
