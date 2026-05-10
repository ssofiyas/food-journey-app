import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Watch, HeartPulse, Moon, Brain, Droplet, Plus, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const DEVICES = [
  { type: 'apple_watch', name: 'Apple Watch' },
  { type: 'samsung_watch', name: 'Samsung Watch' },
  { type: 'whoop', name: 'WHOOP' },
  { type: 'oura', name: 'Oura Ring' },
  { type: 'fitbit', name: 'Fitbit' },
];

const SYNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-connect-sync`;

export default function HealthHub() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [cycle, setCycle] = useState<any[]>([]);
  const [samsungForm, setSamsungForm] = useState({ steps: '', sleep_hours: '', resting_heart_rate: '', calories_consumed: '' });
  const [samsungSyncing, setSamsungSyncing] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: d }, { data: l }, { data: c }] = await Promise.all([
        supabase.from('connected_devices' as any).select('*').eq('user_id', user.id),
        supabase.from('daily_health_logs' as any).select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
        supabase.from('cycle_logs' as any).select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
      ]);
      setDevices((d as any[]) || []);
      setLogs((l as any[]) || []);
      setCycle((c as any[]) || []);
    })();
  }, [user]);

  const toggleDevice = async (type: string, name: string) => {
    if (!user) return;
    const existing = devices.find(d => d.device_type === type);
    if (existing) {
      await supabase.from('connected_devices' as any).delete().eq('id', existing.id);
      setDevices(devices.filter(d => d.id !== existing.id));
      toast.success(`${name} disconnected`);
    } else {
      const { data } = await supabase.from('connected_devices' as any).insert({ user_id: user.id, device_type: type, device_name: name, last_synced_at: new Date().toISOString() }).select().single();
      if (data) setDevices([...devices, data]);
      toast.success(`${name} connected (mock)`);
    }
  };

  const syncFitbit = async () => {
    if (!user) return;
    toast.loading('Syncing Fitbit…', { id: 'fitbit' });
    const { data, error } = await supabase.functions.invoke('fitbit-sync');
    if (error || (data as any)?.error) {
      toast.error(`Fitbit sync failed: ${(data as any)?.error || error?.message}`, { id: 'fitbit' });
      return;
    }
    const s = (data as any).synced;
    toast.success(`Synced: ${s.steps} steps · ${s.sleepHours}h sleep${s.restingHR ? ` · ${s.restingHR} bpm` : ''}`, { id: 'fitbit' });
    const { data: l } = await supabase.from('daily_health_logs' as any).select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7);
    setLogs((l as any[]) || []);
  };

  const logToday = async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const date = prompt('Date (YYYY-MM-DD)', today) || today;
    const phase = prompt('Phase (menstrual / follicular / ovulation / luteal)', 'follicular') || 'follicular';
    await supabase.from('cycle_logs' as any).upsert({ user_id: user.id, date, phase }, { onConflict: 'user_id,date' });
    toast.success('Logged');
    const { data } = await supabase.from('cycle_logs' as any).select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30);
    setCycle((data as any[]) || []);
  };

  const avg = (key: string) => {
    const vals = logs.map(l => Number(l[key]) || 0).filter(v => v > 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '—';
  };

  const syncSamsung = async () => {
    if (!user) return;
    const body: Record<string, number> = {};
    for (const k of ['steps', 'sleep_hours', 'resting_heart_rate', 'calories_consumed'] as const) {
      const v = parseFloat(samsungForm[k]);
      if (!isNaN(v) && v >= 0) body[k] = v;
    }
    if (Object.keys(body).length === 0) {
      toast.error('Enter at least one value');
      return;
    }
    setSamsungSyncing(true);
    toast.loading('Syncing Samsung Watch…', { id: 'samsung' });
    const { data, error } = await supabase.functions.invoke('health-connect-sync', { body });
    setSamsungSyncing(false);
    if (error || (data as any)?.error) {
      toast.error(`Sync failed: ${(data as any)?.error || error?.message}`, { id: 'samsung' });
      return;
    }
    toast.success('Synced! Data is live on Home.', { id: 'samsung' });
    setSamsungForm({ steps: '', sleep_hours: '', resting_heart_rate: '', calories_consumed: '' });
    const { data: l } = await supabase.from('daily_health_logs' as any).select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7);
    setLogs((l as any[]) || []);
  };

  return (
    <div className="flex-1 max-w-3xl min-h-screen pb-32 md:pb-8">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Health Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">Your personal vitals & devices</p>
      </div>

      <div className="p-5 space-y-5">
        {/* Devices */}
        <Card className="p-5 rounded-3xl">
          <p className="font-display font-semibold mb-3">Connected devices</p>
          <div className="grid grid-cols-2 gap-2">
            {DEVICES.map(dev => {
              const connected = devices.find(d => d.device_type === dev.type);
              return (
                <button
                  key={dev.type}
                  onClick={() => toggleDevice(dev.type, dev.name)}
                  className={`rounded-2xl border p-3 text-left transition-all ${connected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'}`}
                >
                  <div className="flex items-center justify-between">
                    <Watch className="h-5 w-5 text-foreground/70" />
                    {connected ? <Check className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <p className="text-sm font-semibold mt-2">{dev.name}</p>
                  <p className="text-[11px] text-muted-foreground">{connected ? 'Connected' : 'Tap to connect'}</p>
                </button>
              );
            })}
          </div>
          {devices.find(d => d.device_type === 'fitbit') && (
            <Button size="sm" className="rounded-full mt-3 w-full" onClick={syncFitbit}>
              Sync Fitbit now
            </Button>
          )}
          {devices.find(d => d.device_type === 'samsung_watch') && (
            <div className="mt-3 rounded-2xl bg-muted/50 p-3 space-y-2">
              <p className="text-xs font-semibold">Samsung Watch via Health Connect</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Connect your Samsung Watch to Health Connect on Android, then send data to this endpoint with your auth token:
              </p>
              <code className="block text-[10px] bg-background rounded-lg p-2 break-all border border-border">POST {SYNC_URL}</code>
              <p className="text-[10px] text-muted-foreground">Body: {`{ steps, sleep_hours, resting_heart_rate, calories_consumed }`}</p>
              <Button size="sm" variant="outline" className="rounded-full w-full" onClick={() => { navigator.clipboard.writeText(SYNC_URL); toast.success('Endpoint copied'); }}>
                Copy endpoint URL
              </Button>
            </div>
          )}
        </Card>

        {/* 7-day overview */}
        <Card className="p-5 rounded-3xl">
          <p className="font-display font-semibold mb-3">Last 7 days</p>
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={Moon} label="Avg sleep" value={`${avg('sleep_hours')} h`} color="text-lilac" />
            <Stat icon={HeartPulse} label="Avg resting HR" value={`${avg('resting_heart_rate')} bpm`} color="text-pink" />
            <Stat icon={Brain} label="Avg stress" value={`${avg('stress_level')}/10`} color="text-accent" />
            <Stat icon={Droplet} label="Avg water" value={`${avg('water_glasses')} glasses`} color="text-primary" />
          </div>
        </Card>

        {/* Cycle */}
        <Card className="p-5 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold">Cycle tracking</p>
            <Button size="sm" variant="outline" className="rounded-full" onClick={logToday}>Log entry</Button>
          </div>
          {cycle.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet. Log your phase to see patterns over time.</p>
          ) : (
            <ul className="space-y-2">
              {cycle.slice(0, 5).map(c => (
                <li key={c.id} className="flex items-center justify-between rounded-2xl bg-muted/40 p-3">
                  <span className="text-sm font-medium">{c.date}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-pink/15 text-pink-foreground capitalize">{c.phase}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: any) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className={`h-4 w-4 ${color}`} /> {label}</div>
      <p className="font-display text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
