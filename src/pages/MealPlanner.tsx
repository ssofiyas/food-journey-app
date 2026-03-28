import { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Utensils } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface MealPlan {
  id: string;
  date: string;
  meal_type: string;
  recipe_id: string | null;
  custom_meal: string | null;
  notes: string | null;
}

type ViewMode = 'week' | 'month';
const mealSlots = ['breakfast', 'lunch', 'dinner'];

export default function MealPlanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('dinner');
  const [mealName, setMealName] = useState('');
  const [saving, setSaving] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: addDays(startOfWeek(addDays(monthEnd, 6), { weekStartsOn: 1 }), -1) });

  const fetchPlans = async () => {
    if (!user) return;
    const rangeStart = viewMode === 'week' ? format(weekDays[0], 'yyyy-MM-dd') : format(monthDays[0], 'yyyy-MM-dd');
    const rangeEnd = viewMode === 'week' ? format(weekDays[6], 'yyyy-MM-dd') : format(monthDays[monthDays.length - 1], 'yyyy-MM-dd');

    const { data } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', rangeStart)
      .lte('date', rangeEnd);
    if (data) setPlans(data as MealPlan[]);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, [user, currentDate, viewMode]);

  const getMealsForDay = (date: Date) => plans.filter(p => p.date === format(date, 'yyyy-MM-dd'));

  const handleAddMeal = async () => {
    if (!user || !selectedDate || !mealName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('meal_plans').insert({
        user_id: user.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        meal_type: selectedSlot,
        custom_meal: mealName.trim(),
      });
      if (error) throw error;
      setDialogOpen(false);
      setMealName('');
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

  const openAddDialog = (date: Date, slot: string) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
    setMealName('');
    setDialogOpen(true);
  };

  const navigate = (dir: number) => {
    setCurrentDate(prev => viewMode === 'week' ? (dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1)) : new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
  };

  return (
    <div className="flex-1 border-r border-border max-w-2xl">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">Meal Planner</h1>
          <div className="flex items-center gap-1">
            <Button variant={viewMode === 'week' ? 'default' : 'ghost'} size="sm" className="rounded-full text-xs" onClick={() => setViewMode('week')}>Week</Button>
            <Button variant={viewMode === 'month' ? 'default' : 'ghost'} size="sm" className="rounded-full text-xs" onClick={() => setViewMode('month')}>Month</Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="font-display font-semibold text-foreground">
            {viewMode === 'week'
              ? `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')
            }
          </span>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : viewMode === 'week' ? (
        /* Week View */
        <div className="divide-y divide-border">
          {weekDays.map(day => {
            const meals = getMealsForDay(day);
            const today = isToday(day);
            return (
              <div key={day.toISOString()} className={`px-4 py-3 ${today ? 'bg-primary/5' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-display font-semibold text-sm ${today ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'EEEE')}
                    </span>
                    <span className="text-xs text-muted-foreground">{format(day, 'MMM d')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {mealSlots.map(slot => {
                    const meal = meals.find(m => m.meal_type === slot);
                    return (
                      <div key={slot} className="min-h-[48px]">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{slot}</p>
                        {meal ? (
                          <div className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1.5 group">
                            <Utensils className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-xs text-foreground truncate flex-1">{meal.custom_meal || 'Recipe'}</span>
                            <button onClick={() => handleDeleteMeal(meal.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </button>
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
              </div>
            );
          })}
        </div>
      ) : (
        /* Month View */
        <div className="p-4">
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="bg-muted px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
            ))}
            {monthDays.map(day => {
              const meals = getMealsForDay(day);
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`bg-background min-h-[80px] p-1 ${!inMonth ? 'opacity-30' : ''} ${today ? 'ring-1 ring-inset ring-primary' : ''}`}
                >
                  <span className={`text-xs font-semibold ${today ? 'text-primary' : 'text-foreground'}`}>{format(day, 'd')}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {meals.slice(0, 3).map(meal => (
                      <div key={meal.id} className="rounded bg-primary/10 px-1 py-0.5 text-[9px] text-primary truncate">
                        {meal.custom_meal || meal.meal_type}
                      </div>
                    ))}
                    {inMonth && meals.length === 0 && (
                      <button
                        onClick={() => openAddDialog(day, 'dinner')}
                        className="w-full text-[9px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Meal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              Add Meal — {selectedDate && format(selectedDate, 'EEE, MMM d')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mealSlots.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="What are you eating?" value={mealName} onChange={e => setMealName(e.target.value)} />
            <Button variant="hero" className="w-full rounded-full" onClick={handleAddMeal} disabled={!mealName.trim() || saving}>
              {saving ? 'Adding...' : 'Add Meal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
