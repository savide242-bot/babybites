import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendWebPushNotification, getVapidKeys } from "../_shared/webpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { vapidPublicKey, vapidPrivateKey } = getVapidKeys();
    const APP_URL = "https://babybites.lovable.app";
    const ICON_URL = `${APP_URL}/icon-192x192.png`;

    // Find users inactive for 2+ days who have push subscriptions
    // and haven't received a winback in the last 3 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // Get users with push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, keys");

    if (subError || !subscriptions?.length) {
      return new Response(JSON.stringify({ message: "No subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = [...new Set(subscriptions.map(s => s.user_id))];

    // Get sessions for these users - find those inactive 2+ days
    const { data: sessions } = await supabase
      .from("user_sessions")
      .select("user_id, last_active")
      .in("user_id", userIds)
      .lt("last_active", twoDaysAgo);

    const inactiveUserIds = new Set(sessions?.map(s => s.user_id) || []);

    // Also include users with NO session at all (never tracked)
    const usersWithSessions = new Set(sessions?.map(s => s.user_id) || []);
    
    // Get recent winback campaigns to avoid spamming
    const { data: recentCampaigns } = await supabase
      .from("winback_campaigns")
      .select("user_id")
      .gt("sent_at", threeDaysAgo);

    const recentlySent = new Set(recentCampaigns?.map(c => c.user_id) || []);

    // Filter to inactive users not recently contacted
    const targetUsers = userIds.filter(uid => 
      inactiveUserIds.has(uid) && !recentlySent.has(uid)
    );

    if (!targetUsers.length) {
      return new Response(JSON.stringify({ message: "No inactive users to notify", checked: userIds.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profiles for personalization
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, mother_name, baby_name")
      .in("id", targetUsers);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    let sent = 0;
    let failed = 0;

    for (const userId of targetUsers) {
      const profile = profileMap.get(userId);
      const name = profile?.mother_name || "there";
      const babyName = profile?.baby_name || "your little one";

      const userSubs = subscriptions.filter(s => s.user_id === userId);

      const messages = [
        { title: `Hey ${name}, we miss you!`, body: `${babyName} deserves a tasty meal today. Come check out new recipes!` },
        { title: `It's been a while, ${name}!`, body: `We have new easy recipes perfect for ${babyName}. Ready in under 15 minutes!` },
        { title: `${name}, your meal planner misses you`, body: `Keep ${babyName}'s nutrition on track. Tap to plan this week's meals.` },
      ];

      const msg = messages[Math.floor(Math.random() * messages.length)];

      for (const sub of userSubs) {
        try {
          const result = await sendWebPushNotification(
            { endpoint: sub.endpoint, keys: sub.keys as any },
            {
              title: msg.title,
              body: msg.body,
              icon: ICON_URL,
              badge: ICON_URL,
              tag: "winback",
              data: { url: APP_URL },
            },
            vapidPublicKey,
            vapidPrivateKey
          );

          if (result.success) {
            sent++;
          } else {
            failed++;
            // Clean up expired subscriptions
            if (result.expired) {
              await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            }
          }
        } catch (err) {
          failed++;
          console.error(`Error sending to ${userId}:`, err);
        }
      }

      // Log the campaign
      await supabase.from("winback_campaigns").insert({
        user_id: userId,
        campaign_type: "inactive_2days",
        message_sent: `${msg.title} | ${msg.body}`,
      });
    }

    console.log(`Winback: sent=${sent}, failed=${failed}, targeted=${targetUsers.length}`);

    return new Response(JSON.stringify({ sent, failed, targeted: targetUsers.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Winback error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
