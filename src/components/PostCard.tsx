import { Heart, MessageCircle, Bookmark, CalendarPlus, MoreHorizontal, User, ChefHat, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
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
  const [showRecipe, setShowRecipe] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = author?.full_name || 'Anonymous';
  const handle = author?.username ? `@${author.username}` : '@user';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const isOwner = user?.id === post.user_id;

  const hasRecipeData = post.is_recipe &&
    ((post.recipe_ingredients && post.recipe_ingredients.length > 0) ||
     (post.recipe_instructions && post.recipe_instructions.length > 0));

  const handleCardClick = () => {
    if (hasRecipeData) setShowDetail(true);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${post.user_id}`);
  };

  return (
    <>
      <article
        onClick={handleCardClick}
        className="flex gap-3 border-b border-border px-4 py-4 transition-all hover:bg-muted/30 cursor-pointer group"
      >
        <button onClick={handleProfileClick} className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all">
          {author?.avatar_url ? (
            <img src={author.avatar_url} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-primary" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button onClick={handleProfileClick} className="font-semibold text-sm text-foreground truncate hover:underline">{displayName}</button>
            <button onClick={handleProfileClick} className="text-sm text-muted-foreground truncate hover:underline">{handle}</button>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground whitespace-nowrap">{timeAgo}</span>
            {post.is_recipe && (
              <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
                <ChefHat className="h-3 w-3" /> Recipe
              </Badge>
            )}

            {/* Owner three-dot menu */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onEdit?.()}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit Recipe
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <p className="mt-1 text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {post.image_url && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-border transition-transform group-hover:scale-[1.01]">
              <img src={post.image_url} alt="" className="w-full object-cover max-h-96" />
            </div>
          )}

          {/* Recipe Quick View toggle */}
          {hasRecipeData && (
            <div className="mt-3">
              <button
                onClick={(e) => { e.stopPropagation(); setShowRecipe(!showRecipe); }}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                {showRecipe ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showRecipe ? 'Hide recipe' : 'Quick view'}
              </button>

              {showRecipe && (
                <div className="mt-2 p-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-border space-y-3">
                  {post.recipe_ingredients && post.recipe_ingredients.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ingredients</p>
                      <ul className="space-y-0.5">
                        {post.recipe_ingredients.map((ing, i) => (
                          <li key={i} className="text-xs text-foreground">
                            <span className="text-primary font-medium">{ing.amount} {ing.unit}</span> {ing.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {post.recipe_instructions && post.recipe_instructions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Steps</p>
                      <ol className="space-y-1">
                        {post.recipe_instructions.map((step, i) => (
                          <li key={i} className="text-xs text-foreground flex gap-2">
                            <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-1 -ml-2">
            <button
              onClick={(e) => { e.stopPropagation(); onLike?.(); }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:text-destructive hover:bg-destructive/10 ${liked ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              {post.likes_count > 0 && <span className="text-xs">{post.likes_count}</span>}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10"
            >
              <MessageCircle className="h-4 w-4" />
              {post.comments_count > 0 && <span className="text-xs">{post.comments_count}</span>}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSave?.(); }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:text-primary hover:bg-primary/10 ${saved ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
            </button>
            {post.is_recipe && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToPlan?.(); }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-accent hover:bg-accent/10"
              >
                <CalendarPlus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Full-screen Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" /> Recipe Detail
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {author?.avatar_url ? (
                  <img src={author.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{handle} · {timeAgo}</p>
              </div>
            </div>

            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

            {post.image_url && (
              <div className="rounded-2xl overflow-hidden border border-border">
                <img src={post.image_url} alt="" className="w-full object-cover" />
              </div>
            )}

            {post.recipe_ingredients && post.recipe_ingredients.length > 0 && (
              <div>
                <h3 className="text-sm font-display font-bold text-foreground mb-2">Ingredients</h3>
                <ul className="space-y-1.5">
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
                <h3 className="text-sm font-display font-bold text-foreground mb-2">Instructions</h3>
                <ol className="space-y-3">
                  {post.recipe_instructions.map((step, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-3">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{i + 1}</span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The post will be permanently removed.</AlertDialogDescription>
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
