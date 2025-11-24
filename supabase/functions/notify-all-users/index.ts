import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  action_label?: string;
  action_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Unauthorized - admin role required');
    }

    const payload: NotificationPayload = await req.json();

    // Fetch all push subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    let successCount = 0;
    let failCount = 0;
    const expiredEndpoints: string[] = [];

    for (const subscription of subscriptions as PushSubscription[]) {
      try {
        const notificationData = {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'admin-notification',
          requireInteraction: false,
          data: {
            url: payload.action_url || '/',
          },
          actions: payload.action_label ? [{
            action: 'open',
            title: payload.action_label,
          }] : [],
        };

        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
          },
          body: JSON.stringify(notificationData),
        });

        if (response.ok) {
          successCount++;
        } else if (response.status === 410) {
          expiredEndpoints.push(subscription.endpoint);
          failCount++;
        } else {
          console.error(`Failed to send to ${subscription.endpoint}: ${response.status}`);
          failCount++;
        }
      } catch (error) {
        console.error(`Error sending to ${subscription.endpoint}:`, error);
        failCount++;
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    // Log admin notification
    await supabase
      .from('admin_notifications')
      .insert({
        created_by: user.id,
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        action_label: payload.action_label,
        action_url: payload.action_url,
        recipients_count: subscriptions.length,
        successful_count: successCount,
        failed_count: failCount,
      });

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        total: subscriptions.length,
        successful: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
