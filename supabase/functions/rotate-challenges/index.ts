import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    // Deactivate expired challenges
    const { error: deactivateError } = await supabase
      .from("weekly_challenges")
      .update({ is_active: false })
      .eq("is_active", true)
      .lt("ends_at", now);

    if (deactivateError) {
      console.error("Error deactivating expired challenges:", deactivateError);
    }

    // Check if there's an active challenge
    const { data: activeChallenge } = await supabase
      .from("weekly_challenges")
      .select("id")
      .eq("is_active", true)
      .gte("ends_at", now)
      .limit(1)
      .single();

    // If no active challenge, activate the next one
    if (!activeChallenge) {
      // Find the next challenge that should start
      const { data: nextChallenge, error: nextError } = await supabase
        .from("weekly_challenges")
        .select("*")
        .eq("is_active", false)
        .lte("starts_at", now)
        .gte("ends_at", now)
        .order("starts_at", { ascending: true })
        .limit(1)
        .single();

      if (nextChallenge && !nextError) {
        // Activate this challenge
        await supabase
          .from("weekly_challenges")
          .update({ is_active: true })
          .eq("id", nextChallenge.id);

        console.log(`Activated challenge: ${nextChallenge.title}`);
      } else {
        // No scheduled challenge found, recycle an old one
        // Get a random inactive challenge and reschedule it
        const { data: oldChallenges } = await supabase
          .from("weekly_challenges")
          .select("*")
          .eq("is_active", false)
          .lt("ends_at", now)
          .order("ends_at", { ascending: true })
          .limit(5);

        if (oldChallenges && oldChallenges.length > 0) {
          // Pick a random challenge to recycle
          const randomIndex = Math.floor(Math.random() * oldChallenges.length);
          const recycledChallenge = oldChallenges[randomIndex];

          const newStartsAt = new Date();
          const newEndsAt = new Date();
          newEndsAt.setDate(newEndsAt.getDate() + 7);

          await supabase
            .from("weekly_challenges")
            .update({
              is_active: true,
              starts_at: newStartsAt.toISOString(),
              ends_at: newEndsAt.toISOString(),
            })
            .eq("id", recycledChallenge.id);

          console.log(`Recycled and activated challenge: ${recycledChallenge.title}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Challenge rotation complete" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in rotate-challenges:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
