import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Link as LinkIcon, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/PostCard';

interface ProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  followers_count: number;
  following_count: number;
  created_at: string;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
}

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');

  const profileId = userId || user?.id;
  const isOwnProfile = profileId === user?.id;

  useEffect(() => {
    if (!profileId) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', profileId)
        .single();
      if (data) setProfile(data as any);

      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });
      if (postData) setPosts(postData as Post[]);

      if (user && !isOwnProfile) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [profileId, user, isOwnProfile]);

  const handleFollow = async () => {
    if (!user || !profileId) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profileId);
      setIsFollowing(false);
      setProfile((p) => p ? { ...p, followers_count: Math.max(0, p.followers_count - 1) } : p);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profileId });
      setIsFollowing(true);
      setProfile((p) => p ? { ...p, followers_count: p.followers_count + 1 } : p);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 border-r border-border max-w-2xl flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 border-r border-border max-w-2xl py-16 text-center">
        <p className="text-lg font-display font-semibold text-foreground">User not found</p>
      </div>
    );
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="flex-1 border-r border-border max-w-2xl">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 py-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">{profile.full_name || 'User'}</h1>
          <p className="text-xs text-muted-foreground">{posts.length} posts</p>
        </div>
      </div>

      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-primary/20 to-accent/20">
        {profile.banner_url && (
          <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Profile info */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-16 mb-3">
          <div className="h-32 w-32 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name || ''} className="h-full w-full object-cover" />
            ) : (
              <User className="h-16 w-16 text-muted-foreground" />
            )}
          </div>
          {isOwnProfile ? (
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Edit profile
            </Button>
          ) : user ? (
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              className="rounded-full px-6"
              onClick={handleFollow}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          ) : null}
        </div>

        <h2 className="font-display text-xl font-bold text-foreground">{profile.full_name || 'User'}</h2>
        <p className="text-sm text-muted-foreground">{profile.username ? `@${profile.username}` : `@user_${profile.id.slice(0, 8)}`}</p>

        {profile.bio && <p className="mt-3 text-sm text-foreground leading-relaxed">{profile.bio}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {profile.location}
            </span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
              <LinkIcon className="h-4 w-4" /> {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" /> Joined {joinDate}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="text-foreground"><strong>{profile.following_count}</strong> <span className="text-muted-foreground">Following</span></span>
          <span className="text-foreground"><strong>{profile.followers_count}</strong> <span className="text-muted-foreground">Followers</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['posts', 'likes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No posts yet</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            author={{
              full_name: profile.full_name,
              username: profile.username,
              avatar_url: profile.avatar_url,
            }}
          />
        ))
      )}
    </div>
  );
}
