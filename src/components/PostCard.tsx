import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal, User, ChefHat, ShoppingCart, CalendarPlus, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url?: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    user_id: string;
    is_recipe?: boolean;
    recipe_ingredients?: Ingredient[];
    recipe_instructions?: string[];
  };
  author?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  liked?: boolean;
  saved?: boolean;
  onLike?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onAddToPlan?: () => void;
}

export function PostCard({ post, author, liked, saved, onLike, onSave, onDelete, onEdit, onAddToPlan }: PostCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = author?.full_name || 'Anonymous';
  const handle = author?.username ? `@${author.username}` : '@user';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const isOwner = user?.id === post.user_id;

  const hasRecipeData = post.is_recipe &&
    ((post.recipe_ingredients && post.recipe_ingredients.length > 0) ||
     (post.recipe_instructions && post.recipe_instructions.length > 0));

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 300);
    onLike?.();
  };

  const handleDoubleClick = () => {
    if (!liked) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 300);
      onLike?.();
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${post.user_id}`);
  };

  return (
    <>
      <article className="bg-card border-b border-border animate-fade-in">
        {/* Header - Instagram style */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleProfileClick}
            className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent p-[2px] transition-transform hover:scale-105"
          >
            <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
              {author?.avatar_url ? (
                <img src={author.avatar_url} alt={displayName} className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
            </div>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <button onClick={handleProfileClick} className="font-semibold text-sm text-foreground truncate hover:opacity-70 transition-opacity">
                {displayName}
              </button>
              {post.is_recipe && (
                <Badge variant="secondary" className="text-[9px] gap-0.5 px-1.5 py-0 h-4 shrink-0 bg-primary/10 text-primary border-0">
                  <ChefHat className="h-2.5 w-2.5" /> Resepti
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
          </div>

          {/* Three-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={e => e.stopPropagation()}>
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => onEdit?.()}>
                    <Pencil className="h-4 w-4 mr-2" /> Muokkaa
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Poista
                  </DropdownMenuItem>
                </>
              )}
              {hasRecipeData && (
                <DropdownMenuItem onClick={() => onAddToPlan?.()}>
                  <CalendarPlus className="h-4 w-4 mr-2" /> Lisää suunnitelmaan
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Image - Instagram full-width style */}
        {post.image_url && (
          <div
            className="relative w-full cursor-pointer select-none"
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={post.image_url}
              alt=""
              className="w-full object-cover max-h-[500px]"
              loading="lazy"
            />
            {/* Double-tap heart animation */}
            {likeAnim && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart className="h-20 w-20 text-white fill-white drop-shadow-lg animate-like-pop" />
              </div>
            )}
          </div>
        )}

        {/* Actions - Instagram style */}
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLikeClick}
              className={`transition-transform active:scale-125 ${liked ? 'text-destructive' : 'text-foreground'}`}
            >
              <Heart className={`h-6 w-6 ${liked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (hasRecipeData) setShowDetail(true); }}
              className="text-foreground transition-transform active:scale-110"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
            <button className="text-foreground transition-transform active:scale-110">
              <Send className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSave?.(); }}
            className={`transition-transform active:scale-125 ${saved ? 'text-foreground' : 'text-foreground'}`}
          >
            <Bookmark className={`h-6 w-6 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Likes count */}
        {post.likes_count > 0 && (
          <p className="px-4 pt-1.5 text-sm font-semibold text-foreground">
            {post.likes_count} {post.likes_count === 1 ? 'tykkäys' : 'tykkäystä'}
          </p>
        )}

        {/* Content */}
        <div className="px-4 pt-1 pb-2">
          <p className="text-sm text-foreground leading-relaxed">
            <button onClick={handleProfileClick} className="font-semibold mr-1.5 hover:opacity-70 transition-opacity">
              {displayName}
            </button>
            <span className="whitespace-pre-wrap">{post.content}</span>
          </p>
        </div>

        {/* Recipe quick peek */}
        {hasRecipeData && (
          <button
            onClick={() => setShowDetail(true)}
            className="px-4 pb-1 text-sm text-primary font-medium hover:opacity-70 transition-opacity"
          >
            Näytä resepti →
          </button>
        )}

        {/* Comments preview */}
        {post.comments_count > 0 && (
          <button className="px-4 pb-2 text-sm text-muted-foreground hover:opacity-70 transition-opacity">
            Näytä kaikki {post.comments_count} kommenttia
          </button>
        )}

        <div className="h-1" />
      </article>

      {/* Full-screen Recipe Detail */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          {post.image_url && (
            <div className="w-full">
              <img src={post.image_url} alt="" className="w-full object-cover max-h-72" />
            </div>
          )}
          <div className="p-5 space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
                  <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                    {author?.avatar_url ? (
                      <img src={author.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold">{displayName}</DialogTitle>
                  <p className="text-xs text-muted-foreground">{handle} · {timeAgo}</p>
                </div>
              </div>
            </DialogHeader>

            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

            {post.recipe_ingredients && post.recipe_ingredients.length > 0 && (
              <div className="rounded-2xl bg-muted/50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5" /> Ainekset
                </h3>
                <ul className="space-y-2">
                  {post.recipe_ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-foreground flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="font-medium text-primary">{ing.amount} {ing.unit}</span> {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {post.recipe_instructions && post.recipe_instructions.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Vaiheet</h3>
                <ol className="space-y-3">
                  {post.recipe_instructions.map((step, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-3">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{i + 1}</span>
                      <span className="pt-0.5 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Action buttons in detail view */}
            {hasRecipeData && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => onAddToPlan?.()}
                >
                  <CalendarPlus className="h-4 w-4 mr-2" /> Suunnitelmaan
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => onSave?.()}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${saved ? 'fill-current' : ''}`} /> Tallenna
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Poista julkaisu?</AlertDialogTitle>
            <AlertDialogDescription>Tätä toimintoa ei voi peruuttaa. Julkaisu poistetaan pysyvästi.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Peruuta</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { onDelete?.(); setShowDeleteConfirm(false); }}>
              Poista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
