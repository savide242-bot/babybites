import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Mail, 
  ShieldCheck, 
  Users, 
  AlertCircle,
  Play,
  Lock,
  Copy
} from 'lucide-react';

export interface BatchMother {
  id: number;
  name: string;
  email: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
  tempPassword?: string;
}

export const INITIAL_FORM_MOTHERS: Omit<BatchMother, 'id' | 'status'>[] = [
  { name: "Temitope Adeyinka", email: "temmyinka2018@gmail.com" },
  { name: "Jessica Spadafora", email: "jspadafora94@gmail.com" },
  { name: "Anme", email: "ankerix1@gmail.com" },
  { name: "Donna Nair", email: "donnanair25@gmail.com" },
  { name: "Kajal Munsamy", email: "Kajal.ramnarain@hotmail.com" },
  { name: "Pavithra Arunbabu", email: "pavithraarunbabu@gmail.com" },
  { name: "Nothando Purity Ngema", email: "ndotha94@gmail.com" },
  { name: "Tendai", email: "tendaisean5@gmail.com" },
  { name: "Salwa Saab", email: "salwa-saab@hotmail.com" },
  { name: "Heather Marinelli", email: "heatheranneclark@live.com" },
  { name: "Kira Preece", email: "kira.preece@hotmail.com" },
  { name: "Portia Ann Rose Curamen", email: "curamen.portia@yahoo.com" },
  { name: "Antarpreet Kaur", email: "antarpreetkaur97@gmail.com" },
  { name: "Jannat Shahzaib", email: "jannatsharif718@gmail.com" },
  { name: "Manasa Katta", email: "manasakatta134@gmail.com" },
  { name: "Jennifer Jarabe", email: "jjarabe888@gmail.com" },
  { name: "Malaika Ntshangase", email: "malaikantshangase@gmail.com" },
  { name: "Fatou Nyass", email: "fienyass@googlemail.com" },
  { name: "Precious ayobo", email: "preciousayobo5@gmail.com" },
  { name: "Emma turner", email: "etrockgal28@gmail.com" },
  { name: "Joy Corpataux", email: "joycorpataux@ymail.com" },
  { name: "Chanice Orlane Giramahoro", email: "chaniceorlanegiramahoro@gmail.com" },
  { name: "Ogunro Omolabake", email: "ogunroomolabake1@gmail.com" },
  { name: "Sania Lalani", email: "sania.lalani1@gmail.com" },
  { name: "Oyebola Omolara", email: "omolaraarewa90@gmail.com" },
  { name: "chinnadandluru Shahida", email: "chinnadandlurushahida@gmail.com" },
  { name: "Sameera Hydrose", email: "sameerasemy143@gmail.com" },
  { name: "Jenny kusnierz", email: "martinjennykusnierz@gmail.com" },
  { name: "Elizabeth Davis", email: "hkpcfamily@gmail.com" },
  { name: "Sarah Gabreau", email: "sarahgabreau@gmail.com" },
  { name: "Titi Adigun", email: "titilayo.adigun@gmail.com" },
];

interface BatchImportMothersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished?: () => void;
}

