import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { DietaryTag } from "@/hooks/useDietaryPreferences";
import { generateInitialMealPlan } from "@/utils/mealPlanGenerator";

import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import StepProfileBasics from "@/components/onboarding/steps/StepProfileBasics";
import StepDietaryPreferences from "@/components/onboarding/steps/StepDietaryPreferences";
import StepReminders, { ReminderSetting, DEFAULT_REMINDERS } from "@/components/onboarding/steps/StepReminders";
import StepWelcome from "@/components/onboarding/steps/StepWelcome";

const TOTAL_STEPS = 4;

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [motherName, setMotherName] = useState("");
  const [babyName, setBabyName] = useState("");
  const [birthDateStr, setBirthDateStr] = useState("");
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryTag[]>([]);
  const [reminders, setReminders] = useState<ReminderSetting[]>(DEFAULT_REMINDERS);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const birthDate = birthDateStr ? new Date(birthDateStr) : undefined;

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
        "Parent";

      // Use upsert to reliably create or update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: fullName,
          mother_name: motherName.trim(),
          baby_name: babyName.trim(),
          baby_birth_date: birthDateStr || undefined,
          dietary_preferences: dietaryPreferences,
          timezone: detectedTimezone,
        }, { onConflict: 'id' });

      if (profileError) throw profileError;

      // Save meal times to baby_meal_times
      const mealTimesToInsert = reminders.map(reminder => ({
        user_id: session.user.id,
        meal_type: reminder.id,
        enabled: reminder.enabled,
        preferred_hour: reminder.hour,
        preferred_minute: reminder.minute,
      }));

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

      // Generate initial weekly meal plan based on baby's age and dietary preferences
      await generateInitialMealPlan(session.user.id, birthDate, dietaryPreferences);

      toast.success(`Welcome to BabyBites, ${motherName}! 🌱`);
      navigate('/');
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
          <StepProfileBasics
            motherName={motherName}
            babyName={babyName}
            birthDate={birthDateStr}
            onMotherNameChange={setMotherName}
            onBabyNameChange={setBabyName}
            onBirthDateChange={setBirthDateStr}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <StepDietaryPreferences
            value={dietaryPreferences}
            babyName={babyName || "your baby"}
            onChange={setDietaryPreferences}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <StepReminders
            value={reminders}
            onChange={setReminders}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
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
        return (
          <StepProfileBasics
            motherName={motherName}
            babyName={babyName}
            birthDate={birthDateStr}
            onMotherNameChange={setMotherName}
            onBabyNameChange={setBabyName}
            onBirthDateChange={setBirthDateStr}
            onNext={nextStep}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle botanical background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#48B774]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#1E5E3A]/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border border-[#EBE8DF] bg-white rounded-[32px] shadow-[0_12px_40px_-8px_rgba(30,94,58,0.08)]">
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
