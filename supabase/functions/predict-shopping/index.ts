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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Fetch all shopping lists for pattern analysis
    const { data: lists } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!lists || lists.length === 0) {
      return new Response(JSON.stringify({ suggestions: [], message: "Not enough shopping history yet. Keep using your lists and I'll learn your patterns!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build history summary for AI
    const historyItems: string[] = [];
    for (const list of lists) {
      const items = (list.items as any[]) || [];
      for (const item of items) {
        historyItems.push(`${item.name} (qty: ${item.quantity}, list: "${list.name}", date: ${list.created_at?.slice(0, 10)})`);
      }
    }

    // Get current active list items
    const { messages: bodyMessages } = await req.json().catch(() => ({ messages: null }));
    const currentItems = lists[0]?.items as any[] || [];
    const currentItemNames = currentItems.map((i: any) => i.name.toLowerCase());

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a smart shopping assistant that analyzes grocery shopping patterns.

You will receive a user's shopping list history. Your job is to:
1. Identify items they buy regularly (weekly, bi-weekly, monthly patterns)
2. Suggest items they might have forgotten based on their patterns
3. Categorize suggestions into: "Produce", "Dairy", "Meat & Seafood", "Pantry Staples", "Beverages", "Snacks", "Other"
4. Give a confidence level (high/medium/low) for each suggestion
5. Provide a friendly, brief reason for each suggestion

Current items already in their latest list: ${currentItemNames.join(", ") || "empty list"}

Respond using the suggest_items tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is my shopping history:\n${historyItems.join("\n")}\n\nWhat items should I add to my current list?` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_items",
              description: "Suggest shopping items based on purchase patterns",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Item name" },
                        quantity: { type: "string", description: "Suggested quantity" },
                        category: { type: "string", enum: ["Produce", "Dairy", "Meat & Seafood", "Pantry Staples", "Beverages", "Snacks", "Other"] },
                        confidence: { type: "string", enum: ["high", "medium", "low"] },
                        reason: { type: "string", description: "Brief friendly reason, e.g. 'You buy this every week'" },
                      },
                      required: ["name", "quantity", "category", "confidence", "reason"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "A friendly 1-sentence summary of the predictions" },
                },
                required: ["suggestions", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_items" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict-shopping error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
