import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Mail, Lock, Loader2, Heart, Star, Users, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import GoogleLogo from "@/components/auth/GoogleLogo";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";
import FormInput from "@/components/auth/FormInput";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import appLogo from "@/assets/logo.png";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address").max(255),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "signup" | "login">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("mother_name, baby_name")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!profile?.mother_name || !profile?.baby_name) {
            navigate("/onboarding", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
          return;
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        if (step === "signup") {
          navigate("/onboarding", { replace: true });
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("mother_name, baby_name")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!profile?.mother_name || !profile?.baby_name) {
            navigate("/onboarding", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, step]);

  const checkEmailExists = async (userEmail: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: { shouldCreateUser: false },
      });
      return !error || !error.message.includes("Signups not allowed");
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
      setStep(exists ? "login" : "signup");
    } catch {
      toast.error("Failed to verify email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setErrors({});
    const validation = signupSchema.safeParse({ email, password, confirmPassword });

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
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
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Account created successfully! Welcome to BabyBites! 🌱");
        navigate("/onboarding", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrors({});
    const validation = loginSchema.safeParse({ email, password });

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrors({ password: "Password or email is incorrect" });
          return;
        }
        throw error;
      }

      if (data.user) {
        toast.success("Welcome back! 💕");
        navigate("/", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  const goBack = () => {
    setStep("email");
    setPassword("");
    setConfirmPassword("");
    setErrors({});
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1E5E3A]" />
          <p className="text-gray-500 text-sm">Loading...</p>
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

      <div className="min-h-screen relative overflow-hidden bg-[#FAF9F5] flex items-center justify-center p-4">
        {/* Subtle botanical background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#48B774]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#1E5E3A]/5 rounded-full blur-3xl" />
        </div>

        {/* Main Auth Card */}
        <div className="w-full max-w-md relative z-10 animate-fade-in-up">
          <div className="bg-white rounded-[32px] p-8 md:p-10 border border-[#EBE8DF] shadow-[0_12px_40px_-8px_rgba(30,94,58,0.08)]">
            {/* Logo */}
            <div className="mb-4 flex justify-center">
              <img
                src={appLogo}
                alt="BabyBites"
                className="w-24 h-24 rounded-full object-cover shadow-xs border border-[#EBE8DF]"
              />
            </div>

            {/* Title Section */}
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-3xl font-serif font-bold text-forest">
                {step === "email"
                  ? "BabyBites"
                  : step === "signup"
                  ? "Create Account"
                  : "Welcome Back"}
              </h1>
              <p className="text-gray-500 text-sm">
                {step === "email"
                  ? "Nourishing your baby's feeding journey"
                  : step === "signup"
                  ? "Choose a secure password to get started"
                  : "Glad to see you again!"}
              </p>

              {/* Social proof for email step */}
              {step === "email" && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5 text-[#48B774]" />
                    <span>300+ families</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>4.9 rating</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Heart className="w-3.5 h-3.5 text-[#1E5E3A] fill-[#1E5E3A]/30" />
                    <span>390+ recipes</span>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 1: Email Input */}
            {step === "email" && (
              <div className="space-y-5">
                <FormInput
                  id="email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                  icon={Mail}
                  placeholder="mama@example.com"
                  autoFocus
                />

                <Button
                  onClick={handleEmailSubmit}
                  disabled={isLoading || !email}
                  size="lg"
                  className="w-full h-12 rounded-full text-base font-semibold bg-[#1E5E3A] hover:bg-[#16482c] text-white shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#EBE8DF]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-400">Or</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 rounded-full text-sm font-semibold border border-[#EBE8DF] hover:bg-gray-50 text-gray-700"
                >
                  <GoogleLogo />
                  <span className="ml-3">Continue with Google</span>
                </Button>
              </div>
            )}

            {/* STEP 2A: Signup */}
            {step === "signup" && (
              <div className="space-y-5 animate-fade-in">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-forest transition-colors mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{email} (Change)</span>
                </button>

                <div className="bg-[#F3F6F3] p-3 rounded-2xl flex items-center gap-2.5 text-xs text-[#1E5E3A]">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#48B774]" />
                  <span>Next: You'll personalize your baby's profile in seconds!</span>
                </div>

                <FormInput
                  id="password"
                  label="Create Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  error={errors.password}
                  icon={Lock}
                  placeholder="At least 8 characters"
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
                  placeholder="Repeat your password"
                />

                <Button
                  onClick={handleSignup}
                  disabled={isLoading || !password || !confirmPassword}
                  size="lg"
                  className="w-full h-12 rounded-full text-base font-semibold bg-[#48B774] hover:bg-[#3ca465] text-white shadow-sm mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account & Continue"
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#EBE8DF]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-400">Or</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 rounded-full text-sm font-semibold border border-[#EBE8DF] hover:bg-gray-50 text-gray-700"
                >
                  <GoogleLogo />
                  <span className="ml-3">Sign up with Google</span>
                </Button>
              </div>
            )}

            {/* STEP 2B: Login */}
            {step === "login" && (
              <div className="space-y-5 animate-fade-in">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-forest transition-colors mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{email} (Change)</span>
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
                    className="text-xs text-[#1E5E3A] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={isLoading || !password}
                  size="lg"
                  className="w-full h-12 rounded-full text-base font-semibold bg-[#1E5E3A] hover:bg-[#16482c] text-white shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#EBE8DF]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-400">Or</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 rounded-full text-sm font-semibold border border-[#EBE8DF] hover:bg-gray-50 text-gray-700"
                >
                  <GoogleLogo />
                  <span className="ml-3">Continue with Google</span>
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            By continuing, you agree to our{" "}
            <a href="#" className="text-forest underline underline-offset-2">Terms</a>
            {" "}and{" "}
            <a href="#" className="text-forest underline underline-offset-2">Privacy Policy</a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;
