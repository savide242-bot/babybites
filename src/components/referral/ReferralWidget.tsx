import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Copy, Check, Users, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ReferralWidget = () => {
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReferralData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      // Get or create referral code
      const { data: existingReferrals } = await supabase
        .from('referrals')
        .select('code')
        .eq('referrer_id', session.user.id)
        .limit(1);

      let code = existingReferrals?.[0]?.code;

      if (!code) {
        // Generate unique code
        code = `MOM${session.user.id.slice(0, 6).toUpperCase()}`;
        await supabase.from('referrals').insert({
          referrer_id: session.user.id,
          code,
          status: 'active'
        });
      }

      setReferralCode(code);

      // Count successful referrals
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', session.user.id)
        .eq('status', 'completed');

      setReferralCount(count || 0);
      setIsLoading(false);
    };

    fetchReferralData();
  }, []);

  const handleCopy = async () => {
    const shareText = `Join me on BabyBites! Use my code ${referralCode} to get started 👶🍼\n\nhttps://babybites.app?ref=${referralCode}`;
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'BabyBites - Healthy Baby Meals',
      text: `Join me on BabyBites! Use my code ${referralCode} to get started 👶🍼`,
      url: `https://babybites.app?ref=${referralCode}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (isLoading) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="bg-gradient-to-r from-primary to-accent rounded-2xl p-4 shadow-card border border-primary/30 w-full text-left hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Invite a Mom</h3>
                <p className="text-xs text-white/80">Get 50 points per friend!</p>
              </div>
            </div>
            {referralCount > 0 && (
              <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                <Users className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">{referralCount}</span>
              </div>
            )}
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Invite Friends & Earn!
          </DialogTitle>
          <DialogDescription>
            Share your referral code and earn 50 points for each mom who joins!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">Your referral code</p>
            <p className="text-2xl font-bold text-foreground tracking-wider">{referralCode}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" className="flex-1">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button onClick={handleShare} className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <div className="bg-primary/10 rounded-xl p-4">
            <h4 className="font-medium text-sm text-foreground mb-2">How it works:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Share your code with other moms</li>
              <li>• They sign up using your code</li>
              <li>• You both get 50 bonus points!</li>
              <li>• Unlock exclusive badges with referrals</li>
            </ul>
          </div>

          {referralCount > 0 && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                You've invited <span className="font-bold text-primary">{referralCount}</span> friends!
              </p>
              <p className="text-xs text-muted-foreground">
                Total earned: <span className="font-bold text-mint">+{referralCount * 50} points</span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralWidget;
