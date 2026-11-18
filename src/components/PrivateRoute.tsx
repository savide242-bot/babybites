import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import BannedScreen from "@/components/BannedScreen";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const MASTER_SUPER_ADMINS = [
  'octaviomoiane2007@gmail.com',
  'savide242@gmail.com',
];

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
  userMetadata?: Record<string, unknown>,
  email?: string
): Promise<boolean> => {
  // 1. Fast path: Master super admins NEVER need onboarding
  if (email && MASTER_SUPER_ADMINS.includes(email.toLowerCase().trim())) {
    setCachedOnboarded(userId);
    return false;
  }

  // 2. Fast path: local cache
  if (isCachedOnboarded(userId)) {
    return false;
  }

  // 3. Fast path: auth metadata flag set during onboarding completion
  if (userMetadata?.onboarding_completed === true) {
    setCachedOnboarded(userId);
    return false;
  }

  // 4. Check if user already has baby profiles stored in localStorage (existing users)
  try {
    const rawBabies = localStorage.getItem(`babybites_babies_${userId}`);
    if (rawBabies) {
      const parsed = JSON.parse(rawBabies);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCachedOnboarded(userId);
        return false;
      }
    }
  } catch {
    // ignore
  }

  // 5. Full DB check — only columns that exist in the schema
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("mother_name, baby_name, baby_birth_date, bio, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    // If not a blank VIP gift, never force into onboarding on DB error
    if (userMetadata?.source !== "admin_vip_gift") {
      setCachedOnboarded(userId);
      return false;
    }
    return true;
  }

  // 6. Check if bio contains a babies array (existing accounts store babies in bio JSON)
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

  // 7. Determine baby and mother completeness
  const hasExistingBaby = Boolean(profile.baby_name && profile.baby_name.trim().length > 0 && profile.baby_name !== "My Baby");
  const hasBabyBirthDate = Boolean(profile.baby_birth_date);
  const hasExistingMother = Boolean(profile.mother_name && profile.mother_name.trim().length > 0 && profile.mother_name !== "Loving Mother" && profile.mother_name !== "User");
  const hasCustomFullName = Boolean(profile.full_name && profile.full_name.trim().length > 0 && !profile.full_name.includes("User") && !profile.full_name.includes("Loving Mother"));

  // Check if this account was gifted via the admin panel
  const isVipGift = userMetadata?.source === "admin_vip_gift";

  if (isVipGift) {
    // Mothers created by admin MUST complete onboarding to provide their baby's name & birthdate
    const hasCompleteBaby = (hasExistingBaby && hasBabyBirthDate) || hasBabyInBio;
    if (hasCompleteBaby) {
      setCachedOnboarded(userId);
      return false;
    }
    // No baby data yet -> show onboarding so the mother can register her baby
    return true;
  }

  // 8. For manual signups and existing accounts, do not force onboarding if any profile data exists
  const isComplete =
    hasBabyInBio ||
    hasExistingBaby ||
    (hasExistingMother && hasBabyBirthDate) ||
    (hasExistingMother && hasCustomFullName);

  if (isComplete || hasExistingMother || hasCustomFullName) {
    setCachedOnboarded(userId);
    return false;
  }

  return true;
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
        session.user.user_metadata as Record<string, unknown>,
        session.user.email
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
