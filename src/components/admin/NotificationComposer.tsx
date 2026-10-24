import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Send, TestTube, Loader2 } from 'lucide-react';
import NotificationHistory from './NotificationHistory';

const NotificationComposer = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!title || !body) {
      toast({ title: 'Required fields', description: 'Fill in title and message', variant: 'destructive' });
      return;
    }

    setTesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Trigger local system notification immediately via Service Worker
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title || '🥑 BabyBites', {
            body: body || 'Test notification delivery!',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            data: { url: '/' },
          });
          toast({ title: '✅ Push Delivered', description: 'System notification displayed on your device!' });
        } catch (swErr) {
          console.warn('Local SW notification error:', swErr);
        }
      }

      // 2. Also try invoking the server edge function if available
      try {
        if (user) {
          await supabase.functions.invoke('test-push-notification', {
            body: { userId: user.id, title, body, icon: '/icon-192x192.png' },
          });
        }
      } catch (fnErr) {
        console.warn('Server function invoke notice:', fnErr);
      }
    } catch (error: any) {
      console.error('Test notification error:', error);
      toast({ title: 'Test Notice', description: error?.message || 'Check notification permissions', variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const handleSend = async () => {
    if (!title || !body) {
      toast({ title: 'Required fields', description: 'Fill in title and message', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      await supabase.auth.refreshSession();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated — please log in again');

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roleData) throw new Error('Admin permission required');

      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('notify-all-users', {
        body: { title, body },
      });
      const duration = Date.now() - startTime;

      if (error) throw new Error(error.message || JSON.stringify(error));
      if (data?.error) throw new Error(data.error);

      toast({
        title: '✅ Notifications Sent',
        description: `Sent: ${data?.successful || 0} | Failed: ${data?.failed || 0} | Expired: ${data?.expired || 0} | ${duration}ms`,
      });

      setTitle('');
      setBody('');
    } catch (error: any) {
      console.error('Send notification error:', error);
      toast({ title: 'Send Failed', description: error?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Push Notification</CardTitle>
          <CardDescription>
            Send a push notification to all subscribed users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Feature Available!"
              maxLength={50}
            />
            <span className="text-xs text-muted-foreground">{title.length}/50</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Check out our new recipe collection..."
              rows={4}
              maxLength={200}
            />
            <span className="text-xs text-muted-foreground">{body.length}/200</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleTest} variant="secondary" disabled={testing || !title || !body} className="flex-1">
              {testing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
              ) : (
                <><TestTube className="mr-2 h-4 w-4" /> Test on Me</>
              )}
            </Button>
            <Button onClick={handleSend} disabled={sending || !title || !body} className="flex-1">
              {sending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Send to All</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <NotificationHistory />
    </div>
  );
};

export default NotificationComposer;
