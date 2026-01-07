import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fetchNeedsOnboarding = async (userId: string): Promise<boolean> => {
  // New accounts can briefly have no profile row yet (trigger delay)
  const delays = [0, 200, 400, 800];

  for (const delay of delays) {
    if (delay) await sleep(delay);

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("mother_name, baby_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) continue;
    if (!profile) continue;

    const hasIncompleteProfile =
      !profile.mother_name ||
      !profile.baby_name ||
      profile.mother_name === "User" ||
      profile.baby_name === null;

    return hasIncompleteProfile;
  }

  // If we still can't read a profile, force onboarding rather than showing a blank app.
  return true;
};

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const location = useLocation();

  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [profileChecking, setProfileChecking] = useState(false);

  // IMPORTANT: listener first, then getSession (prevents missing events)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Synchronous state updates only (no Supabase calls here)
      setSession(newSession);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session))
      .finally(() => setAuthReady(true));

    return () => subscription.unsubscribe();
  }, []);

  // Defer profile checks to a separate effect (avoid deadlocks)
  useEffect(() => {
    const isOnOnboardingPage = location.pathname === "/onboarding";

    if (!authReady) return;
    if (!session?.user) {
      setNeedsOnboarding(false);
      setProfileChecking(false);
      return;
    }

    if (isOnOnboardingPage) {
      // Never block rendering the onboarding page.
      setNeedsOnboarding(false);
      setProfileChecking(false);
      return;
    }

    let cancelled = false;
    setProfileChecking(true);

    fetchNeedsOnboarding(session.user.id)
      .then((needs) => {
        if (!cancelled) setNeedsOnboarding(needs);
      })
      .finally(() => {
        if (!cancelled) setProfileChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, session?.user?.id, location.pathname]);

  if (!authReady || profileChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
