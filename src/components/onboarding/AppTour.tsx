import { RefObject, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Heart, BookOpen, Calendar, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TourSpotlight from './TourSpotlight';
import { cn } from '@/lib/utils';

interface TourRefs {
  recipeOfDay?: RefObject<HTMLElement>;
  checkinWidget?: RefObject<HTMLElement>;
  ageCategoriesRef?: RefObject<HTMLElement>;
  recipesNav?: RefObject<HTMLElement>;
  plannerNav?: RefObject<HTMLElement>;
}

interface AppTourProps {
  isActive: boolean;
  currentStep: number;
  motherName: string;
  babyName: string;
  refs: TourRefs;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

const TOTAL_STEPS = 6; // 0: Welcome, 1-4: Features, 5: Conclusion

const AppTour = ({
  isActive,
  currentStep,
  motherName,
  babyName,
  refs,
  onNext,
  onPrev,
  onSkip,
  onComplete
}: AppTourProps) => {
  // Scroll to target element when step changes
  useEffect(() => {
    if (!isActive) return;
    
    const stepRefs: Record<number, RefObject<HTMLElement> | undefined> = {
      1: refs.ageCategoriesRef,
      2: refs.recipeOfDay,
      3: refs.recipesNav,
      4: refs.plannerNav,
    };

    const targetRef = stepRefs[currentStep];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, isActive, refs]);

  if (!isActive) return null;

  const displayName = motherName || 'Mom';
  const babyDisplayName = babyName || 'your baby';

  // Welcome Modal (Step 0)
  if (currentStep === 0) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-md bg-card rounded-3xl p-8 shadow-xl border border-border"
          >
            {/* Skip button */}
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Welcome content */}
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-peach/30 flex items-center justify-center"
              >
                <Heart className="w-10 h-10 text-primary" />
              </motion.div>

              <div className="space-y-3">
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold text-foreground"
                >
                  Welcome, {displayName}! 💕
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground leading-relaxed"
                >
                  We know how much you care about {babyDisplayName}'s health and nutrition. 
                  Let me show you around in 30 seconds!
                </motion.p>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="pt-4 space-y-3"
              >
                <Button
                  onClick={onNext}
                  className="w-full h-12 rounded-2xl text-base font-semibold gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Show Me Around
                </Button>
                
                <button
                  onClick={onSkip}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip tour
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Conclusion Modal (Step 5)
  if (currentStep === TOTAL_STEPS - 1) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-md bg-card rounded-3xl p-8 shadow-xl border border-border"
          >
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="text-6xl"
              >
                🎉
              </motion.div>

              <div className="space-y-3">
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-foreground"
                >
                  You're all set!
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground leading-relaxed"
                >
                  Start exploring recipes and planning {babyDisplayName}'s meals. 
                  You've got this! 💪
                </motion.p>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-4"
              >
                <Button
                  onClick={onComplete}
                  className="w-full h-12 rounded-2xl text-base font-semibold gap-2"
                >
                  Start Exploring
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Feature spotlight steps (1-4)
  const stepConfigs: Record<number, { 
    ref?: RefObject<HTMLElement>; 
    title: string; 
    description: string; 
    icon: React.ReactNode;
    position?: 'top' | 'bottom';
  }> = {
    1: {
      ref: refs.ageCategoriesRef,
      title: "Recipes by Age",
      description: `Here you find recipes perfect for ${babyDisplayName}'s age. Tap a circle to explore!`,
      icon: <ChefHat className="w-5 h-5" />,
      position: 'bottom'
    },
    2: {
      ref: refs.recipeOfDay,
      title: "Today's Recipe",
      description: `Every day we pick a perfect recipe for ${babyDisplayName}. Tap to see ingredients!`,
      icon: <Heart className="w-5 h-5" />,
      position: 'bottom'
    },
    3: {
      ref: refs.recipesNav,
      title: "All Recipes",
      description: "Here you find 300+ recipes! Filter by age, ingredients, and prep time.",
      icon: <BookOpen className="w-5 h-5" />,
      position: 'top'
    },
    4: {
      ref: refs.plannerNav,
      title: "Meal Planner",
      description: "Here you can plan the whole week! We've already created your first plan.",
      icon: <Calendar className="w-5 h-5" />,
      position: 'top'
    },
  };

  const currentConfig = stepConfigs[currentStep];
  const totalFeatureSteps = TOTAL_STEPS - 2; // Exclude welcome and conclusion

  return (
    <TourSpotlight
      targetRef={currentConfig?.ref}
      isActive={isActive}
      position={currentConfig?.position || 'bottom'}
    >
      <div className="bg-card rounded-2xl p-5 shadow-xl border border-border">
        {/* Header with step indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {currentConfig?.icon}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Step {currentStep} of {totalFeatureSteps}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          >
            Skip tour
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2 mb-5">
          <h3 className="text-lg font-semibold text-foreground">
            {currentConfig?.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentConfig?.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {Array.from({ length: totalFeatureSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                step === currentStep 
                  ? "bg-primary w-6" 
                  : step < currentStep 
                    ? "bg-primary/50" 
                    : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              className="flex-1 rounded-xl gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <Button
            size="sm"
            onClick={onNext}
            className={cn(
              "rounded-xl gap-1",
              currentStep === 1 ? "w-full" : "flex-1"
            )}
          >
            {currentStep === totalFeatureSteps ? "Finish" : "Got it!"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </TourSpotlight>
  );
};

export default AppTour;
