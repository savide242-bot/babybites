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
      body: "New features and improvements are now available. The app will update automatically.",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "app-update"
    };

    // VAPID keys (you need to generate these with web-push library)
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    // Send push notification to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: PushSubscription) => {
        try {
          const keys = JSON.parse(sub.keys);
          
          // Create JWT for Web Push
          const jwt = await createJWT(
            vapidPublicKey,
            vapidPrivateKey,
            sub.endpoint
          );

          // Send push notification
          const response = await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `WebPush ${jwt}`,
              "TTL": "86400"
            },
            body: JSON.stringify({
              notification: notification
            })
          });

          if (!response.ok) {
            console.error(`Failed to send notification to ${sub.user_id}:`, response.statusText);
            
            // If subscription is invalid (410 Gone), delete it
            if (response.status === 410) {
              await supabaseClient
                .from("push_subscriptions")
                .delete()
                .eq("user_id", sub.user_id);
            }
          }

          return { success: response.ok, user_id: sub.user_id };
        } catch (error) {
          console.error(`Error sending to ${sub.user_id}:`, error);
          return { success: false, user_id: sub.user_id, error };
        }
      })
    );

    const successful = results.filter(r => r.status === "fulfilled" && r.value.success).length;
    const failed = results.length - successful;

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
    console.error("Error in notify-update:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});

// Simple JWT creation for Web Push (simplified version)
async function createJWT(publicKey: string, privateKey: string, audience: string): Promise<string> {
  // In production, use a proper JWT library
  // This is a placeholder - you'll need to implement proper JWT signing
  const header = {
    typ: "JWT",
    alg: "ES256"
  };

  const payload = {
    aud: new URL(audience).origin,
    exp: Math.floor(Date.now() / 1000) + 43200, // 12 hours
    sub: "mailto:support@babybites.app"
  };

  // For production, implement proper ES256 signing with the private key
  // This is a simplified placeholder
  return "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.placeholder.signature";
}
