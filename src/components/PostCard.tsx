import { Clock, ChefHat, User, MoreHorizontal, Pencil, Trash2, CalendarPlus, Bookmark, PartyPopper } from 'lucide-react';
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

const CARD_COLORS = [
  'bg-orange-400',
  'bg-rose-500',
  'bg-lime-400',
  'bg-yellow-400',
  'bg-pink-300',
  'bg-teal-400',
  'bg-violet-400',
  'bg-sky-400',
];

const CARD_TEXT_COLORS = [
  'text-orange-950',
  'text-white',
  'text-lime-950',
  'text-yellow-950',
  'text-pink-950',
  'text-teal-950',
  'text-violet-950',
  'text-sky-950',
];

export function PostCard({ post, author, liked, saved, onLike, onSave, onDelete, onEdit, onAddToPlan, onCookedThis, colorIndex = 0 }: PostCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = author?.full_name || 'Anonymous';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const isOwner = user?.id === post.user_id;
  const totalTime = post.is_recipe ? '15 min' : '';

  const hasRecipeData = post.is_recipe &&
    ((post.recipe_ingredients && post.recipe_ingredients.length > 0) ||
     (post.recipe_instructions && post.recipe_instructions.length > 0));

  const bgColor = CARD_COLORS[colorIndex % CARD_COLORS.length];
  const textColor = CARD_TEXT_COLORS[colorIndex % CARD_TEXT_COLORS.length];

  const handleCardClick = () => {
    if (hasRecipeData) {
      setShowDetail(true);
    }
    // Silent like on click
    onLike?.();
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`${bgColor} rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative group`}
      >
        {/* Top row: author & time */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.user_id}`); }}
            className={`text-sm font-semibold ${textColor} hover:opacity-70 transition-opacity`}
          >
            {displayName}
          </button>
          <div className="flex items-center gap-2">
            {totalTime && (
              <span className={`text-xs ${textColor} opacity-80 border border-current/20 rounded-full px-2.5 py-0.5`}>
                <Clock className="h-3 w-3 inline mr-1" />{totalTime}
              </span>
            )}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button onClick={e => e.stopPropagation()} className={`${textColor} opacity-60 hover:opacity-100 transition-opacity`}>
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
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="px-3 pb-2">
            <img
              src={post.image_url}
              alt={post.content}
              className="w-full aspect-square object-cover rounded-2xl"
              loading="lazy"
            />
          </div>
        )}

        {/* Title / content */}
        <div className="px-4 pb-4">
          <h3 className={`font-display text-2xl font-bold ${textColor} leading-tight`}>
            {post.content.length > 60 ? post.content.slice(0, 60) + '...' : post.content}
          </h3>
          {post.is_recipe && (
            <span className={`inline-flex items-center gap-1 mt-2 text-xs font-medium ${textColor} opacity-70`}>
              <ChefHat className="h-3.5 w-3.5" /> Recipe
            </span>
          )}
        </div>

        {/* Hover actions (hidden by default) */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onSave && (
            <button
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className={`h-8 w-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors`}
            >
              <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
            </button>
          )}
          {hasRecipeData && onAddToPlan && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToPlan(); }}
              className="h-8 w-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors"
            >
              <CalendarPlus className="h-4 w-4" />
            </button>
          )}
          {hasRecipeData && onCookedThis && (
            <button
              onClick={(e) => { e.stopPropagation(); onCookedThis(); }}
              className="h-8 w-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors"
              title="Cooked This!"
            >
              <PartyPopper className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Full-screen Recipe Detail */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          {post.image_url && (
            <div className="w-full">
              <img src={post.image_url} alt="" className="w-full object-cover max-h-72 rounded-t-lg" />
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Ingredients
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
            <AlertDialogDescription>This action cannot be undone. The post will be permanently deleted.</AlertDialogDescription>
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
