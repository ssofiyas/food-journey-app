import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ComposePost } from '@/components/ComposePost';
import { PostCard } from '@/components/PostCard';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  is_recipe: boolean;
  recipe_ingredients: any[];
  recipe_instructions: string[];
  tags: string[];
}

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

type FeedTab = 'global' | 'following';

export default function Feed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('global');
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    // Fetch following IDs and user preferences in parallel
    supabase.from('follows').select('following_id').eq('follower_id', user.id).then(({ data }) => {
      if (data) setFollowingIds(data.map((f: any) => f.following_id));
    });
    supabase.from('user_preferences').select('liked_tags').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setUserPreferences((data as any).liked_tags || {});
    });
  }, [user]);

  // Score a post based on user's tag preferences
  const scorePost = useCallback((post: Post): number => {
    if (!post.tags || post.tags.length === 0 || Object.keys(userPreferences).length === 0) return 0;
    let score = 0;
    for (const tag of post.tags) {
      score += userPreferences[tag] || 0;
    }
    return score;
  }, [userPreferences]);

  const fetchPosts = useCallback(async () => {
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
    if (activeTab === 'following' && followingIds.length > 0) {
      query = query.in('user_id', [...followingIds, user?.id || '']);
    }
    const { data } = await query;
    if (data) {
      let sortedPosts = data as Post[];
      
      // For "global" tab, apply recommendation scoring
      if (activeTab === 'global' && Object.keys(userPreferences).length > 0) {
        sortedPosts = [...sortedPosts].sort((a, b) => {
          const scoreA = scorePost(a);
          const scoreB = scorePost(b);
          if (scoreA !== scoreB) return scoreB - scoreA;
          // Fall back to recency
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }
      
      setPosts(sortedPosts);
      const userIds = [...new Set(data.map((p: any) => p.user_id))];
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
  }, [activeTab, followingIds, user, scorePost, userPreferences]);

  const fetchLikes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
    if (data) setLikedPosts(new Set(data.map((l: any) => l.post_id)));
  }, [user]);

  const fetchSaved = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_posts').select('post_id').eq('user_id', user.id);
    if (data) setSavedPosts(new Set(data.map((s: any) => s.post_id)));
  }, [user]);

  useEffect(() => { fetchPosts(); fetchLikes(); fetchSaved(); }, [fetchPosts, fetchLikes, fetchSaved]);

  useEffect(() => {
    const channel = supabase
      .channel('posts-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPosts.has(postId);
    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
      setLikedPosts((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p));
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      setLikedPosts((prev) => new Set(prev).add(postId));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const handleSave = async (postId: string) => {
    if (!user) return;
    const isSaved = savedPosts.has(postId);
    if (isSaved) {
      await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId);
      setSavedPosts((prev) => { const n = new Set(prev); n.delete(postId); return n; });
    } else {
      await supabase.from('saved_posts').insert({ user_id: user.id, post_id: postId });
      setSavedPosts((prev) => new Set(prev).add(postId));
      toast({ title: 'Tallennettu!' });
    }
  };

  const handleDelete = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast({ title: 'Julkaisu poistettu' });
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto pb-16 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h1 className="font-display text-xl font-bold text-foreground">MealCraft</h1>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex">
          {(['global', 'following'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all relative ${
                activeTab === tab
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              {tab === 'global' ? 'Sinulle' : 'Seuratut'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {user && <ComposePost onPostCreated={fetchPosts} />}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center px-8">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-lg font-display font-semibold text-foreground">
            {activeTab === 'following' ? 'Seuraa käyttäjiä!' : 'Ei julkaisuja vielä'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === 'following' ? 'Vaihda "Sinulle" löytääksesi sisältöä' : 'Ole ensimmäinen ja jaa jotain!'}
          </p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={profiles[post.user_id]}
              liked={likedPosts.has(post.id)}
              saved={savedPosts.has(post.id)}
              onLike={() => handleLike(post.id)}
              onSave={() => handleSave(post.id)}
              onDelete={() => handleDelete(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
