import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper functions for Web Push encryption
function toBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

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

async function hkdf(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toBuffer(ikm),
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toBuffer(salt),
      info: toBuffer(info)
    },
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

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  const endpointUrl = new URL(subscription.endpoint);
  const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

  // Create VAPID JWT
  const jwtHeader = { typ: 'JWT', alg: 'ES256' };
  const jwtPayload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: 'mailto:admin@bibi-app.com'
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(jwtHeader)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(jwtPayload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import VAPID private key using JWK format
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: vapidPrivateKey,
    x: vapidPublicKey.substring(0, 43),
    y: vapidPublicKey.substring(43)
  };
  
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBytes = new Uint8Array(signature);
  const signatureB64 = base64UrlEncode(signatureBytes);
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

  // Derive encryption keys using HKDF
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const prk = await hkdf(sharedSecret, authSecret, authInfo, 32);

  // Build context for key derivation
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

  // Build encrypted message with header
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

  // Send the push notification
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

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, mealType, title, body } = await req.json();
    
    console.log('📬 Sending meal reminder:', { userId, mealType, title });

    let vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    let vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured');
      throw new Error('VAPID keys not configured');
    }

    // Clean VAPID keys
    vapidPublicKey = vapidPublicKey.replace(/^["']|["']$/g, '').trim();
    vapidPrivateKey = vapidPrivateKey.replace(/^["']|["']$/g, '').trim();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get push subscription(s)
    let query = supabaseClient.from("push_subscriptions").select("*");
    
    if (userId) {
      query = query.eq("user_id", userId);
    }
    
    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found');
      return new Response(JSON.stringify({ message: "No subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    const payload = JSON.stringify({
      title: title || `🍽️ Hora da ${mealType || 'refeição'}!`,
      body: body || `Não te esqueças de preparar a refeição do bebé.`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'meal-reminder',
      data: {
        url: '/meal-planner',
        mealType: mealType
      }
    });

    let successCount = 0;
    let failedCount = 0;
    const expiredSubscriptions: string[] = [];

    // Send push notifications
    for (const sub of subscriptions) {
      try {
        console.log(`📤 Sending notification to user ${sub.user_id}`);
        
        const subscription: PushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys as { p256dh: string; auth: string }
        };
        
        const response = await sendWebPushNotification(
          subscription,
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );
        
        console.log(`📬 Response status: ${response.status}`);
        
        if (response.ok || response.status === 201) {
          console.log(`✅ Notification sent successfully to user ${sub.user_id}`);
          successCount++;
        } else if (response.status === 410 || response.status === 404) {
          console.log(`⚠️ Subscription expired for user ${sub.user_id}`);
          expiredSubscriptions.push(sub.id);
          failedCount++;
        } else {
          const errorText = await response.text();
          console.error(`❌ Failed to send to user ${sub.user_id}: ${response.status} - ${errorText}`);
          failedCount++;
        }
      } catch (subError) {
        console.error(`❌ Error sending to user ${sub.user_id}:`, subError);
        failedCount++;
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      console.log(`🧹 Cleaning up ${expiredSubscriptions.length} expired subscriptions`);
      await supabaseClient
        .from("push_subscriptions")
        .delete()
        .in("id", expiredSubscriptions);
    }
    
    console.log(`📊 Results: ${successCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        message: "Notifications processed", 
        total: subscriptions.length,
        successful: successCount,
        failed: failedCount,
        expiredCleaned: expiredSubscriptions.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error('❌ Error in send-meal-reminder:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
