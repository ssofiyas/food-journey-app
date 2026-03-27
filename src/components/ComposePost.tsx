import { useState } from 'react';
import { ImagePlus, User } from 'lucide-react';
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

  if (!user) return null;

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('posts').insert({
        content: content.trim(),
        user_id: user.id,
      });
      if (error) throw error;
      setContent('');
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
        <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary">
              <ImagePlus className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="hero"
            className="rounded-full px-6"
            disabled={!content.trim() || loading}
            onClick={handlePost}
          >
            {loading ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  );
}
