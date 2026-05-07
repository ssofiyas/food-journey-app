import { useEffect, useState } from 'react';
import { Plus, Clock, ChefHat, Search, X, ChevronRight, Download, Sparkles } from 'lucide-react';
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
const UNITS = ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'pcs', 'oz', 'lb', 'pinch', 'handful', 'cloves'];
const COMMON_INGREDIENTS = [
  'Chicken breast', 'Ground beef', 'Salmon', 'Tofu', 'Eggs',
  'Rice', 'Pasta', 'Quinoa', 'Bread', 'Flour',
  'Olive oil', 'Butter', 'Heavy cream', 'Milk', 'Coconut milk',
  'Onion', 'Garlic', 'Tomato', 'Bell pepper', 'Broccoli',
  'Carrot', 'Spinach', 'Kale', 'Avocado', 'Lemon',
  'Salt', 'Pepper', 'Paprika', 'Cumin', 'Basil',
  'Parmesan', 'Mozzarella', 'Cheddar', 'Feta',
];

export default function Recipes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const [form, setForm] = useState({
    title: '', description: '', prep_time: 10, cook_time: 15,
    difficulty: 'Easy', cuisine: '', meal_type: 'Dinner',
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '', unit: 'g' }]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [ingredientSearch, setIngredientSearch] = useState<number | null>(null);

  const fetchRecipes = async () => {
    const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
    if (data) setRecipes(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchRecipes(); }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', prep_time: 10, cook_time: 15, difficulty: 'Easy', cuisine: '', meal_type: 'Dinner' });
    setIngredients([{ name: '', amount: '', unit: 'g' }]);
    setInstructions(['']);
  };

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
      resetForm();
      fetchRecipes();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = recipes.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine?.toLowerCase().includes(search.toLowerCase()) ||
      r.meal_type.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || r.meal_type.toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchType;
  });

  const getSuggestions = (query: string) => {
    if (!query) return [];
    return COMMON_INGREDIENTS.filter(i => i.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">Recipes</h1>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full gap-1.5 h-9">
                  <Plus className="h-4 w-4" /> New
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display">Create Recipe</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title *</Label>
                    <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Creamy Garlic Pasta" className="mt-1.5 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="A brief description..." className="mt-1.5 rounded-xl min-h-[60px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prep (min)</Label>
                      <Input type="number" value={form.prep_time} onChange={e => setForm({ ...form, prep_time: +e.target.value })} className="mt-1.5 rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cook (min)</Label>
                      <Input type="number" value={form.cook_time} onChange={e => setForm({ ...form, cook_time: +e.target.value })} className="mt-1.5 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Difficulty</Label>
                      <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
                        <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{difficulties.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meal Type</Label>
                      <Select value={form.meal_type} onValueChange={v => setForm({ ...form, meal_type: v })}>
                        <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{mealTypes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cuisine</Label>
                    <Input value={form.cuisine} onChange={e => setForm({ ...form, cuisine: e.target.value })} placeholder="Italian, Japanese..." className="mt-1.5 rounded-xl" />
                  </div>

                  {/* Ingredients with presets */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ingredients</Label>
                    <div className="space-y-2 mt-2">
                      {ingredients.map((ing, i) => (
                        <div key={i} className="relative">
                          <div className="flex gap-1.5 items-center">
                            <Input
                              placeholder="Qty"
                              value={ing.amount}
                              onChange={e => {
                                const u = [...ingredients]; u[i] = { ...ing, amount: e.target.value }; setIngredients(u);
                              }}
                              className="w-16 rounded-xl text-sm h-9"
                            />
                            <Select
                              value={ing.unit}
                              onValueChange={v => {
                                const u = [...ingredients]; u[i] = { ...ing, unit: v }; setIngredients(u);
                              }}
                            >
                              <SelectTrigger className="w-20 rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <div className="flex-1 relative">
                              <Input
                                placeholder="Ingredient name"
                                value={ing.name}
                                onChange={e => {
                                  const u = [...ingredients]; u[i] = { ...ing, name: e.target.value }; setIngredients(u);
                                  setIngredientSearch(i);
                                }}
                                onFocus={() => setIngredientSearch(i)}
                                onBlur={() => setTimeout(() => setIngredientSearch(null), 200)}
                                className="rounded-xl text-sm h-9"
                              />
                              {ingredientSearch === i && ing.name && getSuggestions(ing.name).length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-20 bg-card border border-border rounded-xl mt-1 shadow-lg overflow-hidden">
                                  {getSuggestions(ing.name).map(suggestion => (
                                    <button
                                      key={suggestion}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                                      onMouseDown={() => {
                                        const u = [...ingredients]; u[i] = { ...ing, name: suggestion }; setIngredients(u);
                                        setIngredientSearch(null);
                                      }}
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {ingredients.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setIngredients([...ingredients, { name: '', amount: '', unit: 'g' }])}>
                        + Add ingredient
                      </Button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steps</Label>
                    <div className="space-y-2 mt-2">
                      {instructions.map((step, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold mt-1 shrink-0">{i + 1}</span>
                          <Textarea placeholder={`Describe step ${i + 1}...`} value={step} onChange={e => {
                            const u = [...instructions]; u[i] = e.target.value; setInstructions(u);
                          }} className="min-h-[50px] rounded-xl text-sm" />
                          {instructions.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-1" onClick={() => setInstructions(instructions.filter((_, j) => j !== i))}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setInstructions([...instructions, ''])}>
                        + Add step
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full rounded-xl h-11 font-semibold" onClick={handleCreate} disabled={!form.title.trim() || saving}>
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
            className="pl-10 rounded-full bg-muted border-0 h-10"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 pb-1 overflow-x-auto scrollbar-hide">
          {['all', ...mealTypes].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filterType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {type === 'all' ? 'All' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center px-8">
          <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-display font-semibold text-foreground">No recipes found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search or create your first recipe!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
          {filtered.map(recipe => (
            <div
              key={recipe.id}
              onClick={() => setDetailRecipe(recipe)}
              className="bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover transition-all cursor-pointer group overflow-hidden"
            >
              {recipe.image_url ? (
                <img src={recipe.image_url} alt={recipe.title} className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full aspect-[16/10] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <ChefHat className="h-10 w-10 text-primary/40" />
                </div>
              )}
              <div className="p-3.5">
                <h3 className="font-display font-bold text-sm text-foreground line-clamp-1">{recipe.title}</h3>
                {recipe.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{recipe.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {recipe.prep_time + recipe.cook_time}m
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-5 px-2">{recipe.difficulty}</Badge>
                  <Badge variant="outline" className="text-[10px] h-5 px-2">{recipe.meal_type}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Detail Dialog */}
      <Dialog open={!!detailRecipe} onOpenChange={() => setDetailRecipe(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
          {detailRecipe && (
            <>
              {detailRecipe.image_url && (
                <img src={detailRecipe.image_url} alt={detailRecipe.title} className="w-full max-h-64 object-cover rounded-t-2xl" />
              )}
              <div className="p-5 space-y-5">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">{detailRecipe.title}</DialogTitle>
                  {detailRecipe.description && (
                    <p className="text-sm text-muted-foreground mt-1">{detailRecipe.description}</p>
                  )}
                </DialogHeader>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> {detailRecipe.prep_time + detailRecipe.cook_time} min</Badge>
                  <Badge variant="secondary">{detailRecipe.difficulty}</Badge>
                  <Badge variant="outline">{detailRecipe.meal_type}</Badge>
                  {detailRecipe.cuisine && <Badge variant="outline">{detailRecipe.cuisine}</Badge>}
                </div>

                {detailRecipe.ingredients && detailRecipe.ingredients.length > 0 && (
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Ingredients</h3>
                    <ul className="space-y-2">
                      {detailRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span className="font-medium text-primary">{ing.amount} {ing.unit}</span> {ing.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailRecipe.instructions && detailRecipe.instructions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Steps</h3>
                    <ol className="space-y-3">
                      {detailRecipe.instructions.map((step, i) => (
                        <li key={i} className="text-sm flex gap-3">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{i + 1}</span>
                          <span className="pt-0.5 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  {user && detailRecipe.user_id !== user.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5 flex-1"
                      onClick={async () => {
                        if (!user) return;
                        try {
                          const { error } = await supabase.from('recipes').insert({
                            user_id: user.id,
                            title: detailRecipe.title + ' (copy)',
                            description: detailRecipe.description,
                            prep_time: detailRecipe.prep_time,
                            cook_time: detailRecipe.cook_time,
                            difficulty: detailRecipe.difficulty,
                            cuisine: detailRecipe.cuisine,
                            meal_type: detailRecipe.meal_type,
                            ingredients: detailRecipe.ingredients as any,
                            instructions: detailRecipe.instructions as any,
                            tags: detailRecipe.tags as any,
                            image_url: detailRecipe.image_url,
                          });
                          if (error) throw error;
                          toast({ title: 'Recipe copied to your library!' });
                          fetchRecipes();
                          setDetailRecipe(null);
                        } catch (err: any) {
                          toast({ title: 'Error', description: err.message, variant: 'destructive' });
                        }
                      }}
                    >
                      <ChefHat className="h-3.5 w-3.5" /> Copy to My Recipes
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5 flex-1"
                    onClick={async () => {
                      if (!user) return;
                      const items = detailRecipe.ingredients.map((ing: any) => ({
                        name: `${ing.name} (${ing.amount} ${ing.unit})`,
                        quantity: ing.amount || '1',
                        checked: false,
                        category: 'Ingredients',
                      }));
                      const { error } = await supabase.from('shopping_lists').insert({
                        user_id: user.id,
                        name: detailRecipe.title,
                        items: items as any,
                      });
                      if (error) {
                        toast({ title: 'Error', description: error.message, variant: 'destructive' });
                      } else {
                        toast({ title: 'Added to shopping list!', description: `${items.length} ingredients from ${detailRecipe.title}` });
                      }
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add to Shopping List
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
