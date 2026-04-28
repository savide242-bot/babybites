import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { cleanVapidKey, getVapidKeys } from "../_shared/webpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🐛 [DEBUG-PUSH] Starting debug check...");

  try {
    // Check VAPID keys
    let vapidConfigured = false;
    let vapidPublicKeyPreview = "";
    let vapidError = "";
    
    try {
      const vapidKeys = getVapidKeys();
      if (vapidKeys) {
        vapidConfigured = true;
        vapidPublicKeyPreview = vapidKeys.publicKey.slice(0, 20) + "...";
        console.log("🐛 [DEBUG-PUSH] VAPID keys found");
      }
    } catch (e: any) {
      vapidError = e.message;
      console.error("🐛 [DEBUG-PUSH] VAPID error:", e);
    }

    // Check database subscriptions
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subscriptions, error: subError, count } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact" })
      .limit(5);

    console.log("🐛 [DEBUG-PUSH] Subscription count:", count);
    console.log("🐛 [DEBUG-PUSH] Subscription error:", subError);

    // Sample subscription details (redacted)
    const sampleSubscriptions = subscriptions?.map((sub: any) => ({
      id: sub.id,
      user_id: sub.user_id,
      endpoint_preview: sub.endpoint?.slice(0, 50) + "...",
      has_keys: !!sub.p256dh && !!sub.auth,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
    })) || [];

    // Test encryption capability
    let encryptionTest = false;
    let encryptionError = "";
    try {
      // Just check if we can create the crypto key
      const testKey = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
      );
      encryptionTest = !!testKey;
      console.log("🐛 [DEBUG-PUSH] Encryption test passed");
    } catch (e: any) {
      encryptionError = e.message;
      console.error("🐛 [DEBUG-PUSH] Encryption test failed:", e);
    }

    // Check recent notifications
    const { data: recentNotifs } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    const recentNotifications = recentNotifs?.map((n: any) => ({
      id: n.id,
      title: n.title,
      successful_count: n.successful_count,
      failed_count: n.failed_count,
      created_at: n.created_at,
    })) || [];

    // Environment check
    const envCheck = {
      hasSupabaseUrl: !!Deno.env.get("SUPABASE_URL"),
      hasServiceKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      hasVapidPublic: !!Deno.env.get("VAPID_PUBLIC_KEY"),
      hasVapidPrivate: !!Deno.env.get("VAPID_PRIVATE_KEY"),
    };

    const result = {
      timestamp: new Date().toISOString(),
      vapidConfigured,
      vapidPublicKeyPreview,
      vapidError: vapidError || null,
      subscriptionCount: count || 0,
      subscriptionError: subError?.message || null,
      sampleSubscriptions,
      encryptionTest,
      encryptionError: encryptionError || null,
      recentNotifications,
      envCheck,
      denoVersion: Deno.version,
    };

    console.log("🐛 [DEBUG-PUSH] Result:", JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("🐛 [DEBUG-PUSH] Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
