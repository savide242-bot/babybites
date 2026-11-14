import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { z } from "zod";
import FormInput from "./FormInput";

const emailSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
});

interface ForgotPasswordModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal = ({ email, isOpen, onClose }: ForgotPasswordModalProps) => {
  const [resetEmail, setResetEmail] = useState(email);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Reset email when prop changes
  useEffect(() => {
    if (email) setResetEmail(email);
  }, [email]);

  const handleSendResetEmail = async () => {
    setError("");
    const validation = emailSchema.safeParse({ email: resetEmail });
    
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
        redirectTo: redirectUrl
      });
      
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('rate limit') || msg.includes('too many')) {
          setCooldown(60);
          toast.error("Too many requests. Please wait 60 seconds.");
        } else if (msg.includes('email not confirmed')) {
          toast.error("Please confirm your email first before resetting password.");
        } else if (msg.includes('user not found')) {
          // Don't reveal if user exists - still show success for security
          setIsSent(true);
          toast.success("If an account exists, you will receive a reset email.");
          return;
        } else {
          toast.error("Unable to send reset instructions. Please verify your email and try again.");
        }
        return;
      }
      
      setIsSent(true);
      toast.success("BabyBites password reset email sent! Check your inbox.");
      
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setIsSent(false);
    handleSendResetEmail();
  };

  const handleClose = () => {
    setIsSent(false);
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!isSent ? (
          <div className="space-y-6">
            <DialogHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl font-serif">Reset Your Password</DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground">
                Enter your BabyBites registered email address and we'll send you a secure link to create a new password.
              </DialogDescription>
            </DialogHeader>

            <FormInput
              id="resetEmail"
              label="Email address"
              type="email"
              value={resetEmail}
              onChange={setResetEmail}
              error={error}
              icon={Mail}
              placeholder="mom@example.com"
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-full"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendResetEmail}
                className="flex-1 rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white"
                disabled={isLoading || !resetEmail}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#EAF5EE] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#1E5E3A]" />
            </div>
            
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-[#1E5E3A]">Email Sent!</DialogTitle>
              <DialogDescription className="text-base pt-2 text-stone-600">
                Check your inbox at:<br />
                <span className="font-semibold text-foreground">{resetEmail}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Click the secure link in the email from <strong>BabyBites</strong> to reset your password.</p>
              <p>The link expires in <span className="font-medium text-foreground">60 minutes</span>.</p>
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl mt-3 text-left">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Can't find the email? Check your <span className="font-medium">spam or promotions folder</span> or search for <strong>BabyBites</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleClose} className="w-full rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white">
                Back to Sign In
              </Button>
              <button
                onClick={handleResend}
                disabled={cooldown > 0}
                className={`text-sm ${cooldown > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-[#1E5E3A] hover:underline font-medium'}`}
              >
                {cooldown > 0 
                  ? `Wait ${cooldown}s to resend` 
                  : "Didn't receive it? Resend email"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;
