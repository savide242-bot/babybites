import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  sendWebPushNotification,
  getVapidKeys,
  type PushSubscription,
  type NotificationPayload,
} from "../_shared/webpush.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// One-time announcement function for the Video Recipes launch.
// Guarded by a launch key to prevent abuse; intended to be removed after use.
const LAUNCH_KEY = "BABYBITES_VIDEO_RECIPES_LAUNCH_2026";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.launch_key !== LAUNCH_KEY) {
      return new Response(JSON.stringify({ error: 'Invalid launch key' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const vapidKeys = getVapidKeys();
    if (!vapidKeys) {
      throw new Error('VAPID keys not configured');
    }

    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth');

    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', total: 0, successful: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notification: NotificationPayload = {
      title: '🎬 Video Recipes Are Here!',
      body: "Hello mamas! BabyBites now features step-by-step VIDEO recipes — watch, cook, and enjoy with your little one. Tap to see them! 🍲✨",
      icon: 'https://babybites.lovable.app/icon-192x192.png',
      badge: 'https://babybites.lovable.app/icon-192x192.png',
      tag: 'video-recipes-launch',
      data: {
        url: '/recipes',
        timestamp: Date.now(),
      },
      actions: [{ action: 'open', title: 'Watch Now 🎬' }],
    };

    let successCount = 0;
    let failCount = 0;
    const expiredIds: string[] = [];

    for (const sub of subscriptions) {
      if (!sub.p256dh || !sub.auth) {
        failCount++;
        continue;
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
        successCount++;
      } else {
        failCount++;
        if (result.expired) expiredIds.push(sub.id);
      }
    }

    if (expiredIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds);
    }

    console.log(`📊 Video recipes launch: ${successCount} sent, ${failCount} failed, ${expiredIds.length} expired`);

    return new Response(
      JSON.stringify({
        message: 'Video recipes announcement sent',
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
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
