import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, X, Sparkles } from "lucide-react";
import { useAdminPreviewRedirect } from "@/hooks/useAdminPreviewRedirect";
import { motion, AnimatePresence } from "framer-motion";

export const AdminPreviewBanner = () => {
  const { showBanner, previewUrl, loading } = useAdminPreviewRedirect();
  const [dismissed, setDismissed] = useState(false);

  if (loading || !showBanner || dismissed) {
    return null;
  }

  const handleGoToPreview = () => {
    window.location.href = previewUrl;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-lg"
      >
        <div className="container px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="font-medium">
              Admin: You're on the published version
            </span>
            <span className="hidden sm:inline text-white/80">
              — Click to see latest changes instantly
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleGoToPreview}
              className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs h-7"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Preview
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
