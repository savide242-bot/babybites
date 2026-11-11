import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, ExternalLink, LogOut, Heart, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { toast } from "sonner";

export const SubscriptionPaywallModal: React.FC = () => {
  const { isAdmin } = useAdminRole();
  const [isLocked, setIsLocked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>("Membership");
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLocked(false);
        return;
      }

      const email = (user.email || "").toLowerCase().trim();
      setUserEmail(email);

      // Super admin or admin is never locked
      if (email === "octaviomoiane2007@gmail.com" || isAdmin) {
        setIsLocked(false);
        return;
      }

      const meta = user.user_metadata || {};
      const status = (meta.subscription_status || "").toLowerCase();
      const expiresAt = meta.subscription_expires_at ? new Date(meta.subscription_expires_at) : null;
      const now = new Date();

      if (meta.subscription_plan_name) {
        setPlanName(meta.subscription_plan_name);
      } else if (meta.subscription_plan === "annual") {
        setPlanName("Annual Plan ($49.99/yr)");
      } else if (meta.subscription_plan === "monthly") {
        setPlanName("Monthly Plan ($5.00/mo)");
      }

      // Also check profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_banned, banned_reason")
        .eq("id", user.id)
        .maybeSingle();

      const isProfileBanned = profile?.is_banned && profile?.banned_reason === "subscription_past_due";
      const isStatusPastDue = status === "past_due" || status === "canceled" || status === "expired";
      const isTimeExpired = expiresAt && expiresAt < now;

      if (isProfileBanned || isStatusPastDue || isTimeExpired) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch (err) {
      console.warn("Subscription check notice:", err);
    }
  };

  useEffect(() => {
    checkStatus();

    // Recheck on visibility change or focus
    const handleFocus = () => checkStatus();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [isAdmin]);

  const handleRefreshCheck = async () => {
    setIsChecking(true);
    await checkStatus();
    await new Promise((r) => setTimeout(r, 600));
    setIsChecking(false);

    const { data: { user } } = await supabase.auth.getUser();
    const status = user?.user_metadata?.subscription_status;
    if (status === "active") {
      toast.success("Welcome back! Your payment has been confirmed and access restored. 🎉");
      setIsLocked(false);
    } else {
      toast.info("Payment not yet confirmed by Hotmart. Please verify your invoice or update your card.");
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch {
      window.location.href = "/auth";
    }
  };

  if (!isLocked) return null;

  return (
    <Dialog open={isLocked} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md p-0 overflow-hidden bg-white dark:bg-[#161c18] border border-[#EBE8DF] dark:border-stone-800 rounded-[32px] shadow-2xl [&>button]:hidden text-stone-900 dark:text-stone-100"
      >
        <div className="relative p-6 sm:p-8 text-center bg-gradient-to-b from-[#FAF9F5] via-white to-white dark:from-[#1b221d] dark:via-[#161c18] dark:to-[#161c18]">
          {/* Lock Icon Badge */}
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4 shadow-sm border border-amber-200 dark:border-amber-800/60">
            <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/60 px-3.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/60">
            Membership On Hold
          </span>

          <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mt-3">
            Subscription Renewal Required
          </h2>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-stone-300 mt-2.5 leading-relaxed px-2">
            Your BabyBites membership is temporarily paused due to a pending subscription renewal on Hotmart ({planName}).
          </p>

          {/* Preservation Reassurance Card */}
          <div className="my-5 p-4 rounded-2xl bg-[#EAF5EE] dark:bg-emerald-950/30 border border-[#CCE0D2] dark:border-emerald-800/40 text-left space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Your records are 100% safe:</strong> All your baby's personalized weekly meal plans, favorite recipes, and milestone records are preserved.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Instant reactivation:</strong> As soon as your renewal is processed on Hotmart, your access is unlocked immediately.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <Button
              asChild
              size="lg"
              className="w-full h-12 rounded-full font-bold bg-[#1E5E3A] hover:bg-[#16482c] text-white shadow-md gap-2"
            >
              <a
                href="https://consumer.hotmart.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Update Payment on Hotmart</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleRefreshCheck}
              disabled={isChecking}
              className="w-full h-11 rounded-full text-xs font-semibold border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin text-emerald-600" : ""}`} />
              <span>{isChecking ? "Verifying with Hotmart..." : "I've Renewed, Check Status"}</span>
            </Button>

            <button
              type="button"
              onClick={handleSignOut}
              className="pt-2 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPaywallModal;
