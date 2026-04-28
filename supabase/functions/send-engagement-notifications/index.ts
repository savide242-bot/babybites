import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  sendWebPushNotification, 
  getVapidKeys, 
  type PushSubscription,
  type NotificationPayload 
} from "../_shared/webpush.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📬 send-engagement-notifications v2.0 - Using unified webpush module');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get VAPID keys
    const vapidKeys = getVapidKeys();
    if (!vapidKeys) {
      throw new Error('VAPID keys not configured');
    }

    const { type } = await req.json();
    console.log(`📬 Processing engagement notification type: ${type}`);

    let results = { sent: 0, failed: 0, expired: 0 };
    const expiredIds: string[] = [];

    if (type === 'checkin_reminder') {
      // Send check-in reminder to users who haven't checked in today
      const today = new Date().toISOString().split('T')[0];
      
      // Get all users with push subscriptions
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh, auth');

      if (!subscriptions || subscriptions.length === 0) {
        return new Response(JSON.stringify({ message: 'No subscriptions found', results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      for (const sub of subscriptions) {
        // Check if user has notification preference enabled
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('checkin_reminder_enabled')
          .eq('user_id', sub.user_id)
          .limit(1);

        // Skip if user has disabled checkin reminders
        if (prefs && prefs.length > 0 && prefs[0].checkin_reminder_enabled === false) {
          continue;
        }

        // Check if user already checked in today
        const { data: checkin } = await supabase
          .from('daily_checkins')
          .select('id')
          .eq('user_id', sub.user_id)
          .eq('checkin_date', today)
          .maybeSingle();

        if (!checkin) {
          // User hasn't checked in, send reminder
          const { data: profile } = await supabase
            .from('profiles')
            .select('baby_name')
            .eq('id', sub.user_id)
            .single();

          const babyName = profile?.baby_name || 'your baby';
          
          const notification: NotificationPayload = {
            title: '🍽️ How was feeding today?',
            body: `Don't forget to log how ${babyName} ate today! Keep your streak going.`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'checkin-reminder',
            data: { url: '/' }
          };

          const pushSub: PushSubscription = {
            id: sub.id,
            user_id: sub.user_id,
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          };

          const result = await sendWebPushNotification(
            pushSub,
            notification,
            vapidKeys.publicKey,
            vapidKeys.privateKey
          );

          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
            if (result.expired) {
              expiredIds.push(sub.id);
              results.expired++;
            }
          }
        }
      }
    } else if (type === 'streak_risk') {
      // Alert users whose streak is at risk
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: atRiskStreaks } = await supabase
        .from('user_streaks')
        .select('user_id, current_streak')
        .eq('last_activity_date', yesterdayStr)
        .gte('current_streak', 3);

      if (atRiskStreaks) {
        for (const streak of atRiskStreaks) {
          // Check notification preference
          const { data: prefs } = await supabase
            .from('notification_preferences')
            .select('streak_risk_alerts_enabled')
            .eq('user_id', streak.user_id)
            .limit(1);

          if (prefs && prefs.length > 0 && prefs[0].streak_risk_alerts_enabled === false) {
            continue;
          }

          const { data: sub } = await supabase
            .from('push_subscriptions')
            .select('id, user_id, endpoint, p256dh, auth')
            .eq('user_id', streak.user_id)
            .maybeSingle();

          if (sub) {
            const notification: NotificationPayload = {
              title: '🔥 Your streak is at risk!',
              body: `Don't lose your ${streak.current_streak}-day streak! Log in today to keep it going.`,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              tag: 'streak-risk',
              data: { url: '/' }
            };

            const pushSub: PushSubscription = {
              id: sub.id,
              user_id: sub.user_id,
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            };

            const result = await sendWebPushNotification(
              pushSub,
              notification,
              vapidKeys.publicKey,
              vapidKeys.privateKey
            );

            if (result.success) {
              results.sent++;
            } else {
              results.failed++;
              if (result.expired) {
                expiredIds.push(sub.id);
                results.expired++;
              }
            }
          }
        }
      }
    } else if (type === 'challenge_expiring') {
      // Notify about challenges expiring in 24h
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: expiringChallenge } = await supabase
        .from('weekly_challenges')
        .select('id, title')
        .eq('is_active', true)
        .lte('ends_at', tomorrow.toISOString())
        .gte('ends_at', new Date().toISOString())
        .maybeSingle();

      if (expiringChallenge) {
        // Get users with incomplete progress
        const { data: incompleteProgress } = await supabase
          .from('user_challenge_progress')
          .select('user_id')
          .eq('challenge_id', expiringChallenge.id)
          .eq('completed', false);

        if (incompleteProgress) {
          for (const progress of incompleteProgress) {
            // Check notification preference
            const { data: prefs } = await supabase
              .from('notification_preferences')
              .select('challenge_alerts_enabled')
              .eq('user_id', progress.user_id)
              .limit(1);

            if (prefs && prefs.length > 0 && prefs[0].challenge_alerts_enabled === false) {
              continue;
            }

            const { data: sub } = await supabase
              .from('push_subscriptions')
              .select('id, user_id, endpoint, p256dh, auth')
              .eq('user_id', progress.user_id)
              .maybeSingle();

            if (sub) {
              const notification: NotificationPayload = {
                title: '⏰ Challenge ending soon!',
                body: `"${expiringChallenge.title}" ends tomorrow. Complete it to earn bonus points!`,
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: 'challenge-expiring',
                data: { url: '/' }
              };

              const pushSub: PushSubscription = {
                id: sub.id,
                user_id: sub.user_id,
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              };

              const result = await sendWebPushNotification(
                pushSub,
                notification,
                vapidKeys.publicKey,
                vapidKeys.privateKey
              );

              if (result.success) {
                results.sent++;
              } else {
                results.failed++;
                if (result.expired) {
                  expiredIds.push(sub.id);
                  results.expired++;
                }
              }
            }
          }
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      console.log(`🧹 Cleaning ${expiredIds.length} expired subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredIds);
    }

    console.log(`📊 Notification results: ${results.sent} sent, ${results.failed} failed, ${results.expired} expired`);

    return new Response(JSON.stringify({ 
      success: true, 
      type,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in send-engagement-notifications:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
