// Health Connect / Samsung Watch sync endpoint
// Accepts POST { date?, steps?, sleep_hours?, resting_heart_rate?, calories_consumed?, water_glasses? }
// Auth: Bearer JWT (Lovable user). Upserts into daily_health_logs.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const auth = req.headers.get('Authorization') ?? '';
    if (!auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'missing bearer token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json().catch(() => ({}));
    const date = (body.date as string) || new Date().toISOString().slice(0, 10);
    const payload: Record<string, unknown> = { user_id: user.id, date };
    for (const k of ['steps', 'sleep_hours', 'resting_heart_rate', 'calories_consumed', 'water_glasses', 'stress_level', 'readiness_score']) {
      if (body[k] !== undefined && body[k] !== null) payload[k] = body[k];
    }

    const { error } = await supabase.from('daily_health_logs').upsert(payload, { onConflict: 'user_id,date' });
    if (error) throw error;

    // touch device last_synced_at
    await supabase.from('connected_devices').update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', user.id).eq('device_type', 'samsung_watch');

    return new Response(JSON.stringify({ ok: true, synced: payload }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
