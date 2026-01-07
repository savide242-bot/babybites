import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const location = useLocation();

  const checkProfile = async (userId: string, retryCount = 0): Promise<boolean> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('mother_name, baby_name')
      .eq('id', userId)
      .single();

    // If profile doesn't exist and we haven't retried too much, wait and retry
    // (The profile might still be creating via trigger)
    if (error && retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 200 * (retryCount + 1)));
      return checkProfile(userId, retryCount + 1);
    }

    const hasIncompleteProfile = 
      !profile?.mother_name || 
      !profile?.baby_name || 
      profile.mother_name === 'User' ||
      profile.baby_name === null;

    return hasIncompleteProfile;
  };

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (!session) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Check if user needs onboarding (skip if already on onboarding page)
        const isOnOnboardingPage = location.pathname === '/onboarding';
        
        if (!isOnOnboardingPage) {
          const needsOnboard = await checkProfile(session.user.id);
          if (mounted) {
            setNeedsOnboarding(needsOnboard);
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      setIsAuthenticated(!!session);
      
      if (session?.user) {
        // Re-check profile on auth change
        const isOnOnboardingPage = location.pathname === '/onboarding';
        if (!isOnOnboardingPage) {
          const needsOnboard = await checkProfile(session.user.id);
          if (mounted) {
            setNeedsOnboarding(needsOnboard);
          }
        }
      } else {
        setNeedsOnboarding(false);
      }
      
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [location.pathname]);

  if (isLoading) {
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

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
