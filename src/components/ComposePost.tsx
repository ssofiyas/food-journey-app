import { useState, useRef } from 'react';
import { ImagePlus, X, User, ChefHat, Loader2, Plus } from 'lucide-react';
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
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Kuva liian suuri', description: 'Maks. 5MB', variant: 'destructive' });
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

      // Extract hashtags from content + manual tags
      const hashtagsFromContent = (content.match(/#(\w+)/g) || []).map(t => t.slice(1).toLowerCase());
      const allTags = [...new Set([...tags, ...hashtagsFromContent])];

      const { error } = await supabase.from('posts').insert({
        content: content.trim() || '📸',
        user_id: user.id,
        image_url,
        is_recipe: isRecipe,
        recipe_ingredients: recipeIngredients as any,
        recipe_instructions: recipeInstructions as any,
        tags: allTags as any,
      });
      if (error) throw error;
      setContent('');
      removeImage();
      setIsRecipe(false);
      setIngredients([{ name: '', amount: '', unit: '' }]);
      setInstructions(['']);
      setTags([]);
      setTagInput('');
      setExpanded(false);
      toast({ title: 'Julkaistu!' });
      onPostCreated?.();
    } catch (err: any) {
      toast({ title: 'Virhe', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <div className="border-b border-border px-4 py-3">
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
            <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
          <span className="text-muted-foreground text-sm flex-1">Mitä on tänään ruokana?</span>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Plus className="h-4 w-4 text-primary-foreground" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-border px-4 py-4 animate-fade-in">
      <div className="flex gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
          <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Mitä on tänään ruokana?"
            className="min-h-[70px] resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            maxLength={500}
            autoFocus
          />

          {imagePreview && (
            <div className="relative mt-2 inline-block">
              <img src={imagePreview} alt="" className="max-h-52 rounded-2xl border border-border object-cover" />
              <button onClick={removeImage} className="absolute top-2 right-2 rounded-full bg-foreground/70 p-1 hover:bg-foreground/90 transition-colors">
                <X className="h-3.5 w-3.5 text-background" />
              </button>
            </div>
          )}

          {/* Recipe Toggle */}
          <div className="flex items-center gap-2 mt-3">
            <Switch checked={isRecipe} onCheckedChange={setIsRecipe} id="recipe-toggle" />
            <Label htmlFor="recipe-toggle" className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
              <ChefHat className="h-3.5 w-3.5" /> Tämä on resepti
            </Label>
          </div>

          {/* Tags */}
          <div className="mt-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                  #{tag}
                  <button onClick={() => setTags(tags.filter(t => t !== tag))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                placeholder="#lisää tagi"
                value={tagInput}
                onChange={e => setTagInput(e.target.value.replace(/[^a-zäöåA-ZÄÖÅ0-9]/g, ''))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    const t = tagInput.trim().toLowerCase();
                    if (!tags.includes(t)) setTags([...tags, t]);
                    setTagInput('');
                  }
                }}
                className="h-6 bg-transparent border-0 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-24"
              />
            </div>
          </div>

          {isRecipe && (
            <div className="space-y-3 p-3 rounded-2xl bg-muted/50 border border-border mt-3 animate-fade-in">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Ainekset</p>
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-1.5 mb-1.5">
                    <Input placeholder="Määrä" value={ing.amount} className="w-16 h-8 text-xs rounded-lg" onChange={e => {
                      const u = [...ingredients]; u[i] = { ...ing, amount: e.target.value }; setIngredients(u);
                    }} />
                    <Input placeholder="Yks." value={ing.unit} className="w-16 h-8 text-xs rounded-lg" onChange={e => {
                      const u = [...ingredients]; u[i] = { ...ing, unit: e.target.value }; setIngredients(u);
                    }} />
                    <Input placeholder="Ainesosa" value={ing.name} className="flex-1 h-8 text-xs rounded-lg" onChange={e => {
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
                  + Lisää
                </Button>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Vaiheet</p>
                {instructions.map((step, i) => (
                  <div key={i} className="flex gap-1.5 mb-1.5 items-start">
                    <span className="text-xs text-muted-foreground mt-2 w-4 shrink-0">{i + 1}.</span>
                    <Textarea placeholder={`Vaihe ${i + 1}`} value={step} className="min-h-[36px] text-xs rounded-lg" onChange={e => {
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
                  + Lisää vaihe
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setExpanded(false)}>
                Peruuta
              </Button>
              <Button
                className="rounded-full px-5 h-8 text-sm font-semibold"
                disabled={(!content.trim() && !imageFile) || loading}
                onClick={handlePost}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Julkaise'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
