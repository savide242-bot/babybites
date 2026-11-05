import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Sparkles, Trophy, CheckCircle2, Star, Bookmark, ArrowRight, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { Badge, BADGES } from "@/hooks/useGamification";

export const BadgeCelebrationModal: React.FC = () => {
  const [badge, setBadge] = useState<Badge | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleBadgeUnlocked = (e: CustomEvent<Badge>) => {
      if (e.detail) {
        setBadge(e.detail);
        setIsOpen(true);

        // Fire celebratory colorful confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#48B774', '#FFB800', '#FF6B6B', '#38BDF8', '#A855F7'],
          });
        } catch (err) {
          // Ignore
        }
      }
    };

    window.addEventListener("babybites_badge_unlocked" as any, handleBadgeUnlocked);
    return () => {
      window.removeEventListener("babybites_badge_unlocked" as any, handleBadgeUnlocked);
    };
  }, []);

  if (!badge) return null;

  const handlePinToProfile = () => {
    try {
      const raw = localStorage.getItem("babybites_pinned_badges_v1");
      const current: string[] = raw ? JSON.parse(raw) : [];
      if (!current.includes(badge.id)) {
        const updated = [...current, badge.id];
        localStorage.setItem("babybites_pinned_badges_v1", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("babybites_pinned_badges_updated", { detail: updated }));
      }
    } catch {
      // Ignore
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-sm sm:max-w-md w-full rounded-[32px] p-0 overflow-hidden bg-white dark:bg-[#161c18] border-2 border-emerald-500/30 text-stone-900 dark:text-stone-100 shadow-2xl">
        {/* Glow Header */}
        <div className="bg-gradient-to-br from-[#1E5E3A] via-[#2F7E50] to-[#55B37B] p-6 text-center text-white relative overflow-hidden">
          {/* Subtle animated sparkles background */}
          <div className="absolute top-2 left-3 opacity-30 text-2xl">✨</div>
          <div className="absolute top-4 right-4 opacity-30 text-xl">🌟</div>
          <div className="absolute bottom-2 left-6 opacity-30 text-lg">🥑</div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Achievement Unlocked!</span>
          </div>

          {/* Large Medal Icon with pulse */}
          <div className="relative mx-auto w-24 h-24 mb-2 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-white/20 blur-md animate-pulse" />
            <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center text-4xl shadow-xl border-2 border-white/60`}>
              {badge.icon}
            </div>
          </div>

          <h2 className="font-serif text-2xl font-extrabold tracking-tight text-white mt-1">
            {badge.name}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <UIBadge className="bg-amber-400 text-stone-900 font-bold text-[10px] px-2 py-0 border-none">
              ★ {badge.tier} Tier
            </UIBadge>
            <UIBadge variant="outline" className="text-white/90 border-white/40 text-[10px] px-2 py-0">
              {badge.category}
            </UIBadge>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 text-center leading-relaxed">
            {badge.description}
          </p>

          {/* Criterion & Reward Box */}
          <div className="rounded-2xl p-3.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-stone-900 dark:text-stone-100 block">Milestone Criterion:</span>
                <span className="text-stone-600 dark:text-stone-300">{badge.criterion}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-stone-900 dark:text-stone-100 block">Bonus Unlocked:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{badge.reward}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <Button
              onClick={handlePinToProfile}
              className="w-full rounded-2xl bg-[#1E5E3A] hover:bg-[#16472c] text-white font-bold text-xs h-11 gap-2 shadow-sm cursor-pointer"
            >
              <Bookmark className="w-4 h-4" />
              <span>Showcase on My Public Profile</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="w-full rounded-2xl text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 h-9 cursor-pointer"
            >
              Awesome, Keep Exploring! ✨
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeCelebrationModal;
