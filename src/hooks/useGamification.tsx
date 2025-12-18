import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  total_points: number;
  last_activity_date: string | null;
  streak_freezes_available: number;
  grace_period_eligible: boolean;
  grace_period_days_missed: number;
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

// All available badges
export const BADGES: Badge[] = [
  { id: 'first_step', name: 'First Step', description: 'Complete the onboarding', icon: '👶', requirement: 'onboarding' },
  { id: 'chef_beginner', name: 'Chef Beginner', description: 'View your first recipe', icon: '👨‍🍳', requirement: 'first_recipe' },
  { id: 'week_perfect', name: 'Perfect Week', description: '7 days streak', icon: '🌟', requirement: 'streak_7' },
  { id: 'flavor_explorer', name: 'Flavor Explorer', description: 'View 10 different recipes', icon: '🍽️', requirement: 'recipes_10' },
  { id: 'informed_mom', name: 'Informed Mom', description: 'Use AI Analyzer 5 times', icon: '🔬', requirement: 'analyzer_5' },
  { id: 'super_mom', name: 'Super Mom', description: '30 days streak', icon: '🦸‍♀️', requirement: 'streak_30' },
  { id: 'meal_planner', name: 'Meal Planner', description: 'Plan 7 meals', icon: '📅', requirement: 'meals_7' },
  { id: 'community_star', name: 'Community Star', description: 'Create 5 community posts', icon: '⭐', requirement: 'posts_5' },
  { id: 'growth_tracker', name: 'Growth Tracker', description: 'Log 5 growth records', icon: '📈', requirement: 'growth_5' },
  { id: 'task_master', name: 'Task Master', description: 'Complete all daily tasks 5 days in a row', icon: '✅', requirement: 'tasks_5' },
  { id: 'checkin_champion', name: 'Check-in Champion', description: 'Do 10 daily check-ins', icon: '📊', requirement: 'checkins_10' },
  { id: 'challenge_warrior', name: 'Challenge Warrior', description: 'Complete 3 weekly challenges', icon: '🏆', requirement: 'challenges_3' },
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

export const useGamification = () => {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<CompletedChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize gamification data
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        await loadGamificationData(session.user.id);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const loadGamificationData = async (uid: string) => {
    try {
      // Load streak data
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (streakData) {
        setStreak({
          current_streak: streakData.current_streak,
          longest_streak: streakData.longest_streak,
          total_points: streakData.total_points,
          last_activity_date: streakData.last_activity_date,
          streak_freezes_available: (streakData as any).streak_freezes_available || 1,
          grace_period_eligible: (streakData as any).grace_period_eligible || false,
          grace_period_days_missed: (streakData as any).grace_period_days_missed || 0,
        });
        
        // Check if we need to reset weekly freeze
        await checkAndResetWeeklyFreeze(uid, streakData);
      } else {
        // Create initial streak record
        const { data: newStreak } = await supabase
          .from('user_streaks')
          .insert({ user_id: uid })
          .select()
          .single();
        
        if (newStreak) {
          setStreak({
            current_streak: 0,
            longest_streak: 0,
            total_points: 0,
            last_activity_date: null,
            streak_freezes_available: 1,
            grace_period_eligible: false,
            grace_period_days_missed: 0,
          });
        }
      }

      // Load badges
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', uid);

      if (badgesData) {
        setBadges(badgesData);
      }

      // Load completed challenges history
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
    }
  };

  // Check and reset weekly freeze (resets every Monday)
  const checkAndResetWeeklyFreeze = async (uid: string, streakData: any) => {
    const lastReset = streakData.last_freeze_reset_at ? new Date(streakData.last_freeze_reset_at) : null;
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // If it's Monday (day 1) and we haven't reset this week
    if (dayOfWeek === 1) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      if (!lastReset || lastReset < startOfWeek) {
        await supabase
          .from('user_streaks')
          .update({ 
            streak_freezes_available: 1,
            last_freeze_reset_at: now.toISOString()
          })
          .eq('user_id', uid);
        
        setStreak(prev => prev ? { ...prev, streak_freezes_available: 1 } : null);
      }
    }
  };

  // Use a streak freeze
  const useStreakFreeze = useCallback(async () => {
    if (!userId || !streak || streak.streak_freezes_available <= 0) return false;

    try {
      const { error } = await supabase
        .from('user_streaks')
        .update({ 
          streak_freezes_available: streak.streak_freezes_available - 1,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', userId);

      if (error) throw error;

      setStreak(prev => prev ? { 
        ...prev, 
        streak_freezes_available: prev.streak_freezes_available - 1 
      } : null);

      toast({
        title: '❄️ Streak Freeze Used!',
        description: 'Your streak is protected for today.',
      });

      return true;
    } catch (error) {
      console.error('Error using streak freeze:', error);
      return false;
    }
  }, [userId, streak, toast]);

  // Recover streak with grace period
  const recoverStreak = useCallback(async () => {
    if (!userId || !streak || !streak.grace_period_eligible) return false;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('user_streaks')
        .update({ 
          grace_period_eligible: false,
          grace_period_days_missed: 0,
          last_activity_date: today
        })
        .eq('user_id', userId);

      if (error) throw error;

      setStreak(prev => prev ? { 
        ...prev, 
        grace_period_eligible: false,
        grace_period_days_missed: 0,
        last_activity_date: today
      } : null);

      toast({
        title: '🎉 Streak Recovered!',
        description: 'Great job coming back! Keep the momentum going.',
      });

      return true;
    } catch (error) {
      console.error('Error recovering streak:', error);
      return false;
    }
  }, [userId, streak, toast]);

  // Update streak when user is active
  const updateStreak = useCallback(async () => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data: current } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!current) return;

      const lastActivity = current.last_activity_date;
      let newStreak = current.current_streak;
      let newPoints = current.total_points;
      let gracePeriodEligible = false;
      let gracePeriodDaysMissed = 0;

      if (lastActivity === today) {
        // Already logged today
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivity === yesterdayStr) {
        // Consecutive day - increment streak
        newStreak += 1;
        newPoints += POINTS.streak_bonus;
        
        // Check for streak badges
        if (newStreak === 7) {
          await awardBadge('week_perfect');
        } else if (newStreak === 30) {
          await awardBadge('super_mom');
        }
      } else if (lastActivity !== today) {
        // Calculate days missed
        const lastDate = lastActivity ? new Date(lastActivity) : null;
        const todayDate = new Date(today);
        const daysMissed = lastDate 
          ? Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) - 1
          : 0;

        if (daysMissed > 0 && daysMissed <= 3 && current.current_streak >= 3) {
          // Eligible for grace period recovery
          gracePeriodEligible = true;
          gracePeriodDaysMissed = daysMissed;
          // Don't reset streak yet, give them a chance to recover
        } else {
          // Streak broken - reset
          newStreak = 1;
        }
      }

      const longestStreak = Math.max(newStreak, current.longest_streak);

      const { data: updated } = await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          total_points: newPoints,
          last_activity_date: today,
          grace_period_eligible: gracePeriodEligible,
          grace_period_days_missed: gracePeriodDaysMissed,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updated) {
        setStreak({
          current_streak: updated.current_streak,
          longest_streak: updated.longest_streak,
          total_points: updated.total_points,
          last_activity_date: updated.last_activity_date,
          streak_freezes_available: (updated as any).streak_freezes_available || 1,
          grace_period_eligible: gracePeriodEligible,
          grace_period_days_missed: gracePeriodDaysMissed,
        });
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }, [userId]);

  // Add points for an action
  const addPoints = useCallback(async (points: number, reason?: string) => {
    if (!userId || !streak) return;

    try {
      const newPoints = streak.total_points + points;
      
      const { data } = await supabase
        .from('user_streaks')
        .update({ total_points: newPoints })
        .eq('user_id', userId)
        .select()
        .single();

      if (data) {
        setStreak(prev => prev ? { ...prev, total_points: newPoints } : null);
        
        if (reason && points > 0) {
          toast({
            title: `+${points} points!`,
            description: reason,
          });
        }
      }
    } catch (error) {
      console.error('Error adding points:', error);
    }
  }, [userId, streak, toast]);

  // Award a badge
  const awardBadge = useCallback(async (badgeId: string) => {
    if (!userId) return;

    // Check if already has badge
    const hasBadge = badges.some(b => b.badge_id === badgeId);
    if (hasBadge) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badgeId })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint - already has badge
          return;
        }
        throw error;
      }

      if (data) {
        setBadges(prev => [...prev, { badge_id: badgeId, earned_at: data.earned_at }]);
        
        // Add bonus points for badge
        await addPoints(POINTS.badge_earned);

        const badge = BADGES.find(b => b.id === badgeId);
        if (badge) {
          toast({
            title: `🏆 New Badge Earned!`,
            description: `${badge.icon} ${badge.name} - ${badge.description}`,
          });
        }
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  }, [userId, badges, addPoints, toast]);

  // Check and award badges based on counts
  const checkBadges = useCallback(async () => {
    if (!userId) return;

    try {
      // Check recipe views
      const { count: recipeCount } = await supabase
        .from('recipe_views')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (recipeCount && recipeCount >= 1) {
        await awardBadge('chef_beginner');
      }
      if (recipeCount && recipeCount >= 10) {
        await awardBadge('flavor_explorer');
      }

      // Check food analyses
      const { count: analysisCount } = await supabase
        .from('food_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (analysisCount && analysisCount >= 5) {
        await awardBadge('informed_mom');
      }

      // Check meal plans
      const { count: mealCount } = await supabase
        .from('meal_plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (mealCount && mealCount >= 7) {
        await awardBadge('meal_planner');
      }

      // Check community posts
      const { count: postCount } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (postCount && postCount >= 5) {
        await awardBadge('community_star');
      }

      // Check growth records
      const { count: growthCount } = await supabase
        .from('baby_growth')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (growthCount && growthCount >= 5) {
        await awardBadge('growth_tracker');
      }

      // Check daily checkins
      const { count: checkinCount } = await supabase
        .from('daily_checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (checkinCount && checkinCount >= 10) {
        await awardBadge('checkin_champion');
      }

      // Check completed challenges
      const { count: challengeCount } = await supabase
        .from('completed_challenges_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (challengeCount && challengeCount >= 3) {
        await awardBadge('challenge_warrior');
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  }, [userId, awardBadge]);

  // Log activity (updates streak and checks badges)
  const logActivity = useCallback(async (activityType: keyof typeof POINTS) => {
    await updateStreak();
    await addPoints(POINTS[activityType], `${activityType.replace('_', ' ')}`);
    await checkBadges();
  }, [updateStreak, addPoints, checkBadges]);

  // Refresh completed challenges
  const refreshCompletedChallenges = useCallback(async () => {
    if (!userId) return;
    
    const { data } = await supabase
      .from('completed_challenges_history')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (data) {
      setCompletedChallenges(data as CompletedChallenge[]);
    }
  }, [userId]);

  return {
    streak,
    badges,
    completedChallenges,
    isLoading,
    BADGES,
    POINTS,
    updateStreak,
    addPoints,
    awardBadge,
    checkBadges,
    logActivity,
    useStreakFreeze,
    recoverStreak,
    refreshCompletedChallenges,
    hasBadge: (badgeId: string) => badges.some(b => b.badge_id === badgeId),
    getBadgeInfo: (badgeId: string) => BADGES.find(b => b.id === badgeId),
  };
};
