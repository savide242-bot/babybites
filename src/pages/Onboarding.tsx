import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { DietaryTag } from "@/hooks/useDietaryPreferences";
import { generateInitialMealPlan } from "@/utils/mealPlanGenerator";
import { useBabyProfiles } from "@/contexts/BabyProfileContext";

import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import StepProfileBasics from "@/components/onboarding/steps/StepProfileBasics";
import StepWelcome from "@/components/onboarding/steps/StepWelcome";
import { DEFAULT_REMINDERS } from "@/components/onboarding/steps/StepReminders";

const MASTER_SUPER_ADMINS = [
  'octaviomoiane2007@gmail.com',
  'savide242@gmail.com',
];

// Streamlined: 2 steps only — Basics + Welcome
const TOTAL_STEPS = 2;

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [motherName, setMotherName] = useState("");
  const [babyName, setBabyName] = useState("");
  const [birthDateStr, setBirthDateStr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const { refreshBabies } = useBabyProfiles();

  const birthDate = birthDateStr ? new Date(birthDateStr) : undefined;

  // On mount: check if user already has data or is an admin; pre-fill if data exists
  useEffect(() => {
    let isMounted = true;

    const checkExistingProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (isMounted) setIsInitializing(false);
          return;
        }

        const user = session.user;
        const email = user.email?.toLowerCase().trim();

        // Master super admins skip onboarding completely
        if (email && MASTER_SUPER_ADMINS.includes(email)) {
          navigate('/', { replace: true });
          return;
        }

        // Check profiles table for existing mother & baby data
        const { data: profile } = await supabase
          .from('profiles')
          .select('mother_name, baby_name, baby_birth_date, full_name, bio')
          .eq('id', user.id)
          .maybeSingle();

        // Check if user already has babies stored in localStorage or bio
        let hasBabiesInCache = false;
        try {
          const raw = localStorage.getItem(`babybites_babies_${user.id}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) hasBabiesInCache = true;
          }
        } catch {
          // ignore
        }

        // If user already has both mother and baby, skip onboarding!
        const existingMother = profile?.mother_name || user.user_metadata?.mother_name || user.user_metadata?.full_name;
        const existingBaby = profile?.baby_name || user.user_metadata?.baby_name;
        const existingBirthDate = profile?.baby_birth_date || user.user_metadata?.baby_birth_date;

        if (hasBabiesInCache || (existingBaby && existingMother && existingMother !== "User" && existingMother !== "Loving Mother")) {
          // Mark cached
          try {
            localStorage.setItem(`babybites_onboarded_${user.id}`, 'true');
            localStorage.setItem(`babybites_user_onboarded_${user.id}`, 'true');
          } catch {
            // ignore
          }
          navigate('/', { replace: true });
          return;
        }

        // Otherwise prefill what we have so user never sees empty inputs if partial data exists
        if (isMounted) {
          if (existingMother && existingMother !== "User" && existingMother !== "Loving Mother") {
            setMotherName(existingMother);
          }
          if (existingBaby && existingBaby !== "My Baby") {
            setBabyName(existingBaby);
          }
          if (existingBirthDate) {
            setBirthDateStr(existingBirthDate.split('T')[0]);
          }
        }
      } catch (e) {
        console.warn('Error checking existing profile in onboarding:', e);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    checkExistingProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

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

      // Save profile — only columns that actually exist in the DB
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: fullName,
          mother_name: motherName.trim(),
          baby_name: babyName.trim(),
          baby_birth_date: birthDateStr || null,
          timezone: detectedTimezone,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileError) throw profileError;

      // Update user_metadata so Auth session reflects completion instantly
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            mother_name: motherName.trim(),
            baby_name: babyName.trim(),
            baby_birth_date: birthDateStr || null,
            onboarding_completed: true,
          }
        });
      } catch (authMetaErr) {
        console.warn('Could not update user metadata:', authMetaErr);
      }

      // Mark local cache as onboarded (both key variants for compatibility)
      try {
        localStorage.setItem(`babybites_onboarded_${session.user.id}`, 'true');
        localStorage.setItem(`babybites_user_onboarded_${session.user.id}`, 'true');
      } catch (e) {
        console.warn('Could not cache onboarding flag:', e);
      }

      // Sync BabyProfileContext
      try {
        await refreshBabies();
      } catch (refErr) {
        console.warn('Could not refresh baby profile context:', refErr);
      }

      // Save default meal times to baby_meal_times (non-blocking)
      try {
        for (const reminder of DEFAULT_REMINDERS) {
          await supabase
            .from('baby_meal_times')
            .upsert({
              user_id: session.user.id,
              meal_type: reminder.id,
              enabled: reminder.enabled,
              preferred_hour: reminder.hour,
              preferred_minute: reminder.minute,
            }, { onConflict: 'user_id,meal_type' });
        }
      } catch (mealTimesErr) {
        console.warn('Could not save default meal times:', mealTimesErr);
      }

      // Generate initial weekly meal plan (non-blocking)
      try {
        await generateInitialMealPlan(session.user.id, birthDate, []);
      } catch (planErr) {
        console.warn('Could not generate initial meal plan:', planErr);
      }

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

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5]">
        <div className="w-8 h-8 rounded-full border-2 border-[#1E5E3A] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden onboarding-card"
      style={{ backgroundColor: '#FAF9F5', colorScheme: 'light', color: '#111827' }}
    >
      {/* Botanical background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(72,183,116,0.08)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(30,94,58,0.05)' }} />
      </div>

      <Card
        className="w-full max-w-md relative z-10 border border-[#EBE8DF] bg-white rounded-[32px] shadow-[0_12px_40px_-8px_rgba(30,94,58,0.08)]"
        style={{ backgroundColor: '#ffffff', colorScheme: 'light', color: '#111827' }}
      >
        <CardContent className="p-6 sm:p-8 space-y-6" style={{ color: '#111827' }}>
          <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          <div className="min-h-[380px] flex flex-col justify-center">
            {renderStep()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
