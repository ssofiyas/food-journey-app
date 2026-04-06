import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Heart, MessageCircle, Bookmark, Share2, ChefHat, Clock, Play, Pause, Volume2, VolumeX, User } from 'lucide-react';
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
  const [showSearch, setShowSearch] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedRecipes, setLikedRecipes] = useState<Set<string>>(new Set());
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!search) return true;
    return r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine?.toLowerCase().includes(search.toLowerCase()) ||
      r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
  });

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    const height = container.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    setActiveIndex(newIndex);
  }, []);

  const toggleLike = (id: string) => {
    setLikedRecipes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSave = async (id: string) => {
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
      <div className="flex-1 flex items-center justify-center h-screen bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-black">
      {/* Search overlay */}
      {showSearch && (
        <div className="absolute inset-x-0 top-0 z-50 p-4 bg-gradient-to-b from-black/90 to-transparent">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              autoFocus
              placeholder="Search recipes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onBlur={() => { if (!search) setShowSearch(false); }}
              className="rounded-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
            />
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-4 pt-3 pb-8 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <h1 className="text-white font-display text-lg font-bold pointer-events-auto">Reels</h1>
        <button
          onClick={() => setShowSearch(true)}
          className="pointer-events-auto h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
        >
          <Search className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Vertical snap-scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[calc(100vh-4rem)] md:h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white">
            <ChefHat className="h-16 w-16 text-white/40 mb-4" />
            <p className="text-lg font-display font-semibold">No recipes found</p>
            <p className="text-sm text-white/50">Try a different search</p>
          </div>
        ) : (
          filtered.map((recipe, index) => (
            <ReelCard
              key={recipe.id}
              recipe={recipe}
              author={profiles[recipe.user_id]}
              isActive={index === activeIndex}
              liked={likedRecipes.has(recipe.id)}
              saved={savedRecipes.has(recipe.id)}
              expanded={expandedId === recipe.id}
              onToggleLike={() => toggleLike(recipe.id)}
              onToggleSave={() => toggleSave(recipe.id)}
              onToggleExpand={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
            />
          ))
        )}
      </div>

      {/* Progress dots */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1">
        {filtered.slice(0, 8).map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'h-6 bg-white' : 'h-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Single Reel Card ─── */

interface ReelCardProps {
  recipe: Recipe;
  author?: Profile;
  isActive: boolean;
  liked: boolean;
  saved: boolean;
  expanded: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onToggleExpand: () => void;
}

function ReelCard({ recipe, author, isActive, liked, saved, expanded, onToggleLike, onToggleSave, onToggleExpand }: ReelCardProps) {
  const [doubleTapAnim, setDoubleTapAnim] = useState(false);
  const lastTap = useRef(0);
  const displayName = author?.full_name || author?.username || 'Chef';

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) onToggleLike();
      setDoubleTapAnim(true);
      setTimeout(() => setDoubleTapAnim(false), 800);
    }
    lastTap.current = now;
  };

  return (
    <div
      className="h-[calc(100vh-4rem)] md:h-screen w-full snap-start snap-always relative flex items-end"
      onClick={handleDoubleTap}
    >
      {/* Background image */}
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center">
          <ChefHat className="h-24 w-24 text-white/20" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

      {/* Double tap heart */}
      {doubleTapAnim && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <Heart className="h-24 w-24 text-red-500 fill-red-500 animate-like-pop" />
        </div>
      )}

      {/* Right action bar */}
      <div className="absolute right-3 bottom-32 md:bottom-40 z-30 flex flex-col items-center gap-5">
        {/* Author avatar */}
        <button className="relative mb-2">
          <div className="h-11 w-11 rounded-full border-2 border-white overflow-hidden bg-white/20">
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">+</div>
        </button>

        {/* Like */}
        <button onClick={(e) => { e.stopPropagation(); onToggleLike(); }} className="flex flex-col items-center gap-1">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${liked ? 'bg-red-500/20' : 'bg-white/10 backdrop-blur-sm'}`}>
            <Heart className={`h-6 w-6 ${liked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </div>
          <span className="text-white text-[10px] font-semibold">{liked ? '1' : '0'}</span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center gap-1">
          <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-semibold">0</span>
        </button>

        {/* Save */}
        <button onClick={(e) => { e.stopPropagation(); onToggleSave(); }} className="flex flex-col items-center gap-1">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${saved ? 'bg-yellow-500/20' : 'bg-white/10 backdrop-blur-sm'}`}>
            <Bookmark className={`h-6 w-6 ${saved ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
          </div>
          <span className="text-white text-[10px] font-semibold">Save</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-semibold">Share</span>
        </button>
      </div>

      {/* Bottom content */}
      <div className="relative z-20 w-full px-4 pb-20 md:pb-8 pr-20">
        {/* Author name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white font-semibold text-sm">@{author?.username || 'chef'}</span>
          <span className="text-white/50 text-xs">•</span>
          <span className="text-white/50 text-xs">{recipe.prep_time + recipe.cook_time} min</span>
        </div>

        {/* Title */}
        <h2 className="text-white font-display text-xl font-bold leading-tight mb-2">
          {recipe.title}
        </h2>

        {/* Description / expanded recipe */}
        <div
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          className="cursor-pointer"
        >
          {expanded ? (
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 space-y-3 max-h-[50vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
              {recipe.description && (
                <p className="text-white/80 text-sm leading-relaxed">{recipe.description}</p>
              )}

              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div>
                  <h4 className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2">Ingredients</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.ingredients.map((ing: any, i: number) => (
                      <span key={i} className="text-xs bg-white/10 text-white rounded-full px-2.5 py-1">
                        {ing.amount} {ing.unit} {ing.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recipe.instructions && recipe.instructions.length > 0 && (
                <div>
                  <h4 className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2">Steps</h4>
                  <ol className="space-y-1.5">
                    {(recipe.instructions as string[]).map((step: string, i: number) => (
                      <li key={i} className="text-white/80 text-xs flex gap-2">
                        <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <p className="text-white/40 text-[10px] text-center pt-1">Tap to collapse</p>
            </div>
          ) : (
            <p className="text-white/70 text-sm line-clamp-2">
              {recipe.description || 'Tap to see full recipe...'}
              <span className="text-white/50 ml-1">more</span>
            </p>
          )}
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && !expanded && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {recipe.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs text-white/60">#{tag}</span>
            ))}
          </div>
        )}

        {/* Difficulty & cuisine badge */}
        <div className="flex gap-2 mt-3">
          <span className="text-[10px] font-semibold bg-white/10 backdrop-blur-sm text-white rounded-full px-3 py-1 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {recipe.difficulty}
          </span>
          {recipe.cuisine && (
            <span className="text-[10px] font-semibold bg-white/10 backdrop-blur-sm text-white rounded-full px-3 py-1">
              {recipe.cuisine}
            </span>
          )}
          <span className="text-[10px] font-semibold bg-primary/30 backdrop-blur-sm text-primary-foreground rounded-full px-3 py-1">
            {recipe.meal_type}
          </span>
        </div>
      </div>
    </div>
  );
}
