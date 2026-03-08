import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Loader2, Sparkles, X, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import FormInput from "@/components/auth/FormInput";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {

    // Parse hash parameters more robustly - handle both hash and query params
    const hashString = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hashString);
    const queryParams = new URLSearchParams(window.location.search);
    
    // Check for error in URL (from both hash and query)
    const error = hashParams.get('error') || queryParams.get('error');
    const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
    const tokenType = hashParams.get('type') || queryParams.get('type');
    const code = queryParams.get('code'); // For PKCE flow
    
    console.log('🔐 [RESET-PAGE] Parsed params:', { 
      error, 
      errorDescription, 
      hasAccessToken: !!accessToken,
      hasCode: !!code,
      tokenType 
    });
    
    if (error) {
      console.error('🔐 [RESET-PAGE] Error in URL:', error, errorDescription);
      setIsValidToken(false);
      setTokenError(errorDescription?.replace(/\+/g, ' ') || 'Invalid or expired reset link');
      setIsCheckingToken(false);
      return;
    }

    // If we have tokens in URL, set session manually
    const setSessionFromUrl = async (): Promise<boolean> => {
      // Try access_token + refresh_token first
      if (accessToken && refreshToken) {
        console.log('🔐 [RESET-PAGE] Found tokens in URL, setting session...');
        try {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          console.log('🔐 [RESET-PAGE] setSession result:', { data: !!data.session, error: sessionError });
          
          if (sessionError) {
            console.error('🔐 [RESET-PAGE] setSession error:', sessionError);
            throw sessionError;
          }
          
          if (data.session) {
            return true;
          }
        } catch (e) {
          console.error('🔐 [RESET-PAGE] Error setting session:', e);
        }
      }
      
      // Try code exchange for PKCE flow
      if (code) {
        console.log('🔐 [RESET-PAGE] Found code, exchanging for session...');
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          console.log('🔐 [RESET-PAGE] exchangeCode result:', { data: !!data.session, error: exchangeError });
          
          if (exchangeError) {
            console.error('🔐 [RESET-PAGE] exchangeCode error:', exchangeError);
            throw exchangeError;
          }
          
          if (data.session) {
            return true;
          }
        } catch (e) {
          console.error('🔐 [RESET-PAGE] Error exchanging code:', e);
        }
      }
      
      return false;
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 [RESET-PAGE] Auth state changed:', event, !!session);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔐 [RESET-PAGE] PASSWORD_RECOVERY event detected!');
        setIsValidToken(true);
        setIsCheckingToken(false);
      } else if (event === 'SIGNED_IN' && session) {
        console.log('🔐 [RESET-PAGE] SIGNED_IN event with session');
        setIsValidToken(true);
        setIsCheckingToken(false);
      }
    });

    // Main check flow with delay for Supabase to process the hash
    const checkSession = async () => {
      try {
        // CRITICAL: Wait 800ms for Supabase to process the URL hash internally
        console.log('🔐 [RESET-PAGE] Waiting 800ms for Supabase to process hash...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // First try to set session from URL tokens
        const sessionSet = await setSessionFromUrl();
        if (sessionSet) {
          console.log('🔐 [RESET-PAGE] Session set from URL successfully!');
          setIsValidToken(true);
          setIsCheckingToken(false);
          return;
        }
        
        // Check existing session (Supabase may have already processed the hash)
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 [RESET-PAGE] Current session:', !!session);
        
        if (session) {
          setIsValidToken(true);
          setIsCheckingToken(false);
          return;
        }
        
        // No session - check if we have recovery type in URL
        const hasRecoveryType = tokenType === 'recovery' || hashString.includes('type=recovery');
        const hasAccessToken = !!accessToken || hashString.includes('access_token');
        const hasCode = !!code;
        
        console.log('🔐 [RESET-PAGE] Recovery indicators:', { hasRecoveryType, hasAccessToken, hasCode });
        
        // If we have indicators but no session, wait a bit more and retry once
        if (hasAccessToken || hasRecoveryType || hasCode) {
          console.log('🔐 [RESET-PAGE] Has recovery indicators, waiting 500ms more...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            console.log('🔐 [RESET-PAGE] Session found on retry!');
            setIsValidToken(true);
            setIsCheckingToken(false);
            return;
          }
          
          // Still no session - show error
          setIsValidToken(false);
          setTokenError('Reset link may have expired. Please request a new password reset.');
        } else {
          setIsValidToken(false);
          setTokenError('No reset token found. Please request a new password reset link.');
        }
      } catch (error) {
        console.error("🔐 [RESET-PAGE] Session check error:", error);
        setIsValidToken(false);
        setTokenError('Failed to verify reset link. Please try again.');
      } finally {
        // Ensure loading state ends after 3s max
        setTimeout(() => {
          setIsCheckingToken(false);
        }, 3000);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async () => {
    setErrors({});
    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        if (error.message.includes('same as')) {
          toast.error("Please choose a different password from your previous one.");
        } else if (error.message.includes('session')) {
          toast.error("Your reset link has expired. Please request a new one.");
          setIsValidToken(false);
          setTokenError('Reset link expired. Please request a new password reset.');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      toast.success("Password reset successfully! Please log in with your new password.");
      
      // Force logout to invalidate old session and require login with new password
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/auth');
      }, 1500);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-particle-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-mint/40 rounded-full animate-particle-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-primary-glow/30 rounded-full animate-particle-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-mint-glow/30 rounded-full animate-particle-float" style={{ animationDelay: '6s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div 
          className="backdrop-blur-xl bg-[var(--glass-bg)] rounded-[32px] p-8 md:p-10 border border-border/50"
          style={{ boxShadow: 'var(--shadow-glass)' }}
        >
          {isValidToken === false ? (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Invalid or Expired Link</h2>
                <p className="text-muted-foreground">
                  {tokenError || "This password reset link is invalid or has expired. Please request a new one."}
                </p>
              </div>
              <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
                Back to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Icon */}
              <div className="flex justify-center animate-bounce-soft">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-mint flex items-center justify-center shadow-lg">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-mint to-primary bg-clip-text text-transparent">
                  Create New Password
                </h1>
                <p className="text-muted-foreground text-base">
                  Choose a strong password for your account 🔒
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <FormInput
                  id="newPassword"
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  error={errors.password}
                  icon={Lock}
                  placeholder="••••••••"
                  autoFocus
                />

                <PasswordStrengthIndicator password={password} />

                <FormInput
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={errors.confirmPassword}
                  icon={Lock}
                  placeholder="••••••••"
                />

                <Button
                  onClick={handleResetPassword}
                  disabled={isLoading || !password || !confirmPassword}
                  size="lg"
                  className="w-full h-12 text-base font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </div>

              {/* Back to Login */}
              <div className="text-center">
                <button
                  onClick={() => navigate('/auth')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Encrypted</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Safe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
