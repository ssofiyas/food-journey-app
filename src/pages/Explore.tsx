import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Heart, MessageCircle, Bookmark, ChefHat, Clock, User, Hash, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

interface Profile {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export default function Explore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [likedRecipes, setLikedRecipes] = useState<Set<string>>(new Set());
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Collect all tags
  const allTags = [...new Set(recipes.flatMap(r => r.tags || []))].sort();
  const trendingTags = allTags.slice(0, 12);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setRecipes(data as any);
        const userIds = [...new Set(data.map((r: any) => r.user_id))];
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id, full_name, username, avatar_url')
            .in('user_id', userIds);
          if (profileData) {
            const map: Record<string, Profile> = {};
            profileData.forEach((p: any) => { map[p.user_id] = p; });
            setProfiles(map);
          }
        }
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filtered = recipes.filter(r => {
    const matchesSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine?.toLowerCase().includes(search.toLowerCase()) ||
      r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !activeTag || r.tags?.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const toggleLike = (id: string) => {
    setLikedRecipes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSave = (id: string) => {
    setSavedRecipes(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else {
        next.add(id);
        toast({ title: 'Recipe saved!' });
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-2xl mx-auto pb-24 md:pb-0">
        <div className="sticky top-0 z-10 border-b border-border bg-background/70 backdrop-blur-xl px-3 sm:px-4 py-3">
          <h1 className="font-display text-xl font-bold text-foreground">Explore</h1>
        </div>
        {/* Skeleton grid */}
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square skeleton-glass rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto pb-24 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/70 backdrop-blur-xl px-3 sm:px-4 py-3 space-y-3">
        <h1 className="font-display text-xl font-bold text-foreground">Explore</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes, tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-full pl-10 bg-muted/50 border-border"
          />
        </div>
        {/* Trending tags */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {trendingTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTag === tag
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              <Hash className="h-3 w-3" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <ChefHat className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-display font-semibold">No results found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Try a different search or tag</p>
        </div>
      ) : (
        <>
          {/* Instagram-style grid */}
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {filtered.map(recipe => {
              const author = profiles[recipe.user_id];
              return (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className="relative aspect-square overflow-hidden group bg-muted"
                >
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-lime/20 to-lilac/20 flex items-center justify-center">
                      <ChefHat className="h-8 w-8 text-primary/40" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-4 text-white">
                      <span className="flex items-center gap-1 text-sm font-semibold">
                        <Heart className="h-4 w-4 fill-white" /> {likedRecipes.has(recipe.id) ? 1 : 0}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold">
                        <MessageCircle className="h-4 w-4 fill-white" /> 0
                      </span>
                    </div>
                  </div>
                  {/* Tags badge */}
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="absolute bottom-1 left-1">
                      <span className="text-[9px] bg-foreground/60 text-white rounded-full px-1.5 py-0.5 backdrop-blur-sm">
                        #{recipe.tags[0]}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Recipe detail modal */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            className="bg-card rounded-bento max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            {selectedRecipe.image_url ? (
              <div className="aspect-video w-full overflow-hidden rounded-t-bento">
                <img src={selectedRecipe.image_url} alt={selectedRecipe.title} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video w-full bg-gradient-to-br from-lime/20 to-lilac/20 rounded-t-bento flex items-center justify-center">
                <ChefHat className="h-16 w-16 text-primary/30" />
              </div>
            )}

            <div className="p-6 space-y-4">
              {/* Close */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{selectedRecipe.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {selectedRecipe.prep_time + selectedRecipe.cook_time} min
                    </span>
                    <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">{selectedRecipe.difficulty}</span>
                    {selectedRecipe.cuisine && (
                      <span className="text-xs bg-lilac/15 text-accent rounded-full px-2 py-0.5 font-medium">{selectedRecipe.cuisine}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedRecipe(null)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selectedRecipe.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedRecipe.description}</p>
              )}

              {/* Author */}
              {profiles[selectedRecipe.user_id] && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {profiles[selectedRecipe.user_id].avatar_url ? (
                      <img src={profiles[selectedRecipe.user_id].avatar_url!} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    @{profiles[selectedRecipe.user_id].username || 'chef'}
                  </span>
                </div>
              )}

              {/* Tags */}
              {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedRecipe.tags.map(tag => (
                    <span key={tag} className="text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-1">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Ingredients */}
              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ingredients</h4>
                  <div className="space-y-1">
                    {selectedRecipe.ingredients.map((ing: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {ing.amount} {ing.unit} {ing.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Steps</h4>
                  <ol className="space-y-2">
                    {(selectedRecipe.instructions as string[]).map((step: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-foreground">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => toggleLike(selectedRecipe.id)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all ${
                    likedRecipes.has(selectedRecipe.id)
                      ? 'bg-pink/20 text-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${likedRecipes.has(selectedRecipe.id) ? 'fill-pink text-pink' : ''}`} />
                  Like
                </button>
                <button
                  onClick={() => toggleSave(selectedRecipe.id)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all ${
                    savedRecipes.has(selectedRecipe.id)
                      ? 'bg-lime/20 text-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${savedRecipes.has(selectedRecipe.id) ? 'fill-primary text-primary' : ''}`} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
