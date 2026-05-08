import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Item { key: string; text: string; }

const LANG_NAMES: Record<string, string> = {
  es: "Spanish (neutral, friendly tone for Latin American mothers)",
  en: "English",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { items, targetLanguage } = await req.json() as { items: Item[]; targetLanguage: string };
    if (!items?.length || !targetLanguage) {
      return new Response(JSON.stringify({ error: "items and targetLanguage required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (targetLanguage === "en") {
      const out: Record<string, string> = {};
      items.forEach(i => out[i.key] = i.text);
      return new Response(JSON.stringify({ translations: out }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Read cache
    const keys = items.map(i => i.key);
    const { data: cached } = await supabase
      .from("content_translations")
      .select("content_key, translated_text")
      .in("content_key", keys)
      .eq("language", targetLanguage);

    const cacheMap = new Map((cached ?? []).map(r => [r.content_key, r.translated_text]));
    const missing = items.filter(i => !cacheMap.has(i.key));

    // 2. Translate missing via Lovable AI
    const newTranslations: Record<string, string> = {};
    if (missing.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

      // Batch in groups of 30 to stay within token budgets
      const BATCH = 60;
      for (let i = 0; i < missing.length; i += BATCH) {
        const chunk = missing.slice(i, i + BATCH);
        const numbered = chunk.map((it, idx) => `[${idx}] ${it.text}`).join("\n---\n");

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: `You are a professional translator for a baby nutrition app. Translate each numbered text into ${LANG_NAMES[targetLanguage] ?? targetLanguage}. RULES: 1) If the input is already in the target language, return it unchanged. 2) Keep brand names (BabyBites, Emily Harter), proper nouns, units (g, ml, oz), emojis, numbers, percentages, and URLs unchanged. 3) Preserve markdown, punctuation and line breaks exactly. 4) Use a warm, expert, motherly tone. 5) Never add commentary, prefixes, or quotes. Output ONLY a JSON object: { "0": "...", "1": "...", ... }` },
              { role: "user", content: numbered },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!resp.ok) {
          const t = await resp.text();
          console.error("AI gateway error", resp.status, t);
          if (resp.status === 429 || resp.status === 402) {
            return new Response(JSON.stringify({ error: resp.status === 429 ? "Rate limited" : "Credits exhausted" }), {
              status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          continue;
        }
        const data = await resp.json();
        let parsed: Record<string, string> = {};
        try {
          parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
        } catch (e) {
          console.error("Parse fail", e);
          continue;
        }

        const rowsToInsert: any[] = [];
        chunk.forEach((it, idx) => {
          const tx = parsed[String(idx)];
          if (tx && typeof tx === "string") {
            newTranslations[it.key] = tx;
            rowsToInsert.push({ content_key: it.key, language: targetLanguage, translated_text: tx });
          }
        });
        if (rowsToInsert.length) {
          await supabase.from("content_translations").upsert(rowsToInsert, { onConflict: "content_key,language", ignoreDuplicates: true });
        }
      }
    }

    // 3. Combine
    const out: Record<string, string> = {};
    for (const it of items) {
      out[it.key] = cacheMap.get(it.key) ?? newTranslations[it.key] ?? it.text;
    }
    return new Response(JSON.stringify({ translations: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
