import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { sendWebPushNotification as sendPush, getVapidKeys, type PushSubscription, type NotificationPayload } from "../_shared/webpush.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// English-only meal messages — sent AT meal time (not "in 30 minutes")
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

// Window: send if user's local time is between -2 and +8 minutes of meal time
// With cron every 5 min, this guarantees exactly 1 hit per meal
const WINDOW_BEFORE_MIN = 2;  // can be up to 2 min early
const WINDOW_AFTER_MIN = 8;   // can be up to 8 min late

function getUserLocalTime(utcDate: Date, timezone: string): { hour: number; minute: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, hour: 'numeric', minute: 'numeric', hour12: false,
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
  const diff = userTotal - mealTotal; // positive = user is past meal time
  // diff in [-WINDOW_BEFORE, +WINDOW_AFTER] means we should send
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

    const now = new Date();
    console.log(`\n⏰ CHECK-MEAL-REMINDERS v3 | UTC: ${now.toISOString()}`);

    // 1) Fetch all enabled meal times
    const { data: allMealTimes, error: mtErr } = await supabase
      .from('baby_meal_times')
      .select('user_id, meal_type, preferred_hour, preferred_minute')
      .eq('enabled', true);

    if (mtErr) throw mtErr;
    if (!allMealTimes?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No enabled meal times' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2) Fetch profiles (timezone + baby_name) and push subscriptions
    const userIds = [...new Set(allMealTimes.map(m => m.user_id))];

    const [{ data: profiles }, { data: allSubs }] = await Promise.all([
      supabase.from('profiles').select('id, baby_name, timezone').in('id', userIds),
      supabase.from('push_subscriptions').select('*'),
    ]);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const subsMap = new Map<string, any[]>();
    (allSubs || []).forEach(s => {
      const arr = subsMap.get(s.user_id) || [];
      arr.push(s);
      subsMap.set(s.user_id, arr);
    });

    let sentCount = 0, failedCount = 0, skipped = 0;
    const expiredIds: string[] = [];

    // 3) For each meal time, check if in window
    for (const mt of allMealTimes) {
      const profile = profileMap.get(mt.user_id);
      const tz = profile?.timezone || 'UTC';
      const babyName = profile?.baby_name || 'baby';
      const local = getUserLocalTime(now, tz);
      const localDate = getUserLocalDate(now, tz);

      const inWindow = isInMealWindow(local.hour, local.minute, mt.preferred_hour, mt.preferred_minute);

      console.log(`  ${mt.meal_type} | user=${mt.user_id.substring(0,8)} | tz=${tz} | local=${local.hour}:${String(local.minute).padStart(2,'0')} | meal=${mt.preferred_hour}:${String(mt.preferred_minute).padStart(2,'0')} | ${inWindow ? '✅ IN WINDOW' : '⏭️ skip'}`);

      if (!inWindow) continue;

      // 4) Atomic duplicate prevention: insert first, skip if already exists
      const { error: logErr } = await supabase.from('notification_logs').insert({
        user_id: mt.user_id,
        meal_type: mt.meal_type,
        sent_date: localDate,
      });

      if (logErr) {
        // Unique constraint violation = already sent today
        if (logErr.code === '23505' || logErr.message?.includes('duplicate') || logErr.message?.includes('unique')) {
          console.log(`  ⏭️ Already sent ${mt.meal_type} today`);
          skipped++;
          continue;
        }
        console.error('  ❌ Log insert error:', logErr);
      }

      // 5) Send push
      const subs = subsMap.get(mt.user_id);
      if (!subs?.length) {
        console.log(`  ⚠️ No push subscription for user`);
        continue;
      }

      const msg = MEAL_MESSAGES[mt.meal_type] || MEAL_MESSAGES['snack'];
      const body = msg.body.replace('{baby}', babyName);

      const notification: NotificationPayload = {
        title: msg.title,
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `meal-${mt.meal_type}-${localDate}`,
        data: { url: '/planner', mealType: mt.meal_type },
      };

      for (const sub of subs) {
        const pushSub: PushSubscription = { id: sub.id, endpoint: sub.endpoint, keys: sub.keys };

        // Retry up to 2 times
        let success = false;
        for (let attempt = 1; attempt <= 2; attempt++) {
          const result = await sendPush(pushSub, notification, vapidKeys.publicKey, vapidKeys.privateKey);
          if (result.success) {
            sentCount++;
            success = true;
            console.log(`  ✅ Sent ${mt.meal_type} to ${sub.endpoint.substring(0, 50)}...`);
            break;
          }
          if (result.expired) {
            expiredIds.push(sub.id);
            failedCount++;
            break;
          }
          if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
          else { failedCount++; console.error(`  ❌ Failed after retries: ${result.error}`); }
        }
      }
    }

    // 6) Cleanup expired subscriptions
    if (expiredIds.length > 0) {
      console.log(`🧹 Cleaning ${expiredIds.length} expired subscriptions`);
      await supabase.from('push_subscriptions').delete().in('id', expiredIds);
    }

    console.log(`📊 Done: ${sentCount} sent, ${failedCount} failed, ${skipped} skipped (duplicate)`);

    return new Response(JSON.stringify({
      success: true, sent: sentCount, failed: failedCount, skippedDuplicates: skipped,
      expiredCleaned: expiredIds.length, checkedAt: now.toISOString(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
