import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, RefreshCw, ExternalLink, LogOut, Heart, Sparkles, 
  CheckCircle2, Clock, Crown, ArrowRight, ShieldCheck, Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { toast } from "sonner";

export const SubscriptionPaywallModal: React.FC = () => {
  const { isAdmin } = useAdminRole();
  const [isLocked, setIsLocked] = useState(false);
  const [lockMode, setLockMode] = useState<"trial_ended" | "subscription_past_due" | "account_suspended">("trial_ended");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [motherName, setMotherName] = useState<string>("");
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
      const plan = (meta.subscription_plan || "").toLowerCase();
      const expiresAt = meta.subscription_expires_at ? new Date(meta.subscription_expires_at) : null;
      const now = new Date();

      if (meta.full_name || meta.mother_name) {
        setMotherName(meta.mother_name || meta.full_name);
      }

      if (meta.subscription_plan_name) {
        setPlanName(meta.subscription_plan_name);
      } else if (plan === "annual") {
        setPlanName("Annual Plan ($49.99/yr)");
      } else if (plan === "monthly") {
        setPlanName("Monthly Plan ($5.00/mo)");
      } else if (plan === "trial") {
        setPlanName("VIP Free Trial");
      }

      // Check profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_banned, banned_reason")
        .eq("id", user.id)
        .maybeSingle();

      const bannedReason = (profile?.banned_reason || meta.banned_reason || "").toLowerCase();
      const isProfileBanned = !!profile?.is_banned;
      const isStatusPastDue = status === "past_due" || status === "canceled";
      const isTrialExpired = (plan === "trial" || status === "trial") && expiresAt && expiresAt < now;
      const isGeneralExpired = status === "expired" || (expiresAt && expiresAt < now);

      if (isTrialExpired || bannedReason.includes("trial")) {
        setLockMode("trial_ended");
        setIsLocked(true);
      } else if (isStatusPastDue || bannedReason.includes("subscription_past_due") || bannedReason.includes("hotmart")) {
        setLockMode("subscription_past_due");
        setIsLocked(true);
      } else if (isProfileBanned || isGeneralExpired) {
        // If it was annual/monthly expired, treat as subscription_past_due
        if (plan === "annual" || plan === "monthly") {
          setLockMode("subscription_past_due");
        } else {
          setLockMode(bannedReason ? "account_suspended" : "trial_ended");
        }
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
      toast.info("Status not updated yet. If you completed a payment, it can take up to 60 seconds to process.");
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
        className="max-w-md p-0 overflow-hidden bg-white dark:bg-[#161c18] border border-[#EBE8DF] dark:border-stone-800 rounded-[32px] shadow-2xl [&>button]:hidden text-stone-900 dark:text-stone-100 max-h-[92vh] overflow-y-auto"
      >
        <div className="relative p-6 sm:p-7 text-center bg-gradient-to-b from-[#FAF9F5] via-white to-white dark:from-[#1b221d] dark:via-[#161c18] dark:to-[#161c18]">
          
          {/* ========================================================
              MODE 1: FREE TRIAL CONCLUDED (VIP GIFT PERIOD ENDED)
          ======================================================== */}
          {lockMode === "trial_ended" && (
            <div>
              {/* Badge Icon */}
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center mb-3 shadow-sm border border-amber-200 dark:border-amber-800/60">
                <Clock className="w-8 h-8 stroke-[2.2]" />
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-3.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/60">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Free Trial Concluded
              </span>

              <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mt-3">
                Your Free Trial Has Ended
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-stone-300 mt-2 leading-relaxed px-1">
                {motherName ? `We hope you and your baby enjoyed your VIP gift access, ${motherName}! ` : "We hope you loved exploring our pediatric recipes and meal plans! "}
                BabyBites is now available to keep your baby's weaning journey supported with two flexible membership plans:
              </p>

              {/* Plans Comparison Card */}
              <div className="my-5 space-y-3 text-left">
                {/* Plan 1: Annual (Best Value) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EAF5EE] to-[#FAF9F5] dark:from-emerald-950/40 dark:to-stone-900 border-2 border-[#1E5E3A] relative shadow-sm">
                  <div className="absolute -top-2.5 right-4 bg-[#1E5E3A] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3" />
                    Best Value &bull; Save 17%
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#1E5E3A] dark:text-emerald-300">
                        Annual VIP Membership
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-stone-300 mt-0.5">
                        Complete access for 12 full months &bull; only $4.16/mo
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">$49.99</div>
                      <div className="text-[10px] text-gray-500 uppercase">per year</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> 395+ recipes &bull; meal planner &bull; offline PWA
                    </span>
                    <Button
                      asChild
                      size="sm"
                      className="rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white text-xs font-bold px-4 h-8 gap-1 shadow"
                    >
                      <a href="https://consumer.hotmart.com" target="_blank" rel="noopener noreferrer">
                        <span>Choose Annual</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Plan 2: Monthly */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-stone-900/60 border border-[#EBE8DF] dark:border-stone-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-base text-gray-900 dark:text-white">
                        Monthly Membership
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-stone-400 mt-0.5">
                        Flexible recurring access &bull; cancel anytime
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">$5.00</div>
                      <div className="text-[10px] text-gray-500 uppercase">per month</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-[11px] text-gray-600 dark:text-stone-400 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> Full access &bull; weekly new recipes
                    </span>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full border-stone-300 dark:border-stone-700 text-xs font-bold px-4 h-8 gap-1"
                    >
                      <a href="https://consumer.hotmart.com" target="_blank" rel="noopener noreferrer">
                        <span>Choose Monthly</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Data Preservation Reassurance */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 text-left text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All your baby's logs, milestone records, and favorites remain safely saved.</span>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshCheck}
                  disabled={isChecking}
                  className="w-full rounded-full text-xs font-medium border-stone-200 dark:border-stone-800 hover:bg-stone-50 gap-2 h-9"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin text-emerald-600" : ""}`} />
                  <span>{isChecking ? "Checking subscription..." : "I've Subscribed, Check Access"}</span>
                </Button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 flex items-center justify-center gap-1.5 mx-auto pt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              MODE 2: HOTMART RENEWAL REQUIRED / PAST DUE
          ======================================================== */}
          {lockMode === "subscription_past_due" && (
            <div>
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
          )}

          {/* ========================================================
              MODE 3: ACCOUNT SUSPENDED
          ======================================================== */}
          {lockMode === "account_suspended" && (
            <div>
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-4 border border-red-200">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mt-2">
                Account Suspended
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-stone-300 mt-2 leading-relaxed px-2">
                Access to this account has been temporarily restricted by administrators. Please reach out to support at access@app.babybites.space if you believe this is an error.
              </p>

              <button
                type="button"
                onClick={handleSignOut}
                className="mt-6 text-xs text-stone-400 hover:text-stone-600 flex items-center justify-center gap-1.5 mx-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPaywallModal;
