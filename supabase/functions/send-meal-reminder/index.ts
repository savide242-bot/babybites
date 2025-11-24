import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mealType, title, body } = await req.json();
    
    console.log('📬 Sending meal reminder:', { mealType, title });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all active push subscriptions
    const { data: subscriptions, error } = await supabaseClient
      .from("push_subscriptions")
      .select("*");

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

    // Send push notifications to all subscribed users
    // Note: This is a placeholder - full Web Push implementation requires
    // proper VAPID authentication and web-push library
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        console.log(`Sending notification to user ${sub.user_id}`);
        // TODO: Implement proper Web Push protocol with VAPID keys
        // This requires the web-push library and proper encryption
        return { userId: sub.user_id, status: 'placeholder' };
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    console.log(`✅ Sent ${successCount}/${subscriptions.length} notifications`);

    return new Response(
      JSON.stringify({ 
        message: "Notifications sent", 
        total: subscriptions.length,
        successful: successCount 
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
