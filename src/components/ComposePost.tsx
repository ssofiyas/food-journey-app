import { useState, useRef } from 'react';
import { ImagePlus, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ComposePostProps {
  onPostCreated?: () => void;
}

export function ComposePost({ onPostCreated }: ComposePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

      const { error } = await supabase.from('posts').insert({
        content: content.trim() || '📸',
        user_id: user.id,
        image_url,
      });
      if (error) throw error;
      setContent('');
      removeImage();
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
