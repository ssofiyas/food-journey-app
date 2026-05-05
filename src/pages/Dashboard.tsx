import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Flame, Footprints, Droplets, Moon, HeartPulse, Activity, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DailyLog {
  calories_consumed: number;
  steps: number;
  water_glasses: number;
  sleep_hours: number;
  readiness_score: number | null;
  resting_heart_rate: number | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const { user } = useAuth();
  const [log, setLog] = useState<DailyLog>({ calories_consumed: 0, steps: 0, water_glasses: 0, sleep_hours: 0, readiness_score: null, resting_heart_rate: null });
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [activities, setActivities] = useState<any[]>([]);
  const [coachMsg, setCoachMsg] = useState<string>('');
  const [coachLoading, setCoachLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: dlog }, { data: target }, { data: acts }] = await Promise.all([
        supabase.from('daily_health_logs' as any).select('*').eq('user_id', user.id).eq('date', today()).maybeSingle(),
        supabase.from('user_health_data').select('daily_calorie_target').eq('user_id', user.id).maybeSingle(),
        supabase.from('day_plan_activities' as any).select('*').eq('user_id', user.id).eq('date', today()).order('scheduled_time', { ascending: true }),
      ]);
      if (dlog) setLog(dlog as any);
      if (target?.daily_calorie_target) setCalorieTarget(target.daily_calorie_target);
      setActivities((acts as any[]) || []);
    })();
  }, [user]);

  const updateField = async (field: keyof DailyLog, value: number) => {
    if (!user) return;
    const next = { ...log, [field]: value };
    setLog(next);
    await supabase.from('daily_health_logs' as any).upsert({ user_id: user.id, date: today(), ...next }, { onConflict: 'user_id,date' });
  };

  const askCoach = async () => {
    setCoachLoading(true);
    const { data } = await supabase.functions.invoke('health-coach', {
      body: { metrics: { ...log, calorieTarget, activities } },
    });
    setCoachMsg((data as any)?.message || 'Stay consistent today!');
    setCoachLoading(false);
  };

  const stats = [
    { icon: Flame, label: 'Calories', value: log.calories_consumed, target: calorieTarget, unit: 'kcal', color: 'text-pink' },
    { icon: Footprints, label: 'Steps', value: log.steps, target: 10000, unit: '', color: 'text-primary' },
    { icon: Droplets, label: 'Water', value: log.water_glasses, target: 8, unit: 'glasses', color: 'text-accent' },
    { icon: Moon, label: 'Sleep', value: log.sleep_hours, target: 8, unit: 'h', color: 'text-lilac' },
  ];

  return (
    <div className="flex-1 max-w-3xl border-r border-border min-h-screen">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-5 py-4">
        <h1 className="font-display text-2xl font-bold">Today</h1>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="p-5 space-y-5">
        {/* AI Coach */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-primary/10 via-lilac/10 to-pink/10 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl gradient-hero flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold mb-1">Your AI Coach</p>
              <p className="text-sm text-muted-foreground leading-relaxed min-h-[60px]">
                {coachMsg || (coachLoading ? 'Thinking…' : 'Tap below for a personalized read on your day.')}
              </p>
              <Button size="sm" className="mt-3 rounded-full" onClick={askCoach} disabled={coachLoading}>
                {coachLoading ? 'Coaching…' : 'Get today\'s coaching'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => {
            const pct = Math.min(100, Math.round((Number(s.value) / s.target) * 100));
            const field = s.label === 'Calories' ? 'calories_consumed' : s.label === 'Steps' ? 'steps' : s.label === 'Water' ? 'water_glasses' : 'sleep_hours';
            return (
              <Card key={s.label} className="p-4 rounded-3xl border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} strokeWidth={1.8} />
                  <button
                    onClick={() => {
                      const inc = s.label === 'Calories' ? 100 : s.label === 'Steps' ? 500 : s.label === 'Water' ? 1 : 0.5;
                      updateField(field as any, Number(s.value) + inc);
                    }}
                    className="h-7 w-7 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-2xl font-bold">{s.value}<span className="text-sm font-normal text-muted-foreground">/{s.target}{s.unit && ` ${s.unit}`}</span></p>
                <Progress value={pct} className="h-1.5 mt-2" />
              </Card>
            );
          })}
        </div>

        {/* Vitals */}
        <Card className="p-5 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold">Vitals & readiness</p>
            <Link to="/health-hub" className="text-xs text-primary font-semibold">Open Health Hub →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><HeartPulse className="h-4 w-4 text-pink" /> Resting HR</div>
              <p className="font-display text-xl font-bold mt-1">{log.resting_heart_rate ?? '—'} <span className="text-xs text-muted-foreground">bpm</span></p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Activity className="h-4 w-4 text-primary" /> Readiness</div>
              <p className="font-display text-xl font-bold mt-1">{log.readiness_score ?? '—'}<span className="text-xs text-muted-foreground">/100</span></p>
            </div>
          </div>
        </Card>

        {/* Day plan */}
        <Card className="p-5 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold">Day plan</p>
            <Link to="/planner" className="text-xs text-primary font-semibold">Open planner →</Link>
          </div>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activities planned. Add a workout, walk, or meditation in the planner.</p>
          ) : (
            <ul className="space-y-2">
              {activities.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.activity_type}{a.duration_minutes ? ` • ${a.duration_minutes} min` : ''}{a.scheduled_time ? ` • ${a.scheduled_time.slice(0,5)}` : ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
