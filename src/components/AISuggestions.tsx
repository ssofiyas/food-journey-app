import { useState } from 'react';
import { Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  name: string;
  quantity: string;
  category: string;
  confidence: string;
  reason: string;
}

interface AISuggestionsProps {
  onAddItem: (name: string, quantity: string, category: string) => void;
}

const confidenceColor: Record<string, string> = {
  high: 'bg-green-500/15 text-green-700 dark:text-green-400',
  medium: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  low: 'bg-muted text-muted-foreground',
};

export function AISuggestions({ onAddItem }: AISuggestionsProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict-shopping`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to get suggestions');
      }

      const data = await resp.json();
      setSuggestions(data.suggestions || []);
      setSummary(data.summary || data.message || '');
      setDismissed(new Set());
      setHasLoaded(true);
    } catch (err: any) {
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (s: Suggestion) => {
    onAddItem(s.name, s.quantity, s.category);
    setDismissed(prev => new Set(prev).add(s.name));
    toast({ title: `Added ${s.name}` });
  };

  const handleDismiss = (name: string) => {
    setDismissed(prev => new Set(prev).add(name));
  };

  const visible = suggestions.filter(s => !dismissed.has(s.name));

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-display font-semibold text-foreground">AI Shopping Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs rounded-full"
          onClick={fetchSuggestions}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
          {hasLoaded ? 'Refresh' : 'Get Suggestions'}
        </Button>
      </div>

      {summary && (
        <p className="px-4 py-2 text-xs text-muted-foreground border-b border-border">{summary}</p>
      )}

      {visible.length > 0 && (
        <div className="divide-y divide-border">
          {visible.map((s) => (
            <div key={s.name} className="flex items-center gap-3 px-4 py-2.5 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{s.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${confidenceColor[s.confidence] || confidenceColor.low}`}>
                    {s.confidence}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{s.reason}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{s.category}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-primary hover:bg-primary/10"
                onClick={() => handleAdd(s)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <button
                onClick={() => handleDismiss(s.name)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {hasLoaded && visible.length === 0 && !loading && (
        <p className="px-4 py-4 text-xs text-muted-foreground text-center">
          {suggestions.length > 0 ? 'All suggestions added or dismissed!' : 'No predictions yet — keep using your lists and I\'ll learn your patterns!'}
        </p>
      )}
    </div>
  );
}
