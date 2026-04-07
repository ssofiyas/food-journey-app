import { Clock, ChefHat, User, MoreHorizontal, Pencil, Trash2, CalendarPlus, Bookmark, PartyPopper, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
    tags?: string[];
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
  onCookedThis?: () => void;
  colorIndex?: number;
}

export function PostCard({ post, author, liked, saved, onLike, onSave, onDelete, onEdit, onAddToPlan, onCookedThis, colorIndex = 0 }: PostCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = author?.full_name || author?.username || 'Anonymous';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const isOwner = user?.id === post.user_id;

  const hasRecipeData = post.is_recipe &&
    ((post.recipe_ingredients && post.recipe_ingredients.length > 0) ||
     (post.recipe_instructions && post.recipe_instructions.length > 0));

  const handleDoubleClick = () => {
    if (!showHeart) {
      setShowHeart(true);
      if (!liked) onLike?.();
      setTimeout(() => setShowHeart(false), 600);
    }
  };

  const handleCardClick = () => {
    if (hasRecipeData) {
      setShowDetail(true);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        onDoubleClick={handleDoubleClick}
        className="bg-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-card-hover shadow-card border border-border/50 group relative"
      >
        {/* Image */}
        {post.image_url && (
          <div className="relative overflow-hidden">
            <img
              src={post.image_url}
              alt={post.content}
              className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Double-tap heart */}
            {showHeart && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart className="h-16 w-16 text-primary fill-primary animate-like-pop" />
              </div>
            )}
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
            {/* Recipe badge */}
            {post.is_recipe && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary/90 backdrop-blur-sm text-primary-foreground text-[10px] font-bold px-2.5 py-1">
                <ChefHat className="h-3 w-3" /> Recipe
              </span>
            )}
            {/* Hover save/plan buttons */}
            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {onSave && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSave(); }}
                  className={`h-8 w-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${saved ? 'bg-primary text-primary-foreground' : 'bg-black/30 text-white hover:bg-black/50'}`}
                >
                  <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                </button>
              )}
              {hasRecipeData && onCookedThis && (
                <button
                  onClick={(e) => { e.stopPropagation(); onCookedThis(); }}
                  className="h-8 w-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                  title="Cooked This!"
                >
                  <PartyPopper className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="p-3.5">
          {/* Author row */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.user_id}`); }}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent p-[1.5px] shrink-0">
                <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                  {author?.avatar_url ? (
                    <img src={author.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold text-foreground">{displayName}</span>
            </button>
            <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo}</span>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onEdit?.()}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Title */}
          <h3 className="font-display text-sm font-bold text-foreground leading-snug line-clamp-2">
            {post.content}
          </h3>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] text-primary font-medium">#{tag}</span>
              ))}
            </div>
          )}

          {/* Bottom stats */}
          <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-border/50">
            <button
              onClick={(e) => { e.stopPropagation(); onLike?.(); }}
              className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-primary'}`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
              {post.likes_count > 0 && post.likes_count}
            </button>
            {hasRecipeData && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                <Clock className="h-3 w-3" /> Quick view
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen Recipe Detail */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
          {post.image_url && (
            <div className="w-full">
              <img src={post.image_url} alt="" className="w-full object-cover max-h-72 rounded-t-2xl" />
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
                  <p className="text-xs text-muted-foreground">{timeAgo}</p>
                </div>
              </div>
            </DialogHeader>

            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

            {post.recipe_ingredients && post.recipe_ingredients.length > 0 && (
              <div className="rounded-2xl bg-muted/50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Ingredients</h3>
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Steps</h3>
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

            {hasRecipeData && (
              <div className="flex gap-2 pt-2 flex-wrap">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => onAddToPlan?.()}>
                  <CalendarPlus className="h-4 w-4 mr-2" /> Add to Plan
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => onSave?.()}>
                  <Bookmark className={`h-4 w-4 mr-2 ${saved ? 'fill-current' : ''}`} /> Save
                </Button>
                <Button variant="default" className="flex-1 rounded-xl gap-2" onClick={() => onCookedThis?.()}>
                  <PartyPopper className="h-4 w-4" /> Cooked This!
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
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { onDelete?.(); setShowDeleteConfirm(false); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
