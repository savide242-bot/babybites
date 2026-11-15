import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import BannedScreen from "@/components/BannedScreen";

interface PrivateRouteProps {
  children: React.ReactNode;
}

// Two localStorage key variants for compatibility
const isCachedOnboarded = (userId: string): boolean => {
  try {
    return (
      localStorage.getItem(`babybites_user_onboarded_${userId}`) === "true" ||
      localStorage.getItem(`babybites_onboarded_${userId}`) === "true"
    );
  } catch {
    return false;
  }
};

const setCachedOnboarded = (userId: string): void => {
  try {
    localStorage.setItem(`babybites_user_onboarded_${userId}`, "true");
    localStorage.setItem(`babybites_onboarded_${userId}`, "true");
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

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Only insert columns that actually exist in the profiles table
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      dietary_preferences: [],
      timezone,
    },
    { onConflict: "id" }
  );
};

const fetchNeedsOnboarding = async (
  userId: string,
  userMetadata?: Record<string, unknown>
): Promise<boolean> => {
  // 1. Fast path: local cache
  if (isCachedOnboarded(userId)) {
    return false;
  }

  // 2. Fast path: auth metadata flag set during onboarding completion
  if (userMetadata?.onboarding_completed === true) {
    setCachedOnboarded(userId);
    return false;
  }

  // 3. Full DB check — only columns that exist in the schema
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("mother_name, baby_name, baby_birth_date, bio")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return true;
  }

  // 4. Check if bio contains a babies array (existing accounts store babies in bio JSON)
  let hasBabyInBio = false;
  if (profile.bio) {
    try {
      const parsed = JSON.parse(profile.bio);
      if (Array.isArray(parsed.babies) && parsed.babies.length > 0) {
        hasBabyInBio = true;
      }
    } catch {
      // bio is plain text, ignore
    }
  }

  // 5. Profile is complete if:
  //    — has mother_name AND baby_name AND baby_birth_date in columns, OR
  //    — has baby data stored in the bio JSON (existing accounts)
  const hasColumnarData =
    Boolean(profile.mother_name) &&
    Boolean(profile.baby_name) &&
    Boolean(profile.baby_birth_date) &&
    profile.mother_name !== "User" &&
    profile.mother_name !== "Loving Mother" &&
    profile.baby_name !== "My Baby";

  const isComplete = hasColumnarData || hasBabyInBio;

  if (isComplete) {
    setCachedOnboarded(userId);
  }

  return !isComplete;
};

const checkBanStatus = async (
  userId: string
): Promise<{ banned: boolean; reason?: string | null }> => {
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

    // Already verified in this session — skip
    if (checkedUserIdRef.current === currentUserId) {
      return;
    }

    // Fast path via local cache — allow instant mount
    const alreadyOnboarded = isCachedOnboarded(currentUserId);
    if (alreadyOnboarded) {
      checkedUserIdRef.current = currentUserId;
      setNeedsOnboarding(false);
      setProfileChecking(false);
      // Background ban check
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
      // Check ban status first
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
      const needs = await fetchNeedsOnboarding(
        currentUserId,
        session.user.user_metadata as Record<string, unknown>
      );
      if (!cancelled) {
        setNeedsOnboarding(needs);
        checkedUserIdRef.current = currentUserId;
      }
    })().finally(() => {
      if (!cancelled) setProfileChecking(false);
    });

    return () => {
      cancelled = true;
    };
  }, [authReady, session?.user?.id, location.pathname]);

  // Show banned screen
  if (isBanned) {
    return <BannedScreen reason={banReason} />;
  }

  // Only show skeleton on cold boot
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
