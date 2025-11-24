import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Clock, Save } from 'lucide-react';

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

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);
  const [initialPrefs, setInitialPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

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

  const hasChanges = () => {
    return JSON.stringify(prefs) !== JSON.stringify(initialPrefs);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setPrefs(initialPrefs);
    setIsEditing(false);
    setIsSaved(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
            body: `Hi ${motherName}! Your meal reminders are now scheduled. You'll receive notifications at your chosen times.`,
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
      setIsSaved(true);
      setIsEditing(false);

      toast({
        title: "✅ Preferences Saved",
        description: "Your notification times have been updated successfully!",
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

      <p className="text-sm text-muted-foreground">
        Your notification times are automatically scheduled. Edit anytime to adjust your reminders.
      </p>
    </div>
  );
}
