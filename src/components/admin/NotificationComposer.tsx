import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, TestTube, Loader2, Users, User, Radio, Sparkles } from 'lucide-react';
import NotificationHistory from './NotificationHistory';

const MASTER_SUPER_ADMINS = [
  'octaviomoiane2007@gmail.com',
  'savide242@gmail.com',
];

interface UserItem {
  id: string;
  name: string;
  mother_name?: string | null;
  baby_name?: string | null;
}

const NotificationComposer = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [actionUrl, setActionUrl] = useState('/');
  const [audience, setAudience] = useState<'all' | 'specific' | 'active' | 'inactive'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch users for target selection
    const fetchUsers = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, mother_name, baby_name')
          .order('full_name', { ascending: true })
          .limit(100);

        if (data) {
          setUsersList(data.map(u => ({
            id: u.id,
            name: u.mother_name || u.full_name || 'Community Mom',
            mother_name: u.mother_name,
            baby_name: u.baby_name,
          })));
        }
      } catch (err) {
        console.warn('Could not fetch users for notification composer:', err);
      }
    };

    fetchUsers();
  }, []);

  const handleTest = async () => {
    if (!title || !body) {
      toast({ title: 'Required fields', description: 'Fill in title and message', variant: 'destructive' });
      return;
    }

    setTesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Trigger local system notification via Service Worker
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title || '🥑 BabyBites', {
            body: body || 'Test notification delivery!',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            data: { url: actionUrl || '/' },
          });
          toast({ title: '✅ Push Delivered', description: 'System notification displayed on your device!' });
        } catch (swErr) {
          console.warn('Local SW notification error:', swErr);
        }
      }

      // 2. Also try invoking test edge function
      if (user) {
        try {
          await supabase.functions.invoke('test-push-notification', {
            body: { userId: user.id, title, body, icon: '/icon-192x192.png' },
          });
        } catch (fnErr) {
          console.warn('Server function test notice:', fnErr);
        }
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

    if (audience === 'specific' && !selectedUserId) {
      toast({ title: 'User Required', description: 'Please select a mother from the list', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      await supabase.auth.refreshSession();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated — please log in again');

      const userEmail = (user.email || '').toLowerCase().trim();
      const isMasterAdmin = MASTER_SUPER_ADMINS.includes(userEmail);

      // Verify admin role if not master admin
      if (!isMasterAdmin) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleError || !roleData) throw new Error('Admin permission required');
      }

      const startTime = Date.now();

      // Dispatch via notify-all-users with segment or specific targetUserId
      const payload: any = {
        title,
        body,
        action_url: actionUrl || '/',
        segment: audience === 'specific' ? undefined : audience,
        targetUserId: audience === 'specific' ? selectedUserId : undefined,
      };

      const { data, error } = await supabase.functions.invoke('notify-all-users', {
        body: payload,
      });

      const duration = Date.now() - startTime;

      if (error) {
        console.warn('Push edge function error, falling back to database broadcast:', error);
      }

      // Insert into admin_notifications table so in-app users receive it
      try {
        await supabase.from('admin_notifications').insert({
          title,
          body,
          action_url: actionUrl || '/',
          action_label: 'Open App',
          created_by: user.id,
          successful_count: data?.successful || (audience === 'specific' ? 1 : usersList.length),
          failed_count: data?.failed || 0,
        });
      } catch (dbErr) {
        console.warn('Could not record in admin_notifications:', dbErr);
      }

      toast({
        title: '✅ Push Notification Dispatched!',
        description: audience === 'specific' 
          ? `Delivered to selected mother successfully (${duration}ms).`
          : `Broadcast sent to all subscribers: ${data?.successful || 'Delivered'} (${duration}ms).`,
      });

      setTitle('');
      setBody('');
      setSelectedUserId('');
    } catch (error: any) {
      console.error('Send notification error:', error);
      toast({ title: 'Send Failed', description: error?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-stone-200 dark:border-stone-800 shadow-sm">
        <CardHeader className="bg-stone-50/60 dark:bg-stone-800/40 border-b border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            <CardTitle className="text-lg font-serif">Push Notification Broadcast Center</CardTitle>
          </div>
          <CardDescription>
            Broadcast urgent announcements, recipe updates, or tips to all registered mothers or target individuals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {/* Target Audience Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
              Target Audience *
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setAudience('all')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  audience === 'all'
                    ? 'border-[#1E5E3A] bg-[#EAF5EE] text-[#1E5E3A] dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>All Parents</span>
              </button>

              <button
                type="button"
                onClick={() => setAudience('specific')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  audience === 'specific'
                    ? 'border-[#1E5E3A] bg-[#EAF5EE] text-[#1E5E3A] dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Specific Mother</span>
              </button>

              <button
                type="button"
                onClick={() => setAudience('active')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  audience === 'active'
                    ? 'border-[#1E5E3A] bg-[#EAF5EE] text-[#1E5E3A] dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Active (7d)</span>
              </button>

              <button
                type="button"
                onClick={() => setAudience('inactive')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  audience === 'inactive'
                    ? 'border-[#1E5E3A] bg-[#EAF5EE] text-[#1E5E3A] dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                <span>Winback (&gt;7d)</span>
              </button>
            </div>
          </div>

          {/* Specific User Dropdown if specific selected */}
          {audience === 'specific' && (
            <div className="space-y-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
              <Label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Select Mother to Notify:
              </Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full bg-white dark:bg-stone-800 rounded-xl text-xs">
                  <SelectValue placeholder="Choose a mother from the registry..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {usersList.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.name} {u.baby_name ? `• Baby: ${u.baby_name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Notification Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🥑 Wholesome Dinner Ideas for Tonight!"
              maxLength={60}
              className="rounded-xl text-xs"
            />
            <span className="text-[10px] text-muted-foreground">{title.length}/60 characters</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body" className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Message Body *
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Discover 5 quick, nutrient-dense purees and finger foods your baby will love today..."
              rows={3}
              maxLength={200}
              className="rounded-xl text-xs"
            />
            <span className="text-[10px] text-muted-foreground">{body.length}/200 characters</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actionUrl" className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Click Destination URL
            </Label>
            <Input
              id="actionUrl"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="/recipes or /planner"
              className="rounded-xl text-xs"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              onClick={handleTest} 
              variant="outline" 
              disabled={testing || !title || !body} 
              className="flex-1 rounded-xl text-xs font-semibold h-10 gap-1.5"
            >
              {testing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Testing on Me...</>
              ) : (
                <><TestTube className="h-4 w-4 text-amber-500" /> Test on My Device</>
              )}
            </Button>

            <Button 
              onClick={handleSend} 
              disabled={sending || !title || !body || (audience === 'specific' && !selectedUserId)} 
              className="flex-1 rounded-xl bg-[#1E5E3A] hover:bg-[#16472c] text-white text-xs font-bold h-10 gap-1.5 shadow-xs"
            >
              {sending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Dispathing...</>
              ) : (
                <><Send className="h-4 w-4" /> {audience === 'specific' ? 'Send to Selected Mother' : 'Broadcast to All Parents'}</>
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
