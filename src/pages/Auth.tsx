import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Mail, User, Lock, Loader2, Calendar, Heart, Star, Users } from "lucide-react";
import { z } from "zod";
import GoogleLogo from "@/components/auth/GoogleLogo";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";
import FormInput from "@/components/auth/FormInput";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import BabyIllustration from "@/components/auth/BabyIllustration";

const emailSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  motherName: z.string().min(2, "Mother's name must be at least 2 characters").max(100),
  babyName: z.string().min(2, "Baby's name must be at least 2 characters").max(100),
  babyBirthDate: z.string().min(1, "Baby's birth date is required").refine((date) => {
    const d = new Date(date);
    const now = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    return d <= now && d >= threeYearsAgo;
  }, "Birth date must be within the last 3 years"),
  email: z.string().email().max(255),
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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required")
});

const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'signup' | 'login'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // User is already authenticated, redirect to home
          navigate("/", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();

    // Listen for auth changes (e.g., after signup with auto-confirm)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Navigate to home on successful sign in
        navigate("/", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      });
      return !error || !error.message.includes('Signups not allowed');
    } catch {
      return false;
    }
  };

  const handleEmailSubmit = async () => {
    setErrors({});
    const validation = emailSchema.safeParse({ email });
    
    if (!validation.success) {
      setErrors({ email: validation.error.errors[0].message });
      return;
    }

    setIsLoading(true);
    try {
      const exists = await checkEmailExists(email);
      setStep(exists ? 'login' : 'signup');
    } catch (error: any) {
      toast.error("Failed to verify email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setErrors({});
    const validation = signupSchema.safeParse({ fullName, motherName, babyName, babyBirthDate, email, password, confirmPassword });
    
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: fullName,
            mother_name: motherName,
            baby_name: babyName,
            baby_birth_date: babyBirthDate
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
      
      if (data.user) {
        toast.success("Account created successfully! Welcome! 🎉");
        // The onAuthStateChange listener will handle navigation
        // If auto-confirm is enabled, session will be created immediately
        if (data.session) {
          navigate("/", { replace: true });
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrors({});
    const validation = loginSchema.safeParse({ email, password });
    
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes("Invalid")) {
          setErrors({ password: "Incorrect password" });
          toast.error("Incorrect password. Try again or reset your password.");
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        toast.success("Welcome back! 💕");
        navigate("/", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
    }
  };

  const goBack = () => {
    setStep('email');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/15 via-peach/20 to-mint/15">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ForgotPasswordModal
        email={email}
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
      
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary/15 via-peach/20 to-mint/15 flex items-center justify-center p-4">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/30 to-mint/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-peach/40 to-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary/40 rounded-full animate-particle-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-mint/50 rounded-full animate-particle-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-accent/40 rounded-full animate-particle-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-peach/50 rounded-full animate-particle-float" style={{ animationDelay: '6s' }} />
        <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-primary/30 rounded-full animate-particle-float" style={{ animationDelay: '8s' }} />
        <div className="absolute top-20 left-20 w-2 h-2 bg-mint/30 rounded-full animate-particle-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-20 w-3 h-3 bg-accent/30 rounded-full animate-particle-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div 
          className="backdrop-blur-xl bg-[var(--glass-bg)] rounded-[32px] p-8 md:p-10 border border-border/50 shadow-2xl"
          style={{ boxShadow: 'var(--shadow-glass), 0 0 60px hsla(var(--primary), 0.1)' }}
        >
          {/* Baby Illustration */}
          <div className="mb-4">
            <BabyIllustration />
          </div>

          {/* Title Section */}
          <div className="text-center space-y-3 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-mint to-primary bg-clip-text text-transparent animate-fade-in">
              {step === 'email' ? 'BabyBites' : step === 'signup' ? 'Join BabyBites' : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              {step === 'email' ? "Your baby's nutrition journey starts here" : 
               step === 'signup' ? 'Create your free account' : 
               'Great to see you again!'}
            </p>
            
            {/* Social proof for email step */}
            {step === 'email' && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>10,000+ moms</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                  <span>4.9 rating</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Heart className="w-3.5 h-3.5 text-primary fill-primary/50" />
                  <span>500+ recipes</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 1: Email Input */}
          {step === 'email' && (
            <div className="space-y-6 animate-fade-in">
              <FormInput
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                error={errors.email}
                icon={Mail}
                placeholder="mom@example.com"
                autoFocus
              />

              <Button
                onClick={handleEmailSubmit}
                disabled={isLoading || !email}
                size="lg"
                className="w-full h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--glass-bg)] px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                size="lg"
                className="w-full h-12 text-base font-semibold border-2 hover:bg-accent"
              >
                <GoogleLogo />
                <span className="ml-3">Continue with Google</span>
              </Button>
            </div>
          )}

          {/* STEP 2A: Signup */}
          {step === 'signup' && (
            <div className="space-y-6 animate-fade-in">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {email}
              </button>

              <FormInput
                id="fullName"
                label="Full Name"
                type="text"
                value={fullName}
                onChange={setFullName}
                error={errors.fullName}
                icon={User}
                placeholder="Your name"
                autoFocus
              />

              <FormInput
                id="motherName"
                label="Mother's Name"
                type="text"
                value={motherName}
                onChange={setMotherName}
                error={errors.motherName}
                icon={User}
                placeholder="Your name as a mother"
              />

              <FormInput
                id="babyName"
                label="Baby's Name"
                type="text"
                value={babyName}
                onChange={setBabyName}
                error={errors.babyName}
                icon={User}
                placeholder="Your baby's name"
              />

              <FormInput
                id="babyBirthDate"
                label="Baby's Birth Date *"
                type="date"
                value={babyBirthDate}
                onChange={setBabyBirthDate}
                error={errors.babyBirthDate}
                icon={Calendar}
                placeholder=""
              />

              <FormInput
                id="password"
                label="Create Password"
                type="password"
                value={password}
                onChange={setPassword}
                error={errors.password}
                icon={Lock}
                placeholder="••••••••"
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
                onClick={handleSignup}
                disabled={isLoading || !fullName || !password || !confirmPassword || !babyBirthDate}
                size="lg"
                className="w-full h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--glass-bg)] px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                size="lg"
                className="w-full h-12 text-base font-semibold border-2 hover:bg-accent"
              >
                <GoogleLogo />
                <span className="ml-3">Sign up with Google</span>
              </Button>
            </div>
          )}

          {/* STEP 2B: Login */}
          {step === 'login' && (
            <div className="space-y-6 animate-fade-in">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {email}
              </button>

              <FormInput
                id="loginPassword"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                error={errors.password}
                icon={Lock}
                placeholder="••••••••"
                autoFocus
              />

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                onClick={handleLogin}
                disabled={isLoading || !password}
                size="lg"
                className="w-full h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--glass-bg)] px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                size="lg"
                className="w-full h-12 text-base font-semibold border-2 hover:bg-accent"
              >
                <GoogleLogo />
                <span className="ml-3">Continue with Google</span>
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">Terms</a>
          {" "}and{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
    </>
  );
};

export default Auth;
