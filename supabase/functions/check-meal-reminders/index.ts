import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MealTime {
  id: string;
  user_id: string;
  meal_type: string;
  preferred_hour: number;
  preferred_minute: number;
  enabled: boolean;
}

interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface UserProfile {
  id: string;
  mother_name: string | null;
  baby_name: string | null;
  timezone: string | null;
}

const MEAL_MESSAGES: Record<string, { title: string; body: string; emoji: string }> = {
  'breakfast': {
    title: '🌅 Hora do Café da Manhã!',
    body: 'Em 30 minutos é hora do café! Que tal preparar algo especial para {baby}?',
    emoji: '🌅'
  },
  'lunch': {
    title: '☀️ Hora do Almoço!',
    body: 'Em 30 minutos é hora do almoço de {baby}! Vamos preparar uma refeição nutritiva?',
    emoji: '☀️'
  },
  'snack': {
    title: '🍎 Hora do Lanche!',
    body: 'Em 30 minutos é hora do lanche de {baby}! Uma fruta ou algo leve?',
    emoji: '🍎'
  },
  'dinner': {
    title: '🌙 Hora do Jantar!',
    body: 'Em 30 minutos é hora do jantar! Vamos preparar a última refeição do dia para {baby}?',
    emoji: '🌙'
  }
};

const TIME_TOLERANCE_MINUTES = 3;
const REMINDER_MINUTES_BEFORE = 30;

// ==================== VAPID / WEB PUSH HELPERS ====================

async function sendWebPushNotification(
  subscription: PushSubscriptionRecord,
  title: string,
  body: string,
  tag?: string
): Promise<{ success: boolean; expired: boolean; error?: string }> {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!vapidPublicKey || !vapidPrivateKey) {
    return { success: false, expired: false, error: 'VAPID keys not configured' };
  }

  try {
    const webpush = await import('https://esm.sh/web-push@3.6.7');

    webpush.setVapidDetails(
      'mailto:support@babybites.app',
      vapidPublicKey.replace(/^['"]|['"]$/g, '').trim(),
      vapidPrivateKey.replace(/^['"]|['"]$/g, '').trim()
    );

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: tag || `meal-${Date.now()}`,
      data: { url: '/planner', timestamp: Date.now() }
    });

    console.log('📤 Sending push to:', subscription.endpoint.substring(0, 60) + '...');

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      payload,
      {
        TTL: 60 * 60 * 24,
        urgency: 'high',
      }
    );

    console.log('✅ Push accepted by provider');
    return { success: true, expired: false };
  } catch (error: any) {
    const status = error?.statusCode ?? error?.status;
    const details = error?.body ?? error?.message ?? String(error);

    console.error('❌ web-push error:', { status, details });

    if (status === 410 || status === 404) {
      return { success: false, expired: true, error: details };
    }

    return { success: false, expired: false, error: details };
  }
}

// Get current time in user's timezone
function getUserLocalTime(utcDate: Date, timezone: string): { hour: number; minute: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(utcDate);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');

    return { hour, minute };
  } catch (error) {
    console.error(`❌ Invalid timezone "${timezone}":`, error);
    return { hour: utcDate.getUTCHours(), minute: utcDate.getUTCMinutes() };
  }
}

// Calculate reminder time (30 min before meal)
function getReminderTime(mealHour: number, mealMinute: number): { hour: number; minute: number } {
  let reminderMinute = mealMinute - REMINDER_MINUTES_BEFORE;
  let reminderHour = mealHour;
  
  if (reminderMinute < 0) {
    reminderMinute += 60;
    reminderHour -= 1;
    if (reminderHour < 0) {
      reminderHour = 23;
    }
  }
  
  return { hour: reminderHour, minute: reminderMinute };
}

