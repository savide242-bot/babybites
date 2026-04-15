import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { sendWebPushNotification, getVapidKeys, type PushSubscription, type NotificationPayload } from "../_shared/webpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, userId, mealType, meal_type, title, body } = await req.json();
    const targetUserId = user_id || userId;
    const targetMealType = meal_type || mealType || 'lunch';

    console.log('📬 Sending meal reminder:', { targetUserId, targetMealType });

    const vapidKeys = getVapidKeys();
    if (!vapidKeys) {
      return new Response(JSON.stringify({ success: false, error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get push subscriptions
    let query = supabaseClient
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth");
    if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    }

    const { data: subscriptions, error } = await query;
    if (error) throw error;

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ success: false, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const notification: NotificationPayload = {
      title: title || `🍽️ Meal Time!`,
      body: body || `Time to prepare baby's meal!`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: `meal-reminder-${targetMealType}`,
      data: { url: '/planner', mealType: targetMealType },
    };

    let successCount = 0, failedCount = 0;
    const expiredIds: string[] = [];

    for (const sub of subscriptions) {
      if (!sub.p256dh || !sub.auth) {
        failedCount++;
        console.error(`❌ Invalid subscription keys for user=${sub.user_id?.substring(0, 8)}`);
        continue;
      }

      const pushSub: PushSubscription = {
        id: sub.id,
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      const result = await sendWebPushNotification(pushSub, notification, vapidKeys.publicKey, vapidKeys.privateKey);

      if (result.success) {
        successCount++;
      } else if (result.expired) {
        expiredIds.push(sub.id);
        failedCount++;
      } else {
        failedCount++;
      }
    }

    // Cleanup expired
    if (expiredIds.length > 0) {
      await supabaseClient.from("push_subscriptions").delete().in("id", expiredIds);
    }

    return new Response(JSON.stringify({
      success: successCount > 0,
      message: "Notifications processed",
      total: subscriptions.length,
      successful: successCount,
      failed: failedCount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
