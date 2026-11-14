import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import BannedScreen from "@/components/BannedScreen";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ONBOARDED_STORAGE_KEY_PREFIX = "babybites_user_onboarded_";

const isCachedOnboarded = (userId: string): boolean => {
  try {
    return localStorage.getItem(`${ONBOARDED_STORAGE_KEY_PREFIX}${userId}`) === "true";
  } catch {
    return false;
  }
};

const setCachedOnboarded = (userId: string, value: boolean): void => {
  try {
    localStorage.setItem(`${ONBOARDED_STORAGE_KEY_PREFIX}${userId}`, value ? "true" : "false");
  } catch {
    // Ignore
  }
};

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
  // If already known to be onboarded from local storage, return false immediately (instant tab switches)
  if (isCachedOnboarded(userId)) {
    return false;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("mother_name, baby_name")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return true;
  }

  const hasIncompleteProfile =
    !profile.mother_name ||
    !profile.baby_name ||
    profile.mother_name === "User" ||
    profile.baby_name === null;

  if (!hasIncompleteProfile) {
    setCachedOnboarded(userId, true);
  }

  return hasIncompleteProfile;
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

  // Tracks the user ID whose profile has already been verified in this session
  // This prevents unmounting and showing white screens on tab / route switches
  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id !== checkedUserIdRef.current) {
        checkedUserIdRef.current = null;
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
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
      checkedUserIdRef.current = null;
      return;
    }

    if (isOnOnboardingPage || isOnFirstDayPage) {
      setNeedsOnboarding(false);
      setProfileChecking(false);
      return;
    }

    const currentUserId = session.user.id;

    // IF ALREADY CHECKED FOR THIS USER: NEVER SHOW SKELETON OR WHITE SCREEN DURING TAB SWITCHING!
    if (checkedUserIdRef.current === currentUserId) {
      return;
    }

    // If local cache confirms user is onboarded, allow instant mount without blocking UI
    const alreadyOnboarded = isCachedOnboarded(currentUserId);
    if (alreadyOnboarded) {
      checkedUserIdRef.current = currentUserId;
      setNeedsOnboarding(false);
      setProfileChecking(false);
      // Run background check without unmounting the app
      checkBanStatus(currentUserId).then((ban) => {
        if (ban.banned) {
          setIsBanned(true);
          setBanReason(ban.reason || null);
          supabase.auth.signOut();
        }
      });
      return;
    }

    let cancelled = false;
    setProfileChecking(true);

    (async () => {
      // Check ban status FIRST
      const banStatus = await checkBanStatus(currentUserId);
      if (cancelled) return;
      
      if (banStatus.banned) {
        setIsBanned(true);
        setBanReason(banStatus.reason || null);
        await supabase.auth.signOut();
        setProfileChecking(false);
        return;
      }

      await ensureUserProfile(session.user);
      const needs = await fetchNeedsOnboarding(currentUserId);
      if (!cancelled) {
        setNeedsOnboarding(needs);
        checkedUserIdRef.current = currentUserId;
      }
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

  // Only show skeleton on first cold boot while reading session
  if (!authReady || (profileChecking && checkedUserIdRef.current !== session?.user?.id)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0f1411]">
        <div className="w-full max-w-md space-y-4 p-6">
          <Skeleton className="h-12 w-full rounded-2xl bg-stone-200/60 dark:bg-stone-800/60" />
          <Skeleton className="h-28 w-full rounded-2xl bg-stone-200/60 dark:bg-stone-800/60" />
          <Skeleton className="h-28 w-full rounded-2xl bg-stone-200/60 dark:bg-stone-800/60" />
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
