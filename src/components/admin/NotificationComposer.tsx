import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Send, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const NotificationComposer = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [icon, setIcon] = useState('/icon-192x192.png');
  const [actionLabel, setActionLabel] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!title || !body) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in title and message',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.functions.invoke('notify-all-users', {
        body: {
          title,
          body,
          icon,
          action_label: actionLabel || null,
          action_url: actionUrl || null,
        },
      });

      if (error) throw error;

      toast({
        title: '✅ Notifications Sent',
        description: 'Push notifications sent to all subscribed users',
      });

      setTitle('');
      setBody('');
      setActionLabel('');
      setActionUrl('');
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notifications',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
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
            placeholder="e.g., New Feature Update!"
            maxLength={50}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Message *</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g., Check out our new recipe collection..."
            rows={4}
            maxLength={200}
          />
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="actionLabel">Action Button Text</Label>
            <Input
              id="actionLabel"
              value={actionLabel}
              onChange={(e) => setActionLabel(e.target.value)}
              placeholder="e.g., View Now"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actionUrl">Action URL</Label>
            <Input
              id="actionUrl"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="e.g., /recipes"
            />
          </div>
        </div>

        {preview && title && body && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">{title}</div>
                <div className="text-sm">{body}</div>
                {actionLabel && (
                  <div className="text-xs text-primary">→ {actionLabel}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => setPreview(!preview)}
            variant="outline"
            className="flex-1"
          >
            <Eye className="mr-2 h-4 w-4" />
            {preview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !title || !body}
            className="flex-1"
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Sending...' : 'Send to All Users'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationComposer;
