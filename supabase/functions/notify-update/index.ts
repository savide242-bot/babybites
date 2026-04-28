import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  sendWebPushNotification, 
  getVapidKeys, 
  type PushSubscription,
  type NotificationPayload 
} from "../_shared/webpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 notify-update v2.0 - Using unified webpush module');
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get VAPID keys
    const vapidKeys = getVapidKeys();
    if (!vapidKeys) {
      throw new Error('VAPID keys not configured');
    }

    // Get all push subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth");

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`📤 Sending update notifications to ${subscriptions.length} users...`);

    // Notification payload
    const notification: NotificationPayload = {
      title: "🎉 BabyBites Updated!",
      body: "New features and improvements are now available. Click to update now.",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "app-update",
      data: { 
        action: 'update',
        url: '/' 
      },
      actions: [
        { action: 'update', title: 'Update Now' },
        { action: 'later', title: 'Later' }
      ]
    };

    let successCount = 0;
    let failCount = 0;
    const expiredIds: string[] = [];

    // Send to each subscription
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
        console.log(`✅ Sent successfully to ${sub.user_id}`);
      } else {
        failCount++;
        console.error(`❌ Failed to send to ${sub.user_id}: ${result.error}`);
        if (result.expired) {
          expiredIds.push(sub.id);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      console.log(`🧹 Cleaning ${expiredIds.length} expired subscriptions`);
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", expiredIds);
    }

    console.log(`📊 Results: ${successCount} sent successfully, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Push notifications sent",
        total: subscriptions.length,
        successful: successCount,
        failed: failCount,
        expired: expiredIds.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: any) {
    console.error("❌ Error in notify-update:", String(error));
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
