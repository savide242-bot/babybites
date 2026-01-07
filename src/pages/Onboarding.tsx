import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { DietaryTag } from "@/hooks/useDietaryPreferences";
import { generateInitialMealPlan } from "@/utils/mealPlanGenerator";

import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import StepMotherName from "@/components/onboarding/steps/StepMotherName";
import StepBabyName from "@/components/onboarding/steps/StepBabyName";
import StepBirthDate from "@/components/onboarding/steps/StepBirthDate";
import StepDietaryPreferences from "@/components/onboarding/steps/StepDietaryPreferences";
import StepReminders, { ReminderSetting, DEFAULT_REMINDERS } from "@/components/onboarding/steps/StepReminders";
import StepWelcome from "@/components/onboarding/steps/StepWelcome";

const TOTAL_STEPS = 6;

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [motherName, setMotherName] = useState("");
  const [babyName, setBabyName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryTag[]>([]);
  const [reminders, setReminders] = useState<ReminderSetting[]>(DEFAULT_REMINDERS);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error("Session expired. Please sign in again.");
        navigate('/auth');
        return;
      }

      // Detect user timezone
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Get full_name from metadata or use mother_name
      const fullName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        motherName.trim() ||
        "User";

      // Use upsert to reliably create or update the profile (prevents loop when profile is missing)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: fullName,
          mother_name: motherName.trim(),
          baby_name: babyName.trim(),
          baby_birth_date: birthDate?.toISOString().split('T')[0],
          dietary_preferences: dietaryPreferences,
          timezone: detectedTimezone,
        }, { onConflict: 'id' });

      if (profileError) throw profileError;

      // Save meal times to baby_meal_times (source of truth for server-side push)
      const mealTimesToInsert = reminders.map(reminder => ({
        user_id: session.user.id,
        meal_type: reminder.id,
        enabled: reminder.enabled,
        preferred_hour: reminder.hour,
        preferred_minute: reminder.minute,
      }));

      // Upsert each meal time
      for (const mealTime of mealTimesToInsert) {
        const { error: mealTimeError } = await supabase
          .from('baby_meal_times')
          .upsert(mealTime, {
            onConflict: 'user_id,meal_type'
          });

        if (mealTimeError) {
          console.error('Error saving meal time:', mealTimeError);
        }
      }

      console.log(`✅ Saved ${mealTimesToInsert.length} meal times to baby_meal_times`);

      // Generate initial weekly meal plan based on baby's age and dietary preferences
      await generateInitialMealPlan(session.user.id, birthDate, dietaryPreferences);

      toast.success(`Welcome to BabyBites, ${motherName}! 🎉`);
      navigate('/first-day');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Failed to save information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepMotherName
            value={motherName}
            onChange={setMotherName}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <StepBabyName
            value={babyName}
            motherName={motherName}
            onChange={setBabyName}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <StepBirthDate
            value={birthDate}
            babyName={babyName}
            onChange={setBirthDate}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <StepDietaryPreferences
            value={dietaryPreferences}
            babyName={babyName}
            onChange={setDietaryPreferences}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <StepReminders
            value={reminders}
            onChange={setReminders}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 6:
        return (
          <StepWelcome
            motherName={motherName}
            babyName={babyName}
            birthDate={birthDate}
            isLoading={isLoading}
            onComplete={handleComplete}
            onBack={prevStep}
          />
        );
      default:
        // Never return null to avoid blank screens if state gets out of sync
        return (
          <StepMotherName
            value={motherName}
            onChange={setMotherName}
            onNext={nextStep}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 via-pink-200 to-cyan-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-mint/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-2 border-white/50 shadow-2xl">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          
          <div className="min-h-[400px] flex flex-col justify-center">
            {renderStep()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
