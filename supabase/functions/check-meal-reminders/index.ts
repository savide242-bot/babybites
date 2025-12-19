import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPreference {
  user_id: string;
  meal_type: string;
  hour: number;
  minute: number;
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
    title: '🍳 Breakfast Time!',
    body: "Start baby's day with a nutritious breakfast!",
    emoji: '🍳'
  },
  'morning-snack': {
    title: '🍎 Morning Snack Time',
    body: 'A healthy snack keeps baby energized!',
    emoji: '🍎'
  },
  'lunch': {
    title: '🥗 Lunch Time!',
    body: 'Time for a delicious and balanced lunch!',
    emoji: '🥗'
  },
  'afternoon-snack': {
    title: '🍌 Afternoon Snack',
    body: 'Keep baby happy with a tasty snack!',
    emoji: '🍌'
  },
  'dinner': {
    title: '🍽️ Dinner Time!',
    body: 'End the day with a wholesome dinner!',
    emoji: '🍽️'
  }
};

const TIME_TOLERANCE_MINUTES = 5;

// ==================== VAPID / WEB PUSH HELPERS ====================

function base64UrlDecode(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const rawData = atob(base64 + padding);
  return Uint8Array.from(rawData, c => c.charCodeAt(0));
}

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function toBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

async function hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey('raw', toBuffer(ikm), { name: 'HKDF' }, false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toBuffer(salt), info: toBuffer(info) },
    keyMaterial,
    length * 8
  );
  return new Uint8Array(derivedBits);
}

function createInfo(type: string, context: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const info = new Uint8Array(typeBytes.length + 1 + context.length);
  info.set(typeBytes);
  info[typeBytes.length] = 0;
  info.set(context, typeBytes.length + 1);
  return info;
}

// Properly decode VAPID public key (65-byte uncompressed EC point) to x and y coordinates
function decodeVapidPublicKey(vapidPublicKey: string): { x: string; y: string } {
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  
  // Uncompressed EC point format: 0x04 || x (32 bytes) || y (32 bytes)
  if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04) {
    throw new Error(`Invalid VAPID public key format. Length: ${publicKeyBytes.length}, First byte: ${publicKeyBytes[0]}`);
  }
  
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  
  return {
    x: base64UrlEncode(x),
    y: base64UrlEncode(y)
  };
}

async function sendWebPushNotification(
  subscription: PushSubscriptionRecord,
  title: string,
  body: string,
  motherName?: string,
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

    const personalizedBody = motherName ? `Hi ${motherName}! ${body}` : body;

    const payload = JSON.stringify({
      title,
      body: personalizedBody,
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

function timeMatchesWithTolerance(userHour: number, userMinute: number, prefHour: number, prefMinute: number): boolean {
  const userTotalMinutes = userHour * 60 + userMinute;
  const prefTotalMinutes = prefHour * 60 + prefMinute;
  const diff = Math.abs(userTotalMinutes - prefTotalMinutes);
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
    console.log(`========================================\n`);

    // Get all enabled preferences
    const { data: allPreferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, meal_type, hour, minute, enabled')
      .eq('enabled', true);

    if (prefsError) {
      console.error('❌ Error fetching preferences:', prefsError);
    }

    console.log(`📋 Total enabled preferences: ${allPreferences?.length || 0}`);

    // Get user profiles with timezones
    const userIds = [...new Set((allPreferences || []).map((p: NotificationPreference) => p.user_id))];

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

    // Check each preference against user's LOCAL time
    if (allPreferences && allPreferences.length > 0) {
      for (const pref of allPreferences as NotificationPreference[]) {
        const profile = profileMap.get(pref.user_id);
        const userTimezone = profile?.timezone || 'UTC';

        const userLocalTime = getUserLocalTime(now, userTimezone);

        // Calculate time difference for logging
        const userTotalMinutes = userLocalTime.hour * 60 + userLocalTime.minute;
        const prefTotalMinutes = pref.hour * 60 + pref.minute;
        const diff = Math.abs(userTotalMinutes - prefTotalMinutes);
        const wrappedDiff = Math.min(diff, 24 * 60 - diff);

        const matches = timeMatchesWithTolerance(
          userLocalTime.hour,
          userLocalTime.minute,
          pref.hour,
          pref.minute
        );

        // Detailed logging for debugging
        console.log(`📋 Checking: ${pref.meal_type} | User: ${pref.user_id.substring(0, 8)}...`);
        console.log(`   🌍 Timezone: ${userTimezone}`);
        console.log(`   ⏰ User Local Time: ${userLocalTime.hour}:${String(userLocalTime.minute).padStart(2, '0')}`);
        console.log(`   🎯 Preference Time: ${pref.hour}:${String(pref.minute).padStart(2, '0')}`);
        console.log(`   📏 Difference: ${wrappedDiff} min (tolerance: ${TIME_TOLERANCE_MINUTES} min)`);
        console.log(`   ${matches ? '✅ MATCHES!' : '❌ Does not match'}`);

        if (!matches) continue;

        const userMealKey = `${pref.user_id}-${pref.meal_type}`;
        if (processedUsers.has(userMealKey)) continue;
        processedUsers.add(userMealKey);

        console.log(`\n👤 MATCH: ${pref.meal_type} for ${pref.user_id.substring(0, 8)}...`);
        console.log(`   🌍 Timezone: ${userTimezone}, Local: ${userLocalTime.hour}:${String(userLocalTime.minute).padStart(2, '0')}`);

        const subscriptions = subsMap.get(pref.user_id);
        if (!subscriptions || subscriptions.length === 0) {
          console.log(`⚠️ No push subscription for this user`);
          continue;
        }

        const message = MEAL_MESSAGES[pref.meal_type] || MEAL_MESSAGES['lunch'];

        for (const sub of subscriptions) {
          const result = await sendWebPushNotification(
            sub,
            message.title,
            message.body,
            profile?.mother_name || undefined,
            `meal-${pref.meal_type}`
          );

          if (result.success) {
            sentCount++;
            console.log(`✅ Notification sent!`);
          } else if (result.expired) {
            expiredSubscriptions.push(sub.id);
            failedCount++;
          } else {
            failedCount++;
            console.log(`❌ Failed: ${result.error}`);
          }
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
        expiredCleaned: expiredSubscriptions.length
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
