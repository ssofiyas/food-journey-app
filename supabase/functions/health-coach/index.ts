import { corsHeaders } from '@supabase/supabase-js/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { metrics } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');

    const prompt = `You are a friendly, expert health & nutrition coach. Based on this user's day so far, give them a short, warm, actionable coaching message (3-4 sentences max). Focus on what to do next today. No medical advice.

Today's data:
${JSON.stringify(metrics, null, 2)}`;

    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`AI gateway ${r.status}: ${t}`);
    }
    const data = await r.json();
    const message = data.choices?.[0]?.message?.content ?? 'Keep going — you are doing great today.';
    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return new Response(JSON.stringify({ error: msg, message: "I couldn't reach your coach right now — try again in a moment." }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
