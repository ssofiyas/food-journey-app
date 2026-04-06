import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { image_url, description } = await req.json();
    if (!image_url && !description) throw new Error("Provide image_url or description");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const messages: any[] = [
      {
        role: "system",
        content: `You are a nutrition expert AI. Analyze the food described or shown in the image.
Identify all ingredients, estimate portion sizes, and calculate nutritional information.
Use the analyze_plate tool to return structured data.`
      },
    ];

    if (image_url) {
      messages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: image_url } },
          { type: "text", text: description || "Analyze this meal. Identify ingredients and estimate nutrition." },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Analyze this meal: "${description}". Identify ingredients and estimate nutrition.`,
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [{
          type: "function",
          function: {
            name: "analyze_plate",
            description: "Return nutritional analysis of a meal",
            parameters: {
              type: "object",
              properties: {
                meal_name: { type: "string" },
                ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      amount: { type: "string" },
                      calories: { type: "number" },
                      protein: { type: "number" },
                      fat: { type: "number" },
                      carbs: { type: "number" },
                    },
                    required: ["name", "amount", "calories", "protein", "fat", "carbs"],
                    additionalProperties: false,
                  },
                },
                total_calories: { type: "number" },
                total_protein: { type: "number" },
                total_fat: { type: "number" },
                total_carbs: { type: "number" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
              },
              required: ["meal_name", "ingredients", "total_calories", "total_protein", "total_fat", "total_carbs", "confidence"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_plate" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No analysis returned");

    return new Response(toolCall.function.arguments, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-plate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
