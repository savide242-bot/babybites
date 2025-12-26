import { useState, useEffect, useCallback, RefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetRef?: RefObject<HTMLElement>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  isModal?: boolean;
}

interface TourState {
  isActive: boolean;
  currentStep: number;
  hasCompletedTour: boolean;
  isLoading: boolean;
  motherName: string;
  babyName: string;
}

export const useAppTour = () => {
  const [tourState, setTourState] = useState<TourState>({
    isActive: false,
    currentStep: 0,
    hasCompletedTour: true, // Default to true to not show tour until we check
    isLoading: true,
    motherName: '',
    babyName: ''
  });

  // Check if user is new and should see tour
  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setTourState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const userId = session.user.id;

        // Fetch user preferences and profile in parallel
        const [prefsResult, profileResult] = await Promise.all([
          supabase
            .from('user_preferences')
            .select('has_completed_tour, has_seen_welcome')
            .eq('user_id', userId)
            .single(),
          supabase
            .from('profiles')
            .select('mother_name, baby_name')
            .eq('id', userId)
            .single()
        ]);

        const hasCompletedTour = prefsResult.data?.has_completed_tour ?? false;
        const hasSeenWelcome = prefsResult.data?.has_seen_welcome ?? false;
        
        // Only show tour if user has completed onboarding but hasn't seen the tour
        const shouldShowTour = hasSeenWelcome && !hasCompletedTour;

        setTourState({
          isActive: shouldShowTour,
          currentStep: 0,
          hasCompletedTour,
          isLoading: false,
          motherName: profileResult.data?.mother_name || '',
          babyName: profileResult.data?.baby_name || ''
        });
      } catch (error) {
        console.error('Error checking tour status:', error);
        setTourState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkTourStatus();
  }, []);

  const startTour = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0
    }));
  }, []);

  const nextStep = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1
    }));
  }, []);

  const prevStep = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1)
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setTourState(prev => ({
      ...prev,
      currentStep: step
    }));
  }, []);

  const completeTour = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('user_preferences')
          .update({ has_completed_tour: true })
          .eq('user_id', session.user.id);
      }
    } catch (error) {
      console.error('Error completing tour:', error);
    }

    setTourState(prev => ({
      ...prev,
      isActive: false,
      hasCompletedTour: true
    }));
  }, []);

  const skipTour = useCallback(async () => {
    await completeTour();
  }, [completeTour]);

  return {
    ...tourState,
    startTour,
    nextStep,
    prevStep,
    goToStep,
    completeTour,
    skipTour
  };
};
