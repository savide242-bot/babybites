import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { sendWebPushNotification as sendPush, getVapidKeys, type PushSubscription, type NotificationPayload } from "../_shared/webpush.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = 'https://app.babybites.space';
const ICON_URL = `${APP_URL}/icon-192.png`;

// English-only meal messages — sent AT meal time
const MEAL_MESSAGES: Record<string, { title: string; body: string }> = {
  'breakfast': {
    title: '🌅 Breakfast Time!',
    body: "It's breakfast time for {baby}! Start the day with something nutritious.",
  },
  'morning-snack': {
    title: '🍎 Morning Snack Time!',
    body: "Time for {baby}'s morning snack! A fruit or yogurt is a great choice.",
  },
  'lunch': {
    title: '☀️ Lunch Time!',
    body: "Lunch time for {baby}! Let's enjoy a balanced meal.",
  },
  'afternoon-snack': {
    title: '🍌 Afternoon Snack Time!',
    body: "Time for {baby}'s afternoon snack! Something light and healthy.",
  },
  'snack': {
    title: '🍎 Snack Time!',
    body: "Snack time for {baby}! A fruit or something light?",
  },
  'dinner': {
    title: '🌙 Dinner Time!',
    body: "Dinner time for {baby}! End the day with a wholesome meal.",
  },
};

// Generous window so that 10-min, 15-min or 30-min cron jobs never miss a meal!
const WINDOW_BEFORE_MIN = 5;
const WINDOW_AFTER_MIN = 45;

function getUserLocalTime(utcDate: Date, timezone: string): { hour: number; minute: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(utcDate);
    return {
      hour: parseInt(parts.find(p => p.type === 'hour')?.value || '0'),
      minute: parseInt(parts.find(p => p.type === 'minute')?.value || '0'),
    };
  } catch {
    return { hour: utcDate.getUTCHours(), minute: utcDate.getUTCMinutes() };
  }
}

function getUserLocalDate(utcDate: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(utcDate);
  } catch {
    return utcDate.toISOString().split('T')[0];
  }
}

