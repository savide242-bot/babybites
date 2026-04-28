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
    console.log('Daily Admin Report v2.0 (secured)');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Allow cron calls (no auth header) OR authenticated admin calls
    const authHeader = req.headers.get('Authorization');
    const isCronCall = authHeader?.includes(supabaseAnonKey);

    if (!isCronCall) {
      // If not a cron call, verify the caller is an admin
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
        _user_id: claimsData.claims.sub,
        _role: 'admin',
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split('T')[0];
    const todayStart = `${today}T00:00:00.000Z`;
    const todayEnd = `${today}T23:59:59.999Z`;

    const [
      dauResult, signupsResult, topRecipesResult,
      streaksResult, mealPlansResult, totalUsersResult, pushSubsResult,
    ] = await Promise.all([
      supabase.from('user_sessions').select('user_id', { count: 'exact', head: true })
        .gte('last_active', todayStart).lte('last_active', todayEnd),
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart).lte('created_at', todayEnd),
      supabase.from('recipe_views').select('recipe_id')
        .gte('viewed_at', todayStart).lte('viewed_at', todayEnd),
      supabase.from('user_streaks').select('current_streak'),
      supabase.from('meal_plans').select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart).lte('created_at', todayEnd),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }),
    ]);

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
      `Daily Report - ${today}`,
      `DAU: ${dau} | Total: ${totalUsers}`,
      `New Signups: ${newSignups}`,
      `Meals Planned: ${mealsPlanned}`,
      `Avg Streak: ${avgStreak} days`,
      `Push Subs: ${pushSubs}`,
      topRecipes ? `Top: ${topRecipes}` : 'No views today',
    ].join('\n');

    console.log('Report:', reportBody);

    // Send push to admins
    const { data: adminRoles } = await supabase
      .from('user_roles').select('user_id').eq('role', 'admin');

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ report: reportBody, sent: false, reason: 'no_admins' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminIds = adminRoles.map(r => r.user_id);
    const { data: subscriptions } = await supabase
      .from('push_subscriptions').select('*').in('user_id', adminIds);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ report: reportBody, sent: false, reason: 'no_subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vapidKeys = getVapidKeys();
    const APP_URL = 'https://babybites.lovable.app';
    const payload: NotificationPayload = {
      title: 'BabyBites Daily Report',
      body: reportBody,
      icon: `${APP_URL}/icon-192x192.png`,
      data: { url: '/admin' },
    };

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      if (!sub.p256dh || !sub.auth) { failed++; continue; }
      try {
        const pushSub: PushSubscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } } as any;
        const result = await sendWebPushNotification(pushSub, payload, vapidKeys.publicKey, vapidKeys.privateKey);
        if (result.success) sent++;
        else {
          failed++;
          if (result.expired) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      } catch (e) {
        failed++;
        console.error('Error sending to admin:', e);
      }
    }

    return new Response(JSON.stringify({
      report: reportBody,
      metrics: { dau, newSignups, mealsPlanned, avgStreak, totalUsers, pushSubs, topRecipes },
      notifications: { sent, failed },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Daily report error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
