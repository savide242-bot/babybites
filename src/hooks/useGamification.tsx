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
}

export interface UserBadge {
  badge_id: string;
  earned_at: string;
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
};

export const useGamification = () => {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
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
        });
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
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  };

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
        // Streak broken - reset
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, current.longest_streak);

      const { data: updated } = await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          total_points: newPoints,
          last_activity_date: today,
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
        
        if (reason) {
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

  return {
    streak,
    badges,
    isLoading,
    BADGES,
    POINTS,
    updateStreak,
    addPoints,
    awardBadge,
    checkBadges,
    logActivity,
    hasBadge: (badgeId: string) => badges.some(b => b.badge_id === badgeId),
    getBadgeInfo: (badgeId: string) => BADGES.find(b => b.id === badgeId),
  };
};
