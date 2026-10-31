import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/hooks/useLanguage';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { useDietaryPreferences, DIETARY_OPTIONS } from '@/hooks/useDietaryPreferences';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAutoResubscribe } from '@/hooks/useAutoResubscribe';
import { Settings as SettingsIcon, RefreshCw, Salad, Check, Bell, BellOff, Clock, Shield, Flame, Trophy, CalendarCheck, PartyPopper, Send, Moon } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import ChangePasswordSection from '@/components/auth/ChangePasswordSection';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
};

const Settings = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { forceUpdate, needRefresh } = useServiceWorkerUpdate();
  const { preferences, togglePreference, hasPreference, loading } = useDietaryPreferences();
  const { isSupported, isSubscribed: subscription, subscribe: subscribeToPushNotifications, unsubscribe: unsubscribeFromPushNotifications } = usePushNotifications();
  const { isAdmin } = useAdminRole();
  
  // Auto-resubscribe to push notifications if subscription was lost
  useAutoResubscribe();
  const [updateNotifications, setUpdateNotifications] = useState(false);
  const [checking, setChecking] = useState(false);
  const [engagementPrefs, setEngagementPrefs] = useState({
    checkin_reminder_enabled: true,
    streak_risk_alerts_enabled: true,
    challenge_alerts_enabled: true,
    achievement_celebration_enabled: true
  });
  const [loadingEngagement, setLoadingEngagement] = useState(true);
  const [savingEngagement, setSavingEngagement] = useState(false);

  useEffect(() => {
    setUpdateNotifications(!!subscription);
  }, [subscription]);

  // Load engagement notification preferences
  useEffect(() => {
    const loadEngagementPrefs = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoadingEngagement(false);
          return;
        }

        const { data } = await supabase
          .from('notification_preferences')
          .select('checkin_reminder_enabled, streak_risk_alerts_enabled, challenge_alerts_enabled, achievement_celebration_enabled')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();

        if (data) {
          setEngagementPrefs({
            checkin_reminder_enabled: data.checkin_reminder_enabled ?? true,
            streak_risk_alerts_enabled: data.streak_risk_alerts_enabled ?? true,
            challenge_alerts_enabled: data.challenge_alerts_enabled ?? true,
            achievement_celebration_enabled: data.achievement_celebration_enabled ?? true
          });
        }
      } catch (error) {
        console.error('Error loading engagement prefs:', error);
      } finally {
        setLoadingEngagement(false);
      }
    };

    loadEngagementPrefs();
  }, []);

  const handleEngagementToggle = async (key: keyof typeof engagementPrefs, value: boolean) => {
    setEngagementPrefs(prev => ({ ...prev, [key]: value }));
    setSavingEngagement(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await supabase
        .from('notification_preferences')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id);
        
      toast({
        title: "✅ Preference Saved",
        description: `${key.replace(/_/g, ' ').replace('enabled', '')} ${value ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error saving engagement pref:', error);
      setEngagementPrefs(prev => ({ ...prev, [key]: !value }));
    } finally {
      setSavingEngagement(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const success = await subscribeToPushNotifications();
      setUpdateNotifications(!!success);
    } else {
      await unsubscribeFromPushNotifications();
      setUpdateNotifications(false);
    }
  };

  const handleCheckForUpdates = async () => {
    setChecking(true);
    try {
      await forceUpdate();
      if (!needRefresh) {
        toast({
          title: "✅ You're up to date!",
          description: "BabyBites is running the latest version.",
        });
      }
    } finally {
      setTimeout(() => setChecking(false), 1000);
    }
  };


  const handleNotifyUpdate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('notify-update');
      
      if (error) throw error;
      
      toast({
        title: "✅ Notifications Sent!",
        description: `All users have been notified about the update`,
      });
    } catch (error) {
      console.error('Error notifying update:', error);
      toast({
        title: "❌ Error",
        description: "Failed to send update notifications",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-24 lg:pb-8 bg-gradient-to-b from-background via-peach/5 to-background">
      <div className="container max-w-4xl">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            {t('settings.title')}
          </h1>
        </motion.div>

        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="border border-border/50 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-mint/5 pb-4">
                <CardTitle className="text-base">🌐 Language</CardTitle>
                <CardDescription>Application language settings</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between p-3.5 bg-muted/50 rounded-xl border border-border/30">
                  <div>
                    <p className="font-medium text-sm">Current Language</p>
                    <p className="text-xs text-muted-foreground">The app is available in English</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-3">English</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          {/* Theme & Dark Mode Selection */}
          <motion.div variants={itemVariants}>
            <Card className="border border-border/50 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-mint/5 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Moon className="h-5 w-5 text-primary" />
                  Appearance & Dark Mode
                </CardTitle>
                <CardDescription>Customize the look and feel of BabyBites</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-muted/50 rounded-xl border border-border/30">
                  <div>
                    <p className="font-medium text-sm">Theme Mode</p>
                    <p className="text-xs text-muted-foreground">Select Light, Dark, or System mode</p>
                  </div>
                  <ThemeToggle variant="segmented" className="w-full sm:w-64" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
          <Card className="border border-border/50 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-mint/5 to-secondary/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Salad className="h-5 w-5 text-mint" />
                Dietary Preferences
              </CardTitle>
              <CardDescription>
                Set dietary restrictions for personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {DIETARY_OPTIONS.map((option) => {
                      const isSelected = hasPreference(option.value);
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => togglePreference(option.value)}
                          className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                            isSelected
                              ? option.color + " border-2"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {isSelected && <Check className="h-4 w-4 text-white" />}
                            </div>
                            <span className="font-medium">{option.label}</span>
                          </div>
                          {isSelected && (
                            <Badge variant="default" className="rounded-full">
                              Active
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {preferences.length > 0 && (
                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">Preferences Saved!</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {preferences.map((pref) => {
                          const option = DIETARY_OPTIONS.find((o) => o.value === pref);
                          return (
                            <Badge
                              key={pref}
                              variant="secondary"
                              className={option?.color || ''}
                            >
                              {option?.label}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Recipes matching your preferences will be highlighted with a "Perfect Match" badge
                      </p>
                    </div>
                  )}
                  
                  {preferences.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No dietary preferences selected. Select your restrictions above to get personalized recommendations.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          </motion.div>

          {isAdmin && (
            <motion.div variants={itemVariants}>
            <Card className="border border-primary/20 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Admin Panel
                </CardTitle>
                <CardDescription>
                  Access administrative tools and system management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/admin')}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Open Admin Panel
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Manage users, send notifications, and view activity logs
                </p>
            </CardContent>
          </Card>
          </motion.div>
          )}

          <motion.div variants={itemVariants}>
          <Card className="border border-border/50 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gold/5 to-peach/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-gold" />
                Meal Reminders
              </CardTitle>
              <CardDescription>Customize your notification schedule</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <NotificationPreferences />
            </CardContent>
          </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
          <Card className="border border-border/50 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5 text-primary" />
                Engagement Notifications
              </CardTitle>
              <CardDescription>Stay motivated with helpful reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingEngagement ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CalendarCheck className="h-5 w-5 text-mint" />
                      <div>
                        <p className="font-medium">Daily Check-in Reminders</p>
                        <p className="text-sm text-muted-foreground">
                          Get reminded to log how meals went
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={engagementPrefs.checkin_reminder_enabled} 
                      onCheckedChange={(v) => handleEngagementToggle('checkin_reminder_enabled', v)}
                      disabled={savingEngagement}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Flame className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium">Streak Risk Alerts</p>
                        <p className="text-sm text-muted-foreground">
                          Warning when your streak is at risk
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={engagementPrefs.streak_risk_alerts_enabled} 
                      onCheckedChange={(v) => handleEngagementToggle('streak_risk_alerts_enabled', v)}
                      disabled={savingEngagement}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-sunshine" />
                      <div>
                        <p className="font-medium">Challenge Alerts</p>
                        <p className="text-sm text-muted-foreground">
                          Updates about weekly challenges
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={engagementPrefs.challenge_alerts_enabled} 
                      onCheckedChange={(v) => handleEngagementToggle('challenge_alerts_enabled', v)}
                      disabled={savingEngagement}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <PartyPopper className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Achievement Celebrations</p>
                        <p className="text-sm text-muted-foreground">
                          Celebrate when you earn badges
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={engagementPrefs.achievement_celebration_enabled} 
                      onCheckedChange={(v) => handleEngagementToggle('achievement_celebration_enabled', v)}
                      disabled={savingEngagement}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
          <ChangePasswordSection />
          </motion.div>

          <motion.div variants={itemVariants}>
          <Card className="border border-border/50 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-mint/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <RefreshCw className="h-5 w-5 text-secondary" />
                App Updates
              </CardTitle>
              <CardDescription>Manage app updates and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isSupported && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {updateNotifications ? (
                      <Bell className="h-5 w-5 text-primary" />
                    ) : (
                      <BellOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">Update Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new versions are available
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={updateNotifications} 
                    onCheckedChange={handleToggleNotifications}
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <Button 
                  onClick={handleCheckForUpdates} 
                  variant="outline" 
                  className="w-full"
                  disabled={checking}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Checking...' : 'Check for Updates'}
                </Button>
                
                
                {isAdmin && updateNotifications && (
                  <Button 
                    onClick={handleNotifyUpdate} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Notify All Users About Update
                  </Button>
                )}
              </div>
              
              {needRefresh && (
                <div className="p-4 bg-primary/10 border-2 border-primary/20 rounded-xl">
                  <p className="text-sm font-medium text-primary mb-2">
                    🎉 Update Available!
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    A new version is ready to install
                  </p>
                  <Button 
                    onClick={forceUpdate} 
                    size="sm" 
                    className="w-full"
                  >
                    Update Now
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Updates are applied automatically. You'll receive a notification when a new version is available.
              </p>
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
