import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  sendWebPushNotification, 
  getVapidKeys, 
  type PushSubscription,
  type NotificationPayload 
} from "../_shared/webpush.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📊 Daily Admin Report v1.0');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];
    const todayStart = `${today}T00:00:00.000Z`;
    const todayEnd = `${today}T23:59:59.999Z`;

    // Gather all metrics in parallel
    const [
      dauResult,
      signupsResult,
      topRecipesResult,
      streaksResult,
      mealPlansResult,
      totalUsersResult,
      pushSubsResult
    ] = await Promise.all([
      // DAU - distinct active users today
      supabase.from('user_sessions')
        .select('user_id', { count: 'exact', head: true })
        .gte('last_active', todayStart)
        .lte('last_active', todayEnd),
      
      // New signups today
      supabase.from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),
      
      // Top 5 viewed recipes today
      supabase.from('recipe_views')
        .select('recipe_id')
        .gte('viewed_at', todayStart)
        .lte('viewed_at', todayEnd),
      
      // Average streak
      supabase.from('user_streaks')
        .select('current_streak'),
      
      // Meals planned today
      supabase.from('meal_plans')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),
      
      // Total users
      supabase.from('profiles')
        .select('id', { count: 'exact', head: true }),
      
      // Push subscriptions count
      supabase.from('push_subscriptions')
        .select('id', { count: 'exact', head: true }),
    ]);

    // Calculate top recipes
    const recipeCounts: Record<string, number> = {};
    if (topRecipesResult.data) {
      for (const view of topRecipesResult.data) {
        recipeCounts[view.recipe_id] = (recipeCounts[view.recipe_id] || 0) + 1;
      }
    }
    const topRecipes = Object.entries(recipeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => `#${id}(${count}x)`)
      .join(', ');

    // Calculate average streak
    let avgStreak = 0;
    if (streaksResult.data && streaksResult.data.length > 0) {
      const sum = streaksResult.data.reduce((acc, s) => acc + (s.current_streak || 0), 0);
      avgStreak = Math.round((sum / streaksResult.data.length) * 10) / 10;
    }

    const dau = dauResult.count || 0;
    const newSignups = signupsResult.count || 0;
    const mealsPlanned = mealPlansResult.count || 0;
    const totalUsers = totalUsersResult.count || 0;
    const pushSubs = pushSubsResult.count || 0;

    const reportBody = [
      `📊 Daily Report - ${today}`,
      `👥 DAU: ${dau} | Total: ${totalUsers}`,
      `🆕 New Signups: ${newSignups}`,
      `🍽️ Meals Planned: ${mealsPlanned}`,
      `🔥 Avg Streak: ${avgStreak} days`,
      `🔔 Push Subs: ${pushSubs}`,
      topRecipes ? `⭐ Top: ${topRecipes}` : '⭐ No views today',
    ].join('\n');

    console.log('📊 Report:', reportBody);

    // Find admin push subscriptions
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles || adminRoles.length === 0) {
      console.log('⚠️ No admins found');
      return new Response(JSON.stringify({ report: reportBody, sent: false, reason: 'no_admins' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminIds = adminRoles.map(r => r.user_id);
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', adminIds);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No admin push subscriptions found');
      return new Response(JSON.stringify({ report: reportBody, sent: false, reason: 'no_subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send push notification to admins
    const vapidKeys = getVapidKeys();
    const payload: NotificationPayload = {
      title: `📊 BabyBites Daily Report`,
      body: reportBody,
      icon: '/icons/icon-192x192.png',
      data: { url: '/admin' },
    };

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const pushSub: PushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys as any,
        };
        const result = await sendWebPushNotification(pushSub, payload, vapidKeys);
        if (result.success) {
          sent++;
        } else {
          failed++;
          console.error('❌ Failed:', result.error);
        }
      } catch (e) {
        failed++;
        console.error('💥 Error sending to admin:', e);
      }
    }

    const response = {
      report: reportBody,
      metrics: { dau, newSignups, mealsPlanned, avgStreak, totalUsers, pushSubs, topRecipes },
      notifications: { sent, failed },
    };

    console.log('✅ Report complete:', response);
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Daily report error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
