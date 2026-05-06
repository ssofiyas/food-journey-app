import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Sparkles, Search, Refrigerator, ShoppingBasket, CalendarDays, Loader2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlateAnalyzer } from '@/components/PlateAnalyzer';
import { FridgeRaid } from '@/components/FridgeRaid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface ScanResult {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  meal_name?: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

export default function Kitchen() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'scan' | 'recipes' | 'fridge'>('scan');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [logging, setLogging] = useState(false);
  const [recipeQuery, setRecipeQuery] = useState('');

  const logToToday = async () => {
    if (!user || !scanResult) return;
    setLogging(true);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('meal_plans').insert({
      user_id: user.id,
      date: today,
      meal_type: 'snack',
      custom_meal: scanResult.meal_name || 'Scanned meal',
      calories: Math.round(scanResult.calories),
      protein: scanResult.protein,
      fat: scanResult.fat,
      carbs: scanResult.carbs,
      is_extra: true,
    });
    setLogging(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✨ Logged to today', description: `${scanResult.meal_name || 'Meal'} • ${Math.round(scanResult.calories)} kcal` });
    setScanResult(null);
  };

  return (
    <div className="flex-1 min-h-screen pb-32 md:pb-8">
      {/* Hero */}
      <motion.header {...fadeUp} className="px-5 pt-8 pb-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-11 w-11 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-pink">
            <ChefHat className="h-6 w-6 text-primary-foreground" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI Kitchen</p>
            <h1 className="font-display text-3xl font-bold leading-tight">Your food, smarter</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Scan a plate, find a recipe, raid your fridge.</p>
      </motion.header>

      {/* Tabs */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="px-5 max-w-3xl mx-auto">
        <div className="glass-strong rounded-2xl p-1.5 flex gap-1">
          {([
            { k: 'scan', icon: Sparkles, label: 'AI Scan' },
            { k: 'recipes', icon: Search, label: 'Recipes' },
            { k: 'fridge', icon: Refrigerator, label: 'Fridge' },
          ] as const).map(({ k, icon: Icon, label }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === k
                  ? 'gradient-primary text-primary-foreground shadow-glow-pink'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab content */}
      <div className="px-5 max-w-3xl mx-auto mt-5 space-y-5">
        {tab === 'scan' && (
          <motion.div {...fadeUp} className="glass rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-bold">AI Photo Scan</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Snap or describe your plate. We'll estimate calories & macros.
            </p>
            <PlateAnalyzer onResult={setScanResult} />

            {scanResult && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <p className="font-display font-bold text-base mb-2">{scanResult.meal_name || 'Scanned meal'}</p>
                <div className="grid grid-cols-4 gap-2 text-center mb-4">
                  {[
                    { label: 'kcal', val: Math.round(scanResult.calories) },
                    { label: 'P', val: `${Math.round(scanResult.protein)}g` },
                    { label: 'C', val: `${Math.round(scanResult.carbs)}g` },
                    { label: 'F', val: `${Math.round(scanResult.fat)}g` },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-card/60 py-2">
                      <p className="font-display text-base font-bold text-foreground">{s.val}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                <Button onClick={logToToday} disabled={logging} className="w-full rounded-xl gradient-primary text-primary-foreground">
                  {logging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Log to today
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {tab === 'recipes' && (
          <motion.div {...fadeUp} className="glass rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Recipe Inspiration</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Search recipes in our community library.
            </p>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="e.g. high-protein breakfast"
                value={recipeQuery}
                onChange={(e) => setRecipeQuery(e.target.value)}
                className="rounded-xl"
              />
              <Button asChild className="rounded-xl gradient-primary text-primary-foreground">
                <Link to={`/recipes${recipeQuery ? `?q=${encodeURIComponent(recipeQuery)}` : ''}`}>
                  <Search className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link to="/recipes"><ChefHat className="h-4 w-4 mr-2" /> Browse all recipes</Link>
            </Button>
          </motion.div>
        )}

        {tab === 'fridge' && (
          <motion.div {...fadeUp} className="glass rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Refrigerator className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Fridge Raid AI</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Tell us what's in your fridge — get a recipe instantly.
            </p>
            <FridgeRaid />
          </motion.div>
        )}

        {/* Quick links: nutrition tools */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="grid grid-cols-2 gap-3">
          <Link to="/shopping" className="glass rounded-2xl p-4 hover:scale-[1.02] active:scale-[0.98] transition-transform">
            <div className="h-10 w-10 rounded-xl bg-accent/30 flex items-center justify-center mb-2">
              <ShoppingBasket className="h-5 w-5 text-accent-foreground" />
            </div>
            <p className="font-display font-bold text-sm">Shopping List</p>
            <p className="text-[11px] text-muted-foreground">Smart, synced</p>
          </Link>
          <Link to="/planner" className="glass rounded-2xl p-4 hover:scale-[1.02] active:scale-[0.98] transition-transform">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center mb-2">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <p className="font-display font-bold text-sm">Week Planner</p>
            <p className="text-[11px] text-muted-foreground">Plan 7 days</p>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
