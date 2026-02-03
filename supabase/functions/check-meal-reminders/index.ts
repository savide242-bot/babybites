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

// Support all meal types including morning-snack and afternoon-snack
const MEAL_MESSAGES: Record<string, { title: string; body: string; emoji: string }> = {
  'breakfast': {
    title: '🌅 Breakfast Time!',
    body: 'In 30 minutes it\'s breakfast time! How about preparing something special for {baby}?',
    emoji: '🌅'
  },
  'morning-snack': {
    title: '🍎 Morning Snack Time!',
    body: 'In 30 minutes it\'s morning snack time for {baby}! A fresh fruit perhaps?',
    emoji: '🍎'
  },
  'lunch': {
    title: '☀️ Lunch Time!',
    body: 'In 30 minutes it\'s lunch time for {baby}! Let\'s prepare a nutritious meal?',
    emoji: '☀️'
  },
  'afternoon-snack': {
    title: '🍌 Afternoon Snack Time!',
    body: 'In 30 minutes it\'s afternoon snack time for {baby}! Something light and healthy?',
    emoji: '🍌'
  },
  'snack': {
    title: '🍎 Snack Time!',
    body: 'In 30 minutes it\'s snack time for {baby}! A fruit or something light?',
    emoji: '🍎'
  },
  'dinner': {
    title: '🌙 Dinner Time!',
    body: 'In 30 minutes it\'s dinner time! Let\'s prepare the last meal of the day for {baby}?',
    emoji: '🌙'
  }
};

// IMPROVED APPROACH: Wider notification window for better reliability
// We want to send notifications when we're between 15-45 minutes BEFORE the meal
// This gives us a 30-minute window to catch the cron job reliably (runs every 5 min)
const MIN_MINUTES_BEFORE_MEAL = 15;
const MAX_MINUTES_BEFORE_MEAL = 45;

// ==================== NATIVE WEB PUSH IMPLEMENTATION ====================
// Using the shared webpush module instead of external library for better Deno compatibility

import { sendWebPushNotification as sendPush, getVapidKeys, type PushSubscription, type NotificationPayload } from "../_shared/webpush.ts";

