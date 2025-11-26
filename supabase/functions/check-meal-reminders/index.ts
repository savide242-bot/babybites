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

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const MEAL_MESSAGES: Record<string, { title: string; body: string; emoji: string }> = {
  'breakfast': {
    title: 'Good Morning! Breakfast Time',
    body: "Start baby's day with a nutritious breakfast!",
    emoji: '🍳'
  },
  'morning-snack': {
    title: 'Morning Snack Time',
    body: 'A healthy snack keeps baby energized!',
    emoji: '🍎'
  },
  'lunch': {
    title: 'Lunch Time!',
    body: 'Time for a delicious and balanced lunch!',
    emoji: '🥗'
  },
  'afternoon-snack': {
    title: 'Afternoon Snack',
    body: 'Keep baby happy with a tasty snack!',
    emoji: '🍌'
  },
  'dinner': {
    title: 'Dinner Time!',
    body: 'End the day with a wholesome dinner!',
    emoji: '🍽️'
  }
};

async function sendWebPushNotification(
  subscription: PushSubscription,
  title: string,
  body: string,
  motherName?: string
): Promise<boolean> {
  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return false;
    }

    const personalizedBody = motherName ? `Hi ${motherName}! ${body}` : body;

    const payload = JSON.stringify({
      title,
      body: personalizedBody,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'meal-reminder',
      data: {
        url: '/planner',
        timestamp: Date.now()
      }
    });

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: payload,
    });

    if (response.status === 410) {
      console.log(`Subscription expired for user ${subscription.user_id}`);
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
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

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    console.log(`Checking meal reminders for ${currentHour}:${currentMinute}`);

    // Get all enabled notification preferences for this time
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, meal_type, hour, minute, enabled')
      .eq('enabled', true)
      .eq('hour', currentHour)
      .eq('minute', currentMinute);

    if (prefsError) {
      throw prefsError;
    }

    if (!preferences || preferences.length === 0) {
      console.log('No preferences found for this time');
      return new Response(
        JSON.stringify({ message: 'No reminders to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${preferences.length} reminders to send`);

    let sentCount = 0;
    let failedCount = 0;
    const expiredSubscriptions: string[] = [];

    for (const pref of preferences as NotificationPreference[]) {
      // Get user's push subscription
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', pref.user_id);

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No subscription found for user ${pref.user_id}`);
        continue;
      }

      // Get user's mother name for personalization
      const { data: profile } = await supabase
        .from('profiles')
        .select('mother_name')
        .eq('id', pref.user_id)
        .single();

      const motherName = profile?.mother_name;
      const mealInfo = MEAL_MESSAGES[pref.meal_type] || {
        title: 'Meal Reminder',
        body: 'Time for a meal!',
        emoji: '🍽️'
      };

      const title = `${mealInfo.emoji} ${mealInfo.title}`;

      for (const sub of subscriptions as PushSubscription[]) {
        const success = await sendWebPushNotification(sub, title, mealInfo.body, motherName);

        if (success) {
          sentCount++;
        } else {
          failedCount++;
          expiredSubscriptions.push(sub.id);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);
      console.log(`Cleaned up ${expiredSubscriptions.length} expired subscriptions`);
    }

    console.log(`Sent ${sentCount} notifications, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        expired: expiredSubscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-meal-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
