import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { z } from "zod";
import { Chrome } from "lucide-react";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);

      if (isSignUp) {
        if (!fullName.trim()) {
          toast.error("Please enter your name");
          setLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        toast.success(t('auth.signUpSuccess'));
        
        // Request push notification permission after signup
        await requestNotificationPermission();
        
        navigate("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success(t('auth.signInSuccess'));
        navigate("/");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(t('auth.error'));
      }
    } finally {
      setLoading(false);
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
      toast.error(error.message || t('auth.googleError'));
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Get service worker registration
          const registration = await navigator.serviceWorker.ready;

          // Send welcome notification
          registration.showNotification('Welcome Mom! 👶', {
            body: 'Welcome to BabyBites! We\'re excited to help you on your parenting journey.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          });
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-primary/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? t('auth.signUpDescription') : t('auth.signInDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <Input
                  type="text"
                  placeholder={t('auth.fullName')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <Input
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.loading') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('auth.orContinueWith')}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleAuth}
          >
            <Chrome className="mr-2 h-4 w-4" />
            {t('auth.continueWithGoogle')}
          </Button>

          <div className="mt-4 text-center text-sm">
            {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
            <Button
              variant="link"
              className="p-0"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? t('auth.signIn') : t('auth.signUp')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;