// Wrapper function to maintain backward compatibility
async function sendWebPushNotification(
  subscription: PushSubscriptionRecord,
  title: string,
  body: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  tag?: string
): Promise<{ success: boolean; expired: boolean; error?: string }> {
  console.log('📤 Sending push to:', subscription.endpoint.substring(0, 60) + '...');
  
  const notification: NotificationPayload = {
    title,
    body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: tag || `meal-${Date.now()}`,
    data: { url: '/planner', timestamp: Date.now() },
    requireInteraction: true,
  };
  
  const pushSub: PushSubscription = {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  };
  
  // Retry up to 3 times with exponential backoff
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await sendPush(pushSub, notification, vapidPublicKey, vapidPrivateKey);
    
    if (result.success) {
      console.log(`✅ Push sent successfully on attempt ${attempt}!`);
      return { success: true, expired: false };
    }
    
    if (result.expired) {
      console.log('📛 Subscription expired, marking for cleanup');
      return { success: false, expired: true, error: result.error };
    }
    
    // If not expired and failed, retry with backoff
    if (attempt < 3) {
      const delay = attempt * 1000; // 1s, 2s
      console.log(`⏳ Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    } else {
      console.error(`❌ All ${attempt} attempts failed:`, result.error);
      return { success: false, expired: false, error: result.error };
    }
  }
  
  return { success: false, expired: false, error: 'Max retries exceeded' };
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

// Get current date in user's timezone (for duplicate prevention)
function getUserLocalDate(utcDate: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(utcDate); // Returns YYYY-MM-DD format
  } catch (error) {
    console.error(`❌ Invalid timezone for date "${timezone}":`, error);
    return utcDate.toISOString().split('T')[0];
  }
}

// NEW APPROACH: Calculate minutes until meal time
function getMinutesUntilMeal(userHour: number, userMinute: number, mealHour: number, mealMinute: number): number {
  const userTotalMinutes = userHour * 60 + userMinute;
  const mealTotalMinutes = mealHour * 60 + mealMinute;
  
  let diff = mealTotalMinutes - userTotalMinutes;
  
  // Handle day wrap-around (if meal is tomorrow)
  if (diff < -12 * 60) {
    diff += 24 * 60; // Add 24 hours
  }
  
  return diff;
}

// Check if we should send a reminder now
// Returns true if we're between 25-35 minutes before the meal
function shouldSendReminder(userHour: number, userMinute: number, mealHour: number, mealMinute: number): boolean {
  const minutesUntilMeal = getMinutesUntilMeal(userHour, userMinute, mealHour, mealMinute);
  
  // Send if we're between 25 and 35 minutes before the meal
  return minutesUntilMeal >= MIN_MINUTES_BEFORE_MEAL && minutesUntilMeal <= MAX_MINUTES_BEFORE_MEAL;
}

// Check if notification was already sent today for this user/meal
async function wasAlreadySentToday(
  supabase: any,
  userId: string,
  mealType: string,
  userLocalDate: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('notification_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('meal_type', mealType)
    .eq('sent_date', userLocalDate)
    .limit(1);

  if (error) {
    console.error('❌ Error checking notification logs:', error);
    return false; // If error, allow sending (better to send duplicate than miss)
  }

  return data && data.length > 0;
}

// Log sent notification to prevent duplicates
async function logNotificationSent(
  supabase: any,
  userId: string,
  mealType: string,
  userLocalDate: string
): Promise<void> {
  const { error } = await supabase
    .from('notification_logs')
    .insert({
      user_id: userId,
      meal_type: mealType,
      sent_date: userLocalDate,
    });

  if (error) {
    // Ignore unique constraint violations (means already logged)
    if (!error.message?.includes('duplicate') && !error.message?.includes('unique')) {
      console.error('❌ Error logging notification:', error);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get VAPID keys
    let vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    let vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up keys (remove quotes if present)
    vapidPublicKey = vapidPublicKey.replace(/^['"]|['"]$/g, '').trim();
    vapidPrivateKey = vapidPrivateKey.replace(/^['"]|['"]$/g, '').trim();

    const now = new Date();

    console.log(`\n========================================`);
    console.log(`⏰ CHECK-MEAL-REMINDERS v2.1 STARTED`);
    console.log(`📅 Server Time (UTC): ${now.toISOString()}`);
    console.log(`🔔 NEW LOGIC: Send when ${MIN_MINUTES_BEFORE_MEAL}-${MAX_MINUTES_BEFORE_MEAL} min before meal`);
    console.log(`📏 Window: 10 minutes (catches cron every 5 min)`);
    console.log(`🔑 Using web-push library (improved compatibility)`);
    console.log(`🛡️ Duplicate prevention: notification_logs table`);
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
    let skippedDuplicates = 0;
    const expiredSubscriptions: string[] = [];
    const processedUsers = new Set<string>();

    // Check each meal time against user's LOCAL time
    for (const mealTime of allMealTimes as MealTime[]) {
      const profile = profileMap.get(mealTime.user_id);
      const userTimezone = profile?.timezone || 'America/Sao_Paulo';
      const babyName = profile?.baby_name || 'baby';

      const userLocalTime = getUserLocalTime(now, userTimezone);
      const userLocalDate = getUserLocalDate(now, userTimezone);
      
      // NEW: Calculate minutes until meal
      const minutesUntilMeal = getMinutesUntilMeal(
        userLocalTime.hour, 
        userLocalTime.minute, 
        mealTime.preferred_hour, 
        mealTime.preferred_minute
      );
      
      const shouldSend = shouldSendReminder(
        userLocalTime.hour,
        userLocalTime.minute,
        mealTime.preferred_hour,
        mealTime.preferred_minute
      );

      // Detailed logging for debugging
      console.log(`📋 Checking: ${mealTime.meal_type} | User: ${mealTime.user_id.substring(0, 8)}...`);
      console.log(`   🌍 Timezone: ${userTimezone}`);
      console.log(`   📅 User Local Date: ${userLocalDate}`);
      console.log(`   ⏰ User Local Time: ${userLocalTime.hour}:${String(userLocalTime.minute).padStart(2, '0')}`);
      console.log(`   🍽️ Meal Time: ${mealTime.preferred_hour}:${String(mealTime.preferred_minute).padStart(2, '0')}`);
      console.log(`   ⏳ Minutes until meal: ${minutesUntilMeal}`);
      console.log(`   📏 Window: ${MIN_MINUTES_BEFORE_MEAL}-${MAX_MINUTES_BEFORE_MEAL} min before meal`);
      console.log(`   ${shouldSend ? '✅ IN WINDOW! Time to send reminder!' : '❌ Not in notification window'}`);

      if (!shouldSend) continue;

      const userMealKey = `${mealTime.user_id}-${mealTime.meal_type}`;
      if (processedUsers.has(userMealKey)) continue;
      processedUsers.add(userMealKey);

      // CHECK FOR DUPLICATES - Don't send if already sent today
      const alreadySent = await wasAlreadySentToday(
        supabase,
        mealTime.user_id,
        mealTime.meal_type,
        userLocalDate
      );

      if (alreadySent) {
        console.log(`⏭️ SKIPPING: Already sent ${mealTime.meal_type} reminder today`);
        skippedDuplicates++;
        continue;
      }

      console.log(`\n🔔 SENDING REMINDER: ${mealTime.meal_type} for user ${mealTime.user_id.substring(0, 8)}...`);

      const subscriptions = subsMap.get(mealTime.user_id);
      if (!subscriptions || subscriptions.length === 0) {
        console.log(`⚠️ No push subscription for this user`);
        continue;
      }

      // Get the message for this meal type (fallback to snack if not found)
      const message = MEAL_MESSAGES[mealTime.meal_type] || MEAL_MESSAGES['snack'];
      const personalizedBody = message.body.replace('{baby}', babyName);

      let sentForThisMeal = false;

      for (const sub of subscriptions) {
        const result = await sendWebPushNotification(
          sub,
          message.title,
          personalizedBody,
          vapidPublicKey,
          vapidPrivateKey,
          `meal-${mealTime.meal_type}`
        );

        if (result.success) {
          sentCount++;
          sentForThisMeal = true;
          console.log(`✅ Notification sent for ${mealTime.meal_type}!`);
        } else if (result.expired) {
          expiredSubscriptions.push(sub.id);
          failedCount++;
        } else {
          failedCount++;
          console.log(`❌ Failed: ${result.error}`);
        }
      }

      // Log this notification to prevent duplicates
      if (sentForThisMeal) {
        await logNotificationSent(supabase, mealTime.user_id, mealTime.meal_type, userLocalDate);
        console.log(`📝 Logged notification to prevent duplicates`);
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      console.log(`🧹 Cleaning ${expiredSubscriptions.length} expired subscriptions`);
      await supabase.from('push_subscriptions').delete().in('id', expiredSubscriptions);
    }

    console.log(`\n📊 Results: ${sentCount} sent, ${failedCount} failed, ${skippedDuplicates} skipped (already sent)`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        skippedDuplicates,
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
