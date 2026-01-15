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

// Development insights based on age
const getDevelopmentInsights = (months: number): string => {
  const insights: { [key: number]: string } = {
    1: "At 1 month, your baby starts focusing on objects 20-30cm away and recognizes mom's voice.",
    2: "At 2 months, your baby smiles socially and starts following objects with their eyes.",
    3: "At 3 months, your baby holds their head up better and loves looking at their own hands.",
    4: "At 4 months, many babies start rolling and laughing out loud.",
    5: "At 5 months, your baby may start sitting with support and shows interest in toys.",
    6: "🎉 6 months! Important milestone! Your baby can start solid foods and shows interest in food.",
    7: "At 7 months, your baby may start crawling and loves exploring textures.",
    8: "At 8 months, many babies crawl well and start picking up objects with the pincer grasp.",
    9: "At 9 months, your baby may start standing with support and can eat more textured foods.",
    10: "At 10 months, your baby loves imitating sounds and gestures.",
    11: "At 11 months, your baby may take first steps with support.",
    12: "🎂 1 YEAR! Happy Birthday! Your baby can eat most family foods now.",
    18: "At 18 months, your child has a vocabulary of 10-20 words and eats more independently.",
    24: "🎂 2 YEARS! Your child speaks short sentences and eats practically everything!",
    36: "🎂 3 YEARS! Your child is very independent and has strong opinions about food.",
  };

  if (insights[months]) return insights[months];
  
  const years = Math.floor(months / 12);
  if (years >= 1) {
    return `At ${years} year${years > 1 ? 's' : ''}, your child continues to develop rapidly!`;
  }
  return `At ${months} months, your baby is in a phase of great development!`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎂 baby-birthday-check v2.0 - Using unified webpush module');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get VAPID keys
    const vapidKeys = getVapidKeys();

    const today = new Date();
    const currentDay = today.getDate();

    // Get all profiles with baby_birth_date
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, baby_name, baby_birth_date')
      .not('baby_birth_date', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles with baby birth dates`);

    let notificationsSent = 0;
    let pushNotificationsSent = 0;

    for (const profile of profiles || []) {
      const birthDate = new Date(profile.baby_birth_date);
      const birthDay = birthDate.getDate();

      // Check if today is the baby's monthly birthday
      if (birthDay === currentDay) {
        // Calculate age in months
        const ageMonths = Math.floor(
          (today.getTime() - birthDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
        );

        if (ageMonths < 1) continue; // Skip if less than 1 month

        // Check if notification already sent for this month
        const { data: existing } = await supabase
          .from('baby_birthday_notifications')
          .select('id')
          .eq('user_id', profile.id)
          .eq('baby_age_months', ageMonths)
          .single();

        if (existing) {
          console.log(`Notification already sent for user ${profile.id} at ${ageMonths} months`);
          continue;
        }

        const insight = getDevelopmentInsights(ageMonths);

        // Create birthday notification record
        const { error: insertError } = await supabase
          .from('baby_birthday_notifications')
          .insert({
            user_id: profile.id,
            baby_age_months: ageMonths,
            insight_text: insight,
            seen: false
          });

        if (insertError) {
          console.error(`Error creating notification for user ${profile.id}:`, insertError);
          continue;
        }

        console.log(`Created birthday notification for user ${profile.id}, baby age: ${ageMonths} months`);
        notificationsSent++;

        // Send push notification if VAPID keys are available
        if (vapidKeys) {
          const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('id, user_id, endpoint, keys')
            .eq('user_id', profile.id);

          if (subscriptions && subscriptions.length > 0) {
            const years = Math.floor(ageMonths / 12);
            const remainingMonths = ageMonths % 12;
            let ageText = '';
            
            if (years === 0) {
              ageText = `${ageMonths} ${ageMonths === 1 ? 'month' : 'months'}`;
            } else if (remainingMonths === 0) {
              ageText = `${years} ${years === 1 ? 'year' : 'years'}`;
            } else {
              ageText = `${years} year${years > 1 ? 's' : ''} and ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
            }

            const notification: NotificationPayload = {
              title: `🎂 Happy Birthday, ${profile.baby_name || 'Baby'}!`,
              body: `Today marks ${ageText}! Open the app to see developmental milestones. 🎉`,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              tag: `birthday-${profile.id}-${ageMonths}`,
              data: {
                url: '/profile',
                type: 'birthday',
                ageMonths
              }
            };

            for (const sub of subscriptions) {
              const pushSub: PushSubscription = {
                id: sub.id,
                user_id: sub.user_id,
                endpoint: sub.endpoint,
                keys: sub.keys as { p256dh: string; auth: string },
              };

              const result = await sendWebPushNotification(
                pushSub,
                notification,
                vapidKeys.publicKey,
                vapidKeys.privateKey
              );

              if (result.success) {
                pushNotificationsSent++;
                console.log(`✅ Push notification sent to ${profile.id}`);
              } else {
                console.error(`❌ Failed to send push to ${profile.id}: ${result.error}`);
                
                // Clean up expired subscription
                if (result.expired) {
                  await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('id', sub.id);
                }
              }
            }
          }
        }
      }
    }

    console.log(`Birthday check complete. DB notifications: ${notificationsSent}, Push notifications: ${pushNotificationsSent}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent,
        pushNotificationsSent,
        checkedProfiles: profiles?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in baby-birthday-check:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
