import { useState } from 'react';
import { Camera, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NutritionData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  confidence: string;
  meal_name?: string;
  ingredients?: { name: string; amount: string; calories: number; protein: number; fat: number; carbs: number }[];
}

interface PlateAnalyzerProps {
  onResult: (data: NutritionData) => void;
  compact?: boolean;
}

export function PlateAnalyzer({ onResult, compact = false }: PlateAnalyzerProps) {
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const analyze = async () => {
    if (!description.trim() && !imageFile) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      let image_url: string | undefined;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `plate-analysis/${session.user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('images').upload(path, imageFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-plate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ image_url, description: description.trim() || undefined }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await resp.json();
      onResult(data);
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      toast({ title: `Analyzed: ${data.meal_name || 'Meal'}`, description: `${data.total_calories || data.calories} kcal estimated` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? 'flex items-center gap-2' : 'space-y-3'}>
      <div className={compact ? 'flex-1 flex gap-2' : 'flex gap-2'}>
        <Input
          placeholder="Describe your meal or snap a photo..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          className={compact ? 'h-8 text-xs rounded-full' : 'rounded-full'}
        />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="plate-camera"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className={compact ? 'h-8 w-8 shrink-0' : 'shrink-0'}
          onClick={() => document.getElementById('plate-camera')?.click()}
        >
          <Camera className="h-4 w-4 text-primary" />
        </Button>
      </div>
      {imagePreview && (
        <img src={imagePreview} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
      )}
      <Button
        variant="hero"
        size={compact ? 'sm' : 'default'}
        className="rounded-full gap-1.5"
        onClick={analyze}
        disabled={loading || (!description.trim() && !imageFile)}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        Analyze
      </Button>
    </div>
  );
}
