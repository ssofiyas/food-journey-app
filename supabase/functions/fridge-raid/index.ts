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
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { ingredients } = await req.json();
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      throw new Error("Provide at least 1 ingredient");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a creative chef who specializes in making delicious meals from limited ingredients.
Given a list of available ingredients, create a practical, tasty recipe that uses primarily those items.
You may assume basic pantry staples (salt, pepper, oil, butter) are available.
Focus on reducing food waste. Make it feel like a "life hack" recipe.`,
          },
          {
            role: "user",
            content: `I have these ingredients: ${ingredients.join(", ")}. Create a recipe using them!`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_recipe",
            description: "Generate a recipe from available ingredients",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string", description: "Fun, engaging 1-2 sentence description" },
                prep_time: { type: "number", description: "Minutes" },
                cook_time: { type: "number", description: "Minutes" },
                difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
                ingredients_used: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      amount: { type: "string" },
                      unit: { type: "string" },
                    },
                    required: ["name", "amount", "unit"],
                    additionalProperties: false,
                  },
                },
                instructions: { type: "array", items: { type: "string" } },
                estimated_calories: { type: "number" },
                protein: { type: "number" },
                fat: { type: "number" },
                carbs: { type: "number" },
                tip: { type: "string", description: "A fun food-waste reduction tip" },
              },
              required: ["title", "description", "prep_time", "cook_time", "difficulty", "ingredients_used", "instructions", "estimated_calories", "protein", "fat", "carbs", "tip"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_recipe" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No recipe generated");

    return new Response(toolCall.function.arguments, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fridge-raid error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
