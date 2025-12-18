import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Development insights based on age
const getDevelopmentInsights = (months: number): string => {
  const insights: { [key: number]: string } = {
    1: "Com 1 mês, o bebé começa a focar objetos a 20-30cm de distância e reconhece a voz da mãe.",
    2: "Aos 2 meses, o bebé já sorri socialmente e começa a seguir objetos com os olhos.",
    3: "Com 3 meses, o bebé sustenta melhor a cabeça e adora olhar para as próprias mãos.",
    4: "Aos 4 meses, muitos bebés começam a rolar e a rir alto.",
    5: "Com 5 meses, o bebé pode começar a sentar-se com apoio e demonstra interesse em brinquedos.",
    6: "🎉 6 meses! Marco importante! O bebé pode começar a introdução alimentar e mostrar interesse em comida sólida.",
    7: "Aos 7 meses, o bebé pode começar a gatinhar e adora explorar texturas.",
    8: "Com 8 meses, muitos bebés já gatinham bem e começam a pegar objetos com o movimento de pinça.",
    9: "Aos 9 meses, o bebé pode começar a ficar de pé com apoio e comer alimentos mais texturizados.",
    10: "Com 10 meses, o bebé adora imitar sons e gestos.",
    11: "Aos 11 meses, o bebé pode dar os primeiros passos com apoio.",
    12: "🎂 1 ANINHO! Parabéns! O bebé já pode comer a maioria dos alimentos da família.",
    18: "Aos 18 meses, a criança já tem vocabulário de 10-20 palavras e come de forma mais independente.",
    24: "🎂 2 ANINHOS! A criança já fala frases curtas e come praticamente tudo!",
    36: "🎂 3 ANINHOS! A criança já é muito independente e tem opiniões fortes sobre comida.",
  };

  if (insights[months]) return insights[months];
  
  const years = Math.floor(months / 12);
  if (years >= 1) {
    return `Com ${years} ano${years > 1 ? 's' : ''}, a criança continua a desenvolver-se rapidamente!`;
  }
  return `Com ${months} meses, o bebé está numa fase de grande desenvolvimento!`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting daily birthday check...');

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

        // Try to send push notification
        if (vapidPublicKey && vapidPrivateKey) {
          const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('endpoint, keys')
            .eq('user_id', profile.id);

          if (subscriptions && subscriptions.length > 0) {
            const years = Math.floor(ageMonths / 12);
            const remainingMonths = ageMonths % 12;
            let ageText = '';
            
            if (years === 0) {
              ageText = `${ageMonths} ${ageMonths === 1 ? 'mês' : 'meses'}`;
            } else if (remainingMonths === 0) {
              ageText = `${years} ${years === 1 ? 'ano' : 'anos'}`;
            } else {
              ageText = `${years} ano${years > 1 ? 's' : ''} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
            }

            const notificationPayload = {
              title: `🎂 Parabéns, ${profile.baby_name || 'Bebé'}!`,
              body: `Hoje faz ${ageText}! Abre a app para ver os marcos de desenvolvimento desta fase. 🎉`,
              icon: '/favicon.ico',
              data: {
                url: '/profile'
              }
            };

            console.log(`Would send push to ${subscriptions.length} devices for user ${profile.id}`);
            // Push notification sending would go here if web-push library was available
          }
        }

        notificationsSent++;
      }
    }

    console.log(`Birthday check complete. Notifications created: ${notificationsSent}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent,
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
