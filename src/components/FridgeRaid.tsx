import { useState, useEffect } from 'react';
import { Sparkles, Plus, X, Loader2, ChefHat, Clock, Lightbulb, Bookmark, Send } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
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
    if (error) { toast({ title: 'Virhe', description: error.message, variant: 'destructive' }); return; }
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
      if (!session) throw new Error('Ei kirjautunut sisään');

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
        throw new Error(err.error || 'Generointi epäonnistui');
      }

      setRecipe(await resp.json());
    } catch (err: any) {
      toast({ title: 'Virhe', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveToRecipes = async () => {
    if (!user || !recipe) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('recipes').insert({
        user_id: user.id,
        title: recipe.title,
        description: recipe.description,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        difficulty: recipe.difficulty,
        ingredients: recipe.ingredients_used as any,
        instructions: recipe.instructions as any,
        meal_type: 'Dinner',
        tags: ['fridge-raid', 'ai-generated'],
      });
      if (error) throw error;
      toast({ title: 'Tallennettu resepteihin! 🎉' });
    } catch (err: any) {
      toast({ title: 'Virhe', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const postToFeed = async () => {
    if (!user || !recipe) return;
    setPosting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: `🧊 Fridge Raid: ${recipe.title}\n\n${recipe.description}`,
        is_recipe: true,
        recipe_ingredients: recipe.ingredients_used as any,
        recipe_instructions: recipe.instructions as any,
        tags: ['fridge-raid', 'ai-generated'] as any,
      });
      if (error) throw error;
      toast({ title: 'Julkaistu syötteeseen! 🚀' });
    } catch (err: any) {
      toast({ title: 'Virhe', description: err.message, variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pantry items */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Kaappisi sisältö</p>
        <div className="flex gap-2 mb-3">
          <input
            placeholder="Lisää ainesosa..."
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPantryItem()}
            className="flex-1 h-9 rounded-full bg-muted border-0 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={addPantryItem} disabled={!newItem.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {pantryItems.map(item => (
            <button
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all group ${
                selectedItems.has(item.id)
                  ? 'bg-primary text-primary-foreground shadow-sm scale-105'
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
            <p className="text-sm text-muted-foreground">Lisää ainesosia joita sinulla on keittiössä</p>
          )}
        </div>
      </div>

      {/* Generate button */}
      <Button
        className="w-full rounded-full gap-2 h-11"
        disabled={selectedItems.size < 2 || loading}
        onClick={generateRecipe}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Luodaan reseptiä...' : `Luo resepti (${selectedItems.size} valittu)`}
      </Button>

      {/* Generated recipe */}
      {recipe && (
        <div className="rounded-2xl border border-border overflow-hidden animate-fade-in">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <h3 className="font-display font-bold text-foreground text-lg">{recipe.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{recipe.description}</p>
            <div className="flex gap-3 mt-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {recipe.prep_time + recipe.cook_time} min
              </span>
              <Badge variant="secondary" className="text-xs">{recipe.difficulty}</Badge>
              <span className="text-xs text-muted-foreground">{recipe.estimated_calories} kcal</span>
            </div>
          </div>

          <div className="px-4 py-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Ainekset</p>
              <ul className="space-y-1">
                {recipe.ingredients_used.map((ing, i) => (
                  <li key={i} className="text-sm text-foreground flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="font-medium text-primary">{ing.amount} {ing.unit}</span> {ing.name}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Vaiheet</p>
              <ol className="space-y-2">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-3">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{i + 1}</span>
                    <span className="pt-0.5 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/10">
              <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{recipe.tip}</p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>🔥 {recipe.estimated_calories} kcal</span>
              <span>🥩 {recipe.protein}g P</span>
              <span>🧈 {recipe.fat}g F</span>
              <span>🍞 {recipe.carbs}g C</span>
            </div>

            {/* Save & Post actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                className="flex-1 rounded-xl gap-1.5"
                onClick={saveToRecipes}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                Tallenna resepteihin
              </Button>
              <Button
                className="flex-1 rounded-xl gap-1.5"
                onClick={postToFeed}
                disabled={posting}
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Julkaise syötteessä
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
