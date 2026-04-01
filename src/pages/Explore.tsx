import { useEffect, useState } from 'react';
import { Search, Clock, ChefHat, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  ingredients: any[];
  instructions: string[];
  tags: string[];
  user_id: string;
  created_at: string;
}

const CARD_COLORS = [
  'bg-orange-400', 'bg-rose-500', 'bg-lime-400', 'bg-yellow-400',
  'bg-pink-300', 'bg-teal-400', 'bg-violet-400', 'bg-sky-400',
  'bg-emerald-400', 'bg-amber-400', 'bg-indigo-400', 'bg-red-400',
];

const CARD_TEXT = [
  'text-orange-950', 'text-white', 'text-lime-950', 'text-yellow-950',
  'text-pink-950', 'text-teal-950', 'text-violet-950', 'text-sky-950',
  'text-emerald-950', 'text-amber-950', 'text-white', 'text-white',
];

const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function Explore() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setRecipes(data as any);
      setLoading(false);
    };
    fetchRecipes();
  }, []);

  const filtered = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || r.meal_type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 max-w-2xl mx-auto pb-16 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-2xl font-bold text-foreground">Explore</h1>
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes, cuisines..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-full pl-10 bg-muted border-0 focus-visible:ring-primary"
          />
        </div>
        {/* Category pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-display font-semibold text-foreground">No recipes found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {filtered.map((recipe, index) => {
            const bgColor = CARD_COLORS[index % CARD_COLORS.length];
            const textColor = CARD_TEXT[index % CARD_TEXT.length];
            return (
              <div
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className={`${bgColor} rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
              >
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span className={`text-sm font-semibold ${textColor}`}>
                    {recipe.cuisine || recipe.meal_type}
                  </span>
                  <span className={`text-xs ${textColor} opacity-80 border border-current/20 rounded-full px-2.5 py-0.5`}>
                    {recipe.prep_time + recipe.cook_time} min
                  </span>
                </div>
                {recipe.image_url && (
                  <div className="px-3 pb-2">
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full aspect-square object-cover rounded-2xl"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="px-4 pb-4">
                  <h3 className={`font-display text-xl font-bold ${textColor} leading-tight`}>
                    {recipe.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          {selectedRecipe?.image_url && (
            <img src={selectedRecipe.image_url} alt="" className="w-full object-cover max-h-72 rounded-t-lg" />
          )}
          {selectedRecipe && (
            <div className="p-5 space-y-5">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{selectedRecipe.title}</DialogTitle>
                {selectedRecipe.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedRecipe.description}</p>
                )}
              </DialogHeader>

              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" /> {selectedRecipe.prep_time + selectedRecipe.cook_time} min
                </Badge>
                <Badge variant="secondary">{selectedRecipe.difficulty}</Badge>
                <Badge variant="outline">{selectedRecipe.meal_type}</Badge>
                {selectedRecipe.cuisine && <Badge variant="outline">{selectedRecipe.cuisine}</Badge>}
              </div>

              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                <div className="rounded-2xl bg-muted/50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Ingredients
                  </h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ing: any, i: number) => (
                      <li key={i} className="text-sm text-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="font-medium text-primary">{ing.amount} {ing.unit}</span> {ing.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Steps</h3>
                  <ol className="space-y-3">
                    {(selectedRecipe.instructions as string[]).map((step: string, i: number) => (
                      <li key={i} className="text-sm text-foreground flex gap-3">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{i + 1}</span>
                        <span className="pt-0.5 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
