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
    title: '🌅 Hora do Café da Manhã!',
    body: 'Em 30 minutos é hora do café! Que tal preparar algo especial para {baby}?',
    emoji: '🌅'
  },
  'morning-snack': {
    title: '🍎 Hora do Lanche da Manhã!',
    body: 'Em 30 minutos é hora do lanche da manhã de {baby}! Uma fruta fresquinha?',
    emoji: '🍎'
  },
  'lunch': {
    title: '☀️ Hora do Almoço!',
    body: 'Em 30 minutos é hora do almoço de {baby}! Vamos preparar uma refeição nutritiva?',
    emoji: '☀️'
  },
  'afternoon-snack': {
    title: '🍌 Hora do Lanche da Tarde!',
    body: 'Em 30 minutos é hora do lanche da tarde de {baby}! Algo leve e saudável?',
    emoji: '🍌'
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

// ==================== NATIVE WEB PUSH IMPLEMENTATION ====================

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

function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(arr.length);
  new Uint8Array(buffer).set(arr);
  return buffer;
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function generateVapidAuthHeader(
  audience: string,
  subject: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key for signing
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);

  // Create JWK for the private key
  const x = base64UrlEncode(publicKeyBytes.slice(1, 33));
  const y = base64UrlEncode(publicKeyBytes.slice(33, 65));
  const d = base64UrlEncode(privateKeyBytes);

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d,
  };

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw format if needed
  const signatureBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  
  if (signatureBytes.length === 64) {
    r = signatureBytes.slice(0, 32);
    s = signatureBytes.slice(32, 64);
  } else {
    r = signatureBytes.slice(0, 32);
    s = signatureBytes.slice(32);
  }

  const rawSignature = concatUint8Arrays(r, s);
  const signatureB64 = base64UrlEncode(rawSignature);

  const jwt = `${unsignedToken}.${signatureB64}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: `p256ecdsa=${vapidPublicKey}`,
  };
}

async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const userPublicKeyBytes = base64UrlDecode(p256dhKey);
  const userAuthBytes = base64UrlDecode(authSecret);

  // Generate ephemeral key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Export local public key
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);

  // Import user's public key
  const userPublicKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(userPublicKeyBytes),
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

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF for IKM
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const prkKey = await crypto.subtle.importKey('raw', toArrayBuffer(sharedSecret), { name: 'HKDF' }, false, ['deriveBits']);
  const ikmBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toArrayBuffer(userAuthBytes), info: toArrayBuffer(authInfo) },
    prkKey,
    256
  );
  const ikm = new Uint8Array(ikmBits);

  // Create context for key derivation
  const keyInfoPrefix = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const keyInfo = concatUint8Arrays(keyInfoPrefix);

  const nonceInfoPrefix = new TextEncoder().encode('Content-Encoding: nonce\0');
  const nonceInfo = concatUint8Arrays(nonceInfoPrefix);

  // Derive encryption key and nonce
  const prkKey2 = await crypto.subtle.importKey('raw', toArrayBuffer(ikm), { name: 'HKDF' }, false, ['deriveBits']);
  
  const keyBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toArrayBuffer(salt), info: toArrayBuffer(keyInfo) },
    prkKey2,
    128
  );
  const contentEncryptionKey = new Uint8Array(keyBits);

  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toArrayBuffer(salt), info: toArrayBuffer(nonceInfo) },
    prkKey2,
    96
  );
  const nonce = new Uint8Array(nonceBits);

  // Encrypt with AES-GCM
  const aesKey = await crypto.subtle.importKey('raw', toArrayBuffer(contentEncryptionKey), { name: 'AES-GCM' }, false, ['encrypt']);
  
  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = concatUint8Arrays(payloadBytes, new Uint8Array([2])); // Add delimiter

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey,
    toArrayBuffer(paddedPayload)
  );
  const ciphertext = new Uint8Array(ciphertextBuffer);

  return { ciphertext, salt, localPublicKey };
}

function buildAes128GcmBody(
  ciphertext: Uint8Array,
  salt: Uint8Array,
  localPublicKey: Uint8Array,
  recordSize: number = 4096
): Uint8Array {
  const header = new Uint8Array(86);
  header.set(salt, 0); // 16 bytes salt
  new DataView(header.buffer).setUint32(16, recordSize, false); // 4 bytes record size
  header[20] = localPublicKey.length; // 1 byte key length
  header.set(localPublicKey, 21); // 65 bytes public key

  return concatUint8Arrays(header, ciphertext);
}

async function sendWebPushNotification(
  subscription: PushSubscriptionRecord,
  title: string,
  body: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  tag?: string
): Promise<{ success: boolean; expired: boolean; error?: string }> {
  try {
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: tag || `meal-${Date.now()}`,
      data: { url: '/planner', timestamp: Date.now() }
    });

    console.log('📤 Sending push to:', subscription.endpoint.substring(0, 60) + '...');

    // Get audience from endpoint URL
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

    // Generate VAPID authorization header
    const vapidHeaders = await generateVapidAuthHeader(
      audience,
      'mailto:support@babybites.app',
      vapidPublicKey,
      vapidPrivateKey
    );

    // Encrypt the payload
    const { ciphertext, salt, localPublicKey } = await encryptPayload(
      payload,
      subscription.keys.p256dh,
      subscription.keys.auth
    );

    // Build the encrypted body
    const encryptedBody = buildAes128GcmBody(ciphertext, salt, localPublicKey);

    // Send the push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization': vapidHeaders.authorization,
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: toArrayBuffer(encryptedBody),
    });

    console.log('📬 Push service response:', response.status, response.statusText);

    if (response.ok || response.status === 201) {
      console.log('✅ Push notification sent successfully!');
      return { success: true, expired: false };
    } else {
      const errorText = await response.text();
      console.error('❌ Push service error:', response.status, errorText);
      
      if (response.status === 410 || response.status === 404) {
        return { success: false, expired: true, error: errorText };
      }
      
      return { success: false, expired: false, error: errorText };
    }
  } catch (error) {
    console.error('💥 Error sending push:', error);
    return { 
      success: false, 
      expired: false,
      error: error instanceof Error ? error.message : String(error) 
    };
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
    console.log(`⏰ CHECK-MEAL-REMINDERS STARTED`);
    console.log(`📅 Server Time (UTC): ${now.toISOString()}`);
    console.log(`🔔 Reminders sent ${REMINDER_MINUTES_BEFORE} min before meal time`);
    console.log(`🔑 Using native Web Push API`);
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

      // Get the message for this meal type (fallback to snack if not found)
      const message = MEAL_MESSAGES[mealTime.meal_type] || MEAL_MESSAGES['snack'];
      const personalizedBody = message.body.replace('{baby}', babyName);

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
