import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Snowflake, Trophy, ShieldCheck, ArrowRight, Sparkles, Check, Calendar } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

interface StreakDisplayProps {
  variant?: "compact" | "full" | "home-banner";
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ variant = "compact" }) => {
  const { streak } = useGamification();
  const [modalOpen, setModalOpen] = useState(false);

  const currentStreak = streak?.current_streak || 1;
  const freezesAvailable = streak?.streak_freezes_available !== undefined ? streak.streak_freezes_available : 1;
  const totalPoints = streak?.total_points || 100;

  // Days of current week representation
  const daysOfWeek = [
    { label: "M", full: "Mon", active: true },
    { label: "T", full: "Tue", active: true },
    { label: "W", full: "Wed", active: true },
    { label: "T", full: "Thu", active: currentStreak >= 4 },
    { label: "F", full: "Fri", active: currentStreak >= 5 },
    { label: "S", full: "Sat", active: currentStreak >= 6 },
    { label: "S", full: "Sun", active: currentStreak >= 7 },
  ];

  if (variant === "home-banner") {
    return (
      <>
        <div 
          onClick={() => setModalOpen(true)}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-emerald-500/5 border border-amber-500/20 dark:border-amber-500/30 shadow-xs cursor-pointer hover:border-amber-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Flame className="w-6 h-6 fill-white text-white drop-shadow-xs" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
                    {currentStreak} Day{currentStreak > 1 ? "s" : ""} Feeding Streak
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    <Snowflake className="w-3 h-3 text-sky-500" />
                    <span>{freezesAvailable} Freezes</span>
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Consistent healthy feeding habits for your baby • Tap to view streak vault
                </p>
              </div>
            </div>

            <Link 
              to="/leaderboard"
              onClick={(e) => e.stopPropagation()}
              className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 hover:text-emerald-600 transition-colors shrink-0 shadow-2xs"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Leaderboard</span>
              <ArrowRight className="w-3 h-3 text-stone-400" />
            </Link>
          </div>
        </div>

        {/* Modal Dialog */}
        <StreakModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          currentStreak={currentStreak}
          freezesAvailable={freezesAvailable}
          totalPoints={totalPoints}
          daysOfWeek={daysOfWeek}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-white dark:bg-stone-800/90 border border-amber-200 dark:border-amber-900/60 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all shadow-xs text-xs font-semibold cursor-pointer shrink-0"
        title="View Daily Streak & Freeze Protection"
      >
        <span className="text-xs sm:text-sm animate-bounce">🔥</span>
        <span className="font-bold text-orange-600 dark:text-orange-400 text-xs sm:text-[13px]">
          {currentStreak}
        </span>
        {freezesAvailable > 0 && (
          <span className="flex items-center text-[10px] sm:text-[11px] text-cyan-600 dark:text-cyan-400 ml-0.5" title={`${freezesAvailable} Streak Freezes ready`}>
            <Snowflake className="w-3 h-3 text-cyan-500 shrink-0" />
            <span className="hidden xs:inline font-bold">{freezesAvailable}</span>
          </span>
        )}
      </button>

      {/* Modal Dialog */}
      <StreakModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        currentStreak={currentStreak}
        freezesAvailable={freezesAvailable}
        totalPoints={totalPoints}
        daysOfWeek={daysOfWeek}
      />
    </>
  );
};

interface StreakModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStreak: number;
  freezesAvailable: number;
  totalPoints: number;
  daysOfWeek: Array<{ label: string; full: string; active: boolean }>;
}

const StreakModal: React.FC<StreakModalProps> = ({
  open,
  onOpenChange,
  currentStreak,
  freezesAvailable,
  totalPoints,
  daysOfWeek,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md w-full rounded-[30px] p-0 overflow-hidden bg-white dark:bg-[#161c18] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-2xl">
        {/* Banner with Glowing Flame */}
        <div className="p-6 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white text-center relative overflow-hidden">
          <div className="absolute top-2 left-4 text-2xl opacity-30">✨</div>
          <div className="absolute top-4 right-4 text-xl opacity-30">🔥</div>

          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/40 mb-2">
            <Flame className="w-10 h-10 text-white fill-white animate-pulse" />
          </div>

          <h2 className="font-serif text-3xl font-extrabold tracking-tight text-white mt-1">
            {currentStreak} Day Streak!
          </h2>
          <p className="text-xs text-white/90 mt-1 max-w-xs mx-auto">
            You're building lifelong healthy feeding habits for your little one. Log in every day to keep your flame alive!
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Days of week tracker */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-2 text-center">
              This Week's Feeding Habit:
            </span>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {daysOfWeek.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    d.active 
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs"
                      : "bg-stone-200/80 dark:bg-stone-700/60 text-stone-400"
                  }`}>
                    {d.active ? <Check className="w-4 h-4 stroke-[3]" /> : d.label}
                  </div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Freeze Vault */}
          <div className="p-4 rounded-2xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/70">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-900 dark:text-cyan-300">
                <Snowflake className="w-4 h-4 text-cyan-500" />
                <span>Streak Freeze Vault ({freezesAvailable}/3 Max)</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200">
                {freezesAvailable > 0 ? "Protected" : "No Freezes"}
              </span>
            </div>

            <p className="text-xs text-cyan-800 dark:text-cyan-300/90 leading-relaxed mb-3">
              Streak Freezes preserve your hard-earned streak for up to 3 days if you are busy, traveling, or miss entering the app!
            </p>

            {/* 3 Freeze Slots */}
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((slotIndex) => {
                const isEquipped = slotIndex < freezesAvailable;
                return (
                  <div
                    key={slotIndex}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isEquipped
                        ? "bg-white dark:bg-cyan-900/60 border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 shadow-2xs"
                        : "bg-transparent border-dashed border-cyan-300/60 text-cyan-400/60"
                    }`}
                  >
                    <span className="text-xl block mb-0.5">{isEquipped ? "❄️" : "⚪"}</span>
                    <span className="text-[10px] font-bold block">
                      {isEquipped ? "Freeze Active" : "Empty Slot"}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-cyan-700 dark:text-cyan-400 mt-2.5 text-center">
              💡 <strong>How to earn Freezes:</strong> Unlock any new Achievement Badge to gain +1 Streak Freeze!
            </p>
          </div>

          {/* Action to Leaderboard */}
          <div className="space-y-2 pt-1">
            <Link to="/leaderboard" onClick={() => onOpenChange(false)}>
              <Button className="w-full rounded-2xl bg-[#1E5E3A] hover:bg-[#16472c] text-white font-bold text-xs h-11 gap-2 shadow-xs cursor-pointer">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>View Weekly Mothers Leaderboard & Prizes</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-2xl text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 h-9 cursor-pointer"
            >
              Keep Streak Alive Today! 🔥
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StreakDisplay;
