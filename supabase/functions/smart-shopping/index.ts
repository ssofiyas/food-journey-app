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

    const { recipe_ids, pantry_items } = await req.json();
    if (!recipe_ids || !Array.isArray(recipe_ids) || recipe_ids.length === 0) {
      throw new Error("Provide at least 1 recipe_id");
    }

    // Fetch recipes
    const { data: recipes } = await supabase
      .from("recipes")
      .select("title, ingredients")
      .in("id", recipe_ids);

    if (!recipes || recipes.length === 0) throw new Error("No recipes found");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const recipeList = recipes.map((r: any) => `Recipe "${r.title}": ${JSON.stringify(r.ingredients)}`).join("\n");
    const pantryList = pantry_items?.length ? `\nI already have: ${pantry_items.join(", ")}` : "";

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
            content: `You merge ingredients from multiple recipes into a single shopping list.
Rules:
- Deduplicate: if 2 recipes use onions, combine quantities
- Categorize into: Produce, Dairy, Meat & Seafood, Bakery, Pantry Staples, Beverages, Frozen, Other
- Subtract pantry items the user already has
- Use practical quantities (round up)`,
          },
          {
            role: "user",
            content: `Generate a shopping list from these recipes:\n${recipeList}${pantryList}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_shopping_list",
            description: "Generate a merged, deduplicated shopping list",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      quantity: { type: "string" },
                      category: { type: "string", enum: ["Produce", "Dairy", "Meat & Seafood", "Bakery", "Pantry Staples", "Beverages", "Frozen", "Other"] },
                      from_recipes: { type: "array", items: { type: "string" }, description: "Which recipes need this" },
                    },
                    required: ["name", "quantity", "category", "from_recipes"],
                    additionalProperties: false,
                  },
                },
                removed_pantry_items: {
                  type: "array",
                  items: { type: "string" },
                  description: "Items removed because user has them",
                },
                summary: { type: "string" },
              },
              required: ["items", "removed_pantry_items", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_shopping_list" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No list generated");

    return new Response(toolCall.function.arguments, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-shopping error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
