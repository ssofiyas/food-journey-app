import { useState, useRef } from 'react';
import { ImagePlus, X, User, ChefHat, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ComposePostProps {
  onPostCreated?: () => void;
}

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export function ComposePost({ onPostCreated }: ComposePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecipe, setIsRecipe] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '', unit: '' }]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePost = async () => {
    if (!content.trim() && !imageFile) return;
    setLoading(true);
    try {
      let image_url: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const recipeIngredients = isRecipe ? ingredients.filter(i => i.name.trim()) : [];
      const recipeInstructions = isRecipe ? instructions.filter(i => i.trim()) : [];

      const { error } = await supabase.from('posts').insert({
        content: content.trim() || '📸',
        user_id: user.id,
        image_url,
        is_recipe: isRecipe,
        recipe_ingredients: recipeIngredients as any,
        recipe_instructions: recipeInstructions as any,
      });
      if (error) throw error;
      setContent('');
      removeImage();
      setIsRecipe(false);
      setIngredients([{ name: '', amount: '', unit: '' }]);
      setInstructions(['']);
      toast({ title: 'Posted!' });
      onPostCreated?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3 border-b border-border px-4 py-4">
      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's cooking?"
          className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          maxLength={500}
        />

        {imagePreview && (
          <div className="relative mt-2 inline-block">
            <img src={imagePreview} alt="" className="max-h-64 rounded-2xl border border-border object-cover" />
            <button onClick={removeImage} className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background transition-colors">
              <X className="h-4 w-4 text-foreground" />
            </button>
          </div>
        )}

        {/* Recipe Toggle */}
        <div className="flex items-center gap-2 mt-3 py-2">
          <Switch checked={isRecipe} onCheckedChange={setIsRecipe} id="recipe-toggle" />
          <Label htmlFor="recipe-toggle" className="text-sm text-muted-foreground flex items-center gap-1.5 cursor-pointer">
            <ChefHat className="h-4 w-4" /> This is a Recipe
          </Label>
        </div>

        {isRecipe && (
          <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border mt-1">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ingredients</p>
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-1.5 mb-1.5">
                  <Input placeholder="Amt" value={ing.amount} className="w-16 h-8 text-xs" onChange={e => {
                    const u = [...ingredients]; u[i] = { ...ing, amount: e.target.value }; setIngredients(u);
                  }} />
                  <Input placeholder="Unit" value={ing.unit} className="w-16 h-8 text-xs" onChange={e => {
                    const u = [...ingredients]; u[i] = { ...ing, unit: e.target.value }; setIngredients(u);
                  }} />
                  <Input placeholder="Ingredient" value={ing.name} className="flex-1 h-8 text-xs" onChange={e => {
                    const u = [...ingredients]; u[i] = { ...ing, name: e.target.value }; setIngredients(u);
                  }} />
                  {ingredients.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => setIngredients([...ingredients, { name: '', amount: '', unit: '' }])}>
                + Add
              </Button>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Steps</p>
              {instructions.map((step, i) => (
                <div key={i} className="flex gap-1.5 mb-1.5 items-start">
                  <span className="text-xs text-muted-foreground mt-2 w-4 shrink-0">{i + 1}.</span>
                  <Textarea placeholder={`Step ${i + 1}`} value={step} className="min-h-[40px] text-xs" onChange={e => {
                    const u = [...instructions]; u[i] = e.target.value; setInstructions(u);
                  }} />
                  {instructions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setInstructions(instructions.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => setInstructions([...instructions, ''])}>
                + Add step
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
          <div className="flex items-center gap-1">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="hero"
            className="rounded-full px-6"
            disabled={(!content.trim() && !imageFile) || loading}
            onClick={handlePost}
          >
            {loading ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  );
}
