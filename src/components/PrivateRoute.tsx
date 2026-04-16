import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import BannedScreen from "@/components/BannedScreen";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ensureUserProfile = async (user: User): Promise<void> => {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      mother_name: fullName,
      dietary_preferences: [],
      timezone,
    },
    { onConflict: "id" }
  );
};

const fetchNeedsOnboarding = async (userId: string): Promise<boolean> => {
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

  return true;
};

const checkBanStatus = async (userId: string): Promise<{ banned: boolean; reason?: string | null }> => {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned, banned_reason")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.is_banned) {
    return { banned: true, reason: profile.banned_reason };
  }
  return { banned: false };
};

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const location = useLocation();

  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [profileChecking, setProfileChecking] = useState(false);

  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session))
      .finally(() => setAuthReady(true));

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const isOnOnboardingPage = location.pathname === "/onboarding";
    const isOnFirstDayPage = location.pathname === "/first-day";

    if (!authReady) return;
    if (!session?.user) {
      setNeedsOnboarding(false);
      setProfileChecking(false);
      setIsBanned(false);
      return;
    }

    if (isOnOnboardingPage || isOnFirstDayPage) {
      setNeedsOnboarding(false);
      setProfileChecking(false);
      return;
    }

    let cancelled = false;
    setProfileChecking(true);

    (async () => {
      // Check ban status FIRST
      const banStatus = await checkBanStatus(session.user.id);
      if (cancelled) return;
      
      if (banStatus.banned) {
        setIsBanned(true);
        setBanReason(banStatus.reason || null);
        // Sign out the banned user
        await supabase.auth.signOut();
        setProfileChecking(false);
        return;
      }

      await ensureUserProfile(session.user);
      const needs = await fetchNeedsOnboarding(session.user.id);
      if (!cancelled) setNeedsOnboarding(needs);
    })()
      .finally(() => {
        if (!cancelled) setProfileChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, session?.user?.id, location.pathname]);

  // Show banned screen — this persists even after sign out
  if (isBanned) {
    return <BannedScreen reason={banReason} />;
  }

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
