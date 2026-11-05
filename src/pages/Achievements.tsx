import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGamification, BADGES, Badge } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Star, Flame, Target, Lock, 
  ArrowLeft, Share2, Check, Pin, PinOff, Sparkles, Award, ShieldCheck, Heart
} from "lucide-react";
import ShareAchievementModal from "@/components/ShareAchievementModal";
import { motion, AnimatePresence } from "framer-motion";

export const Achievements = () => {
  const { 
    streak, 
    badges, 
    pinnedBadges,
    togglePinBadge,
    isBadgePinned,
    isLoading 
  } = useGamification();

  const [activeFilter, setActiveFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState<{
    type: 'badge' | 'streak' | 'points' | 'challenge';
    title: string;
    value?: number | string;
    icon?: string;
  } | null>(null);

  const earnedBadgeIds = useMemo(() => badges.map(b => b.badge_id), [badges]);
  const unlockedBadges = useMemo(() => BADGES.filter(b => earnedBadgeIds.includes(b.id)), [earnedBadgeIds]);
  const lockedBadges = useMemo(() => BADGES.filter(b => !earnedBadgeIds.includes(b.id)), [earnedBadgeIds]);

  const displayedBadges = useMemo(() => {
    let list = BADGES;
    if (activeFilter === "unlocked") list = unlockedBadges;
    if (activeFilter === "locked") list = lockedBadges;

    if (selectedCategory !== "all") {
      list = list.filter(b => b.category === selectedCategory);
    }
    return list;
  }, [activeFilter, selectedCategory, unlockedBadges, lockedBadges]);

  const featuredPinnedBadges = useMemo(() => {
    return BADGES.filter(b => pinnedBadges.includes(b.id) && earnedBadgeIds.includes(b.id));
  }, [pinnedBadges, earnedBadgeIds]);

  const handleShare = (title: string, icon: string) => {
    setShareData({
      type: 'badge',
      title: `Conquista: ${title}`,
      icon: icon
    });
    setShareOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0f1411] p-4 flex items-center justify-center">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-[#1E5E3A]/30 border-t-[#1E5E3A] rounded-full animate-spin mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0f1411] text-stone-900 dark:text-stone-100 pb-28 pt-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5 text-stone-600 dark:text-stone-300">
            <Link to="/profile">
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Perfil</span>
            </Link>
          </Button>
          <UiBadge variant="outline" className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 px-3 py-1 font-bold">
            🏆 {unlockedBadges.length} de {BADGES.length} Conquistadas
          </UiBadge>
        </div>

        {/* Hero Trophy Banner */}
        <div className="rounded-[32px] bg-gradient-to-br from-[#1E5E3A] via-[#2F7E50] to-[#1E5E3A] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Conquistas da Mãe
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Galeria de Medalhas
              </h1>
              <p className="text-emerald-100/90 text-sm mt-1 max-w-sm leading-relaxed">
                Celebre cada passo do desenvolvimento do seu bebê. Você escolhe quais medalhas deseja exibir no seu perfil público!
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-300/30 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0">
              🏆
            </div>
          </div>

          {/* Quick Progress */}
          <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100 font-semibold">
            <span>Progresso Total</span>
            <span>{Math.round((unlockedBadges.length / BADGES.length) * 100)}% concluído</span>
          </div>
          <Progress 
            value={(unlockedBadges.length / BADGES.length) * 100} 
            className="h-2 bg-white/20 mt-1.5 rounded-full" 
          />
        </div>

        {/* Featured Pinned Showcase Banner */}
        <div className="bg-white dark:bg-[#161c18] border border-black/[0.06] dark:border-white/[0.08] rounded-[28px] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Pin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                  Medalhas no seu Perfil Público ({featuredPinnedBadges.length}/4)
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Visíveis para outras mães na comunidade quando visitam o seu perfil.
                </p>
              </div>
            </div>
          </div>

          {featuredPinnedBadges.length === 0 ? (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/50 border border-dashed border-stone-300 dark:border-stone-700 text-center text-xs text-stone-500">
              Você ainda não fixou nenhuma medalha. Toque no botão <strong>"Exibir no Perfil"</strong> em qualquer conquista desbloqueada abaixo!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {featuredPinnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="rounded-2xl p-3 bg-gradient-to-b from-amber-50/50 to-orange-50/30 dark:from-stone-900 dark:to-stone-900/80 border border-amber-500/30 text-center flex flex-col items-center justify-between relative group shadow-xs"
                >
                  <button
                    onClick={() => togglePinBadge(badge.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-red-500 flex items-center justify-center shadow-xs"
                    title="Remover do perfil público"
                  >
                    <PinOff className="w-3 h-3" />
                  </button>
                  <div className="text-3xl my-1 group-hover:scale-110 transition-transform">
                    {badge.icon}
                  </div>
                  <p className="text-xs font-bold text-stone-800 dark:text-stone-200 line-clamp-1">
                    {badge.name}
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    ✓ No Perfil
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#161c18] p-1 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === "all"
                  ? "bg-[#1E5E3A] text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              Todas ({BADGES.length})
            </button>
            <button
              onClick={() => setActiveFilter("unlocked")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === "unlocked"
                  ? "bg-[#1E5E3A] text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              Conquistadas ({unlockedBadges.length})
            </button>
            <button
              onClick={() => setActiveFilter("locked")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === "locked"
                  ? "bg-[#1E5E3A] text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              Bloqueadas ({lockedBadges.length})
            </button>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <AnimatePresence mode="popLayout">
            {displayedBadges.map((badge) => {
              const isUnlocked = earnedBadgeIds.includes(badge.id);
              const isPinned = isBadgePinned(badge.id);
              const earnedRecord = badges.find(b => b.badge_id === badge.id);

              return (
                <motion.div
                  key={badge.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`rounded-[26px] overflow-hidden border transition-all ${
                    isUnlocked
                      ? "bg-white dark:bg-[#161c18] border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:shadow-md"
                      : "bg-stone-50/70 dark:bg-[#141916]/60 border-black/[0.04] dark:border-white/[0.04] opacity-75"
                  }`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-3.5">
                        {/* Emblem Icon */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-xs border relative ${
                          isUnlocked
                            ? `bg-gradient-to-br ${badge.gradient} text-white border-white/20`
                            : "bg-stone-200 dark:bg-stone-800 text-stone-400 border-stone-300 dark:border-stone-700 grayscale"
                        }`}>
                          {badge.icon}
                          {!isUnlocked && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-stone-700 text-white flex items-center justify-center text-[10px] shadow-sm">
                              <Lock className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        {/* Text info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#1E5E3A] dark:text-emerald-300">
                              {badge.category}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                              {badge.tier}
                            </span>
                          </div>

                          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 truncate">
                            {badge.name}
                          </h3>
                          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mt-1">
                            {badge.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions / Status */}
                      <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-2">
                        {isUnlocked ? (
                          <>
                            {/* Pin to Profile Toggle Button */}
                            <Button
                              size="sm"
                              variant={isPinned ? "default" : "outline"}
                              onClick={() => togglePinBadge(badge.id)}
                              className={`rounded-full text-xs h-8 px-3 gap-1.5 transition-all ${
                                isPinned
                                  ? "bg-[#1E5E3A] hover:bg-[#16472c] text-white shadow-xs"
                                  : "border-emerald-600/30 text-[#1E5E3A] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              }`}
                            >
                              <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-white" : ""}`} />
                              <span>{isPinned ? "No Perfil ✓" : "Exibir no Perfil"}</span>
                            </Button>

                            {/* Share button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleShare(badge.name, badge.icon)}
                              className="w-8 h-8 rounded-full text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                              title="Compartilhar conquista"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
                            <Target className="w-3.5 h-3.5 text-stone-400" />
                            <span>Meta: {badge.requirement}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Share Modal */}
      {shareData && (
        <ShareAchievementModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          achievement={shareData}
        />
      )}
    </div>
  );
};

export default Achievements;
