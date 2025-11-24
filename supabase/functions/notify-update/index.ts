import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushSubscription {
  user_id: string;
  endpoint: string;
  keys: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all push subscriptions
    const { data: subscriptions, error } = await supabaseClient
      .from("push_subscriptions")
      .select("*");

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Notification payload
    const notification: NotificationPayload = {
      title: "🎉 BabyBites Updated!",
      body: "New features and improvements are now available. Click to update now.",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "app-update"
    };

    console.log(`📤 Sending update notifications to ${subscriptions.length} users...`);

    // Send push notification to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: PushSubscription) => {
        try {
          console.log(`📨 Sending to user: ${sub.user_id}`);
          
          // Send notification directly to the push service endpoint
          const response = await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "TTL": "86400"
            },
            body: JSON.stringify({
              title: notification.title,
              body: notification.body,
              icon: notification.icon,
              badge: notification.badge,
              tag: notification.tag,
              data: { action: 'update' },
              actions: [
                { action: 'update', title: 'Update Now' },
                { action: 'later', title: 'Later' }
              ]
            })
          });

          if (!response.ok) {
            console.error(`❌ Failed to send to ${sub.user_id}: ${response.status} ${response.statusText}`);
            
            // If subscription is invalid (410 Gone), delete it
            if (response.status === 410) {
              console.log(`🗑️ Deleting expired subscription for ${sub.user_id}`);
              await supabaseClient
                .from("push_subscriptions")
                .delete()
                .eq("user_id", sub.user_id);
            }
            return { success: false, user_id: sub.user_id };
          }

          console.log(`✅ Sent successfully to ${sub.user_id}`);
          return { success: true, user_id: sub.user_id };
        } catch (error) {
          console.error(`❌ Error sending to ${sub.user_id}:`, String(error));
          return { success: false, user_id: sub.user_id };
        }
      })
    );

    const successful = results.filter(r => r.status === "fulfilled" && r.value.success).length;
    const failed = results.length - successful;

    console.log(`📊 Results: ${successful} sent successfully, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: "Push notifications sent",
        total: subscriptions.length,
        successful,
        failed
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
