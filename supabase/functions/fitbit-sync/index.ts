import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory token cache (resets on cold start; refresh handles re-auth)
let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = cachedRefreshToken || Deno.env.get('FITBIT_REFRESH_TOKEN');
  const clientId = Deno.env.get('FITBIT_CLIENT_ID');
  if (!refreshToken || !clientId) throw new Error('Missing FITBIT_REFRESH_TOKEN or FITBIT_CLIENT_ID');

  const res = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Fitbit refresh failed: ${JSON.stringify(data)}`);
  cachedAccessToken = data.access_token;
  cachedRefreshToken = data.refresh_token;
  return data.access_token;
}

async function fitbitGet(path: string): Promise<any> {
  let token = cachedAccessToken || Deno.env.get('FITBIT_ACCESS_TOKEN');
  if (!token) token = await refreshAccessToken();

  let res = await fetch(`https://api.fitbit.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    token = await refreshAccessToken();
    res = await fetch(`https://api.fitbit.com${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  const json = await res.json();
  if (!res.ok) throw new Error(`Fitbit GET ${path} failed: ${JSON.stringify(json)}`);
  return json;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const today = new Date().toISOString().slice(0, 10);

    const [activity, hr, sleep] = await Promise.all([
      fitbitGet(`/1/user/-/activities/date/${today}.json`),
      fitbitGet(`/1/user/-/activities/heart/date/${today}/1d.json`),
      fitbitGet(`/1.2/user/-/sleep/date/${today}.json`),
    ]);

    const steps = activity?.summary?.steps ?? 0;
    const restingHR = hr?.['activities-heart']?.[0]?.value?.restingHeartRate ?? null;
    const sleepMin = sleep?.summary?.totalMinutesAsleep ?? 0;
    const sleepHours = Math.round((sleepMin / 60) * 10) / 10;

    const payload: any = {
      user_id: user.id,
      date: today,
      steps,
      sleep_hours: sleepHours,
    };
    if (restingHR != null) payload.resting_heart_rate = restingHR;

    // Upsert today's log
    const { data: existing } = await supabase
      .from('daily_health_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      await supabase.from('daily_health_logs').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('daily_health_logs').insert(payload);
    }

    // Update last_synced_at on connected device
    await supabase
      .from('connected_devices')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('device_type', 'fitbit');

    return new Response(
      JSON.stringify({ success: true, synced: { steps, restingHR, sleepHours } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('fitbit-sync error:', e?.message || e);
    return new Response(
      JSON.stringify({ error: e?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
