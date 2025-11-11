import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { Chrome, Sparkles } from "lucide-react";

const Auth = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

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

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary/10 via-mint/10 to-background flex items-center justify-center p-4">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-particle-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-mint/40 rounded-full animate-particle-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-primary-glow/30 rounded-full animate-particle-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-mint-glow/30 rounded-full animate-particle-float" style={{ animationDelay: '6s' }} />
        <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-primary/20 rounded-full animate-particle-float" style={{ animationDelay: '8s' }} />
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div 
          className="backdrop-blur-xl bg-[var(--glass-bg)] rounded-[32px] p-8 md:p-10 border border-border/50"
          style={{ boxShadow: 'var(--shadow-glass)' }}
        >
          {/* Logo/Icon with Animation */}
          <div className="flex justify-center mb-6 animate-bounce-soft">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-mint flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-mint to-primary bg-clip-text text-transparent">
              Welcome to BabyBites
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Your baby's nutrition journey starts here 💕
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleAuth}
            size="lg"
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-mint to-primary hover:from-mint-glow hover:to-primary-glow text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
          >
            <Chrome className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
            Continue with Google
          </Button>

          {/* Trust Indicator */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              ⭐ Trusted by 10,000+ moms worldwide
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <button className="hover:text-foreground transition-colors">
              Privacy Policy
            </button>
            <span>•</span>
            <button className="hover:text-foreground transition-colors">
              Terms of Service
            </button>
          </div>
        </div>

        {/* Bottom Decorative Text */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          Join our community of caring mothers 🌸
        </p>
      </div>
    </div>
  );
};

export default Auth;
