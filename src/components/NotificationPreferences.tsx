import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Clock, Save, Globe, Bell, Loader2 } from 'lucide-react';

interface NotificationPref {
  meal_type: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

const DEFAULT_PREFS: NotificationPref[] = [
  { meal_type: 'breakfast', hour: 7, minute: 30, enabled: true },
  { meal_type: 'morning-snack', hour: 10, minute: 0, enabled: true },
  { meal_type: 'lunch', hour: 12, minute: 30, enabled: true },
  { meal_type: 'afternoon-snack', hour: 15, minute: 30, enabled: true },
  { meal_type: 'dinner', hour: 18, minute: 0, enabled: true },
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
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);
  const [initialPrefs, setInitialPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [initialTimezone, setInitialTimezone] = useState<string>('UTC');
  const [testingNotification, setTestingNotification] = useState(false);
  const { toast } = useToast();
  const { subscribeToPushNotifications, isSupported } = usePushNotifications();

  useEffect(() => {
    loadPreferences();
    detectAndSaveTimezone();
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
        .single();

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
        console.log(`🌍 Auto-detected timezone: ${detectedTimezone}`);
      }
    } catch (error) {
      console.error('Error detecting timezone:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedPrefs = data.map(d => ({
          meal_type: d.meal_type,
          hour: d.hour,
          minute: d.minute,
          enabled: d.enabled,
        }));
        setPrefs(loadedPrefs);
        setInitialPrefs(loadedPrefs);
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

  const handleTimeChange = (mealType: string, field: 'hour' | 'minute', value: string) => {
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

  const handleTestNotification = async () => {
    setTestingNotification(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "❌ Error",
          description: "You must be logged in to test notifications",
          variant: "destructive",
        });
        return;
      }

      // Check if notifications are permitted
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast({
            title: "⚠️ Permission Denied",
            description: "Please allow notifications in your browser settings",
            variant: "destructive",
          });
          return;
        }
        // Subscribe after permission granted
        await subscribeToPushNotifications();
      }

      const { data, error } = await supabase.functions.invoke('test-push-notification', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "✅ Test Sent!",
          description: "Check for a notification on your device. It may take a few seconds.",
        });
      } else {
        toast({
          title: "⚠️ Test Result",
          description: data?.message || "Notification may not have been delivered",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Test notification error:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setTestingNotification(false);
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

      // Delete existing preferences
      await supabase
        .from('notification_preferences')
        .delete()
        .eq('user_id', user.id);

      // Insert new preferences
      const { error } = await supabase
        .from('notification_preferences')
        .insert(
          prefs.map(p => ({
            user_id: user.id,
            meal_type: p.meal_type,
            hour: p.hour,
            minute: p.minute,
            enabled: p.enabled,
          }))
        );

      if (error) throw error;

      // Auto-subscribe to push notifications if supported
      console.log('🔔 Notification permission:', Notification.permission, 'Supported:', isSupported);
      
      if (isSupported) {
        if (Notification.permission === 'granted') {
          console.log('✅ Permission already granted, subscribing...');
          const subscribed = await subscribeToPushNotifications();
          console.log('📱 Subscription result:', subscribed);
        } else if (Notification.permission === 'default') {
          console.log('❓ Requesting notification permission...');
          const permission = await Notification.requestPermission();
          console.log('🔐 Permission response:', permission);
          
          if (permission === 'granted') {
            console.log('✅ Permission granted, subscribing...');
            const subscribed = await subscribeToPushNotifications();
            console.log('📱 Subscription result:', subscribed);
          } else {
            console.warn('⚠️ Permission denied');
          }
        } else {
          console.warn('🚫 Notification permission was denied previously');
        }
      } else {
        console.warn('❌ Push notifications not supported in this browser');
      }

      // Send confirmation notification with SOUND
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('mother_name')
            .eq('id', user.id)
            .single();

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
                value={pref.hour}
                onChange={(e) => handleTimeChange(pref.meal_type, 'hour', e.target.value)}
                disabled={!pref.enabled || !isEditing}
                className="w-16 px-2 py-1 text-center border rounded bg-background disabled:opacity-50"
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={pref.minute.toString().padStart(2, '0')}
                onChange={(e) => handleTimeChange(pref.meal_type, 'minute', e.target.value)}
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

      {/* Test Notification Button */}
      {isSaved && !isEditing && (
        <div className="pt-4 border-t border-border/50">
          <Button 
            onClick={handleTestNotification}
            disabled={testingNotification}
            variant="outline"
            className="w-full"
          >
            {testingNotification ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Test...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Test Notification Now
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Send a test notification to verify your setup works
          </p>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Your notification times are based on your selected timezone. Edit anytime to adjust your reminders.
      </p>
    </div>
  );
}
