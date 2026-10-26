import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles, Check, Lock, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";

const TRIAL_STORAGE_KEY = "babybites_trial_info_v1";

interface TrialInfo {
  isLocked: boolean;
  trialDaysLeft: number;
  planName?: string;
}

export const TrialPaywallModal: React.FC = () => {
  const { isAdmin } = useAdminRole();
  const [isLocked, setIsLocked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    checkTrialStatus();
  }, [isAdmin]);

  const checkTrialStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const email = (user.email || "").toLowerCase().trim();
      setUserEmail(email);

      // Super Admin is never locked
      if (email === "octaviomoiane2007@gmail.com" || isAdmin) {
        setIsLocked(false);
        return;
      }

      // Check localStorage first
      const saved = localStorage.getItem(TRIAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.isLocked) {
            setIsLocked(true);
            return;
          }
        } catch {
          /* ignore */
        }
      }

      // Check profile metadata or session
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        const metadata = (profile as any).subscription_status;
        if (metadata === "expired" || metadata === "locked") {
          setIsLocked(true);
        }
      }
    } catch {
      /* silent */
    }
  };

  if (!isLocked || isAdmin) return null;

  return (
    <Dialog open={isLocked} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md p-0 overflow-hidden bg-white border border-[#EBE8DF] rounded-[32px] shadow-2xl [&>button]:hidden"
      >
        <div className="relative p-6 text-center bg-gradient-to-b from-[#FAF9F5] via-white to-white">
          {/* Lock Icon Badge */}
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-4 shadow-sm border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Free Trial Ended
          </span>

          <h2 className="text-2xl font-serif font-bold text-gray-900 mt-3">
            Unlock Full Access to BabyBites
          </h2>

          <p className="text-xs text-gray-600 mt-2 leading-relaxed px-2">
            Your free trial has ended. Subscribe now to continue nurturing your baby with 389+ pediatrician-approved recipes and smart meal plans.
          </p>

          {/* Benefits List */}
          <div className="my-5 p-4 rounded-2xl bg-[#FAF9F5] border border-[#EBE8DF] text-left space-y-2">
            <div className="flex items-center gap-2.5 text-xs text-gray-800">
              <div className="w-4 h-4 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span><strong>389+ Complete Recipes</strong> (6–8m, 9–11m, 12–23m, 24+m)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-800">
              <div className="w-4 h-4 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span><strong>Personalized 7-Day Weekly Meal Planner</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-800">
              <div className="w-4 h-4 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span><strong>Allergen Tracker & 100 Foods Challenge</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-800">
              <div className="w-4 h-4 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span><strong>Moms Community & Feeding Support</strong></span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2.5">
            <Button
              size="lg"
              onClick={() => {
                window.open("https://hotmart.com", "_blank");
              }}
              className="w-full rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white font-semibold py-3.5 shadow-md flex items-center justify-center gap-2"
            >
              <span>Subscribe on Hotmart ($14.90/mo)</span>
              <ExternalLink className="w-4 h-4" />
            </Button>

            <p className="text-[11px] text-gray-400">
              Already subscribed? Hotmart webhook will unlock your account instantly.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialPaywallModal;
