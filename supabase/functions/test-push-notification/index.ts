import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import {
  sendWebPushNotification,
  getVapidKeys,
  type PushSubscription,
  type NotificationPayload,
} from '../_shared/webpush.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 test-push-notification v3.0 — using shared webpush module');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const vapidKeys = getVapidKeys();
    if (!vapidKeys) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🧪 Testing push for user ${user.id}`);

    // Get subscription
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No push subscription found',
          message: 'Please enable notifications first in Settings',
          needsResubscribe: true,
          subscriptionCount: 0,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('mother_name')
      .eq('id', user.id)
      .single();

    const motherName = profile?.mother_name || 'Mom';
    const sub = subscriptions[0];

    const notification: NotificationPayload = {
      title: '🔔 Test Notification',
      body: `Hi ${motherName}! Your meal reminders are working perfectly!`,
      icon: 'https://babybites.lovable.app/icon-192x192.png',
      badge: 'https://babybites.lovable.app/icon-192x192.png',
      tag: `test-${Date.now()}`,
      data: { url: '/', timestamp: Date.now() },
    };

    if (!sub.p256dh || !sub.auth) {
      return new Response(
        JSON.stringify({ error: 'Subscription is missing encryption keys. Re-enable notifications.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pushSub: PushSubscription = {
      id: sub.id,
      user_id: sub.user_id,
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    const result = await sendWebPushNotification(
      pushSub,
      notification,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    if (result.success) {
      return new Response(
        JSON.stringify({ success: true, message: 'Test notification sent successfully!', subscriptionCount: subscriptions.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If expired/VAPID mismatch, delete stale subscription
    if (result.expired) {
      console.log('🗑️ Deleting expired subscription');
      await supabase.from('push_subscriptions').delete().eq('id', sub.id);

      return new Response(
        JSON.stringify({
          error: 'Subscription expired',
          message: 'Please re-enable notifications in Settings.',
          needsResubscribe: true,
        }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to send notification', details: result.error, status: result.status }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('💥 Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
