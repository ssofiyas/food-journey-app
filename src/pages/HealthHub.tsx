import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Watch, HeartPulse, Moon, Brain, Droplet, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

const DEVICES = [
  { type: 'apple_watch', name: 'Apple Watch' },
  { type: 'whoop', name: 'WHOOP' },
  { type: 'oura', name: 'Oura Ring' },
  { type: 'fitbit', name: 'Fitbit' },
];

export default function HealthHub() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [cycle, setCycle] = useState<any[]>([]);

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

  return (
    <div className="flex-1 max-w-3xl border-r border-border min-h-screen">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-5 py-4">
        <h1 className="font-display text-2xl font-bold">Health Hub</h1>
        <p className="text-xs text-muted-foreground">Your personal vitals & devices</p>
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
