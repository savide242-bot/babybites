import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge as UIBadge } from "@/components/ui/badge";
import { ShieldCheck, Star, Trophy, CheckCircle2, Bookmark, Lock, Sparkles, X } from "lucide-react";
import { Badge, BADGES } from "@/hooks/useGamification";

export const openBadgeDetail = (badgeIdOrBadge: string | Badge) => {
  let targetBadge: Badge | undefined;
  if (typeof badgeIdOrBadge === "string") {
    targetBadge = BADGES.find((b) => b.id === badgeIdOrBadge);
  } else {
    targetBadge = badgeIdOrBadge;
  }

  if (targetBadge) {
    window.dispatchEvent(new CustomEvent("babybites_badge_detail", { detail: targetBadge }));
  }
};

export const BadgeDetailModal: React.FC = () => {
  const [badge, setBadge] = useState<Badge | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const handleDetail = (e: CustomEvent<Badge>) => {
      if (e.detail) {
        setBadge(e.detail);
        setIsOpen(true);

        // Check if unlocked / pinned in local storage
        try {
          const rawPinned = localStorage.getItem("babybites_pinned_badges_v1");
          const pinnedList: string[] = rawPinned ? JSON.parse(rawPinned) : [];
          setIsPinned(pinnedList.includes(e.detail.id));
        } catch {
          setIsPinned(false);
        }
      }
    };

    window.addEventListener("babybites_badge_detail" as any, handleDetail);
    return () => {
      window.removeEventListener("babybites_badge_detail" as any, handleDetail);
    };
  }, []);

  if (!badge) return null;

  const handleTogglePin = () => {
    try {
      const raw = localStorage.getItem("babybites_pinned_badges_v1");
      let current: string[] = raw ? JSON.parse(raw) : [];
      let nextPinned: string[];
      if (current.includes(badge.id)) {
        nextPinned = current.filter(id => id !== badge.id);
        setIsPinned(false);
      } else {
        nextPinned = [...current, badge.id];
        setIsPinned(true);
      }
      localStorage.setItem("babybites_pinned_badges_v1", JSON.stringify(nextPinned));
      window.dispatchEvent(new CustomEvent("babybites_pinned_badges_updated", { detail: nextPinned }));
    } catch {
      // Ignore
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-sm sm:max-w-md w-full rounded-[30px] p-0 overflow-hidden bg-white dark:bg-[#161c18] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-2xl">
        {/* Header with Badge Graphic */}
        <div className={`p-6 bg-gradient-to-br ${badge.gradient} text-white text-center relative overflow-hidden`}>
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-lg border border-white/40 mb-2">
            {badge.icon}
          </div>

          <h2 className="font-serif text-2xl font-bold tracking-tight text-white mt-1">
            {badge.name}
          </h2>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/25 text-white border border-white/30">
              ★ {badge.tier} Tier
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/20 text-white/90">
              {badge.category}
            </span>
          </div>
        </div>

        {/* Content details */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed text-center">
            {badge.description}
          </p>

          {/* Criterion Box - Exactly what user requested */}
          <div className="rounded-2xl p-4 bg-[#FAF9F5] dark:bg-stone-800/60 border border-[#EBE8DF] dark:border-stone-700/60 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block mb-0.5">
                  Criterion to Earn This Medal:
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {badge.criterion}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2.5 border-t border-stone-200/80 dark:border-stone-700/60">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block mb-0.5">
                  Bonus Reward:
                </span>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold leading-relaxed">
                  {badge.reward}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={handleTogglePin}
              variant={isPinned ? "outline" : "default"}
              className={`flex-1 rounded-2xl text-xs font-bold h-10 gap-1.5 cursor-pointer ${
                isPinned 
                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950" 
                  : "bg-[#1E5E3A] hover:bg-[#16472c] text-white"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isPinned ? "Pinned on Profile ✓" : "Pin to My Profile"}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="rounded-2xl text-xs font-semibold h-10 border-stone-200 dark:border-stone-700 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeDetailModal;