function timeMatchesWithTolerance(userHour: number, userMinute: number, targetHour: number, targetMinute: number): boolean {
  const userTotalMinutes = userHour * 60 + userMinute;
  const targetTotalMinutes = targetHour * 60 + targetMinute;
  const diff = Math.abs(userTotalMinutes - targetTotalMinutes);
  const wrappedDiff = Math.min(diff, 24 * 60 - diff);
  return wrappedDiff <= TIME_TOLERANCE_MINUTES;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    console.log(`\n========================================`);
    console.log(`⏰ CHECK-MEAL-REMINDERS STARTED`);
    console.log(`📅 Server Time (UTC): ${now.toISOString()}`);
    console.log(`🔔 Reminders sent ${REMINDER_MINUTES_BEFORE} min before meal time`);
    console.log(`========================================\n`);

    // Get all enabled meal times from baby_meal_times table
    const { data: allMealTimes, error: mealTimesError } = await supabase
      .from('baby_meal_times')
      .select('id, user_id, meal_type, preferred_hour, preferred_minute, enabled')
      .eq('enabled', true);

    if (mealTimesError) {
      console.error('❌ Error fetching meal times:', mealTimesError);
      throw mealTimesError;
    }

    console.log(`📋 Total enabled meal times: ${allMealTimes?.length || 0}`);

    if (!allMealTimes || allMealTimes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No enabled meal times found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profiles with timezones
    const userIds = [...new Set(allMealTimes.map((m: MealTime) => m.user_id))];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, mother_name, baby_name, timezone')
      .in('id', userIds);

    const profileMap = new Map<string, UserProfile>();
    (profiles || []).forEach((p: UserProfile) => profileMap.set(p.id, p));

    // Get push subscriptions
    const { data: allSubs } = await supabase.from('push_subscriptions').select('*');

    const subsMap = new Map<string, PushSubscriptionRecord[]>();
    (allSubs || []).forEach((s: PushSubscriptionRecord) => {
      const existing = subsMap.get(s.user_id) || [];
      existing.push(s);
      subsMap.set(s.user_id, existing);
    });

    console.log(`📱 Total push subscriptions: ${allSubs?.length || 0}`);

    let sentCount = 0;
    let failedCount = 0;
    const expiredSubscriptions: string[] = [];
    const processedUsers = new Set<string>();

    // Check each meal time against user's LOCAL time
    for (const mealTime of allMealTimes as MealTime[]) {
      const profile = profileMap.get(mealTime.user_id);
      const userTimezone = profile?.timezone || 'America/Sao_Paulo';
      const babyName = profile?.baby_name || 'bebê';

      const userLocalTime = getUserLocalTime(now, userTimezone);
      const reminderTime = getReminderTime(mealTime.preferred_hour, mealTime.preferred_minute);

      // Calculate time difference for logging
      const userTotalMinutes = userLocalTime.hour * 60 + userLocalTime.minute;
      const reminderTotalMinutes = reminderTime.hour * 60 + reminderTime.minute;
      const diff = Math.abs(userTotalMinutes - reminderTotalMinutes);
      const wrappedDiff = Math.min(diff, 24 * 60 - diff);

      const matches = timeMatchesWithTolerance(
        userLocalTime.hour,
        userLocalTime.minute,
        reminderTime.hour,
        reminderTime.minute
      );

      // Detailed logging for debugging
      console.log(`📋 Checking: ${mealTime.meal_type} | User: ${mealTime.user_id.substring(0, 8)}...`);
      console.log(`   🌍 Timezone: ${userTimezone}`);
      console.log(`   ⏰ User Local Time: ${userLocalTime.hour}:${String(userLocalTime.minute).padStart(2, '0')}`);
      console.log(`   🍽️ Meal Time: ${mealTime.preferred_hour}:${String(mealTime.preferred_minute).padStart(2, '0')}`);
      console.log(`   🔔 Reminder Time: ${reminderTime.hour}:${String(reminderTime.minute).padStart(2, '0')}`);
      console.log(`   📏 Difference: ${wrappedDiff} min (tolerance: ${TIME_TOLERANCE_MINUTES} min)`);
      console.log(`   ${matches ? '✅ MATCHES! Time to send reminder!' : '❌ Does not match'}`);

      if (!matches) continue;

      const userMealKey = `${mealTime.user_id}-${mealTime.meal_type}`;
      if (processedUsers.has(userMealKey)) continue;
      processedUsers.add(userMealKey);

      console.log(`\n🔔 SENDING REMINDER: ${mealTime.meal_type} for user ${mealTime.user_id.substring(0, 8)}...`);

      const subscriptions = subsMap.get(mealTime.user_id);
      if (!subscriptions || subscriptions.length === 0) {
        console.log(`⚠️ No push subscription for this user`);
        continue;
      }

      const message = MEAL_MESSAGES[mealTime.meal_type] || MEAL_MESSAGES['snack'];
      const personalizedBody = message.body.replace('{baby}', babyName);

      for (const sub of subscriptions) {
        const result = await sendWebPushNotification(
          sub,
          message.title,
          personalizedBody,
          `meal-${mealTime.meal_type}`
        );

        if (result.success) {
          sentCount++;
          console.log(`✅ Notification sent for ${mealTime.meal_type}!`);
        } else if (result.expired) {
          expiredSubscriptions.push(sub.id);
          failedCount++;
        } else {
          failedCount++;
          console.log(`❌ Failed: ${result.error}`);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      console.log(`🧹 Cleaning ${expiredSubscriptions.length} expired subscriptions`);
      await supabase.from('push_subscriptions').delete().in('id', expiredSubscriptions);
    }

    console.log(`\n📊 Results: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        expiredCleaned: expiredSubscriptions.length,
        checkedAt: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
