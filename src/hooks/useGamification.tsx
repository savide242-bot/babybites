import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  criterion: string;
  reward: string;
  category: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  gradient: string;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  total_points: number;
  last_activity_date: string | null;
  streak_freezes_available?: number;
  grace_period_eligible?: boolean;
  grace_period_days_missed?: number;
}

export interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export interface CompletedChallenge {
  id: string;
  challenge_title: string;
  completed_at: string;
  reward_points: number;
}

// Master Super Admin whitelist
const MASTER_SUPER_ADMINS = [
  'octaviomoiane2007@gmail.com',
  'savide242@gmail.com',
];

// All 12 beautifully designed badges with complete pediatric criteria & rewards
export const BADGES: Badge[] = [
  {
    id: 'pioneer_mother',
    name: 'Pioneer Mother',
    description: 'One of the founding mothers and pioneers of the BabyBites community!',
    icon: '🌟',
    requirement: 'Founding community mother',
    criterion: 'Awarded for being one of the foundational, early mothers of the BabyBites community.',
    reward: '+200 Streak Points & Legendary Gold Community Pioneer Medal on Profile',
    category: 'Special',
    tier: 'Gold',
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
  },
  {
    id: 'first_recipe',
    name: 'First Spoonful',
    description: 'Prepared your very first nourishing meal for your baby on BabyBites!',
    icon: '🥄',
    requirement: 'Prepare 1 recipe',
    criterion: 'Cook, prepare, and check off your very first infant recipe from the library or meal planner.',
    reward: '+200 Streak Points & First Spoonful Bronze Medal',
    category: 'Cooking',
    tier: 'Bronze',
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    id: 'recipes_10',
    name: "Baby's Master Chef",
    description: 'Completed 10 wholesome recipes packed with nourishment and flavor!',
    icon: '👩‍🍳',
    requirement: 'Prepare 10 recipes',
    criterion: 'Complete and log 10 wholesome, pediatrician-approved baby recipes in the app.',
    reward: '+200 Streak Points & Master Chef Silver Medal',
    category: 'Cooking',
    tier: 'Silver',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'gourmet_25',
    name: 'Gourmet Weaning Expert',
    description: '25 recipes completed! A true master of wholesome baby nutrition.',
    icon: '👑',
    requirement: 'Prepare 25 recipes',
    criterion: 'Complete 25 varied recipes covering purées, mashes, finger foods, and iron-rich meals.',
    reward: '+200 Streak Points & Gourmet Weaning Expert Gold Medal',
    category: 'Cooking',
    tier: 'Gold',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'master_planner',
    name: 'Master Meal Planner',
    description: 'Generated and personalized a complete weekly meal plan for your baby!',
    icon: '📅',
    requirement: 'Generate weekly meal plan',
    criterion: 'Generate, customize, and accept your baby\'s personalized weekly meal plan.',
    reward: '+200 Streak Points & Master Meal Planner Medal',
    category: 'Dedication',
    tier: 'Silver',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'streak_7',
    name: 'Unstoppable Week',
    description: '7-day active streak nurturing your baby with wholesome daily food habits!',
    icon: '🔥',
    requirement: '7-day active streak',
    criterion: 'Maintain an active 7-day healthy feeding and tracking streak without missing a day.',
    reward: '+200 Streak Points & Unstoppable Week Silver Medal',
    category: 'Dedication',
    tier: 'Silver',
    gradient: 'from-orange-500 to-rose-600',
  },
  {
    id: 'streak_30',
    name: 'Diamond Dedication',
    description: '30 consecutive days of care and love nourishing your baby\'s healthy journey!',
    icon: '💎',
    requirement: '30-day active streak',
    criterion: 'Maintain an active 30-day continuous feeding and wellness journey with your baby.',
    reward: '+500 Streak Points & Diamond Dedication Medal',
    category: 'Dedication',
    tier: 'Diamond',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
  },
  {
    id: 'community_star',
    name: 'Community Star',
    description: 'Shared milestones and inspired fellow mothers in the BabyBites community!',
    icon: '💬',
    requirement: 'Engage in the parent community',
    criterion: 'Share an authentic milestone post, photo, or supportive comment in the BabyGram parent community.',
    reward: '+200 Streak Points & Community Star Medal',
    category: 'Community',
    tier: 'Bronze',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'flavor_explorer',
    name: 'Flavor Explorer',
    description: 'Explored and saved 10+ varied recipes across diverse nutritious categories!',
    icon: '🥑',
    requirement: 'Explore 10 different recipes',
    criterion: 'Explore and try 10 or more different recipes from various categories in the recipe library.',
    reward: '+200 Streak Points & Flavor Explorer Medal',
    category: 'Cooking',
    tier: 'Bronze',
    gradient: 'from-teal-400 to-emerald-600',
  },
  {
    id: 'allergen_guardian',
    name: 'Allergen Guardian',
    description: 'Consulted the safety tracker and conducted safe, careful allergen introductions.',
    icon: '🛡️',
    requirement: 'Follow allergen introductions safely',
    criterion: 'Consult the Allergen Safety Tracker and log safe, monitored introductions for key allergens.',
    reward: '+200 Streak Points & Allergen Guardian Gold Medal',
    category: 'Health',
    tier: 'Gold',
    gradient: 'from-emerald-600 to-green-700',
  },
  {
    id: 'growth_champion',
    name: 'Growth Champion',
    description: 'Logged weight, height, and milestones in baby\'s growth diary!',
    icon: '📈',
    requirement: 'Track growth milestones',
    criterion: 'Log your baby\'s weight, height, or developmental milestone in the Growth Tracker.',
    reward: '+200 Streak Points & Growth Champion Medal',
    category: 'Health',
    tier: 'Bronze',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'verified_mother_badge',
    name: 'Verified Mother',
    description: 'Official mother profile with verified identity and baby details in BabyBites!',
    icon: '✨',
    requirement: 'Complete profile with baby details',
    criterion: 'Complete your mother and baby profile with birthdate, and log at least 3 meals (or hold official community admin status).',
    reward: 'Official \'Verified Mother ✓\' Profile Shield & Special Gold Badge',
    category: 'Special',
    tier: 'Gold',
    gradient: 'from-emerald-400 via-teal-500 to-[#1E5E3A]',
  },
];

