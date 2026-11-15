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
      }
    } catch (e: any) {
      vapidError = e.message;
    }

    // Check database subscriptions
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subscriptions, error: subError, count } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(10);

    const sampleSubscriptions = subscriptions?.map((sub: any) => ({
      id: sub.id,
      user_id: sub.user_id,
      endpoint_preview: sub.endpoint?.slice(0, 50) + "...",
      has_keys: !!sub.p256dh && !!sub.auth,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
    })) || [];

    // Check theme config
    const { data: themeRow } = await supabase
      .from("recipe_image_overrides")
      .select("*")
      .eq("recipe_id", "app_theme_config")
      .maybeSingle();

    // Check meal times
    const { data: mealTimes } = await supabase
      .from("baby_meal_times")
      .select("*")
      .limit(10);

    // Check notification logs
    const { data: notifLogs, error: notifErr } = await supabase
      .from("notification_logs")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(10);

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

    const result = {
      timestamp: new Date().toISOString(),
      vapidConfigured,
      vapidPublicKeyPreview,
      vapidError: vapidError || null,
      subscriptionCount: count || 0,
      subscriptionError: subError?.message || null,
      sampleSubscriptions,
      themeRow,
      mealTimes,
      notifLogs,
      notifErr: notifErr?.message || null,
      recentNotifications,
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
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
