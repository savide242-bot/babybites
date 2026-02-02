import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { sendWebPushNotification, getVapidKeys, type PushSubscription, type NotificationPayload } from "../_shared/webpush.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Force Test Reminder - Ignores time window and sends notification immediately
 * Use this to test the complete push notification flow end-to-end
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get VAPID keys
    const vapidKeys = getVapidKeys();
    if (!vapidKeys) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`\n========================================`);
    console.log(`🧪 FORCE-TEST-REMINDER for user: ${user.id.substring(0, 8)}...`);
    console.log(`========================================\n`);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('baby_name, mother_name')
      .eq('id', user.id)
      .single();

    const babyName = profile?.baby_name || 'baby';

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No push subscriptions found. Please enable notifications in Settings first.',
          subscriptionCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 Found ${subscriptions.length} subscription(s)`);

    const notification: NotificationPayload = {
      title: '🧪 Test Notification',
      body: `This is a test reminder for ${babyName}! If you see this, notifications are working! 🎉`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: `test-${Date.now()}`,
      data: { url: '/settings', timestamp: Date.now(), isTest: true },
      requireInteraction: true,
    };

    let sent = 0;
    let failed = 0;
    const expiredIds: string[] = [];
    const results: Array<{ endpoint: string; success: boolean; error?: string }> = [];

    for (const sub of subscriptions) {
      console.log(`📤 Sending to: ${sub.endpoint.substring(0, 60)}...`);
      
      const pushSub: PushSubscription = {
        id: sub.id,
        user_id: sub.user_id,
        endpoint: sub.endpoint,
        keys: sub.keys,
      };

      const result = await sendWebPushNotification(
        pushSub,
        notification,
        vapidKeys.publicKey,
        vapidKeys.privateKey
      );

      const shortEndpoint = sub.endpoint.substring(0, 50) + '...';

      if (result.success) {
        sent++;
        results.push({ endpoint: shortEndpoint, success: true });
        console.log(`✅ Success!`);
      } else if (result.expired) {
        failed++;
        expiredIds.push(sub.id);
        results.push({ endpoint: shortEndpoint, success: false, error: 'Subscription expired' });
        console.log(`📛 Subscription expired`);
      } else {
        failed++;
        results.push({ endpoint: shortEndpoint, success: false, error: result.error });
        console.log(`❌ Failed: ${result.error}`);
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      console.log(`🧹 Cleaning ${expiredIds.length} expired subscriptions`);
      await supabase.from('push_subscriptions').delete().in('id', expiredIds);
    }

    console.log(`\n📊 Results: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: sent > 0,
        sent,
        failed,
        subscriptionCount: subscriptions.length,
        expiredCleaned: expiredIds.length,
        results,
        message: sent > 0 
          ? `✅ Notification sent! Check your device.` 
          : `❌ Failed to send. Check subscription validity.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
