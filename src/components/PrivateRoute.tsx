import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [hasError, setHasError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Safety timeout - if auth check takes too long, show error state
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isLoading) {
        console.error("Auth check timed out after 10 seconds");
        setHasError(true);
        setIsLoading(false);
      }
    }, 10000);

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          if (isMountedRef.current) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }
        
        if (isMountedRef.current) {
          setIsAuthenticated(!!session);
        }

        if (session?.user && isMountedRef.current) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('mother_name, baby_name')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileError) {
              console.error("Profile fetch error:", profileError);
              // Continue without profile check - user can still access the app
            }

            if (isMountedRef.current) {
              const hasIncompleteProfile = 
                !profile?.mother_name || 
                !profile?.baby_name || 
                profile?.mother_name === 'User' ||
                profile?.baby_name === null;

              const isOnOnboardingPage = window.location.pathname === '/onboarding';
              
              setNeedsOnboarding(hasIncompleteProfile && !isOnOnboardingPage);
            }
          } catch (profileErr) {
            console.error("Profile check failed:", profileErr);
            // Don't block auth - continue without onboarding redirect
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        if (isMountedRef.current) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMountedRef.current) {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, []);

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

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Connection issue. Please reload.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Reload
          </button>
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
