import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Heart, Footprints, Moon, Droplets, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DailyLog {
  calories_consumed: number;
  steps: number;
  water_glasses: number;
  sleep_hours: number;
  resting_heart_rate: number | null;
}

const today = () => new Date().toISOString().slice(0, 10);

// Simple decorative SVG line/wave generators
function HeartRateBars() {
  const heights = [12, 22, 8, 30, 14, 38, 18, 26, 10, 34, 16, 24, 12, 28, 18];
  return (
    <svg viewBox="0 0 150 50" className="w-full h-12">
      {heights.map((h, i) => (
        <rect key={i} x={i * 10 + 2} y={50 - h} width="3" height={h} rx="1.5" fill="hsl(230 25% 12%)" opacity={0.85} />
      ))}
    </svg>
  );
}

function StepsWave() {
  return (
    <svg viewBox="0 0 150 50" className="w-full h-12">
      <defs>
        <linearGradient id="stepFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(272 60% 60%)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="hsl(272 60% 60%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,40 C20,38 30,20 50,22 C70,24 80,8 100,12 C120,16 130,30 150,28 L150,50 L0,50 Z" fill="url(#stepFill)" />
      <path d="M0,40 C20,38 30,20 50,22 C70,24 80,8 100,12 C120,16 130,30 150,28" fill="none" stroke="hsl(272 50% 45%)" strokeWidth="2" />
    </svg>
  );
}

function SleepBars({ active = 4 }: { active?: number }) {
  const bars = [22, 28, 24, 30, 36, 32, 26, 30];
  return (
    <div className="flex items-end justify-between gap-1.5 h-16 mt-2">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-md ${i === active ? 'bg-foreground' : 'bg-foreground/10'}`}
            style={{ height: `${h * 1.4}px` }}
          />
          <span className="text-[8px] text-muted-foreground">{6 + i}{i < 6 ? 'am' : 'pm'}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name?: string | null; avatar_url?: string | null }>({});
  const [log, setLog] = useState<DailyLog>({ calories_consumed: 0, steps: 0, water_glasses: 0, sleep_hours: 0, resting_heart_rate: null });

  const load = async (uid: string) => {
    const [{ data: dlog }, { data: prof }] = await Promise.all([
      supabase.from('daily_health_logs').select('*').eq('user_id', uid).eq('date', today()).maybeSingle(),
      supabase.from('profiles').select('full_name, avatar_url').eq('user_id', uid).maybeSingle(),
    ]);
    if (dlog) setLog(dlog as any);
    if (prof) setProfile(prof);
  };

  useEffect(() => {
    if (!user) return;
    load(user.id);
    const ch = supabase
      .channel(`home-live-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_health_logs', filter: `user_id=eq.${user.id}` }, () => load(user.id))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const firstName = (profile.full_name || user?.email?.split('@')[0] || 'there').split(' ')[0];
  const sleepH = Math.floor(log.sleep_hours || 0);
  const sleepM = Math.round(((log.sleep_hours || 0) - sleepH) * 60);

  return (
    <div className="flex-1 max-w-3xl min-h-screen pb-32 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/30 to-accent/40" />
            )}
            <p className="text-sm">Hello <span className="font-bold">{firstName}</span></p>
          </div>
          <button className="h-11 w-11 rounded-full bg-card border border-border/50 flex items-center justify-center shadow-sm">
            <Bell className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Title */}
        <h1 className="font-display text-[34px] leading-[1.05] font-extrabold tracking-tight mt-7">
          Here's your health<br />at a glance
        </h1>

        {/* Bento grid */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {/* Heart rate */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl p-4 bg-[hsl(210_40%_92%)]">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center">
                <Heart className="h-4 w-4" />
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-extrabold leading-none">{log.resting_heart_rate ?? 72} <span className="text-xs font-semibold">bpm</span></p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Heart rate</p>
              </div>
            </div>
            <div className="mt-3"><HeartRateBars /></div>
          </motion.div>

          {/* Steps */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl p-4 bg-[hsl(272_50%_92%)]">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center">
                <Footprints className="h-4 w-4" />
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-extrabold leading-none">{(log.steps || 2200).toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Steps</p>
              </div>
            </div>
            <div className="mt-3"><StepsWave /></div>
          </motion.div>

          {/* Sleep — wide */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="col-span-2 rounded-3xl p-4 bg-[hsl(95_40%_88%)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Moon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-display text-xl font-extrabold leading-none">{sleepH}h {sleepM}m</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Total sleep</p>
                </div>
              </div>
              <Link to="/health-hub" className="text-[11px] font-semibold text-foreground/70">Details →</Link>
            </div>
            <SleepBars />
          </motion.div>
        </div>

        {/* Daily recommendations */}
        <div className="mt-7 mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Daily recommendations</h2>
          <Link to="/health-hub" className="text-xs text-muted-foreground">See all</Link>
        </div>

        <Link to="/health-hub" className="flex items-center gap-3 rounded-3xl bg-card border border-border/50 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-11 w-11 rounded-full bg-[hsl(210_50%_88%)] flex items-center justify-center shrink-0">
            <Droplets className="h-5 w-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Stay Hydrated!</p>
            <p className="text-xs text-muted-foreground">Drink at least 2L of water today.</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        <Link to="/kitchen" className="mt-3 flex items-center gap-3 rounded-3xl bg-card border border-border/50 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-11 w-11 rounded-full bg-[hsl(22_70%_88%)] flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Scan your next meal</p>
            <p className="text-xs text-muted-foreground">AI logs calories and macros for you.</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </motion.div>
    </div>
  );
}
