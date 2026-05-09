import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Flame, Footprints, Droplets, Moon, HeartPulse, Activity, Plus, ChefHat, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DailyLog {
  calories_consumed: number;
  steps: number;
  water_glasses: number;
  sleep_hours: number;
  readiness_score: number | null;
  resting_heart_rate: number | null;
}

interface MealLog {
  id: string;
  custom_meal: string | null;
  calories: number | null;
  meal_type: string;
  is_extra: boolean | null;
}

const today = () => new Date().toISOString().slice(0, 10);

function ReadinessRing({ value }: { value: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--peach))" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={r} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
        <motion.circle
          cx="70" cy="70" r={r}
          stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round" fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-4xl font-extrabold leading-none bg-gradient-to-br from-primary to-peach bg-clip-text text-transparent">{Math.round(pct)}</p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Readiness</p>
      </div>
    </div>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [log, setLog] = useState<DailyLog>({ calories_consumed: 0, steps: 0, water_glasses: 0, sleep_hours: 0, readiness_score: null, resting_heart_rate: null });
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [activities, setActivities] = useState<any[]>([]);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [coachMsg, setCoachMsg] = useState<string>('');
  const [coachLoading, setCoachLoading] = useState(false);

  const loadMeals = async (uid: string) => {
    const { data } = await supabase
      .from('meal_plans')
      .select('id, custom_meal, calories, meal_type, is_extra')
      .eq('user_id', uid)
      .eq('date', today())
      .order('created_at', { ascending: false });
    setMeals((data as MealLog[]) || []);
  };

  const loadHealth = async (uid: string) => {
    const [{ data: dlog }, { data: target }, { data: acts }] = await Promise.all([
      supabase.from('daily_health_logs' as any).select('*').eq('user_id', uid).eq('date', today()).maybeSingle(),
      supabase.from('user_health_data').select('daily_calorie_target').eq('user_id', uid).maybeSingle(),
      supabase.from('day_plan_activities' as any).select('*').eq('user_id', uid).eq('date', today()).order('scheduled_time', { ascending: true }),
    ]);
    if (dlog) setLog(dlog as any);
    if (target?.daily_calorie_target) setCalorieTarget(target.daily_calorie_target);
    setActivities((acts as any[]) || []);
  };

  useEffect(() => {
    if (!user) return;
    loadHealth(user.id);
    loadMeals(user.id);

    // Realtime: meal_plans + daily_health_logs + activities for today
    const channel = supabase
      .channel(`home-live-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plans', filter: `user_id=eq.${user.id}` }, () => loadMeals(user.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_health_logs', filter: `user_id=eq.${user.id}` }, () => loadHealth(user.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'day_plan_activities', filter: `user_id=eq.${user.id}` }, () => loadHealth(user.id))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  const totalLoggedCals = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const caloriesShown = Math.max(log.calories_consumed, totalLoggedCals);

  const readiness = log.readiness_score ?? Math.min(100, Math.round(
    (Math.min(log.steps, 10000) / 10000) * 30 +
    (Math.min(log.water_glasses, 8) / 8) * 20 +
    (Math.min(log.sleep_hours, 8) / 8) * 35 +
    (caloriesShown > 0 ? 15 : 0)
  ));

  const stats = [
    { icon: Flame, label: 'Calories', value: caloriesShown, target: calorieTarget, unit: 'kcal', color: 'text-pink' },
    { icon: Footprints, label: 'Steps', value: log.steps, target: 10000, unit: '', color: 'text-primary' },
    { icon: Droplets, label: 'Water', value: log.water_glasses, target: 8, unit: 'glasses', color: 'text-accent-foreground' },
    { icon: Moon, label: 'Sleep', value: log.sleep_hours, target: 8, unit: 'h', color: 'text-lilac' },
  ];

  return (
    <div className="flex-1 max-w-3xl min-h-screen pb-32 md:pb-8">
      <motion.div {...fadeUp} className="px-5 pt-8 pb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Today</h1>
      </motion.div>

      <div className="px-5 mt-4 space-y-5">
        {/* Readiness hero */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="glass rounded-3xl p-5 flex items-center gap-5">
          <ReadinessRing value={readiness} />
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Your day</p>
            <p className="font-display text-xl font-bold leading-tight mt-1">
              {readiness >= 75 ? "You're set to thrive ✨" : readiness >= 50 ? "Solid base — keep going" : "Take it easy today"}
            </p>
            <Link to="/health-hub" className="inline-block mt-3 text-xs font-bold text-primary">Open Health Hub →</Link>
          </div>
        </motion.div>

        {/* AI Coach */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
          <Card className="p-5 rounded-3xl gradient-primary border-0 shadow-glow-pink text-primary-foreground">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold mb-1">AI Nutrition Coach</p>
                <p className="text-sm leading-relaxed min-h-[44px] opacity-95">
                  {coachMsg || (coachLoading ? 'Thinking…' : "Tap below for today's personal read.")}
                </p>
                <Button size="sm" variant="secondary" className="mt-3 rounded-full bg-white/95 text-primary hover:bg-white" onClick={askCoach} disabled={coachLoading}>
                  {coachLoading ? 'Coaching…' : "Get today's tip"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stat grid */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="grid grid-cols-2 gap-3">
          {stats.map((s) => {
            const pct = Math.min(100, Math.round((Number(s.value) / s.target) * 100));
            const field = s.label === 'Calories' ? 'calories_consumed' : s.label === 'Steps' ? 'steps' : s.label === 'Water' ? 'water_glasses' : 'sleep_hours';
            return (
              <Card key={s.label} className="p-4 rounded-3xl border-border/50 glass">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} strokeWidth={1.8} />
                  <button
                    onClick={() => {
                      const inc = s.label === 'Calories' ? 100 : s.label === 'Steps' ? 500 : s.label === 'Water' ? 1 : 0.5;
                      updateField(field as any, Number(s.value) + inc);
                    }}
                    className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
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
        </motion.div>

        {/* Today's meals (live from Kitchen) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
          <Card className="p-5 rounded-3xl glass">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-primary" />
                <p className="font-display font-bold">Today's meals</p>
              </div>
              <Link to="/kitchen" className="text-xs font-bold text-primary">Open Kitchen →</Link>
            </div>
            {meals.length === 0 ? (
              <Link to="/kitchen" className="block rounded-2xl border-2 border-dashed border-primary/30 p-5 text-center hover:bg-primary/5 transition-colors">
                <ChefHat className="h-6 w-6 mx-auto text-primary mb-1" />
                <p className="text-sm font-semibold">Scan or log your first meal</p>
                <p className="text-xs text-muted-foreground">Goes here in real time.</p>
              </Link>
            ) : (
              <ul className="space-y-2">
                {meals.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-card/60 p-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Utensils className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{m.custom_meal || m.meal_type}</p>
                      <p className="text-xs text-muted-foreground capitalize">{m.meal_type}{m.is_extra ? ' • extra' : ''}</p>
                    </div>
                    <p className="font-display text-sm font-bold">{m.calories ?? 0}<span className="text-[10px] text-muted-foreground"> kcal</span></p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </motion.div>

        {/* Vitals */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }}>
          <Card className="p-5 rounded-3xl glass">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-bold">Vitals</p>
              <Link to="/health-hub" className="text-xs font-bold text-primary">Health Hub →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-card/60 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><HeartPulse className="h-4 w-4 text-pink" /> Resting HR</div>
                <p className="font-display text-xl font-bold mt-1">{log.resting_heart_rate ?? '—'} <span className="text-xs text-muted-foreground">bpm</span></p>
              </div>
              <div className="rounded-2xl bg-card/60 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Activity className="h-4 w-4 text-primary" /> Readiness</div>
                <p className="font-display text-xl font-bold mt-1">{readiness}<span className="text-xs text-muted-foreground">/100</span></p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Day plan */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }}>
          <Card className="p-5 rounded-3xl glass">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-bold">Day plan</p>
              <Link to="/planner" className="text-xs font-bold text-primary">Planner →</Link>
            </div>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activities planned yet.</p>
            ) : (
              <ul className="space-y-2">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-card/60 p-3">
                    <div className="h-8 w-8 rounded-xl bg-accent/30 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-accent-foreground" />
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
        </motion.div>
      </div>
    </div>
  );
}
