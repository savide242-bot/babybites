import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  category: "Especial" | "Culinária" | "Dedicação" | "Comunidade" | "Saúde";
  tier: "Bronze" | "Prata" | "Ouro" | "Diamante";
  gradient: string;
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
  is_pinned?: boolean;
}

export interface CompletedChallenge {
  id: string;
  challenge_title: string;
  completed_at: string;
  reward_points: number;
}

// All beautifully designed badges for mothers
export const BADGES: Badge[] = [
  {
    id: 'pioneer_mother',
    name: 'Mãe Pioneira',
    description: 'Uma das mães fundadoras e pioneiras da comunidade BabyBites!',
    icon: '🌟',
    requirement: 'Membro fundadora da comunidade',
    category: 'Especial',
    tier: 'Ouro',
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
  },
  {
    id: 'first_recipe',
    name: 'Primeira Colherada',
    description: 'Preparou a sua primeira receita para o bebê no BabyBites com sucesso!',
    icon: '🥄',
    requirement: 'Preparar 1 receita',
    category: 'Culinária',
    tier: 'Bronze',
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    id: 'recipes_10',
    name: 'Super Chef do Bebê',
    description: 'Completou 10 receitas nutritivas cheias de amor e sabor!',
    icon: '👩‍🍳',
    requirement: 'Preparar 10 receitas',
    category: 'Culinária',
    tier: 'Prata',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'gourmet_25',
    name: 'Mestre Gourmet Infantil',
    description: '25 receitas concluídas! Uma verdadeira chef da introdução alimentar.',
    icon: '👑',
    requirement: 'Preparar 25 receitas',
    category: 'Culinária',
    tier: 'Ouro',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'master_planner',
    name: 'Mãe Estrategista',
    description: 'Gerou e ativou o cardápio semanal completo para o seu bebê!',
    icon: '📅',
    requirement: 'Gerar o plano semanal de refeições',
    category: 'Dedicação',
    tier: 'Prata',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'streak_7',
    name: 'Semana de Ouro',
    description: '7 dias consecutivos cuidando com carinho da alimentação do bebê!',
    icon: '🔥',
    requirement: 'Sequência ativa de 7 dias',
    category: 'Dedicação',
    tier: 'Prata',
    gradient: 'from-orange-500 to-rose-600',
  },
  {
    id: 'streak_30',
    name: 'Mãe Diamante',
    description: '30 dias seguidos de dedicação e amor nutrindo o futuro do bebê!',
    icon: '💎',
    requirement: 'Sequência ativa de 30 dias',
    category: 'Dedicação',
    tier: 'Diamante',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
  },
  {
    id: 'community_star',
    name: 'Voz da Comunidade',
    description: 'Publicou ou interagiu inspirando e apoiando outras mães!',
    icon: '💬',
    requirement: 'Participar na comunidade de mães',
    category: 'Comunidade',
    tier: 'Bronze',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'flavor_explorer',
    name: 'Exploradora de Sabores',
    description: 'Visualizou e salvou 10+ receitas nutritivas de categorias variadas!',
    icon: '🥑',
    requirement: 'Explorar 10 receitas diferentes',
    category: 'Culinária',
    tier: 'Bronze',
    gradient: 'from-teal-400 to-emerald-600',
  },
  {
    id: 'allergen_guardian',
    name: 'Guardiã dos Alérgenos',
    description: 'Consultou o rastreador e conduziu a introdução de alérgenos com segurança.',
    icon: '🛡️',
    requirement: 'Acompanhar alérgenos com cuidado',
    category: 'Saúde',
    tier: 'Ouro',
    gradient: 'from-emerald-600 to-green-700',
  },
  {
    id: 'growth_champion',
    name: 'Diário do Crescimento',
    description: 'Registrou peso, altura e marcos do desenvolvimento do bebê!',
    icon: '📈',
    requirement: 'Registrar marcos de crescimento',
    category: 'Saúde',
    tier: 'Bronze',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'verified_mother_badge',
    name: 'Mãe Verificada',
    description: 'Perfil de mãe com identidade e dados do bebê verificados no app!',
    icon: '✨',
    requirement: 'Completar perfil com dados do bebê',
    category: 'Especial',
    tier: 'Ouro',
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
  const { toast } = useToast();

  // Initialize gamification data
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          await loadGamificationData(session.user.id);
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

  const loadGamificationData = async (uid: string) => {
    try {
      // 1. Load streak
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

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
      } else {
        // Create initial streak record
        const { data: newStreak } = await supabase
          .from('user_streaks')
          .insert({ user_id: uid })
          .select()
          .single();

        if (newStreak) {
          setStreak({
            current_streak: 1,
            longest_streak: 1,
            total_points: 100,
            last_activity_date: new Date().toISOString().split('T')[0],
            streak_freezes_available: 1,
            grace_period_eligible: false,
            grace_period_days_missed: 0,
          });
        }
      }

      // 2. Load badges
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', uid);

      let currentBadges = badgesData || [];

      // Automatically guarantee Pioneer Mother badge for all members
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

      // 3. Load completed challenges
      const { data: challengesData } = await supabase
        .from('completed_challenges_history')
        .select('*')
        .eq('user_id', uid)
        .order('completed_at', { ascending: false });

      if (challengesData) {
        setCompletedChallenges(challengesData as CompletedChallenge[]);
      }

      // 4. Auto check badges based on activity
      await checkBadgesInternal(uid, currentBadges);
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
      // Limit to 4 featured badges max on public profile
      if (pinnedBadges.length >= 4) {
        toast({
          title: "Limite atingido (Máx 4)",
          description: "Remova uma medalha antes de fixar outra no seu perfil.",
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
      title: isNowPinned ? "📌 Medalha Fixada no Perfil!" : "Medalha Ocultada do Perfil",
      description: isNowPinned
        ? "Esta medalha agora fica visível para todas as mães no seu perfil."
        : "A medalha continuará salva em suas conquistas, mas não aparecerá no perfil público.",
    });

    return true;
  }, [pinnedBadges, toast]);

  const isBadgePinned = useCallback((badgeId: string): boolean => {
    return pinnedBadges.includes(badgeId);
  }, [pinnedBadges]);

  // Award a badge
  const awardBadge = useCallback(async (badgeId: string) => {
    if (!userId) {
      setBadges(prev => {
        if (prev.some(b => b.badge_id === badgeId)) return prev;
        return [...prev, { badge_id: badgeId, earned_at: new Date().toISOString() }];
      });
      return;
    }

    if (badges.some(b => b.badge_id === badgeId)) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badgeId })
        .select()
        .single();

      if (error && error.code !== '23505') throw error;

      const earnedAt = data?.earned_at || new Date().toISOString();
      setBadges(prev => [...prev, { badge_id: badgeId, earned_at: earnedAt }]);

      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) {
        toast({
          title: `🏆 Nova Conquista Desbloqueada!`,
          description: `${badge.icon} ${badge.name} - ${badge.description}`,
        });
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  }, [userId, badges, toast]);

  // Internal badge checking
  const checkBadgesInternal = async (uid: string, currentBadges: UserBadge[]) => {
    const has = (id: string) => currentBadges.some(b => b.badge_id === id);

    try {
      // Check recipes prepared from meal plans
      const { count: preparedCount } = await supabase
        .from('meal_plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('prepared', true);

      const prepCount = preparedCount || 0;

      if (prepCount >= 1 && !has('first_recipe')) {
        await awardBadge('first_recipe');
      }
      if (prepCount >= 10 && !has('recipes_10')) {
        await awardBadge('recipes_10');
      }
      if (prepCount >= 25 && !has('gourmet_25')) {
        await awardBadge('gourmet_25');
      }

      // Check meal plans generated
      const { count: planCount } = await supabase
        .from('meal_plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid);

      if (planCount && planCount >= 5 && !has('master_planner')) {
        await awardBadge('master_planner');
      }

      // Check community posts
      const { count: postCount } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid);

      if (postCount && postCount >= 1 && !has('community_star')) {
        await awardBadge('community_star');
      }

      // Check profile completion for verified mother
      const { data: profile } = await supabase
        .from('profiles')
        .select('mother_name, baby_name, baby_birth_date')
        .eq('id', uid)
        .maybeSingle();

      if (profile?.baby_name && profile?.mother_name && !has('verified_mother_badge')) {
        await awardBadge('verified_mother_badge');
      }
    } catch (err) {
      console.warn("Badge check error:", err);
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
    useStreakFreeze: () => {},
    recoverStreak: () => {},
  };
};
