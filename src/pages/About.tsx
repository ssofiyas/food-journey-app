import { useEffect, useRef, useState } from 'react';
import { ChefHat, Sparkles, Camera, ShoppingCart, Calendar, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: Sparkles,
    title: 'AI Fridge Raid',
    description: 'Tell us what\'s in your fridge — our AI creates a recipe instantly.',
    span: 'col-span-2',
    gradient: 'from-primary/10 to-accent/5',
  },
  {
    icon: Camera,
    title: 'Plate Scanner',
    description: 'Snap a photo, get instant calorie & macro estimates.',
    span: 'col-span-1',
    gradient: 'from-accent/10 to-primary/5',
  },
  {
    icon: Calendar,
    title: 'Meal Planner',
    description: 'Drag recipes into your weekly calendar. Stay on track effortlessly.',
    span: 'col-span-1',
    gradient: 'from-primary/5 to-accent/10',
  },
  {
    icon: ShoppingCart,
    title: 'Smart Shopping',
    description: 'Auto-generate shopping lists from your meal plan. Sorted by aisle.',
    span: 'col-span-2',
    gradient: 'from-accent/5 to-primary/10',
  },
  {
    icon: Users,
    title: '10k+ Recipes',
    description: 'A growing community sharing their best creations every day.',
    span: 'col-span-1',
    gradient: 'from-primary/10 to-primary/5',
  },
  {
    icon: ChefHat,
    title: 'Video Recipes',
    description: 'Watch and share TikTok-style cooking videos in the Explore feed.',
    span: 'col-span-2',
    gradient: 'from-accent/10 to-accent/5',
  },
];

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

function FadeSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 pb-24">
      {/* Hero */}
      <section className="min-h-[60vh] flex flex-col items-center justify-center text-center py-20">
        <FadeSection>
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 mb-8">
            <ChefHat className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground tracking-wide">MealCraft — Since 2026</span>
          </div>
        </FadeSection>
        <FadeSection delay={150}>
          <h1 className="font-editorial text-5xl sm:text-7xl font-black text-foreground leading-[0.95] tracking-tight max-w-3xl">
            The Future<br />of Food
          </h1>
        </FadeSection>
        <FadeSection delay={300}>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed font-body">
            Plan meals, discover recipes, scan nutrition — all powered by AI.
            Built for people who love food and want to eat smarter.
          </p>
        </FadeSection>
        <FadeSection delay={450}>
          <div className="mt-10 flex gap-3">
            <Button
              size="lg"
              className="rounded-full px-8 btn-bounce shadow-glow"
              onClick={() => navigate('/register')}
            >
              Get Started <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 glass btn-bounce"
              onClick={() => navigate('/explore')}
            >
              Explore
            </Button>
          </div>
        </FadeSection>
      </section>

      {/* Bento Grid */}
      <section className="py-16">
        <FadeSection>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground text-center mb-12 tracking-tight">
            Everything you need
          </h2>
        </FadeSection>
        <div className="grid grid-cols-3 gap-4">
          {features.map((feat, i) => (
            <FadeSection key={feat.title} delay={i * 100} className={feat.span}>
              <div className={`rounded-bento bg-gradient-to-br ${feat.gradient} border border-border/50 p-6 sm:p-8 h-full flex flex-col gap-4 group hover:shadow-card-hover hover:scale-[1.01] transition-all duration-300`}>
                <div className="h-11 w-11 rounded-2xl glass flex items-center justify-center">
                  <feat.icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* Story section */}
      <section className="py-20">
        <FadeSection>
          <div className="glass-strong rounded-bento p-10 sm:p-16 text-center">
            <h2 className="font-editorial text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
              Food is personal.
              <br />
              <span className="text-primary">Your app should be too.</span>
            </h2>
            <p className="mt-6 text-muted-foreground max-w-lg mx-auto leading-relaxed">
              MealCraft learns what you love, adapts to your pantry, and helps you cook with confidence. 
              No more guessing, no more waste.
            </p>
            <Button
              size="lg"
              className="mt-8 rounded-full px-10 btn-bounce shadow-glow"
              onClick={() => navigate('/register')}
            >
              Join the community
            </Button>
          </div>
        </FadeSection>
      </section>
    </div>
  );
}
