import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  sendWebPushNotification, 
  getVapidKeys, 
  type PushSubscription,
  type NotificationPayload 
} from "../_shared/webpush.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestPayload {
  title: string;
  body: string;
  icon?: string;
  action_label?: string;
  action_url?: string;
  segment?: 'all' | 'active' | 'inactive';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 notify-all-users v2.0 - Using unified webpush module');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Unauthorized - admin role required');
    }

    console.log('✅ Admin verified:', user.id);

    // Get VAPID keys
    const vapidKeys = getVapidKeys();
    if (!vapidKeys) {
      throw new Error('VAPID keys not configured');
    }

    const payload: RequestPayload = await req.json();
    console.log('📝 Notification payload:', { title: payload.title, segment: payload.segment || 'all' });

    // Fetch push subscriptions based on segment
    let query = supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth');

    // Apply segment filter if needed
    if (payload.segment === 'active') {
      // Get users active in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activeSessions } = await supabase
        .from('user_sessions')
        .select('user_id')
        .gte('last_active', sevenDaysAgo);
      
      const activeUserIds = activeSessions?.map(s => s.user_id) || [];
      if (activeUserIds.length > 0) {
        query = query.in('user_id', activeUserIds);
      } else {
        return new Response(
          JSON.stringify({ message: 'No active users found', total: 0, successful: 0, failed: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (payload.segment === 'inactive') {
      // Get users NOT active in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activeSessions } = await supabase
        .from('user_sessions')
        .select('user_id')
        .gte('last_active', sevenDaysAgo);
      
      const activeUserIds = activeSessions?.map(s => s.user_id) || [];
      if (activeUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${activeUserIds.join(',')})`);
      }
    }

    const { data: subscriptions, error: subsError } = await query;

    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', total: 0, successful: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Sending to ${subscriptions.length} subscriptions...`);

    let successCount = 0;
    let failCount = 0;
    const expiredIds: string[] = [];

    // Prepare notification
    const notification: NotificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || 'https://babybites.lovable.app/icon-192x192.png',
      badge: 'https://babybites.lovable.app/icon-192x192.png',
      tag: `admin-${Date.now()}`,
      data: {
        url: payload.action_url || '/',
        timestamp: Date.now(),
      },
      actions: payload.action_label ? [
        { action: 'open', title: payload.action_label }
      ] : [],
    };

    // Send to each subscription using the unified module
    for (const sub of subscriptions) {
      const pushSub: PushSubscription = {
        id: sub.id,
        user_id: sub.user_id,
        endpoint: sub.endpoint,
        keys: sub.keys as { p256dh: string; auth: string },
      };

      const result = await sendWebPushNotification(
        pushSub,
        notification,
        vapidKeys.publicKey,
        vapidKeys.privateKey
      );

      if (result.success) {
        successCount++;
      } else {
        failCount++;
        if (result.expired) {
          expiredIds.push(sub.id);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      console.log(`🧹 Cleaning ${expiredIds.length} expired subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredIds);
    }

    // Log admin notification
    await supabase
      .from('admin_notifications')
      .insert({
        created_by: user.id,
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        action_label: payload.action_label,
        action_url: payload.action_url,
        recipients_count: subscriptions.length,
        successful_count: successCount,
        failed_count: failCount,
      });

    console.log(`📊 Results: ${successCount} sent, ${failCount} failed, ${expiredIds.length} expired`);

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        total: subscriptions.length,
        successful: successCount,
        failed: failCount,
        expired: expiredIds.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
