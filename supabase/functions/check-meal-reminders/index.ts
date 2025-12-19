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
  try {
    let vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    let vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return { success: false, expired: false, error: 'VAPID keys not configured' };
    }

    // Clean VAPID keys
    vapidPublicKey = vapidPublicKey.replace(/^["']|["']$/g, '').trim();
    vapidPrivateKey = vapidPrivateKey.replace(/^["']|["']$/g, '').trim();

    console.log(`🔑 VAPID public key length: ${vapidPublicKey.length}`);

    // Decode VAPID public key to get x and y coordinates
    const { x, y } = decodeVapidPublicKey(vapidPublicKey);
    console.log(`🔑 Decoded x length: ${x.length}, y length: ${y.length}`);

    const personalizedBody = motherName ? `Hi ${motherName}! ${body}` : body;

    const payload = JSON.stringify({
      title,
      body: personalizedBody,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: tag || 'meal-reminder',
      data: { url: '/planner', timestamp: Date.now() }
    });

    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

    // Create VAPID JWT
    const jwtHeader = { typ: 'JWT', alg: 'ES256' };
    const jwtPayload = {
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: 'mailto:support@babybites.app'
    };

    const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(jwtHeader)));
    const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(jwtPayload)));
    const unsignedToken = `${headerB64}.${payloadB64}`;

    // Import VAPID private key with CORRECT x and y from decoded public key
    const jwk = {
      kty: 'EC',
      crv: 'P-256',
      d: vapidPrivateKey,
      x: x,
      y: y
    };

    let privateKey;
    try {
      privateKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      );
    } catch (e) {
      console.error('❌ Failed to import VAPID private key:', e);
      return { success: false, expired: false, error: `Key import failed: ${e}` };
    }

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      new TextEncoder().encode(unsignedToken)
    );

    const signatureB64 = base64UrlEncode(new Uint8Array(signature));
    const vapidToken = `${unsignedToken}.${signatureB64}`;

    // Generate local key pair for encryption
    const localKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );

    const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
    const localPublicKeyBytes = new Uint8Array(localPublicKeyRaw);

    // Import user's public key
    const p256dhBytes = base64UrlDecode(subscription.keys.p256dh);
    const userPublicKey = await crypto.subtle.importKey(
      'raw',
      toBuffer(p256dhBytes),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    // Derive shared secret
    const sharedSecretBits = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: userPublicKey },
      localKeyPair.privateKey,
      256
    );
    const sharedSecret = new Uint8Array(sharedSecretBits);
    const authSecret = base64UrlDecode(subscription.keys.auth);

    // Derive encryption keys
    const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
    const prk = await hkdf(sharedSecret, authSecret, authInfo, 32);

    const context = new Uint8Array(1 + 2 + 65 + 2 + 65);
    context[0] = 0;
    context[1] = 0;
    context[2] = 65;
    context.set(p256dhBytes, 3);
    context[68] = 0;
    context[69] = 65;
    context.set(localPublicKeyBytes, 70);

    const cekInfo = createInfo('Content-Encoding: aes128gcm', context);
    const nonceInfo = createInfo('Content-Encoding: nonce', context);

    const cek = await hkdf(prk, new Uint8Array(0), cekInfo, 16);
    const nonce = await hkdf(prk, new Uint8Array(0), nonceInfo, 12);

    // Encrypt payload
    const payloadBytes = new TextEncoder().encode(payload);
    const paddedPayload = new Uint8Array(payloadBytes.length + 2);
    paddedPayload.set(payloadBytes);
    paddedPayload[payloadBytes.length] = 2;
    paddedPayload[payloadBytes.length + 1] = 0;

    const aesKey = await crypto.subtle.importKey(
      'raw',
      toBuffer(cek),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toBuffer(nonce) },
      aesKey,
      toBuffer(paddedPayload)
    );

    // Build encrypted message
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const recordSize = new Uint8Array(4);
    new DataView(recordSize.buffer).setUint32(0, 4096, false);

    const header = new Uint8Array(16 + 4 + 1 + 65);
    header.set(salt);
    header.set(recordSize, 16);
    header[20] = 65;
    header.set(localPublicKeyBytes, 21);

    const encryptedPayload = new Uint8Array(header.length + encrypted.byteLength);
    encryptedPayload.set(header);
    encryptedPayload.set(new Uint8Array(encrypted), header.length);

    console.log('📤 Sending push to:', subscription.endpoint.substring(0, 60) + '...');

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization': `vapid t=${vapidToken}, k=${vapidPublicKey}`,
        'TTL': '86400',
        'Urgency': 'high'
      },
      body: encryptedPayload
    });

    console.log(`📬 Response status: ${response.status}`);

    if (response.status === 410 || response.status === 404) {
      return { success: false, expired: true };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Push failed: ${response.status} - ${errorText}`);
      return { success: false, expired: false, error: `${response.status}: ${errorText}` };
    }

    return { success: true, expired: false };
  } catch (error) {
    console.error('❌ Push error:', error);
    return { success: false, expired: false, error: String(error) };
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
