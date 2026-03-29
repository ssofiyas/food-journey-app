import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ComposePost } from '@/components/ComposePost';
import { PostCard } from '@/components/PostCard';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('global');
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  // Fetch who user follows
  useEffect(() => {
    if (!user) return;
    supabase.from('follows').select('following_id').eq('follower_id', user.id).then(({ data }) => {
      if (data) setFollowingIds(data.map((f: any) => f.following_id));
    });
  }, [user]);

  const fetchPosts = useCallback(async () => {
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);

    if (activeTab === 'following' && followingIds.length > 0) {
      query = query.in('user_id', [...followingIds, user?.id || '']);
    }

    const { data } = await query;
    if (data) {
      setPosts(data as Post[]);
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
  }, [activeTab, followingIds, user]);

  const fetchLikes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
    if (data) setLikedPosts(new Set(data.map((l: any) => l.post_id)));
  }, [user]);

  useEffect(() => { fetchPosts(); fetchLikes(); }, [fetchPosts, fetchLikes]);

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

  return (
    <div className="flex-1 border-r border-border max-w-2xl">
      {/* Header with tabs */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <h1 className="font-display text-xl font-bold text-foreground px-4 pt-3 pb-2">Home</h1>
        <div className="flex">
          {(['global', 'following'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {tab === 'global' ? 'For You' : 'Following'}
            </button>
          ))}
        </div>
      </div>

      {user && <ComposePost onPostCreated={fetchPosts} />}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-display font-semibold text-foreground">
            {activeTab === 'following' ? 'Follow some people to see their posts!' : 'No posts yet'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === 'following' ? 'Switch to For You to discover content' : 'Be the first to share something!'}
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            author={profiles[post.user_id]}
            liked={likedPosts.has(post.id)}
            onLike={() => handleLike(post.id)}
          />
        ))
      )}
    </div>
  );
}
