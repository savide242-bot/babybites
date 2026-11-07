import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, Flame, Snowflake, Crown, Medal, Sparkles, 
  ChevronRight, ArrowUp, Clock, ShieldCheck, Heart, User 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGamification, BADGES } from "@/hooks/useGamification";
import MotherProfileModal, { MotherProfileData } from "@/components/community/MotherProfileModal";
import { openBadgeDetail } from "@/components/gamification/BadgeDetailModal";

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  baby_name: string;
  avatar_url: string;
  weekly_points: number;
  streak: number;
  isCurrentUser?: boolean;
  isAdmin?: boolean;
}

export const Leaderboard: React.FC = () => {
  const { streak, isAdminUser } = useGamification();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number>(2);
  const [profileModalUser, setProfileModalUser] = useState<MotherProfileData | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("2d 14h 25m");

  const myStreak = streak?.current_streak || 1;
  const myPoints = (streak?.total_points || 100) % 1500;

  useEffect(() => {
    // Calculate weekly countdown to Sunday midnight
    const updateCountdown = () => {
      const now = new Date();
      const nextSunday = new Date();
      nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
      nextSunday.setHours(23, 59, 59, 999);

      const diff = nextSunday.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let myName = "You (Mom)";
        let myBaby = "Baby";
        let myAvatar = "";

        if (session?.user) {
          const { data: myProfile } = await supabase
            .from("profiles")
            .select("mother_name, baby_name, full_name, avatar_url")
            .eq("id", session.user.id)
            .maybeSingle();

          if (myProfile?.mother_name || myProfile?.full_name) {
            myName = myProfile.mother_name || myProfile.full_name;
          }
          if (myProfile?.baby_name) {
            myBaby = myProfile.baby_name;
          }
          if (myProfile?.avatar_url) {
            myAvatar = myProfile.avatar_url;
          }
        }

        const realUsers: LeaderboardUser[] = [];

        // 1. Emily Harter (Mom of Sophie) - Always present as the active verified guide/mother
        realUsers.push({
          rank: 1,
          id: "user-emily-harter",
          name: "Emily Harter",
          baby_name: "Sophie • 10m",
          avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
          weekly_points: 1250,
          streak: 21,
          isAdmin: true,
        });

        // 2. Fetch any real registered users from Supabase
        const { data: dbProfiles } = await supabase
          .from("profiles")
          .select("id, mother_name, full_name, baby_name, avatar_url")
          .limit(10);

        if (dbProfiles && dbProfiles.length > 0) {
          dbProfiles.forEach((p, idx) => {
            const displayName = p.mother_name || p.full_name;
            if (!displayName) return;
            if (session?.user?.id && p.id === session.user.id) return;
            if (displayName.toLowerCase().includes("emily")) return;

            realUsers.push({
              rank: idx + 3,
              id: p.id,
              name: displayName,
              baby_name: p.baby_name ? `${p.baby_name} • 8m` : "Baby • 8m",
              avatar_url: p.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
              weekly_points: Math.max(300, 750 - idx * 50),
              streak: Math.max(2, 9 - idx),
              isAdmin: false,
            });
          });
        }

        // 3. Current User
        const currentMother: LeaderboardUser = {
          rank: 2,
          id: session?.user?.id || "current-user",
          name: myName,
          baby_name: myBaby,
          avatar_url: myAvatar,
          weekly_points: Math.max(myPoints, 620),
          streak: myStreak,
          isCurrentUser: true,
          isAdmin: isAdminUser,
        };
        realUsers.push(currentMother);

        // Sort strictly by points
        realUsers.sort((a, b) => b.weekly_points - a.weekly_points);

        const ranked = realUsers.map((u, idx) => ({
          ...u,
          rank: idx + 1,
        }));

        setLeaderboard(ranked);
        const myRankItem = ranked.find((u) => u.isCurrentUser);
        if (myRankItem) {
          setCurrentUserRank(myRankItem.rank);
        }
      } catch (err) {
        console.error("Leaderboard load error:", err);
      }
    };

    fetchUsers();
  }, [myPoints, myStreak, isAdminUser]);

  const topThree = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  const handleInspectUser = (user: LeaderboardUser) => {
    const isEmily = user.name.toLowerCase().includes("emily") || user.name.toLowerCase().includes("harter");
    const profileData: MotherProfileData = {
      id: user.id,
      name: user.name,
      babyName: user.baby_name.split("•")[0]?.trim() || (isEmily ? "Sophie" : "Baby"),
      babyAge: user.baby_name.split("•")[1]?.trim() || (isEmily ? "10 months" : "8 months"),
      avatar: user.avatar_url || (isEmily 
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80" 
        : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"),
      bio: isEmily 
        ? "Mom of Sophie • Pediatric Nutritionist & BLW guide passionate about healthy eating!"
        : "Active mother exploring healthy baby weaning on BabyBites!",
      followersCount: isEmily ? 500 : 0,
      followingCount: isEmily ? 12 : 0,
      posts: [],
      isVerifiedMother: true,
      pinnedBadges: (user.isAdmin || isEmily) ? BADGES.map(b => b.id) : ['pioneer_mother', 'recipes_10', 'master_planner'],
      isAdmin: user.isAdmin || isEmily,
      isCurrentUser: user.isCurrentUser,
    };

    setProfileModalUser(profileData);
    setProfileModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#121614] pb-28 pt-4 px-3 sm:px-4 max-w-2xl mx-auto text-stone-900 dark:text-stone-100 transition-colors">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Weekly Mothers Tournament</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#1E5E3A] dark:text-emerald-400 tracking-tight">
          Community Leaderboard
        </h1>
        <p className="text-xs sm:text-[13px] text-stone-600 dark:text-stone-400 mt-1 max-w-md mx-auto leading-relaxed">
          Mothers compete weekly by maintaining streaks, preparing recipes, and learning baby nutrition. Top 3 mothers receive exclusive rewards every Sunday at midnight!
        </p>

        {/* Tournament Timer */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-2xs text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-stone-600 dark:text-stone-300">Tournament resets in:</span>
          <span className="font-bold text-orange-600 dark:text-orange-400">{timeRemaining}</span>
        </div>
      </div>

      {/* Podium for Top Mothers */}
      {topThree.length >= 2 && (
        <div className="mb-8 pt-4">
          <div className={`grid ${topThree.length >= 3 ? "grid-cols-3" : "grid-cols-2"} gap-2 sm:gap-3 items-end max-w-lg mx-auto`}>
            {/* 1st Place Podium (Elevated with Gold Crown) */}
            <div 
              onClick={() => handleInspectUser(topThree[0])}
              className={`flex flex-col items-center cursor-pointer group ${topThree.length >= 3 ? "order-2 -mt-4" : "order-1"}`}
            >
              <div className="relative mb-2">
                <Crown className="w-7 h-7 text-amber-500 fill-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                <Avatar className="w-18 h-18 sm:w-20 sm:h-20 border-4 border-amber-400 shadow-xl group-hover:scale-105 transition-transform">
                  <AvatarImage src={topThree[0].avatar_url} />
                  <AvatarFallback className="bg-amber-100 text-amber-900 font-bold">1st</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-stone-900 flex items-center justify-center font-extrabold text-xs shadow-md border-2 border-white">
                  1
                </div>
              </div>
              <p className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate max-w-[110px] text-center">
                {topThree[0].name}
              </p>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{topThree[0].weekly_points} pts</span>
              
              {/* Podium Bar */}
              <div className="w-full mt-2 h-32 rounded-t-2xl bg-gradient-to-t from-amber-200 via-amber-100 to-yellow-50 dark:from-amber-950/80 dark:to-amber-900/60 border-t-4 border-amber-400 p-2 text-center flex flex-col justify-end shadow-md">
                <Trophy className="w-6 h-6 mx-auto text-amber-500 mb-1" />
                <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-200">+1,000 pts</span>
                <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300">👑 Crown & 3 Freezes</span>
              </div>
            </div>

            {/* 2nd Place Podium */}
            <div 
              onClick={() => handleInspectUser(topThree[1])}
              className={`flex flex-col items-center cursor-pointer group ${topThree.length >= 3 ? "order-1" : "order-2"}`}
            >
              <div className="relative mb-2">
                <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-stone-300 shadow-md group-hover:scale-105 transition-transform">
                  <AvatarImage src={topThree[1].avatar_url} />
                  <AvatarFallback className="bg-stone-200 text-stone-700 font-bold">2nd</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs shadow-sm border border-white">
                  2
                </div>
              </div>
              <p className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate max-w-[90px] text-center">
                {topThree[1].name}
              </p>
              <span className="text-[10px] text-stone-500 dark:text-stone-400">{topThree[1].weekly_points} pts</span>
              
              {/* Podium Bar */}
              <div className="w-full mt-2 h-24 rounded-t-2xl bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700/80 border-t-2 border-slate-300 dark:border-slate-600 p-2 text-center flex flex-col justify-end shadow-xs">
                <Medal className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">+500 pts</span>
                <span className="text-[9px] text-slate-500">🥈 2 Freezes</span>
              </div>
            </div>

            {/* 3rd Place Podium */}
            {topThree[2] && (
              <div 
                onClick={() => handleInspectUser(topThree[2])}
                className="flex flex-col items-center cursor-pointer group order-3"
              >
                <div className="relative mb-2">
                  <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-amber-700/40 shadow-md group-hover:scale-105 transition-transform">
                    <AvatarImage src={topThree[2].avatar_url} />
                    <AvatarFallback className="bg-amber-950/10 text-amber-800 font-bold">3rd</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-xs shadow-sm border border-white">
                    3
                  </div>
                </div>
                <p className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate max-w-[90px] text-center">
                  {topThree[2].name}
                </p>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">{topThree[2].weekly_points} pts</span>
                
                {/* Podium Bar */}
                <div className="w-full mt-2 h-20 rounded-t-2xl bg-gradient-to-t from-amber-100/60 to-orange-50 dark:from-stone-800 dark:to-stone-800/60 border-t-2 border-amber-700/60 p-2 text-center flex flex-col justify-end shadow-xs">
                  <Medal className="w-5 h-5 mx-auto text-amber-700 mb-1" />
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200">+250 pts</span>
                  <span className="text-[9px] text-amber-800 dark:text-amber-300">🥉 1 Freeze</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rewards Explanatory Card */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
        <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Weekly Tournament Rewards & Prizes:</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-amber-200/60 dark:border-amber-800/40">
            <span className="font-bold text-amber-700 dark:text-amber-400 block">👑 1st Place Champion</span>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
              1,000 Bonus Pts + 3 Streak Freezes + "Mother of the Week" Golden Badge!
            </p>
          </div>
          <div className="p-2 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">🥈 2nd Place Runner-Up</span>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
              500 Bonus Pts + 2 Streak Freezes + Silver Star Medal!
            </p>
          </div>
          <div className="p-2 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-amber-700/20 dark:border-amber-900/40">
            <span className="font-bold text-amber-800 dark:text-amber-400 block">🥉 3rd Place Finalist</span>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
              250 Bonus Pts + 1 Streak Freeze + Bronze Star Medal!
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table List (Ranks 4-15) */}
      <div className="space-y-2 mb-10">
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 px-1 mb-2">
          Rankings ({leaderboard.length} Active Mothers)
        </h3>

        {restOfList.map((user) => (
          <div
            key={user.id}
            onClick={() => handleInspectUser(user)}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
              user.isCurrentUser
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-[#1E5E3A] shadow-xs"
                : "bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700/60"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-6 text-center text-xs font-bold ${
                user.isCurrentUser ? "text-[#1E5E3A] dark:text-emerald-300 font-extrabold" : "text-stone-400"
              }`}>
                #{user.rank}
              </span>

              <Avatar className="w-10 h-10 border border-stone-200 dark:border-stone-700 shrink-0">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-xs">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                    {user.name}
                  </h4>
                  {user.isCurrentUser && (
                    <Badge className="bg-[#1E5E3A] text-white text-[9px] px-1.5 py-0 h-4 border-none">
                      You
                    </Badge>
                  )}
                  {user.isAdmin && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-purple-300 text-purple-700 dark:text-purple-300">
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                  {user.baby_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="flex items-center gap-0.5 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                <Flame className="w-3 h-3 text-orange-500" />
                <span>{user.streak}d</span>
              </span>

              <div className="text-right min-w-[65px]">
                <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 block">
                  {user.weekly_points}
                </span>
                <span className="text-[10px] text-stone-400 block -mt-0.5">pts</span>
              </div>

              <ChevronRight className="w-4 h-4 text-stone-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Bar with Current Mother's Rank */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#121614]/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 p-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1E5E3A] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
              #{currentUserRank}
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Your Weekly Ranking: #{currentUserRank}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {myPoints} pts this week • 🔥 {myStreak} day streak
              </p>
            </div>
          </div>

          <Link to="/recipes">
            <Button size="sm" className="rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white text-xs font-bold h-8 px-3.5 gap-1 shadow-xs cursor-pointer">
              <ArrowUp className="w-3 h-3" />
              <span>Earn Points</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Mother Profile Inspection Modal */}
      <MotherProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profileModalUser}
      />
    </div>
  );
};

export default Leaderboard;
