import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Utensils, Sparkles, Loader2 } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { NutritionSnapshot } from '@/components/NutritionSnapshot';
import { PlateAnalyzer } from '@/components/PlateAnalyzer';

interface MealPlan {
  id: string;
  date: string;
  meal_type: string;
  recipe_id: string | null;
  custom_meal: string | null;
  notes: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  is_extra: boolean;
}

const mealSlots = ['breakfast', 'lunch', 'dinner'];

export default function MealPlanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('dinner');
  const [mealName, setMealName] = useState('');
  const [isExtra, setIsExtra] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [dailyTarget, setDailyTarget] = useState(2000);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('daily_calorie_target').eq('user_id', user.id).single().then(({ data }) => {
      if (data && (data as any).daily_calorie_target) setDailyTarget((data as any).daily_calorie_target);
    });
  }, [user]);

  const fetchPlans = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', format(weekDays[0], 'yyyy-MM-dd'))
      .lte('date', format(weekDays[6], 'yyyy-MM-dd'));
    if (data) setPlans(data as MealPlan[]);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, [user, currentDate]);

  const getMealsForDay = (date: Date) => plans.filter(p => p.date === format(date, 'yyyy-MM-dd'));
  const getDayCalories = (date: Date) => getMealsForDay(date).reduce((sum, m) => sum + (m.calories || 0), 0);

  const estimateNutrition = async (name: string) => {
    setEstimating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ meal_description: name }),
      });
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; } finally { setEstimating(false); }
  };

  const handleAddMeal = async () => {
    if (!user || !selectedDate || !mealName.trim()) return;
    setSaving(true);
    try {
      const nutrition = await estimateNutrition(mealName.trim());
      const { error } = await supabase.from('meal_plans').insert({
        user_id: user.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        meal_type: isExtra ? 'other' : selectedSlot,
        custom_meal: mealName.trim(),
        is_extra: isExtra,
        calories: nutrition?.calories || 0,
        protein: nutrition?.protein || 0,
        fat: nutrition?.fat || 0,
        carbs: nutrition?.carbs || 0,
      });
      if (error) throw error;
      setDialogOpen(false);
      setMealName('');
      setIsExtra(false);
      fetchPlans();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    await supabase.from('meal_plans').delete().eq('id', id);
    fetchPlans();
  };

  const handlePlateResult = async (data: any) => {
    if (!user || !selectedDate) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('meal_plans').insert({
        user_id: user.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        meal_type: selectedSlot,
        custom_meal: data.meal_name || 'Analyzed Meal',
        calories: data.total_calories || data.calories || 0,
        protein: data.total_protein || data.protein || 0,
        fat: data.total_fat || data.fat || 0,
        carbs: data.total_carbs || data.carbs || 0,
      });
      if (error) throw error;
      setDialogOpen(false);
      fetchPlans();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openAddDialog = (date: Date, slot: string, extra = false) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
    setIsExtra(extra);
    setMealName('');
    setDialogOpen(true);
  };

  const navigate = (dir: number) => {
    setCurrentDate(prev => dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1));
  };

  return (
    <div className="flex-1 border-r border-border max-w-2xl">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <h1 className="font-display text-xl font-bold text-foreground">Meal Planner</h1>
        <div className="flex items-center justify-between mt-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="font-display font-semibold text-foreground">
            {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {weekDays.map(day => {
            const meals = getMealsForDay(day);
            const regularMeals = meals.filter(m => !m.is_extra);
            const extraMeals = meals.filter(m => m.is_extra);
            const today = isToday(day);
            const dayCalories = getDayCalories(day);
            const caloriePercent = Math.min((dayCalories / dailyTarget) * 100, 100);

            return (
              <div key={day.toISOString()} className={`px-4 py-3 ${today ? 'bg-primary/5' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-display font-semibold text-sm ${today ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'EEEE')}
                    </span>
                    <span className="text-xs text-muted-foreground">{format(day, 'MMM d')}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {dayCalories} / {dailyTarget} kcal
                  </span>
                </div>

                {/* Calorie progress bar */}
                <div className="h-1.5 rounded-full bg-muted mb-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      caloriePercent > 100 ? 'bg-destructive' : caloriePercent > 80 ? 'bg-accent' : 'bg-primary'
                    }`}
                    style={{ width: `${caloriePercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {mealSlots.map(slot => {
                    const meal = regularMeals.find(m => m.meal_type === slot);
                    return (
                      <div key={slot} className="min-h-[48px]">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{slot}</p>
                        {meal ? (
                          <div className="rounded-lg bg-muted px-2 py-1.5 group">
                            <div className="flex items-center gap-1">
                              <Utensils className="h-3 w-3 text-primary shrink-0" />
                              <span className="text-xs text-foreground truncate flex-1">{meal.custom_meal || 'Recipe'}</span>
                              <button onClick={() => handleDeleteMeal(meal.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                            {meal.calories > 0 && (
                              <NutritionSnapshot calories={meal.calories} protein={meal.protein} fat={meal.fat} carbs={meal.carbs} compact />
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => openAddDialog(day, slot)}
                            className="w-full rounded-lg border border-dashed border-border px-2 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            <Plus className="h-3 w-3 mx-auto" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Extra meals */}
                {extraMeals.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {extraMeals.map(meal => (
                      <div key={meal.id} className="flex items-center gap-2 rounded-lg bg-accent/10 px-2 py-1.5 group">
                        <span className="text-[10px] text-accent font-medium">+</span>
                        <span className="text-xs text-foreground truncate flex-1">{meal.custom_meal}</span>
                        {meal.calories > 0 && <span className="text-[10px] text-muted-foreground">{meal.calories} kcal</span>}
                        <button onClick={() => handleDeleteMeal(meal.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Other button */}
                <button
                  onClick={() => openAddDialog(day, 'other', true)}
                  className="mt-2 flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add snack / drink
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Meal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              {isExtra ? 'Log Extra' : 'Add Meal'} — {selectedDate && format(selectedDate, 'EEE, MMM d')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {!isExtra && (
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mealSlots.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Input placeholder={isExtra ? "Snack, drink, treat..." : "What are you eating?"} value={mealName} onChange={e => setMealName(e.target.value)} />

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              AI will auto-estimate nutrition
            </div>

            <Button variant="hero" className="w-full rounded-full" onClick={handleAddMeal} disabled={!mealName.trim() || saving || estimating}>
              {(saving || estimating) ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {estimating ? 'Estimating...' : 'Adding...'}</>
              ) : 'Add Meal'}
            </Button>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Or analyze a photo
              </p>
              <PlateAnalyzer onResult={handlePlateResult} compact />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