export const BatchImportMothersModal: React.FC<BatchImportMothersModalProps> = ({
  open,
  onOpenChange,
  onFinished
}) => {
  const [mothers, setMothers] = useState<BatchMother[]>(() =>
    INITIAL_FORM_MOTHERS.map((m, idx) => ({
      id: idx + 1,
      name: m.name,
      email: m.email,
      status: 'idle'
    }))
  );

  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [customMsg] = useState(
    "Congratulations! You have received 7 Days of 100% Free VIP Access to the BabyBites platform! We are delighted to guide you and your baby through wholesome, pediatrician-backed meals, finger-food recipes, allergy trackers, and stress-free weekly grocery planners."
  );

  const successCount = mothers.filter(m => m.status === 'success').length;
  const errorCount = mothers.filter(m => m.status === 'error').length;
  const progressPercent = Math.round((mothers.filter(m => m.status === 'success' || m.status === 'error').length / mothers.length) * 100);

  const runBatchCreation = async (forceResend = false) => {
    setIsRunning(true);
    toast.info(`🚀 Starting forced email dispatch for ${mothers.length} VIP mothers...`);

    const updated = [...mothers];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (!forceResend && item.status === 'success') continue; // Skip only if not forced

      setCurrentIndex(i);
      updated[i] = { ...updated[i], status: 'processing' };
      setMothers([...updated]);

      try {
        // 1. Ensure user account exists in Supabase with standard password 'BabyBites#2026'
        const { data: userData, error: userError } = await supabase.functions.invoke('admin-actions', {
          body: {
            action: 'create_trial_user',
            email: item.email.trim().toLowerCase(),
            motherName: item.name.trim(),
            trialDays: 7,
            customPassword: 'BabyBites#2026',
            customMessage: customMsg
          }
        });

        if (userError) console.warn('User creation response notice:', userError);

        // 2. FORCE SEND WELCOME EMAIL TO MOTHER VIA RESEND (send-email-notification)
        let resendId = '';
        let emailDelivered = false;
        let emailErrString = '';

        try {
          const emailMessage = `
            Congratulations, ${item.name}! 🎉<br><br>
            You have received <strong>7 Days of 100% Free VIP Access</strong> to the complete BabyBites platform!<br><br>
            We are delighted to guide you and your baby through wholesome, pediatrician-backed recipes, allergy trackers, and stress-free weekly meal planners.<br><br>
            <div style="background:#FAF9F5;padding:16px;border-radius:12px;border:1px solid #EBE8DF;margin:16px 0;">
              <strong>🔐 Your Member Login Credentials:</strong><br><br>
              • <strong>Email:</strong> ${item.email}<br>
              • <strong>Temporary Password:</strong> <span style="font-family:monospace;font-size:15px;color:#1E5E3A;font-weight:bold;">BabyBites#2026</span><br>
              • <strong>Access:</strong> 7 Days Free VIP Access
            </div>
            Click the button below to sign in and begin exploring recipes for your baby!
          `;

          const { data: resendData, error: resendError } = await supabase.functions.invoke('send-email-notification', {
            body: {
              to: item.email.trim().toLowerCase(),
              subject: `🥑 Congratulations! You've Unlocked 7 Days of Free VIP Access to BabyBites! ✨`,
              title: `Welcome to BabyBites, ${item.name}! ✨`,
              message: emailMessage,
              actionUrl: 'https://app.babybites.space/auth',
              actionText: 'Open BabyBites & Start Exploring →'
            }
          });

          if (resendError) throw resendError;
          if (resendData?.error) throw new Error(resendData.error);

          emailDelivered = true;
          resendId = resendData?.id || 'delivered';
        } catch (mErr: any) {
          console.error(`Email error for ${item.email}:`, mErr);
          emailErrString = mErr.message || 'Resend error';
        }

        // 3. SEND DIRECT COPY TO SUPER ADMIN (savide242@gmail.com)
        try {
          await supabase.functions.invoke('send-email-notification', {
            body: {
              to: 'savide242@gmail.com',
              subject: `🥑 [Copy] VIP Access Created: ${item.name} (${item.email})`,
              title: `VIP Invitation Sent to ${item.name}`,
              message: `A 7-day VIP Free Trial account has been created for ${item.name} (${item.email}).<br><br>Password: <strong>BabyBites#2026</strong><br>Email Status: ${emailDelivered ? `Sent to mother (ID: ${resendId})` : `Failed (${emailErrString})`}`,
              actionUrl: 'https://app.babybites.space/auth',
              actionText: 'Open BabyBites'
            }
          });
        } catch (copyErr) {
          console.warn('Admin copy dispatch notice:', copyErr);
        }

        updated[i] = {
          ...updated[i],
          status: emailDelivered ? 'success' : 'error',
          tempPassword: 'BabyBites#2026',
          message: emailDelivered 
            ? `✅ Email Delivered (Resend ID: ${resendId})` 
            : `⚠️ Account ready, Resend error: ${emailErrString}`
        };
      } catch (err: any) {
        console.error(`Error processing mother ${item.email}:`, err);
        updated[i] = {
          ...updated[i],
          status: 'error',
          message: err.message || 'Failed to process'
        };
      }

      setMothers([...updated]);
      // Small pause to avoid hitting rate limits on Resend or Supabase Auth
      await new Promise(res => setTimeout(res, 850));
    }

    setIsRunning(false);
    setCurrentIndex(-1);
    toast.success(`🎉 Batch creation completed! ${updated.filter(m => m.status === 'success').length}/${mothers.length} accounts created.`);
    
    // Dispatch summary confirmation email to admin
    try {
      await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'send_quota_alert_email',
          isTest: false,
          usersCount: updated.filter(m => m.status === 'success').length,
          note: `Batch Import Completed: ${updated.filter(m => m.status === 'success').length} of ${mothers.length} VIP Free Trial accounts created with welcome emails sent.`
        }
      });
    } catch (e) {
      console.warn('Notice sending summary to admin:', e);
    }

    if (onFinished) onFinished();
  };

  const handleCopyCredentials = () => {
    const lines = mothers.map((m, idx) => 
      `${idx + 1}. ${m.name} | ${m.email} | Temp Password: ${m.tempPassword || 'BabyBites#2026'}`
    );
    const fullText = `🥑 BabyBites - VIP Trial Accounts (7 Days Free)\n\n${lines.join('\n')}\n\nLogin URL: https://app.babybites.space/auth`;
    
    navigator.clipboard.writeText(fullText);
    toast.success('📋 Copied all 31 credentials and login details to clipboard!');
  };

  const [testingEmail, setTestingEmail] = useState(false);
  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email-notification', {
        body: {
          to: 'savide242@gmail.com',
          subject: '🧪 [Test Resend] BabyBites VIP Email System Verification',
          title: 'Resend Email System Test',
          message: 'Hello Super Admin! If you received this email, the Resend email integration is working perfectly on app.babybites.space.',
          actionUrl: 'https://app.babybites.space/auth',
          actionText: 'Open BabyBites'
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('📧 Test email dispatched to savide242@gmail.com! Check your inbox and spam folder.');
    } catch (err: any) {
      console.error('Email test error:', err);
      toast.error(`❌ Resend Error: ${err.message || 'Check if domain or API key is active'}`);
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isRunning) onOpenChange(val); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 rounded-3xl">
        <DialogHeader className="pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Batch VIP Trial Account Creator
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {mothers.length} Mothers Pre-loaded
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Creates 7-day free trial accounts, dispatches congratulations emails in English with login credentials, and sends a copy to savide242@gmail.com.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Status / Progress Bar */}
        <div className="py-3 px-4 rounded-2xl bg-[#FAF9F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
              <Users className="w-4 h-4 text-emerald-600" />
              Progress: {successCount} Created &bull; {errorCount} Errors &bull; {mothers.length - successCount - errorCount} Pending
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-stone-200 dark:bg-stone-800" />
        </div>

        {/* Mothers Table List */}
        <ScrollArea className="flex-1 max-h-[380px] pr-3">
          <div className="space-y-2">
            {mothers.map((mother, idx) => (
              <div 
                key={mother.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  mother.status === 'processing' 
                    ? 'bg-emerald-50/80 border-emerald-400 shadow-xs'
                    : mother.status === 'success'
                    ? 'bg-white dark:bg-stone-900 border-emerald-200 text-stone-800'
                    : mother.status === 'error'
                    ? 'bg-red-50/60 border-red-200 text-red-900'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-center text-stone-400 font-mono text-[11px] font-bold">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                      {mother.name}
                    </p>
                    <p className="text-stone-500 dark:text-stone-400 font-mono text-[11px] truncate">
                      {mother.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {mother.status === 'idle' && (
                    <Badge variant="outline" className="text-stone-500 text-[10px]">
                      Pending
                    </Badge>
                  )}
                  {mother.status === 'processing' && (
                    <Badge className="bg-amber-100 text-amber-800 animate-pulse text-[10px] gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Creating & Emailing...
                    </Badge>
                  )}
                  {mother.status === 'success' && (
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] gap-1 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Account Created & Emailed
                    </Badge>
                  )}
                  {mother.status === 'error' && (
                    <Badge className="bg-red-100 text-red-800 text-[10px] gap-1">
                      <XCircle className="w-3 h-3 text-red-600" /> {mother.message || 'Error'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Security & Verification Callout */}
        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Copy of all invitations automatically copied to: <strong>savide242@gmail.com</strong></span>
          </div>
          <span className="font-medium text-emerald-700">7 Days Free VIP Trial</span>
        </div>

        <DialogFooter className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isRunning}
              className="rounded-full text-xs font-semibold"
            >
              Close
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCredentials}
              className="rounded-full text-xs font-medium gap-1.5 border-stone-300"
            >
              <Copy className="w-3.5 h-3.5 text-stone-600" />
              <span>Copy 31 Logins</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestEmail}
              disabled={testingEmail || isRunning}
              className="rounded-full text-xs font-medium gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:bg-stone-900"
            >
              <Mail className={`w-3.5 h-3.5 ${testingEmail ? 'animate-spin' : ''}`} />
              <span>{testingEmail ? 'Testing Resend...' : 'Test Email to Admin'}</span>
            </Button>
          </div>

          <Button
            onClick={() => runBatchCreation(successCount === mothers.length)}
            disabled={isRunning}
            className="rounded-full text-xs font-bold gap-2 bg-[#1E5E3A] hover:bg-[#16482c] text-white shadow-sm w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Dispatching ({currentIndex + 1}/{mothers.length})...</span>
              </>
            ) : successCount === mothers.length ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-dispatch Emails (31 Mothers)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>⚡ Force Send English Emails (31 Mothers)</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchImportMothersModal;