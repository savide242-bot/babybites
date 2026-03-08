import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DailyTip {
  id: string;
  tip_text: string;
  category: string;
  age_range: string;
}

interface DailyContent {
  id: string;
  content_type: 'safe_food' | 'common_mistake' | 'quick_tip' | 'try_today';
  title: string;
  content_text: string;
  age_range: string | null;
  icon: string;
  day_of_week: number | null;
}

interface DailyCheckin {
  id: string;
  checkin_date: string;
  status: 'ate_well' | 'rejected' | 'tried_new';
  notes?: string;
}

interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  goal_count: number;
  reward_points: number;
  starts_at: string;
  ends_at: string;
  challenge_type: string;
}

interface ChallengeProgress {
  id: string;
  challenge_id: string;
  current_count: number;
  completed: boolean;
}

interface WeeklyProgress {
  totalCheckins: number;
  varietyCount: number;
  newFoodsCount: number;
  consistencyStreak: number;
}

export const useEngagement = () => {
  const [dailyTip, setDailyTip] = useState<DailyTip | null>(null);
  const [dailyContent, setDailyContent] = useState<DailyContent | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<WeeklyChallenge | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<ChallengeProgress | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress>({
    totalCheckins: 0,
    varietyCount: 0,
    newFoodsCount: 0,
    consistencyStreak: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [babyAgeMonths, setBabyAgeMonths] = useState<number | null>(null);

  // Calculate baby's age in months from birth date
  const calculateBabyAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return Math.max(0, months);
  };

  // Check if age matches the range (e.g., "6-12", "9-12", "all")
  const ageMatchesRange = (ageMonths: number | null, range: string | null): boolean => {
    if (!range || range === 'all') return true;
    if (ageMonths === null) return true; // Show all if no age set
    
    const match = range.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return ageMonths >= min && ageMonths <= max;
    }
    return true;
  };

  // Fetch daily tip filtered by baby's age
  const fetchDailyTip = useCallback(async (ageMonths: number | null) => {
    try {
      const { data: tips, error } = await supabase
        .from('daily_tips')
        .select('*');

      if (error || !tips || tips.length === 0) return;

      // Filter tips by age range
      const filteredTips = tips.filter(tip => 
        ageMatchesRange(ageMonths, tip.age_range)
      );

      if (filteredTips.length === 0) {
        // Fallback to all tips if no age-specific ones
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const tipIndex = dayOfYear % tips.length;
        setDailyTip(tips[tipIndex] as DailyTip);
      } else {
        // Rotate age-filtered tips daily
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const tipIndex = dayOfYear % filteredTips.length;
        setDailyTip(filteredTips[tipIndex] as DailyTip);
      }
    } catch (err) {
      console.error('Error fetching daily tip:', err);
    }
  }, []);

  // Fetch enriched daily content based on day of week and age
  const fetchDailyContent = useCallback(async (ageMonths: number | null) => {
    try {
      const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const { data: contents, error } = await supabase
        .from('daily_content')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (error || !contents || contents.length === 0) return;

      // Filter by age range
      const filteredContents = contents.filter((content: any) => 
        ageMatchesRange(ageMonths, content.age_range)
      );

      if (filteredContents.length > 0) {
        // Pick one randomly or rotate
        const index = new Date().getDate() % filteredContents.length;
        setDailyContent(filteredContents[index] as DailyContent);
      } else if (contents.length > 0) {
        // Fallback to first content if no age match
        setDailyContent(contents[0] as DailyContent);
      }
    } catch (err) {
      console.error('Error fetching daily content:', err);
    }
  }, []);

  // Fetch today's check-in status
  const fetchTodayCheckin = useCallback(async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', today)
      .maybeSingle();

    if (!error && data) {
      setTodayCheckin(data as DailyCheckin);
    }
  }, []);

  // Fetch active challenge and user's progress
  const fetchActiveChallenge = useCallback(async (userId: string) => {
    const now = new Date().toISOString();
    
    const { data: challenge, error } = await supabase
      .from('weekly_challenges')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !challenge) return;
    
    setActiveChallenge(challenge as WeeklyChallenge);

    // Fetch user's progress on this challenge
    const { data: progress } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challenge.id)
      .maybeSingle();

    if (progress) {
      setChallengeProgress(progress as ChallengeProgress);
    }
  }, []);

  // Calculate weekly progress
  const fetchWeeklyProgress = useCallback(async (userId: string) => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Get checkins for this week
    const { data: checkins } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('checkin_date', weekStart.toISOString().split('T')[0]);

    // Get meal logs for variety count
    const { data: mealLogs } = await supabase
      .from('meal_logs')
      .select('recipe_title')
      .eq('user_id', userId)
      .gte('eaten_at', weekStart.toISOString());

    const uniqueRecipes = new Set(mealLogs?.map(m => m.recipe_title).filter(Boolean));
    const newFoodsCount = checkins?.filter(c => c.status === 'tried_new').length || 0;

    // Calculate consistency streak from checkins
    let streak = 0;
    const checkDates = checkins?.map(c => c.checkin_date).sort().reverse() || [];
    const todayStr = today.toISOString().split('T')[0];
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (checkDates.includes(dateStr)) {
        streak++;
      } else if (dateStr !== todayStr) {
        break;
      }
    }

    setWeeklyProgress({
      totalCheckins: checkins?.length || 0,
      varietyCount: uniqueRecipes.size,
      newFoodsCount,
      consistencyStreak: streak
    });
  }, []);

  // Submit a check-in
  const submitCheckin = useCallback(async (status: 'ate_well' | 'rejected' | 'tried_new') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_checkins')
      .upsert({
        user_id: session.user.id,
        checkin_date: today,
        status,
      }, { onConflict: 'user_id,checkin_date' })
      .select()
      .single();

    if (error) {
      console.error('Error submitting checkin:', error);
      return false;
    }

    setTodayCheckin(data as DailyCheckin);
    
    // Update challenge progress if applicable
    if (activeChallenge) {
      await updateChallengeProgress(session.user.id, status);
    }

    return true;
  }, [activeChallenge]);

  // Update challenge progress
  const updateChallengeProgress = async (userId: string, status: string) => {
    if (!activeChallenge) return;

    // Check if status matches challenge type
    const shouldIncrement = 
      (activeChallenge.challenge_type === 'exploration' && status === 'tried_new') ||
      (activeChallenge.challenge_type === 'consistency') ||
      (activeChallenge.challenge_type === 'variety');

    if (!shouldIncrement) return;

    const currentProgress = challengeProgress?.current_count || 0;
    const newCount = currentProgress + 1;
    const completed = newCount >= activeChallenge.goal_count;

    const { data } = await supabase
      .from('user_challenge_progress')
      .upsert({
        user_id: userId,
        challenge_id: activeChallenge.id,
        current_count: newCount,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }, { onConflict: 'user_id,challenge_id' })
      .select()
      .single();

    if (data) {
      setChallengeProgress(data as ChallengeProgress);
      
      if (completed) {
        toast.success(`🎉 Challenge completed! +${activeChallenge.reward_points} points!`);
        
        // Award points - fetch current and increment
        const { data: streakData } = await supabase
          .from('user_streaks')
          .select('total_points')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (streakData) {
          await supabase
            .from('user_streaks')
            .update({ 
              total_points: (streakData.total_points || 0) + activeChallenge.reward_points
            })
            .eq('user_id', userId);
        }
      }
    }
  };

  // Initialize all data
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      let ageMonths: number | null = null;
      
      if (session?.user) {
        // Fetch baby's birth date from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('baby_birth_date')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.baby_birth_date) {
          ageMonths = calculateBabyAge(profile.baby_birth_date);
          setBabyAgeMonths(ageMonths);
        }
        
        await Promise.all([
          fetchDailyTip(ageMonths),
          fetchDailyContent(ageMonths),
          fetchTodayCheckin(session.user.id),
          fetchActiveChallenge(session.user.id),
          fetchWeeklyProgress(session.user.id)
        ]);
      } else {
        await Promise.all([
          fetchDailyTip(null),
          fetchDailyContent(null)
        ]);
      }
      
      setIsLoading(false);
    };

    init();
  }, [fetchDailyTip, fetchDailyContent, fetchTodayCheckin, fetchActiveChallenge, fetchWeeklyProgress]);

  return {
    dailyTip,
    dailyContent,
    todayCheckin,
    activeChallenge,
    challengeProgress,
    weeklyProgress,
    isLoading,
    babyAgeMonths,
    submitCheckin,
    refetch: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await Promise.all([
          fetchTodayCheckin(session.user.id),
          fetchWeeklyProgress(session.user.id)
        ]);
      }
    }
  };
};
