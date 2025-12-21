import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { DietaryTag } from "@/hooks/useDietaryPreferences";

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

      // Update profile with all onboarding data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          mother_name: motherName.trim(),
          baby_name: babyName.trim(),
          baby_birth_date: birthDate?.toISOString().split('T')[0],
          dietary_preferences: dietaryPreferences,
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // Save notification preferences
      const enabledReminders = reminders.filter(r => r.enabled);
      
      if (enabledReminders.length > 0) {
        // First delete existing preferences
        await supabase
          .from('notification_preferences')
          .delete()
          .eq('user_id', session.user.id);

        // Insert new preferences
        const preferencesToInsert = reminders.map(reminder => ({
          user_id: session.user.id,
          meal_type: reminder.id,
          enabled: reminder.enabled,
          hour: reminder.hour,
          minute: reminder.minute,
        }));

        const { error: notifError } = await supabase
          .from('notification_preferences')
          .insert(preferencesToInsert);

        if (notifError) {
          console.error('Error saving notification preferences:', notifError);
          // Don't throw, just log - notifications are optional
        }
      }

      toast.success(`Bem-vinda ao BabyBites, ${motherName}! 🎉`);
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
        return null;
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
