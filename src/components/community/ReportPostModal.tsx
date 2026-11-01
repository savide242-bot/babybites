import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Flag, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { reportPost } from "@/services/communityService";

interface ReportPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
    content: string;
    author_name: string;
    author_baby?: string;
    media_url?: string;
    media_type?: "image" | "video";
  } | null;
  reporterName?: string;
  reporterId?: string;
}

const REPORT_REASONS = [
  { id: "dangerous_advice", label: "Dangerous Feeding Advice (Choking/Allergy Risk)" },
  { id: "inappropriate", label: "Inappropriate or Offensive Content" },
  { id: "spam", label: "Spam, Scams, or Commercial Advertising" },
  { id: "harassment", label: "Harassment, Hate Speech, or Bullying" },
  { id: "misinformation", label: "False Information or Misleading Claims" },
  { id: "other", label: "Other Concern" },
];

export const ReportPostModal: React.FC<ReportPostModalProps> = ({
  isOpen,
  onClose,
  post,
  reporterName = "Anonymous Mom",
  reporterId = "guest",
}) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!post) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason for reporting this post.");
      return;
    }

    const reasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);
    const reasonText = reasonObj ? reasonObj.label : selectedReason;

    setIsSubmitting(true);
    try {
      await reportPost({
        post_id: post.id,
        post_title: post.title || post.content.slice(0, 50),
        post_author: post.author_name,
        post_author_baby: post.author_baby,
        post_media_url: post.media_url,
        post_media_type: post.media_type,
        reporter_name: reporterName,
        reporter_id: reporterId,
        reason: reasonText,
        details: details.trim() || undefined,
      });

      toast.success("Thank you! Your report was sent to the Admin moderation panel.");
      setSelectedReason("");
      setDetails("");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Could not submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full rounded-[28px] p-6 bg-white dark:bg-[#161c18] border border-[#EBE8DF] dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-2xl">
        <DialogHeader className="text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <DialogTitle className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
            Report Publication
          </DialogTitle>
          <DialogDescription className="text-stone-600 dark:text-stone-400 text-sm mt-1">
            Help us keep BabyGram safe and supportive for all mothers. Why are you reporting this post by <strong className="text-stone-900 dark:text-stone-200">{post.author_name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Reason options */}
          <div className="space-y-2">
            {REPORT_REASONS.map((r) => {
              const isSelected = selectedReason === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReason(r.id)}
                  className={`w-full text-left p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-semibold shadow-xs"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700"
                  }`}
                >
                  <span>{r.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Optional details */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
              Additional Details (Optional):
            </label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context for the admin team..."
              rows={3}
              className="resize-none rounded-xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-full border-stone-200 dark:border-stone-700 font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <Flag className="w-4 h-4 fill-white" />
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPostModal;
