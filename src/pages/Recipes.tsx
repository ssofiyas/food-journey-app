import { useEffect, useState } from 'react';
import { Plus, Clock, ChefHat, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number;
  cook_time: number;
  difficulty: string;
  cuisine: string | null;
  meal_type: string;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  user_id: string;
  created_at: string;
}

const difficulties = ['Easy', 'Medium', 'Hard'];
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function Recipes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    prep_time: 0,
    cook_time: 0,
    difficulty: 'Easy',
    cuisine: '',
    meal_type: 'Dinner',
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '', unit: '' }]);
  const [instructions, setInstructions] = useState<string[]>(['']);

  const fetchRecipes = async () => {
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRecipes(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchRecipes(); }, []);

  const handleCreate = async () => {
    if (!user || !form.title.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('recipes').insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description || null,
        prep_time: form.prep_time,
        cook_time: form.cook_time,
        difficulty: form.difficulty,
        cuisine: form.cuisine || null,
        meal_type: form.meal_type,
        ingredients: ingredients.filter(i => i.name.trim()) as any,
        instructions: instructions.filter(i => i.trim()) as any,
      });
      if (error) throw error;
      toast({ title: 'Recipe created!' });
      setDialogOpen(false);
      setForm({ title: '', description: '', prep_time: 0, cook_time: 0, difficulty: 'Easy', cuisine: '', meal_type: 'Dinner' });
      setIngredients([{ name: '', amount: '', unit: '' }]);
      setInstructions(['']);
      fetchRecipes();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine?.toLowerCase().includes(search.toLowerCase()) ||
    r.meal_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 border-r border-border max-w-2xl">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">Recipes</h1>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="sm" className="rounded-full gap-1">
                  <Plus className="h-4 w-4" /> New Recipe
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">Create Recipe</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Recipe name" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="A brief description..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Prep Time (min)</Label>
                      <Input type="number" value={form.prep_time} onChange={e => setForm({ ...form, prep_time: +e.target.value })} />
                    </div>
                    <div>
                      <Label>Cook Time (min)</Label>
                      <Input type="number" value={form.cook_time} onChange={e => setForm({ ...form, cook_time: +e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Difficulty</Label>
                      <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {difficulties.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Meal Type</Label>
                      <Select value={form.meal_type} onValueChange={v => setForm({ ...form, meal_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {mealTypes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Cuisine</Label>
                    <Input value={form.cuisine} onChange={e => setForm({ ...form, cuisine: e.target.value })} placeholder="Italian, Japanese, etc." />
                  </div>

                  {/* Ingredients */}
                  <div>
                    <Label>Ingredients</Label>
                    <div className="space-y-2 mt-1">
                      {ingredients.map((ing, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <Input placeholder="Amount" value={ing.amount} onChange={e => {
                            const updated = [...ingredients];
                            updated[i] = { ...ing, amount: e.target.value };
                            setIngredients(updated);
                          }} className="w-20" />
                          <Input placeholder="Unit" value={ing.unit} onChange={e => {
                            const updated = [...ingredients];
                            updated[i] = { ...ing, unit: e.target.value };
                            setIngredients(updated);
                          }} className="w-20" />
                          <Input placeholder="Ingredient name" value={ing.name} onChange={e => {
                            const updated = [...ingredients];
                            updated[i] = { ...ing, name: e.target.value };
                            setIngredients(updated);
                          }} className="flex-1" />
                          {ingredients.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setIngredients([...ingredients, { name: '', amount: '', unit: '' }])}>
                        + Add ingredient
                      </Button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <Label>Instructions</Label>
                    <div className="space-y-2 mt-1">
                      {instructions.map((step, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-xs text-muted-foreground mt-3 shrink-0 w-5">{i + 1}.</span>
                          <Textarea placeholder={`Step ${i + 1}`} value={step} onChange={e => {
                            const updated = [...instructions];
                            updated[i] = e.target.value;
                            setInstructions(updated);
                          }} className="min-h-[60px]" />
                          {instructions.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-1" onClick={() => setInstructions(instructions.filter((_, j) => j !== i))}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setInstructions([...instructions, ''])}>
                        + Add step
                      </Button>
                    </div>
                  </div>

                  <Button variant="hero" className="w-full rounded-full" onClick={handleCreate} disabled={!form.title.trim() || saving}>
                    {saving ? 'Creating...' : 'Create Recipe'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-full bg-muted border-0"
          />
        </div>
      </div>

      {/* Recipe list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-display font-semibold text-foreground">No recipes yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first recipe to get started!</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map(recipe => (
            <div key={recipe.id} className="px-4 py-4 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="flex gap-3">
                {recipe.image_url ? (
                  <img src={recipe.image_url} alt={recipe.title} className="h-20 w-20 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ChefHat className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground truncate">{recipe.title}</h3>
                  {recipe.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{recipe.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {recipe.prep_time + recipe.cook_time} min
                    </span>
                    <Badge variant="secondary" className="text-xs">{recipe.difficulty}</Badge>
                    <Badge variant="outline" className="text-xs">{recipe.meal_type}</Badge>
                    {recipe.cuisine && <Badge variant="outline" className="text-xs">{recipe.cuisine}</Badge>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
