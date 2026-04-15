import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Smartphone, 
  Download, 
  Bell, 
  Settings, 
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'success' | 'error' | 'checking';
  helpText?: string;
  action?: () => void;
  actionLabel?: string;
}

const IOSPushSetup = () => {
  const { isSupported, subscribe: subscribeToPushNotifications } = usePushNotifications();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [iOSVersion, setIOSVersion] = useState<number | null>(null);

  const detectiOSVersion = (): number | null => {
    const match = navigator.userAgent.match(/OS (\d+)_/);
    return match ? parseInt(match[1]) : null;
  };

  const detectPWAMode = (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  };

  const runDiagnostics = async () => {
    setIsChecking(true);
    
    const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const version = detectiOSVersion();
    const pwaMode = detectPWAMode();
    
    setIsIOS(isIOSDevice);
    setIOSVersion(version);
    setIsPWA(pwaMode);
    
    const newChecklist: ChecklistItem[] = [];

    // Check 1: iOS Detection
    newChecklist.push({
      id: 'ios-device',
      title: 'iOS Device',
      description: isIOSDevice ? 'iPhone/iPad detected' : 'Not an iOS device',
      status: isIOSDevice ? 'success' : 'error',
      helpText: !isIOSDevice ? 'Push notifications work best on iOS. On Android, just accept the permission prompt.' : undefined
    });

    // Check 2: iOS Version
    if (isIOSDevice) {
      const hasValidVersion = version !== null && version >= 16;
      newChecklist.push({
        id: 'ios-version',
        title: 'iOS Version',
        description: version ? `iOS ${version} detected` : 'Version not detected',
        status: hasValidVersion ? 'success' : 'error',
        helpText: !hasValidVersion ? 'Push notifications require iOS 16.4 or later. Go to Settings > General > Software Update.' : undefined
      });
    }

    // Check 3: PWA Mode
    newChecklist.push({
      id: 'pwa-mode',
      title: 'Added to Home Screen',
      description: pwaMode ? 'App installed as PWA ✓' : 'Running in browser',
      status: pwaMode ? 'success' : 'error',
      helpText: !pwaMode ? 'To receive notifications, add the app to your Home Screen.' : undefined,
      action: !pwaMode ? () => {
        alert('In Safari:\n1. Tap the Share button (square with arrow)\n2. Scroll down\n3. Tap "Add to Home Screen"\n4. Confirm');
      } : undefined,
      actionLabel: 'View Instructions'
    });

    // Check 4: Notification API
    const hasNotificationAPI = 'Notification' in window;
    newChecklist.push({
      id: 'notification-api',
      title: 'Notification API',
      description: hasNotificationAPI ? 'Supported by browser' : 'Not supported',
      status: hasNotificationAPI ? 'success' : 'error',
      helpText: !hasNotificationAPI ? 'Your browser does not support notifications. Try using Safari.' : undefined
    });

    // Check 5: Permission Status
    if (hasNotificationAPI) {
      const permission = Notification.permission;
      newChecklist.push({
        id: 'permission',
        title: 'Notification Permission',
        description: permission === 'granted' ? 'Allowed ✓' : permission === 'denied' ? 'Blocked' : 'Not requested',
        status: permission === 'granted' ? 'success' : permission === 'denied' ? 'error' : 'pending',
        helpText: permission === 'denied' ? 'Go to Settings > Safari > Notifications and allow this site.' : 
                  permission === 'default' ? 'Click the button below to enable notifications.' : undefined,
        action: permission === 'default' ? async () => {
          await Notification.requestPermission();
          runDiagnostics();
        } : undefined,
        actionLabel: permission === 'default' ? 'Request Permission' : undefined
      });
    }

    // Check 6: Service Worker
    const hasServiceWorker = 'serviceWorker' in navigator;
    let swRegistered = false;
    if (hasServiceWorker) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        swRegistered = !!registration;
      } catch (e) {
        console.error('SW check error:', e);
      }
    }
    newChecklist.push({
      id: 'service-worker',
      title: 'Service Worker',
      description: swRegistered ? 'Registered and active' : hasServiceWorker ? 'Not registered' : 'Not supported',
      status: swRegistered ? 'success' : 'error'
    });

    // Check 7: Push Manager
    let hasPushSubscription = false;
    if (hasServiceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await (registration as any).pushManager.getSubscription();
        hasPushSubscription = !!subscription;
      } catch (e) {
        console.error('Push check error:', e);
      }
    }
    newChecklist.push({
      id: 'push-subscription',
      title: 'Push Subscription',
      description: hasPushSubscription ? 'Active and synced' : 'Not active',
      status: hasPushSubscription ? 'success' : 'pending',
      action: !hasPushSubscription && isSupported ? async () => {
        await subscribeToPushNotifications();
        runDiagnostics();
      } : undefined,
      actionLabel: !hasPushSubscription && isSupported ? 'Activate Now' : undefined
    });

    setChecklist(newChecklist);
    setIsChecking(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const allPassed = checklist.every(item => item.status === 'success');
  const criticalErrors = checklist.filter(item => item.status === 'error');

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'success':
        return <Check className="w-5 h-5 text-mint" />;
      case 'error':
        return <X className="w-5 h-5 text-destructive" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-primary animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  return (
    <div className="min-h-screen pt-16 pb-24">
      <div className="container px-4 max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/settings" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Bell className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">iOS Notification Setup</h1>
            <p className="text-muted-foreground">
              Follow the steps below to enable meal reminders on your iPhone/iPad
            </p>
          </motion.div>
        </div>

        {/* Status Banner */}
        <AnimatePresence mode="wait">
          {allPassed ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-4 bg-mint/10 border border-mint/30 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-mint/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-mint" />
                </div>
                <div>
                  <p className="font-semibold text-mint-foreground">All Set!</p>
                  <p className="text-sm text-muted-foreground">
                    Push notifications are working correctly.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : criticalErrors.length > 0 ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <X className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold text-destructive">{criticalErrors.length} Issue(s) Found</p>
                  <p className="text-sm text-muted-foreground">
                    Resolve the issues below to enable notifications.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Checklist */}
        <div className="space-y-3">
          {checklist.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`overflow-hidden transition-all ${
                item.status === 'success' ? 'bg-mint/5 border-mint/30' :
                item.status === 'error' ? 'bg-destructive/5 border-destructive/30' :
                'bg-card border-border'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium text-foreground">{item.title}</h3>
                        {item.status === 'success' && (
                          <Badge variant="secondary" className="bg-mint/20 text-mint-foreground text-xs">
                            OK
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                      {item.helpText && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 p-2 bg-amber-500/10 rounded-lg">
                          💡 {item.helpText}
                        </p>
                      )}
                      {item.action && item.actionLabel && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={item.action}
                          className="mt-3"
                        >
                          {item.actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <Button
            onClick={runDiagnostics}
            disabled={isChecking}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Check Again'}
          </Button>
        </div>

        {/* iOS Instructions Card */}
        {isIOS && !isPWA && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  How to Add to Home Screen
                </h3>
                
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Open in Safari</p>
                      <p className="text-sm text-muted-foreground">
                        Make sure you're using Safari, not Chrome or another browser.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Tap the Share Button</p>
                      <p className="text-sm text-muted-foreground">
                        The square icon with an arrow pointing up, in the toolbar.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Scroll and Tap "Add to Home Screen"</p>
                      <p className="text-sm text-muted-foreground">
                        It may be further down in the list of options.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold text-sm">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Open the App from Home Screen</p>
                      <p className="text-sm text-muted-foreground">
                        Now you can set up push notifications!
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Tips */}
        <div className="mt-8 p-4 bg-muted/30 rounded-2xl">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            Quick Tips
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Safari Private Mode doesn't support push notifications.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Check if Focus Mode isn't blocking notifications.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Notifications work even when the app is closed.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IOSPushSetup;
