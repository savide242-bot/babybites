import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Lock, Loader2, Heart, Star, Users, ShieldCheck, Eye, EyeOff, Info } from "lucide-react";
import { z } from "zod";
import GoogleLogo from "@/components/auth/GoogleLogo";
import FormInput from "@/components/auth/FormInput";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import appLogo from "@/assets/logo.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(null);

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
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrors({
            password: "Incorrect email or password. If you just purchased access on Hotmart, check your inbox for your temporary password.",
          });
          return;
        }
        throw error;
      }

      if (data.user) {
        if (data.user.user_metadata?.must_change_password) {
          toast.success("Welcome to BabyBites! 🥑✨", {
            description: "You logged in with your temporary password. You can customize it anytime in Settings.",
          });
        } else {
          toast.success("Welcome back to BabyBites! 💕");
        }
        navigate("/", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in. Please verify your credentials.");
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1E5E3A]" />
          <p className="text-gray-500 text-sm">Verifying session...</p>
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
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-3xl font-serif font-bold text-forest">
                Member Sign In
              </h1>
              <p className="text-gray-500 text-sm">
                Nourishing meals &amp; baby-led weaning for happy little ones
              </p>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-4 pt-1">
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
            </div>

            {/* Exclusive Membership Notice Box */}
            <div className="bg-[#EAF5EE] border border-[#CCE0D2] rounded-2xl p-3.5 mb-6 text-xs text-[#1E5E3A] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#1E5E3A] shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-bold">Verified Member Access Only:</span>
                <p className="text-emerald-900/80">
                  Accounts are automatically created upon purchase on Hotmart. Your temporary login password was sent directly to your email inbox.
                </p>
              </div>
            </div>

            {/* Direct Member Login Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4"
            >
              <FormInput
                id="email"
                label="Member Email"
                type="email"
                value={email}
                onChange={setEmail}
                error={errors.email}
                icon={Mail}
                placeholder="mother@example.com"
                autoFocus
              />

              <div className="space-y-1">
                <div className="relative">
                  <FormInput
                    id="loginPassword"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={setPassword}
                    error={errors.password}
                    icon={Lock}
                    placeholder="Enter password or temporary access code"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-[38px] text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-forest hover:text-emerald-700 font-medium transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                size="lg"
                className="w-full h-12 rounded-full text-base font-semibold bg-[#1E5E3A] hover:bg-[#16482c] text-white shadow-sm mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In to BabyBites"
                )}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#EBE8DF]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400">Or continue with</span>
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

            {/* Non-member guidance */}
            <div className="mt-6 pt-4 border-t border-[#EBE8DF] text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>
                  Didn't receive your email? Check your spam folder or search for <strong>BabyBites</strong>.
                </span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            By continuing, you agree to our{" "}
            <button
              type="button"
              onClick={() => setLegalModal("terms")}
              className="text-forest underline underline-offset-2 hover:text-emerald-700 font-medium"
            >
              Terms
            </button>
            {" "}and{" "}
            <button
              type="button"
              onClick={() => setLegalModal("privacy")}
              className="text-forest underline underline-offset-2 hover:text-emerald-700 font-medium"
            >
              Privacy Policy
            </button>
          </p>

          {/* Legal Information Modal */}
          <Dialog open={legalModal !== null} onOpenChange={(open) => !open && setLegalModal(null)}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl p-6 bg-white dark:bg-[#161c18] border border-[#EBE8DF] dark:border-stone-800">
              <DialogHeader>
                <DialogTitle className="text-lg font-serif font-bold text-forest dark:text-emerald-300">
                  {legalModal === "terms" ? "Terms of Service" : "Privacy Policy"}
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Last updated: 2026 • BabyBites Pediatric Nutrition Platform
                </DialogDescription>
              </DialogHeader>

              <div className="text-xs text-stone-600 dark:text-stone-300 space-y-3 mt-3 leading-relaxed">
                {legalModal === "terms" ? (
                  <>
                    <p>
                      <strong>1. Acceptance of Terms:</strong> By accessing BabyBites, you agree to comply with and be bound by these terms. BabyBites provides educational pediatric meal planning and baby-led weaning recipe guides.
                    </p>
                    <p>
                      <strong>2. Pediatric Medical Disclaimer:</strong> BabyBites is an educational tool and does not substitute for certified pediatric medical advice, clinical diagnosis, or medical treatment. Always consult your pediatrician regarding your baby's specific dietary allergies and developmental readiness.
                    </p>
                    <p>
                      <strong>3. User Accounts:</strong> Membership is granted exclusively through verified checkout. You are responsible for safeguarding your login credentials.
                    </p>
                    <p>
                      <strong>4. Intellectual Property:</strong> All original recipes, nutritional guides, and photography are proprietary to BabyBites.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>1. Information Collection:</strong> We collect only necessary account data (name, email) and optional baby profile milestones (birth date, allergy preferences) to calculate age-appropriate nutrition.
                    </p>
                    <p>
                      <strong>2. Child Privacy &amp; Data Protection:</strong> We adhere to the strictest child privacy standards. Your child's growth measurements and meal records remain private to your account and are never sold or shared with third-party advertisers.
                    </p>
                    <p>
                      <strong>3. Media &amp; Photos:</strong> Photos shared in the Parents Community are compressed to secure WebP format and remain under your ownership. You can permanently delete your posts and photos at any time.
                    </p>
                    <p>
                      <strong>4. Account Deletion:</strong> You have the right to request full account and data deletion at any moment through app settings.
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-end">
                <Button size="sm" onClick={() => setLegalModal(null)} className="bg-forest text-white hover:bg-emerald-800 rounded-full px-5">
                  Understood
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default Auth;
