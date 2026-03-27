import { Heart, MessageCircle, Share2, MoreHorizontal, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url?: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    user_id: string;
  };
  author?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  liked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
}

export function PostCard({ post, author, liked, onLike, onComment }: PostCardProps) {
  const displayName = author?.full_name || 'Anonymous';
  const handle = author?.username ? `@${author.username}` : '@user';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <article className="flex gap-3 border-b border-border px-4 py-4 transition-colors hover:bg-muted/30 cursor-pointer">
      {/* Avatar */}
      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
        {author?.avatar_url ? (
          <img src={author.avatar_url} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-primary" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground truncate">{displayName}</span>
          <span className="text-sm text-muted-foreground truncate">{handle}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground whitespace-nowrap">{timeAgo}</span>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 shrink-0">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <p className="mt-1 text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {post.image_url && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-border">
            <img src={post.image_url} alt="" className="w-full object-cover max-h-96" />
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-1 -ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); onComment?.(); }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10"
          >
            <MessageCircle className="h-4 w-4" />
            {post.comments_count > 0 && <span className="text-xs">{post.comments_count}</span>}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onLike?.(); }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:text-destructive hover:bg-destructive/10 ${liked ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            {post.likes_count > 0 && <span className="text-xs">{post.likes_count}</span>}
          </button>
          <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
