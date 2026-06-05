import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fixed meal schedule: hour → notification content
const MEAL_SCHEDULE: Record<number, { title: string; body: string }> = {
  7:  { title: '🌅 Good morning!', body: "Time for your baby's breakfast 🍎🥛" },
  10: { title: '🍪 Morning snack time', body: 'A healthy little snack to keep the energy up! 🍌' },
  12: { title: '🍽️ Lunch time!', body: "Time to prepare your baby's lunch 🥗🍲" },
  15: { title: '🥛 Afternoon snack', body: 'Snack time! How about some fruit? 🍊🧀' },
  19: { title: '🌙 Dinner time', body: "Time for your baby's dinner 🍵🥦" },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')?.replace(/^["']|["']$/g, '').trim();
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')?.replace(/^["']|["']$/g, '').trim();
    let vapidMailto = Deno.env.get('VAPID_MAILTO') || 'mailto:hello@babybites.app';
    if (!vapidMailto.startsWith('mailto:')) vapidMailto = `mailto:${vapidMailto}`;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    webpush.setVapidDetails(vapidMailto, vapidPublicKey, vapidPrivateKey);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch all push subscriptions
    const { data: subscriptions, error: dbError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth, timezone');

    if (dbError) throw dbError;
    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`📬 Processing ${subscriptions.length} subscriptions`);

    let sent = 0;
    let failed = 0;
    const expiredIds: string[] = [];

    for (const sub of subscriptions) {
      // Get user's local hour
      const tz = sub.timezone || 'Africa/Maputo';
      let localHour: number;
      try {
        const hourStr = new Date().toLocaleString('en-US', {
          timeZone: tz, hour: 'numeric', hour12: false,
        });
        localHour = parseInt(hourStr);
      } catch {
        localHour = new Date().getUTCHours();
      }

      const meal = MEAL_SCHEDULE[localHour];
      if (!meal) continue;

      const payload = JSON.stringify({
        title: meal.title,
        body: meal.body,
        url: '/planner',
      });

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
        console.log(`✅ Sent to user=${sub.user_id.substring(0, 8)} hour=${localHour} tz=${tz}`);
      } catch (pushError: any) {
        console.error(`❌ Failed for user=${sub.user_id.substring(0, 8)}:`, pushError.message);
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          expiredIds.push(sub.id);
        }
        failed++;
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      console.log(`🧹 Cleaning ${expiredIds.length} expired subscriptions`);
      await supabase.from('push_subscriptions').delete().in('id', expiredIds);
    }

    console.log(`📊 Done: ${sent} sent, ${failed} failed, ${expiredIds.length} cleaned`);

    return new Response(JSON.stringify({
      success: true, sent, failed,
      expiredCleaned: expiredIds.length,
      total: subscriptions.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
