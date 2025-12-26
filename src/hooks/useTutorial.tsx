import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetPath: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'recipes',
    title: 'Explore Recipes',
    description: 'Tap here to discover 300+ baby-friendly recipes tailored to your little one\'s age!',
    targetPath: '/recipes'
  },
  {
    id: 'planner',
    title: 'Plan Your Week',
    description: 'Your personalized meal plan is ready! Tap to view and customize it.',
    targetPath: '/planner'
  },
  {
    id: 'scanner',
    title: 'Scan Any Food',
    description: 'Use AI to check if any food is safe for your baby. Just scan or take a photo!',
    targetPath: '/scanner'
  }
];

export const useTutorial = () => {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentTip, setCurrentTip] = useState<TutorialStep | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTutorialProgress();
  }, []);

  const loadTutorialProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      // Check localStorage for completed tutorial steps
      const stored = localStorage.getItem(`tutorial_${session.user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCompletedSteps(parsed.completedSteps || []);
        
        // Find next uncompleted step
        const nextStep = TUTORIAL_STEPS.find(step => !parsed.completedSteps?.includes(step.id));
        if (nextStep && parsed.completedSteps?.length < TUTORIAL_STEPS.length) {
          setCurrentTip(nextStep);
          setShowTutorial(true);
        }
      } else {
        // First time user - show first tutorial step
        setCurrentTip(TUTORIAL_STEPS[0]);
        setShowTutorial(true);
      }
    } catch (error) {
      console.error('Error loading tutorial progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeStep = async (stepId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const newCompleted = [...completedSteps, stepId];
      setCompletedSteps(newCompleted);
      
      // Save to localStorage
      localStorage.setItem(`tutorial_${session.user.id}`, JSON.stringify({
        completedSteps: newCompleted
      }));

      // Find next step
      const nextStep = TUTORIAL_STEPS.find(step => !newCompleted.includes(step.id));
      if (nextStep) {
        setCurrentTip(nextStep);
      } else {
        setCurrentTip(null);
        setShowTutorial(false);
      }
    } catch (error) {
      console.error('Error completing tutorial step:', error);
    }
  };

  const dismissTutorial = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Mark all as completed
      const allIds = TUTORIAL_STEPS.map(s => s.id);
      setCompletedSteps(allIds);
      setShowTutorial(false);
      setCurrentTip(null);
      
      localStorage.setItem(`tutorial_${session.user.id}`, JSON.stringify({
        completedSteps: allIds
      }));
    } catch (error) {
      console.error('Error dismissing tutorial:', error);
    }
  };

  const resetTutorial = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setCompletedSteps([]);
      setCurrentTip(TUTORIAL_STEPS[0]);
      setShowTutorial(true);
      
      localStorage.removeItem(`tutorial_${session.user.id}`);
    } catch (error) {
      console.error('Error resetting tutorial:', error);
    }
  };

  return {
    currentTip,
    showTutorial,
    completedSteps,
    isLoading,
    completeStep,
    dismissTutorial,
    resetTutorial,
    totalSteps: TUTORIAL_STEPS.length,
    remainingSteps: TUTORIAL_STEPS.length - completedSteps.length
  };
};