function isInMealWindow(userHour: number, userMinute: number, mealHour: number, mealMinute: number): boolean {
  const userTotal = userHour * 60 + userMinute;
  const mealTotal = mealHour * 60 + mealMinute;
  const diff = userTotal - mealTotal;
  return diff >= -WINDOW_BEFORE_MIN && diff <= WINDOW_AFTER_MIN;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const vapidKeys = getVapidKeys();
    if (!vapidKeys) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let force = false;
    let targetUserId: string | null = null;
    try {
      if (req.method === 'POST') {
        const body = await req.json();
        force = !!body?.force || !!body?.test;
        targetUserId = body?.user_id || body?.userId || null;
      }
    } catch {
      // No JSON body or empty
    }

    const now = new Date();
    console.log(`\n⏰ CHECK-MEAL-REMINDERS v5 | UTC: ${now.toISOString()} | force=${force} | target=${targetUserId || 'all'}`);

    // 1) Fetch all enabled meal times
    let mtQuery = supabase
      .from('baby_meal_times')
      .select('user_id, meal_type, preferred_hour, preferred_minute')
      .eq('enabled', true);

    if (targetUserId) {
      mtQuery = mtQuery.eq('user_id', targetUserId);
    }

    const { data: allMealTimes, error: mtErr } = await mtQuery;

    if (mtErr) throw mtErr;
    if (!allMealTimes?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No enabled meal times found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2) Fetch profiles and push subscriptions
    const userIds = [...new Set(allMealTimes.map(m => m.user_id))];

    const [{ data: profiles }, { data: allSubs }] = await Promise.all([
      supabase.from('profiles').select('id, baby_name, timezone').in('id', userIds),
      supabase.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth, timezone').in('user_id', userIds),
    ]);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const subsMap = new Map<string, any[]>();
    (allSubs || []).forEach(s => {
      const arr = subsMap.get(s.user_id) || [];
      arr.push(s);
      subsMap.set(s.user_id, arr);
    });

    let sentCount = 0, failedCount = 0, skipped = 0, noSubCount = 0;
    const expiredIds: string[] = [];

    // 3) For each meal time, check if in window
    for (const mt of allMealTimes) {
      const profile = profileMap.get(mt.user_id);
      const tz = profile?.timezone || 'UTC';
      const babyName = profile?.baby_name || 'baby';
      const local = getUserLocalTime(now, tz);
      const localDate = getUserLocalDate(now, tz);

      const inWindow = force || isInMealWindow(local.hour, local.minute, mt.preferred_hour, mt.preferred_minute);

      if (!inWindow) {
        continue;
      }

      // Check subscription before logging
      const subs = subsMap.get(mt.user_id);
      if (!subs?.length) {
        console.log(`  ⚠️ ${mt.meal_type} | user=${mt.user_id.substring(0,8)} | IN WINDOW but NO subscription`);
        noSubCount++;
        continue;
      }

      // 4) Duplicate prevention (unless force=true for testing)
      if (!force) {
        const { error: logErr } = await supabase.from('notification_logs').insert({
          user_id: mt.user_id,
          meal_type: mt.meal_type,
          sent_date: localDate,
        });

        if (logErr) {
          if (logErr.code === '23505' || logErr.message?.includes('duplicate') || logErr.message?.includes('unique')) {
            console.log(`  ⏭️ Already sent ${mt.meal_type} today for user=${mt.user_id.substring(0,8)}`);
            skipped++;
            continue;
          }
          console.error('  ❌ Log insert error:', logErr);
        }
      }

      // 5) Send push
      const msg = MEAL_MESSAGES[mt.meal_type] || MEAL_MESSAGES['snack'];
      const body = msg.body.replace('{baby}', babyName);

      const notification: NotificationPayload = {
        title: msg.title,
        body,
        icon: ICON_URL,
        badge: ICON_URL,
        tag: `meal-${mt.meal_type}-${localDate}`,
        data: { url: '/meal-planner', mealType: mt.meal_type, timestamp: now.getTime() },
      };

      console.log(`  🚀 Sending ${mt.meal_type} to user=${mt.user_id.substring(0,8)} (${subs.length} device(s)) [local=${local.hour}:${String(local.minute).padStart(2,'0')} target=${mt.preferred_hour}:${String(mt.preferred_minute).padStart(2,'0')}]`);

      for (const sub of subs) {
        if (!sub.p256dh || !sub.auth) {
          console.error(`  ❌ Invalid sub keys for device ${sub.id}`);
          failedCount++;
          continue;
        }

        const pushSub: PushSubscription = {
          id: sub.id,
          user_id: sub.user_id,
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const result = await sendPush(pushSub, notification, vapidKeys.publicKey, vapidKeys.privateKey);

            if (result.success) {
              sentCount++;
              console.log(`  ✅ Sent to device ${sub.id.substring(0,8)}`);
              break;
            }

            if (result.expired) {
              console.log(`  🗑️ Expired endpoint for device ${sub.id.substring(0,8)}`);
              expiredIds.push(sub.id);
              failedCount++;
              break;
            }

            if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
            else {
              failedCount++;
              console.error(`  ❌ Failed after retries: status=${result.status} error=${result.error}`);
            }
          } catch (pushError) {
            failedCount++;
            console.error(`  ❌ Push exception: ${pushError}`);
            break;
          }
        }
      }
    }

    // 6) Cleanup expired subscriptions
    if (expiredIds.length > 0) {
      console.log(`🧹 Cleaning ${expiredIds.length} expired subscriptions`);
      await supabase.from('push_subscriptions').delete().in('id', expiredIds);
    }

    console.log(`📊 Done: ${sentCount} sent, ${failedCount} failed, ${skipped} skipped (dup), ${noSubCount} no-sub`);

    return new Response(JSON.stringify({
      success: true,
      sent: sentCount,
      failed: failedCount,
      skippedDuplicates: skipped,
      noSubscription: noSubCount,
      expiredCleaned: expiredIds.length,
      checkedAt: now.toISOString(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
