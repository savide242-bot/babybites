import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Send, Eye, TestTube, History, Bell } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import NotificationHistory from './NotificationHistory';

const NotificationComposer = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [icon, setIcon] = useState('/icon-192x192.png');
  const [actionLabel, setActionLabel] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [preview, setPreview] = useState(false);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!title || !body) {
      toast({ title: 'Required fields', description: 'Fill in title and message', variant: 'destructive' });
      return;
    }

    setTesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('test-push-notification', {
        body: { userId: user.id, title, body, icon },
      });

      if (error) throw error;

      toast({ title: '✅ Test Sent', description: 'Check your device for the notification' });
    } catch (error: any) {
      console.error('Test notification error:', error);
      toast({ title: 'Test Failed', description: error?.message || 'Unknown error', variant: 'destructive' });
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
        body: {
          title,
          body,
          icon,
          action_label: actionLabel || null,
          action_url: actionUrl || null,
        },
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
      setActionLabel('');
      setActionUrl('');
    } catch (error: any) {
      console.error('Send notification error:', error);
      toast({ title: 'Send Failed', description: error?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Tabs defaultValue="compose" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="compose" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Compose
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="compose" className="mt-4">
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

            <div className="space-y-2">
              <Label htmlFor="icon">Icon URL</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="/icon-192x192.png"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actionLabel">Button Text (optional)</Label>
                <Input
                  id="actionLabel"
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  placeholder="e.g. View Now"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionUrl">Action URL (optional)</Label>
                <Input
                  id="actionUrl"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="e.g. /recipes"
                />
              </div>
            </div>

            {preview && title && body && (
              <Alert className="bg-muted/50">
                <AlertDescription>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold">{title}</div>
                      <div className="text-sm text-muted-foreground">{body}</div>
                      {actionLabel && (
                        <div className="text-xs text-primary font-medium mt-2">[{actionLabel}]</div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setPreview(!preview)} variant="outline" className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                {preview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button onClick={handleTest} variant="secondary" disabled={testing || !title || !body} className="flex-1">
                <TestTube className="mr-2 h-4 w-4" />
                {testing ? 'Testing...' : 'Test on Me'}
              </Button>
              <Button onClick={handleSend} disabled={sending || !title || !body} className="flex-1">
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'Sending...' : 'Send to All'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <NotificationHistory />
      </TabsContent>
    </Tabs>
  );
};

export default NotificationComposer;
