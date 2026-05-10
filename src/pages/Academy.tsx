import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Lock, Play, Clock, GraduationCap, Sparkles, X, BookOpen } from 'lucide-react';
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
  video_url: string | null;
}

function ytEmbed(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

const CATEGORIES = ['all', 'sleep', 'recovery', 'nutrition', 'mindfulness', 'movement', 'womens-health'];

const ARTICLES = [
  { id: 'a1', title: 'Protein 101: How much do you really need?', minutes: 6, category: 'nutrition', body: 'Most active adults thrive on 1.6–2.2 g protein per kg bodyweight. Spread it across 3–4 meals of 25–40 g each. Best sources: eggs, fish, chicken, dairy, legumes, tofu, lean beef. Protein not only repairs muscle but also keeps you full and stabilizes blood sugar.' },
  { id: 'a2', title: 'Glycemic load — beyond carbs vs. no-carbs', minutes: 5, category: 'nutrition', body: 'Glycemic load (GL) considers both how fast a carb spikes blood sugar AND how much carb is in the serving. Pair carbs with protein, fat, and fiber to flatten the curve. Berries, oats, lentils, and sweet potatoes are great low-GL options.' },
  { id: 'a3', title: 'The 3-2-1 sleep stack', minutes: 4, category: 'sleep', body: '3 hours before bed: stop eating. 2 hours before: stop working. 1 hour before: dim lights, no screens. This simple ritual aligns melatonin and cortisol so deep sleep arrives naturally.' },
  { id: 'a4', title: 'Walking after meals: a tiny lever', minutes: 3, category: 'movement', body: 'A 10-minute walk within 30 minutes of eating can lower post-meal glucose spikes by 12–22%. It also aids digestion and improves mood.' },
  { id: 'a5', title: 'Hormonisykli ja harjoittelu (FI)', minutes: 7, category: 'womens-health', body: 'Follikulaarivaiheessa keho sietää kovaa harjoittelua hyvin. Ovulaation jälkeen luteaalivaiheessa syke on korkeampi, lämmönsäätely heikompi — siirry kestävyyteen ja palauttavaan harjoitteluun. Kuukautisten aikana kuuntele kehoa: kevyt liike helpottaa.' },
  { id: 'a6', title: 'Hydration math (it is not just 8 glasses)', minutes: 4, category: 'recovery', body: 'Aim for 30–35 ml per kg bodyweight, plus 500 ml per hour of intense exercise. Add a pinch of salt + lemon for electrolytes — especially in summer or after sauna.' },
  { id: 'a7', title: 'Box breathing for stress', minutes: 3, category: 'mindfulness', body: 'Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 5 cycles. Activates the parasympathetic nervous system and lowers cortisol within 90 seconds.' },
];


export default function Academy() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [filter, setFilter] = useState('all');
  const [playing, setPlaying] = useState<Lecture | null>(null);
  const [reading, setReading] = useState<typeof ARTICLES[0] | null>(null);

  useEffect(() => {
    supabase.from('academy_lectures' as any).select('*').order('created_at', { ascending: true }).then(({ data }) => {
      setLectures((data as any[]) || []);
    });
  }, []);

  const filtered = filter === 'all' ? lectures : lectures.filter(l => l.category === filter);
  const filteredArticles = filter === 'all' ? ARTICLES : ARTICLES.filter(a => a.category === filter);

  return (
    <div className="flex-1 max-w-3xl min-h-screen">
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
        {filtered.map(l => {
          const thumb = l.thumbnail_url;
          return (
            <Card key={l.id} className="rounded-3xl overflow-hidden border-border/50 hover:shadow-lg transition-all cursor-pointer group" onClick={() => l.is_premium ? toast.info('Premium lecture — upgrade to watch') : setPlaying(l)}>
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-lilac/20 to-pink/20 flex items-center justify-center overflow-hidden">
                {thumb && <img src={thumb} alt={l.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
                <div className="relative h-14 w-14 rounded-full bg-background/80 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform z-10">
                  {l.is_premium ? <Lock className="h-6 w-6 text-foreground" /> : <Play className="h-6 w-6 text-primary fill-primary" />}
                </div>
                {l.is_premium && (
                  <span className="absolute top-3 right-3 z-10 text-[10px] font-bold px-2 py-1 rounded-full bg-foreground text-background">PREMIUM</span>
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
          );
        })}
      </div>

      {/* Articles section */}
      {filteredArticles.length > 0 && (
        <div className="px-5 pb-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-accent-foreground" />
            <h2 className="font-display text-lg font-bold">Read & learn</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredArticles.map(a => (
              <Card key={a.id} className="p-4 rounded-3xl cursor-pointer hover:shadow-md transition-all border-border/50" onClick={() => setReading(a)}>
                <p className="text-[10px] uppercase tracking-wider text-accent-foreground font-bold">{a.category.replace('-', ' ')}</p>
                <p className="font-display font-semibold mt-1 leading-snug">{a.title}</p>
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {a.minutes} min read
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Video player modal */}
      {playing && (
        <div className="fixed inset-0 z-50 bg-foreground/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPlaying(null)}>
          <div className="bg-card rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-black">
              {ytEmbed(playing.video_url) ? (
                <iframe src={ytEmbed(playing.video_url)!} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen title={playing.title} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No video</div>
              )}
            </div>
            <div className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-bold leading-tight">{playing.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{playing.instructor} • {playing.duration_minutes} min</p>
              </div>
              <button onClick={() => setPlaying(null)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Article reader modal */}
      {reading && (
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReading(null)}>
          <div className="bg-card rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-accent-foreground font-bold">{reading.category.replace('-', ' ')}</p>
                <h2 className="font-display text-xl font-bold mt-1">{reading.title}</h2>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> {reading.minutes} min read</p>
              </div>
              <button onClick={() => setReading(null)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{reading.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
