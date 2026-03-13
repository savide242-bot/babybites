import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Clock, Save, Globe, Bell, Loader2, AlertCircle, CheckCircle2, Send, Zap } from 'lucide-react';

interface MealTimePref {
  meal_type: string;
  preferred_hour: number;
  preferred_minute: number;
  enabled: boolean;
}

const DEFAULT_PREFS: MealTimePref[] = [
  { meal_type: 'breakfast', preferred_hour: 7, preferred_minute: 30, enabled: true },
  { meal_type: 'morning-snack', preferred_hour: 10, preferred_minute: 0, enabled: true },
  { meal_type: 'lunch', preferred_hour: 12, preferred_minute: 30, enabled: true },
  { meal_type: 'afternoon-snack', preferred_hour: 15, preferred_minute: 30, enabled: true },
  { meal_type: 'dinner', preferred_hour: 18, preferred_minute: 0, enabled: true },
];

const MEAL_LABELS: Record<string, string> = {
  'breakfast': '🍳 Breakfast',
  'morning-snack': '🍎 Morning Snack',
  'lunch': '🥗 Lunch',
  'afternoon-snack': '🍌 Afternoon Snack',
  'dinner': '🍽️ Dinner',
};

// Common timezones grouped by region
const COMMON_TIMEZONES = [
  // Africa
  { value: 'Africa/Maputo', label: '🇲🇿 Maputo (CAT)' },
  { value: 'Africa/Johannesburg', label: '🇿🇦 Johannesburg (SAST)' },
  { value: 'Africa/Lagos', label: '🇳🇬 Lagos (WAT)' },
  { value: 'Africa/Cairo', label: '🇪🇬 Cairo (EET)' },
  { value: 'Africa/Nairobi', label: '🇰🇪 Nairobi (EAT)' },
  // Europe
  { value: 'Europe/Lisbon', label: '🇵🇹 Lisbon (WET)' },
  { value: 'Europe/London', label: '🇬🇧 London (GMT/BST)' },
  { value: 'Europe/Paris', label: '🇫🇷 Paris (CET)' },
  { value: 'Europe/Berlin', label: '🇩🇪 Berlin (CET)' },
  // Americas
  { value: 'America/New_York', label: '🇺🇸 New York (EST)' },
  { value: 'America/Sao_Paulo', label: '🇧🇷 São Paulo (BRT)' },
  { value: 'America/Los_Angeles', label: '🇺🇸 Los Angeles (PST)' },
  // Asia
  { value: 'Asia/Dubai', label: '🇦🇪 Dubai (GST)' },
  { value: 'Asia/Singapore', label: '🇸🇬 Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: '🇯🇵 Tokyo (JST)' },
  // Oceania
  { value: 'Australia/Sydney', label: '🇦🇺 Sydney (AEST)' },
  // UTC
  { value: 'UTC', label: '🌍 UTC' },
];

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<MealTimePref[]>(DEFAULT_PREFS);
  const [initialPrefs, setInitialPrefs] = useState<MealTimePref[]>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [initialTimezone, setInitialTimezone] = useState<string>('UTC');
  const [sendingMealReminder, setSendingMealReminder] = useState(false);
  const [testingCronJob, setTestingCronJob] = useState(false);
  const [cronJobStatus, setCronJobStatus] = useState<{ success: boolean; sent: number; checkedAt: string } | null>(null);
  
  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<{
    permissionStatus: string;
    hasSubscription: boolean;
    subscriptionCount: number;
    mealTimesCount: number;
  } | null>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);
  
  const { toast } = useToast();
  const { subscribeToPushNotifications, isSupported } = usePushNotifications();

  useEffect(() => {
    loadPreferences();
    detectAndSaveTimezone();
    loadDiagnostics();
  }, []);

  const detectAndSaveTimezone = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's current timezone from browser
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Check if user already has a timezone saved
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.timezone) {
        setUserTimezone(profile.timezone);
        setInitialTimezone(profile.timezone);
      } else {
        // Auto-save detected timezone
        await supabase
          .from('profiles')
          .update({ timezone: detectedTimezone })
          .eq('id', user.id);
        
        setUserTimezone(detectedTimezone);
        setInitialTimezone(detectedTimezone);
        
      }
    } catch (error) {
      console.error('Error detecting timezone:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load from baby_meal_times (the source of truth for push notifications)
      const { data, error } = await supabase
        .from('baby_meal_times')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedPrefs = data.map(d => ({
          meal_type: d.meal_type,
          preferred_hour: d.preferred_hour,
          preferred_minute: d.preferred_minute,
          enabled: d.enabled ?? true,
        }));
        
        // Merge with defaults to ensure all meal types are present
        const mergedPrefs = DEFAULT_PREFS.map(defaultPref => {
          const existing = loadedPrefs.find(p => p.meal_type === defaultPref.meal_type);
          return existing || defaultPref;
        });
        
        setPrefs(mergedPrefs);
        setInitialPrefs(mergedPrefs);
        setIsSaved(true);
      } else {
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get permission status
      const permissionStatus = 'Notification' in window ? Notification.permission : 'unsupported';

      // Check browser subscription
      let hasSubscription = false;
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await (registration as any).pushManager.getSubscription();
          hasSubscription = !!subscription;
        } catch (e) {
          console.error('Error checking subscription:', e);
        }
      }

      // Count subscriptions in backend
      const { count: subscriptionCount } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count meal times in backend
      const { count: mealTimesCount } = await supabase
        .from('baby_meal_times')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('enabled', true);

      setDiagnostics({
        permissionStatus,
        hasSubscription,
        subscriptionCount: subscriptionCount || 0,
        mealTimesCount: mealTimesCount || 0,
      });
    } catch (error) {
      console.error('Error loading diagnostics:', error);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  const handleTimeChange = (mealType: string, field: 'preferred_hour' | 'preferred_minute', value: string) => {
    const numValue = parseInt(value) || 0;
    setPrefs(prev => prev.map(p => 
      p.meal_type === mealType 
        ? { ...p, [field]: numValue }
        : p
    ));
  };

  const handleToggle = (mealType: string) => {
    setPrefs(prev => prev.map(p => 
      p.meal_type === mealType 
        ? { ...p, enabled: !p.enabled }
        : p
    ));
    setIsSaved(false);
  };

  const handleTimezoneChange = (newTimezone: string) => {
    setUserTimezone(newTimezone);
    setIsSaved(false);
  };

  const hasChanges = () => {
    return JSON.stringify(prefs) !== JSON.stringify(initialPrefs) || userTimezone !== initialTimezone;
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setPrefs(initialPrefs);
    setUserTimezone(initialTimezone);
    setIsEditing(false);
    setIsSaved(true);
  };

  const handleSendMealReminderNow = async () => {
    setSendingMealReminder(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "❌ Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      // Call send-meal-reminder edge function (public, no JWT needed)
      const { data, error } = await supabase.functions.invoke('send-meal-reminder', {
        body: { user_id: user.id, meal_type: 'lunch', title: '🍽️ Test Meal Reminder', body: 'This is a test notification to verify delivery!' },
      });

      if (error) throw error;

      if (data?.success || data?.successful > 0) {
        toast({
          title: "✅ Meal Reminder Sent!",
          description: `Push notification delivered to ${data.successful || 1} device(s). Check your device!`,
        });
      } else {
        toast({
          title: "⚠️ No Delivery",
          description: data?.message || "No active push subscriptions found. Make sure notifications are enabled.",
          variant: "destructive",
        });
      }
      
      // Refresh diagnostics
      await loadDiagnostics();
    } catch (error: any) {
      console.error('Send meal reminder error:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to send meal reminder",
        variant: "destructive",
      });
    } finally {
      setSendingMealReminder(false);
    }
  };

  const handleTestCronJob = async () => {
    setTestingCronJob(true);
    setCronJobStatus(null);
    try {
      // Call the check-meal-reminders function directly to test if it works
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-meal-reminders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setCronJobStatus({
          success: true,
          sent: data.sent || 0,
          checkedAt: data.checkedAt || new Date().toISOString(),
        });
        toast({
          title: "✅ Cron Job Working!",
          description: `System checked ${data.sent || 0} notifications. Last check: ${new Date(data.checkedAt).toLocaleTimeString()}`,
        });
      } else {
        toast({
          title: "⚠️ Cron Job Issue",
          description: data.error || "The scheduler may not be working correctly",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Cron job test error:', error);
      toast({
        title: "❌ Connection Error",
        description: "Could not reach the notification scheduler",
        variant: "destructive",
      });
    } finally {
      setTestingCronJob(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save timezone to profile
      await supabase
        .from('profiles')
        .update({ timezone: userTimezone })
        .eq('id', user.id);

      // Save to baby_meal_times (the source of truth for server-side push)
      for (const pref of prefs) {
        await supabase
          .from('baby_meal_times')
          .upsert({
            user_id: user.id,
            meal_type: pref.meal_type,
            preferred_hour: pref.preferred_hour,
            preferred_minute: pref.preferred_minute,
            enabled: pref.enabled,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,meal_type'
          });
      }

      // Auto-subscribe to push notifications if supported

      if (isSupported) {
        if (Notification.permission === 'granted') {
          await subscribeToPushNotifications();
        } else if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            await subscribeToPushNotifications();
          }
        }
      }

      // Send confirmation notification with SOUND
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('mother_name')
            .eq('id', user.id)
            .maybeSingle();

          const motherName = profile?.mother_name || '';
          
          await registration.showNotification('✅ Notification System Activated!', {
            body: `Hi ${motherName}! Your meal reminders are now scheduled for your timezone (${userTimezone}).`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'notification-activated',
            requireInteraction: false,
            silent: false,
            data: { url: '/settings' }
          });
        } catch (notifError) {
          console.error('Failed to send confirmation notification:', notifError);
        }
      }

      setInitialPrefs(prefs);
      setInitialTimezone(userTimezone);
      setIsSaved(true);
      setIsEditing(false);

      toast({
        title: "✅ Preferences Saved",
        description: `Your notification times have been updated for timezone ${userTimezone}!`,
      });
      
      // Refresh diagnostics
      await loadDiagnostics();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "❌ Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5" />
          <span>Meal Reminder Times</span>
          {isSaved && !isEditing && (
            <span className="text-sm font-normal px-2 py-1 rounded-full bg-green-500/20 text-green-600">
              ✅ Saved
            </span>
          )}
          {isEditing && (
            <span className="text-sm font-normal px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600">
              ✏️ Editing
            </span>
          )}
        </div>
      </div>

      {/* Timezone Selector */}
      <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-primary" />
          <Label className="font-medium">Your Timezone</Label>
        </div>
        <select
          value={userTimezone}
          onChange={(e) => handleTimezoneChange(e.target.value)}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-lg bg-background disabled:opacity-50"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-2">
          Notifications will be sent based on this timezone
        </p>
      </div>

      <div className="space-y-4">
        {prefs.map((pref) => (
          <div key={pref.meal_type} className={`flex items-center justify-between p-4 bg-muted/50 rounded-lg transition-all ${!isEditing && isSaved ? 'opacity-75' : ''}`}>
            <div className="flex items-center gap-4 flex-1">
              <Switch
                checked={pref.enabled}
                onCheckedChange={() => handleToggle(pref.meal_type)}
                disabled={!isEditing}
              />
              <Label className="font-medium">{MEAL_LABELS[pref.meal_type]}</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="23"
                value={pref.preferred_hour}
                onChange={(e) => handleTimeChange(pref.meal_type, 'preferred_hour', e.target.value)}
                disabled={!pref.enabled || !isEditing}
                className="w-16 px-2 py-1 text-center border rounded bg-background disabled:opacity-50"
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={pref.preferred_minute.toString().padStart(2, '0')}
                onChange={(e) => handleTimeChange(pref.meal_type, 'preferred_minute', e.target.value)}
                disabled={!pref.enabled || !isEditing}
                className="w-16 px-2 py-1 text-center border rounded bg-background disabled:opacity-50"
              />
            </div>
          </div>
        ))}
      </div>

      {isEditing ? (
        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges()} 
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button 
            onClick={handleCancel} 
            disabled={saving}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button onClick={handleEdit} className="w-full">
          Edit Preferences
        </Button>
      )}

      {/* Diagnostics Section */}
      {isSaved && !isEditing && (
        <div className="pt-4 border-t border-border/50 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4" />
            Push Notification Status
          </div>
          
          {loadingDiagnostics ? (
            <div className="text-sm text-muted-foreground">Loading status...</div>
          ) : diagnostics && (
            <div className="space-y-3">
              {/* iOS Detection Warning */}
              {!isSupported && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-700 dark:text-amber-400">Push Not Available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {/iPhone|iPad/.test(navigator.userAgent) ? (
                          <>
                            <strong>iOS Requirements:</strong><br/>
                            • iOS 16.4 or later<br/>
                            • App installed on Home Screen (PWA)<br/>
                            • Safari → Settings → Web Push (enable)
                          </>
                        ) : (
                          "Your browser does not support push notifications."
                        )}
                      </p>
                      {/iPhone|iPad/.test(navigator.userAgent) && (
                        <a 
                          href="/ios-push-setup" 
                          className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
                        >
                          See setup guide →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status Grid */}
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {diagnostics.permissionStatus === 'granted' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span>Permission: <strong>{diagnostics.permissionStatus}</strong></span>
                </div>
                
                <div className="flex items-center gap-2">
                  {diagnostics.hasSubscription ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Browser subscription: <strong>{diagnostics.hasSubscription ? 'Active' : 'None'}</strong></span>
                </div>
                
                <div className="flex items-center gap-2">
                  {diagnostics.subscriptionCount > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Server subscriptions: <strong>{diagnostics.subscriptionCount}</strong></span>
                </div>
                
                <div className="flex items-center gap-2">
                  {diagnostics.mealTimesCount > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span>Enabled meal times: <strong>{diagnostics.mealTimesCount}</strong></span>
                </div>
              </div>

              {/* Test Buttons */}
              {isSupported && diagnostics.permissionStatus === 'granted' && diagnostics.subscriptionCount > 0 && (
                <div className="space-y-2">
                  <Button 
                    onClick={handleSendMealReminderNow}
                    disabled={sendingMealReminder}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {sendingMealReminder ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Test Push Notification
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleTestCronJob}
                    disabled={testingCronJob}
                    variant="outline"
                    size="sm"
                    className="w-full border-gold/50 hover:bg-gold/10"
                  >
                    {testingCronJob ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing Scheduler...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2 text-gold" />
                        Test Notification Scheduler
                      </>
                    )}
                  </Button>
                  
                  {cronJobStatus && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Scheduler Active</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last check: {new Date(cronJobStatus.checkedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Your notification times are based on your selected timezone. Edit anytime to adjust your reminders.
      </p>
    </div>
  );
}