// Points for different actions
export const POINTS = {
  daily_task: 10,
  recipe_view: 5,
  recipe_prepare: 25,
  food_analysis: 50,
  streak_bonus: 100,
  badge_earned: 200,
  post_created: 15,
  growth_logged: 30,
  checkin: 15,
  streak_freeze_used: -50,
};

const PINNED_BADGES_KEY = "babybites_pinned_badges_v1";

export const useGamification = () => {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [pinnedBadges, setPinnedBadges] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(PINNED_BADGES_KEY);
      return raw ? JSON.parse(raw) : ['pioneer_mother', 'first_recipe'];
    } catch {
      return ['pioneer_mother', 'first_recipe'];
    }
  });
  const [completedChallenges, setCompletedChallenges] = useState<CompletedChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const { toast } = useToast();

  // Initialize gamification data
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          const email = (session.user.email || '').toLowerCase().trim();
          
          // Check admin status
          let admin = MASTER_SUPER_ADMINS.includes(email);
          if (!admin) {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .eq('role', 'admin')
              .maybeSingle();
            admin = !!roleData;
          }
          setIsAdminUser(admin);

          await loadGamificationData(session.user.id, admin);
        } else {
          // Offline / guest mock fallback
          loadLocalFallbackBadges();
        }
      } catch (e) {
        loadLocalFallbackBadges();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const loadLocalFallbackBadges = () => {
    const now = new Date().toISOString();
    setBadges([
      { badge_id: 'pioneer_mother', earned_at: now },
      { badge_id: 'first_recipe', earned_at: now },
      { badge_id: 'master_planner', earned_at: now },
    ]);
    setStreak({
      current_streak: 3,
      longest_streak: 7,
      total_points: 350,
      last_activity_date: new Date().toISOString().split('T')[0],
      streak_freezes_available: 1,
      grace_period_eligible: false,
      grace_period_days_missed: 0,
    });
  };

  const loadGamificationData = async (uid: string, isAdmin: boolean = false) => {
    try {
      // 1. Load streak & compute daily check-in / streak freeze protection
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      const todayStr = new Date().toISOString().split('T')[0];

      if (streakData) {
        let currentStreak = streakData.current_streak || 1;
        let longestStreak = streakData.longest_streak || 1;
        let totalPoints = streakData.total_points || 100;
        let freezesAvailable = streakData.streak_freezes_available !== null && streakData.streak_freezes_available !== undefined
          ? Number(streakData.streak_freezes_available)
          : 1;
        const lastDate = streakData.last_activity_date;
        let streakChanged = false;

        if (!lastDate) {
          streakChanged = true;
        } else if (lastDate !== todayStr) {
          const lastTime = new Date(lastDate + 'T00:00:00').getTime();
          const todayTime = new Date(todayStr + 'T00:00:00').getTime();
          const diffDays = Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive daily check-in
            currentStreak += 1;
            if (currentStreak > longestStreak) longestStreak = currentStreak;
            totalPoints += POINTS.checkin;
            streakChanged = true;
          } else if (diffDays > 1) {
            const missedDays = diffDays - 1;
            // Check if streak freezes can protect the streak (up to 3 max)
            if (freezesAvailable >= missedDays && missedDays <= 3) {
              freezesAvailable -= missedDays;
              currentStreak += 1;
              if (currentStreak > longestStreak) longestStreak = currentStreak;
              totalPoints += POINTS.checkin;
              streakChanged = true;
              toast({
                title: "❄️ Streak Freeze Activated!",
                description: `Your ${currentStreak}-day streak was protected using ${missedDays} Streak Freeze${missedDays > 1 ? 's' : ''}!`,
              });
            } else {
              currentStreak = 1;
              streakChanged = true;
              toast({
                title: "🔥 Streak Restarted",
                description: "You missed check-in without enough streak freezes. Starting day 1 today — keep going!",
              });
            }
          }
        }

        if (streakChanged) {
          try {
            await supabase
              .from('user_streaks')
              .update({
                current_streak: currentStreak,
                longest_streak: longestStreak,
                total_points: totalPoints,
                streak_freezes_available: freezesAvailable,
                last_activity_date: todayStr,
              })
              .eq('user_id', uid);
          } catch (err) {
            console.warn("Failed updating user streak in db:", err);
          }
        }

        setStreak({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          total_points: totalPoints,
          last_activity_date: todayStr,
          streak_freezes_available: freezesAvailable,
          grace_period_eligible: false,
          grace_period_days_missed: 0,
        });
      } else {
        const { data: newStreak } = await supabase
          .from('user_streaks')
          .insert({
            user_id: uid,
            current_streak: 1,
            longest_streak: 1,
            total_points: 100,
            streak_freezes_available: 1,
            last_activity_date: todayStr,
          })
          .select()
          .single();

        setStreak({
          current_streak: 1,
          longest_streak: 1,
          total_points: 100,
          last_activity_date: todayStr,
          streak_freezes_available: 1,
          grace_period_eligible: false,
          grace_period_days_missed: 0,
        });
      }

      // 2. Load badges
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', uid);

      let currentBadges = badgesData || [];

      // SPECIAL USER REQUIREMENT:
      // "nesse momento, todos os admins devem ter perfis verificados, e todas gamificacoes no perfil. onde quem entra no perfil ve tudo"
      if (isAdmin) {
        const now = new Date().toISOString();
        const allBadgeIds = BADGES.map(b => b.id);
        const existingIds = new Set(currentBadges.map(b => b.badge_id));
        
        // Grant any missing badge to admin
        const missingBadges = allBadgeIds.filter(id => !existingIds.has(id));
        if (missingBadges.length > 0) {
          try {
            await supabase.from('user_badges').insert(
              missingBadges.map(id => ({ user_id: uid, badge_id: id }))
            );
          } catch (e) {
            // Ignore insert conflict
          }
        }

        currentBadges = allBadgeIds.map(id => ({ badge_id: id, earned_at: now }));
        setBadges(currentBadges);

        // Admins have all 12 badges pinned/showcased on profile
        setPinnedBadges(allBadgeIds);
        try {
          localStorage.setItem(PINNED_BADGES_KEY, JSON.stringify(allBadgeIds));
          window.dispatchEvent(new CustomEvent("babybites_pinned_badges_updated", { detail: allBadgeIds }));
        } catch {}
      } else {
        // Guarantee Pioneer Mother badge for all registered users
        const hasPioneer = currentBadges.some(b => b.badge_id === 'pioneer_mother');
        if (!hasPioneer) {
          try {
            const { data: pioneerInsert } = await supabase
              .from('user_badges')
              .insert({ user_id: uid, badge_id: 'pioneer_mother' })
              .select()
              .maybeSingle();
            if (pioneerInsert) {
              currentBadges = [...currentBadges, { badge_id: 'pioneer_mother', earned_at: pioneerInsert.earned_at }];
            }
          } catch {
            currentBadges = [...currentBadges, { badge_id: 'pioneer_mother', earned_at: new Date().toISOString() }];
          }
        }
        setBadges(currentBadges);

        // Check criteria for regular mothers
        await checkBadgesInternal(uid, currentBadges);
      }

      // 3. Load completed challenges
      const { data: challengesData } = await supabase
        .from('completed_challenges_history')
        .select('*')
        .eq('user_id', uid)
        .order('completed_at', { ascending: false });

      if (challengesData) {
        setCompletedChallenges(challengesData as CompletedChallenge[]);
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
      loadLocalFallbackBadges();
    }
  };

  // Toggle badge pinned state on mother's public profile
  const togglePinBadge = useCallback(async (badgeId: string): Promise<boolean> => {
    let nextPinned: string[];
    if (pinnedBadges.includes(badgeId)) {
      nextPinned = pinnedBadges.filter(id => id !== badgeId);
    } else {
      // For non-admins, limit to 4 featured badges max
      if (!isAdminUser && pinnedBadges.length >= 4) {
        toast({
          title: "Pin Limit Reached (Max 4)",
          description: "Please unpin a medal before pinning another to your public profile.",
        });
        return false;
      }
      nextPinned = [...pinnedBadges, badgeId];
    }

    setPinnedBadges(nextPinned);
    try {
      localStorage.setItem(PINNED_BADGES_KEY, JSON.stringify(nextPinned));
      window.dispatchEvent(new CustomEvent("babybites_pinned_badges_updated", { detail: nextPinned }));
    } catch {
      // Ignore
    }

    const isNowPinned = nextPinned.includes(badgeId);
    toast({
      title: isNowPinned ? "📌 Badge Pinned to Profile!" : "Badge Removed from Profile",
      description: isNowPinned
        ? "This badge is now proudly showcased on your public mother profile."
        : "The badge remains saved in your achievements, but won't be showcased publicly.",
    });

    return true;
  }, [pinnedBadges, isAdminUser, toast]);

  const isBadgePinned = useCallback((badgeId: string): boolean => {
    return pinnedBadges.includes(badgeId);
  }, [pinnedBadges]);

  // Award a badge & trigger celebratory modal
  const awardBadge = useCallback(async (badgeId: string) => {
    const badgeObj = BADGES.find(b => b.id === badgeId);
    if (!badgeObj) return;

    if (!userId) {
      setBadges(prev => {
        if (prev.some(b => b.badge_id === badgeId)) return prev;
        return [...prev, { badge_id: badgeId, earned_at: new Date().toISOString() }];
      });
      // Fire celebration modal
      window.dispatchEvent(new CustomEvent('babybites_badge_unlocked', { detail: badgeObj }));
      return;
    }

    try {
      // Check if already awarded
      if (badges.some(b => b.badge_id === badgeId)) return;

      const { data, error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badgeId })
        .select()
        .single();

      if (error && error.code !== '23505') throw error;

      setBadges(prev => [...prev, { badge_id: badgeId, earned_at: data?.earned_at || new Date().toISOString() }]);

      // Add bonus reward points to streak and grant +1 Streak Freeze (up to max 3)
      const currentFreezes = streak?.streak_freezes_available !== undefined ? streak.streak_freezes_available : 1;
      const nextFreezes = Math.min(3, currentFreezes + 1);
      const nextPoints = (streak?.total_points || 100) + POINTS.badge_earned;

      try {
        await supabase
          .from('user_streaks')
          .update({
            total_points: nextPoints,
            streak_freezes_available: nextFreezes,
          })
          .eq('user_id', userId);
      } catch (err) {
        console.warn("Failed updating streak reward in db:", err);
      }

      setStreak(prev => prev ? {
        ...prev,
        total_points: nextPoints,
        streak_freezes_available: nextFreezes,
      } : null);

      // FIRE CELEBRATION MODAL WITH CONFETTI AND REWARD DETAILS!
      window.dispatchEvent(new CustomEvent('babybites_badge_unlocked', { detail: badgeObj }));
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  }, [userId, badges, streak]);

  // Internal criteria checking for regular users
  const checkBadgesInternal = async (uid: string, currentBadges: UserBadge[]) => {
    const has = (id: string) => currentBadges.some(b => b.badge_id === id);

    try {
      // 1. Prepared recipes count criteria
      let prepCount = 0;
      try {
        const rawPrep = localStorage.getItem("babybites_prepared_recipes_history_v1");
        if (rawPrep) prepCount = JSON.parse(rawPrep).length;
      } catch {}

      if (prepCount >= 1 && !has('first_recipe')) {
        await awardBadge('first_recipe');
      }
      if (prepCount >= 10 && !has('recipes_10')) {
        await awardBadge('recipes_10');
      }
      if (prepCount >= 25 && !has('gourmet_25')) {
        await awardBadge('gourmet_25');
      }

      // 2. Meal planner generated criteria
      const { count: planCount } = await supabase
        .from('meal_plans')
        .select('id', { count: 'exact' })
        .eq('user_id', uid);

      if ((planCount && planCount >= 1) || localStorage.getItem("babybites_persisted_personalized_plan_v4")) {
        if (!has('master_planner')) {
          await awardBadge('master_planner');
        }
      }

      // 3. Community milestone post criteria
      const { count: postCount } = await supabase
        .from('forum_posts')
        .select('id', { count: 'exact' })
        .eq('user_id', uid);

      if (postCount && postCount >= 1 && !has('community_star')) {
        await awardBadge('community_star');
      }

      // 4. Growth tracking entry criteria
      const { count: growthCount } = await supabase
        .from('growth_entries')
        .select('id', { count: 'exact' })
        .eq('user_id', uid);

      if (growthCount && growthCount >= 1 && !has('growth_champion')) {
        await awardBadge('growth_champion');
      }

      // 5. Criteria for Verified Mother:
      // Must have mother_name, baby_name, baby_birth_date AND (prepCount >= 3 or postCount >= 1)
      const { data: profile } = await supabase
        .from('profiles')
        .select('baby_name, mother_name, baby_birth_date')
        .eq('id', uid)
        .maybeSingle();

      const profileComplete = Boolean(profile?.baby_name && profile?.mother_name && profile?.baby_birth_date);
      const activeJourney = prepCount >= 3 || (postCount && postCount >= 1);

      if (profileComplete && activeJourney && !has('verified_mother_badge')) {
        await awardBadge('verified_mother_badge');
      }
    } catch (err) {
      console.warn("Badge criteria check error:", err);
    }
  };

  const checkBadges = useCallback(async () => {
    if (userId) {
      await checkBadgesInternal(userId, badges);
    }
  }, [userId, badges]);

  const hasBadge = useCallback((badgeId: string) => {
    return badges.some(b => b.badge_id === badgeId);
  }, [badges]);

  return {
    streak,
    badges,
    pinnedBadges,
    togglePinBadge,
    isBadgePinned,
    completedChallenges,
    isLoading,
    hasBadge,
    awardBadge,
    checkBadges,
    isAdminUser,
    useStreakFreeze: async () => {
      if (!streak || (streak.streak_freezes_available || 0) <= 0) {
        toast({
          title: "No Streak Freezes Available",
          description: "Unlock more achievements to earn up to 3 streak freezes in your vault!",
          variant: "destructive",
        });
        return false;
      }
      toast({
        title: "❄️ Streak Freeze Active",
        description: `You have ${streak.streak_freezes_available} freeze(s) in your vault. If you miss a day, your streak is automatically protected!`,
      });
      return true;
    },
    recoverStreak: () => {},
  };
};

export default useGamification;
