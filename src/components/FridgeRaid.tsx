import { useState, useEffect } from 'react';
import { Sparkles, Plus, X, Loader2, ChefHat, Clock, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
}

interface GeneratedRecipe {
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  difficulty: string;
  ingredients_used: { name: string; amount: string; unit: string }[];
  instructions: string[];
  estimated_calories: number;
  protein: number;
  fat: number;
  carbs: number;
  tip: string;
}

export function FridgeRaid() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('pantry_items').select('*').eq('user_id', user.id).order('name').then(({ data }) => {
      if (data) setPantryItems(data as PantryItem[]);
    });
  }, [user]);

  const addPantryItem = async () => {
    if (!user || !newItem.trim()) return;
    const { data, error } = await supabase.from('pantry_items').insert({
      user_id: user.id,
      name: newItem.trim(),
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    if (data) setPantryItems(prev => [...prev, data as PantryItem]);
    setNewItem('');
  };

  const removePantryItem = async (id: string) => {
    await supabase.from('pantry_items').delete().eq('id', id);
    setPantryItems(prev => prev.filter(p => p.id !== id));
    setSelectedItems(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const generateRecipe = async () => {
    if (selectedItems.size === 0) return;
    setLoading(true);
    setRecipe(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const ingredientNames = pantryItems.filter(p => selectedItems.has(p.id)).map(p => p.name);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fridge-raid`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ ingredients: ingredientNames }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Generation failed');
      }

      setRecipe(await resp.json());
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pantry items */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Pantry</p>
        <div className="flex gap-2 mb-2">
          <input
            placeholder="Add item to pantry..."
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPantryItem()}
            className="flex-1 h-8 rounded-full bg-muted border-0 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addPantryItem} disabled={!newItem.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pantryItems.map(item => (
            <button
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors group ${
                selectedItems.has(item.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {item.name}
              <button
                onClick={e => { e.stopPropagation(); removePantryItem(item.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </button>
          ))}
          {pantryItems.length === 0 && (
            <p className="text-xs text-muted-foreground">Add items you have in your kitchen</p>
          )}
        </div>
      </div>

      {/* Generate button */}
      <Button
        variant="hero"
        className="w-full rounded-full gap-2"
        disabled={selectedItems.size < 2 || loading}
        onClick={generateRecipe}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Cooking up a recipe...' : `Generate Recipe (${selectedItems.size} items selected)`}
      </Button>

      {/* Generated recipe */}
      {recipe && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <h3 className="font-display font-bold text-foreground">{recipe.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{recipe.description}</p>
            <div className="flex gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {recipe.prep_time + recipe.cook_time} min
              </span>
              <Badge variant="secondary" className="text-xs">{recipe.difficulty}</Badge>
              <span className="text-xs text-muted-foreground">{recipe.estimated_calories} kcal</span>
            </div>
          </div>

          <div className="px-4 py-3 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ingredients</p>
              <ul className="space-y-0.5">
                {recipe.ingredients_used.map((ing, i) => (
                  <li key={i} className="text-xs text-foreground">
                    <span className="text-primary font-medium">{ing.amount} {ing.unit}</span> {ing.name}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Steps</p>
              <ol className="space-y-1">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="text-xs text-foreground flex gap-2">
                    <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-accent/10">
              <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{recipe.tip}</p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>🔥 {recipe.estimated_calories} kcal</span>
              <span>🥩 {recipe.protein}g P</span>
              <span>🧈 {recipe.fat}g F</span>
              <span>🍞 {recipe.carbs}g C</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
