import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Lock, Play, Clock, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Lecture {
  id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration_minutes: number;
  is_premium: boolean;
  level: string;
  thumbnail_url: string | null;
}

const CATEGORIES = ['all', 'sleep', 'recovery', 'nutrition', 'mindfulness', 'movement', 'womens-health'];

export default function Academy() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    supabase.from('academy_lectures' as any).select('*').order('created_at', { ascending: true }).then(({ data }) => {
      setLectures((data as any[]) || []);
    });
  }, []);

  const filtered = filter === 'all' ? lectures : lectures.filter(l => l.category === filter);

  return (
    <div className="flex-1 max-w-3xl border-r border-border min-h-screen">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-5 py-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Academy</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Learn from experts in sleep, recovery & nutrition</p>
      </div>

      {/* Premium banner */}
      <div className="mx-5 mt-5">
        <Card className="p-4 rounded-3xl bg-gradient-to-br from-pink/15 via-lilac/15 to-primary/15 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl gradient-hero flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold">Unlock Premium</p>
              <p className="text-xs text-muted-foreground">Full access to advanced lectures & protocols</p>
            </div>
            <Button size="sm" className="rounded-full" onClick={() => toast.info('Premium coming soon')}>Upgrade</Button>
          </div>
        </Card>
      </div>

      {/* Categories */}
      <div className="px-5 pt-5 flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-all ${filter === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
          >
            {c.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="p-5 grid sm:grid-cols-2 gap-4">
        {filtered.map(l => (
          <Card key={l.id} className="rounded-3xl overflow-hidden border-border/50 hover:shadow-lg transition-all cursor-pointer group" onClick={() => l.is_premium ? toast.info('Premium lecture — upgrade to watch') : toast.success(`Playing: ${l.title}`)}>
            <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-lilac/20 to-pink/20 flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-background/80 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                {l.is_premium ? <Lock className="h-6 w-6 text-foreground" /> : <Play className="h-6 w-6 text-primary fill-primary" />}
              </div>
              {l.is_premium && (
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full bg-foreground text-background">PREMIUM</span>
              )}
            </div>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-primary font-bold">{l.category.replace('-', ' ')}</p>
              <p className="font-display font-semibold mt-1 leading-tight">{l.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.description}</p>
              <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {l.duration_minutes} min</span>
                <span>•</span>
                <span className="capitalize">{l.level}</span>
                {l.instructor && <><span>•</span><span>{l.instructor}</span></>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
