import { useEffect, useRef, useState } from 'react';
import { ChefHat, Sparkles, Camera, ShoppingCart, Calendar, Users, ArrowRight, Leaf, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: Sparkles,
    title: 'AI Fridge Raid',
    description: 'Tell us what\'s in your fridge — our AI creates a recipe instantly.',
    span: 'col-span-2',
    gradient: 'from-lime/20 to-lime/5',
    borderColor: 'border-lime/20',
  },
  {
    icon: Camera,
    title: 'Plate Scanner',
    description: 'Snap a photo, get instant calorie & macro estimates.',
    span: 'col-span-1',
    gradient: 'from-lilac/20 to-lilac/5',
    borderColor: 'border-lilac/20',
  },
  {
    icon: Calendar,
    title: 'Meal Planner',
    description: 'Drag recipes into your weekly calendar. Stay on track effortlessly.',
    span: 'col-span-1',
    gradient: 'from-pink/20 to-pink/5',
    borderColor: 'border-pink/20',
  },
  {
    icon: ShoppingCart,
    title: 'Smart Shopping',
    description: 'Auto-generate shopping lists from your meal plan. Sorted by aisle.',
    span: 'col-span-2',
    gradient: 'from-lilac/10 to-pink/10',
    borderColor: 'border-lilac/15',
  },
  {
    icon: Users,
    title: '10k+ Recipes',
    description: 'A growing community sharing their best creations every day.',
    span: 'col-span-1',
    gradient: 'from-lime/10 to-lilac/10',
    borderColor: 'border-lime/15',
  },
  {
    icon: ChefHat,
    title: 'Video Recipes',
    description: 'Watch and share TikTok-style cooking videos in the Explore feed.',
    span: 'col-span-2',
    gradient: 'from-pink/15 to-lime/10',
    borderColor: 'border-pink/15',
  },
];

const whyCards = [
  {
    icon: Leaf,
    title: 'Reduce Waste',
    description: 'Use what you have. Our AI creates recipes from your fridge contents — less food goes in the bin.',
    gradient: 'from-lime/25 to-lime/5',
    borderColor: 'border-lime/20',
  },
  {
    icon: Heart,
    title: 'Eat Better',
    description: 'Track nutrition effortlessly with AI-powered plate scanning. Know exactly what you\'re eating.',
    gradient: 'from-pink/25 to-pink/5',
    borderColor: 'border-pink/20',
  },
  {
    icon: Clock,
    title: 'Save Time',
    description: 'Plan your week in minutes with smart meal planning and auto-generated shopping lists.',
    gradient: 'from-lilac/25 to-lilac/5',
    borderColor: 'border-lilac/20',
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
          <div className="inline-flex items-center gap-2 rounded-full bg-lime/15 border border-lime/20 px-4 py-2 mb-8">
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

      {/* Why MealCraft */}
      <section className="py-16">
        <FadeSection>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground text-center mb-4 tracking-tight">
            Why MealCraft?
          </h2>
          <p className="text-center text-muted-foreground max-w-lg mx-auto mb-12">
            Three problems we solve every day
          </p>
        </FadeSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {whyCards.map((card, i) => (
            <FadeSection key={card.title} delay={i * 120}>
              <div className={`rounded-bento bg-gradient-to-br ${card.gradient} border ${card.borderColor} p-8 h-full flex flex-col items-center text-center gap-4 hover:shadow-card-hover hover:scale-[1.01] transition-all duration-300`}>
                <div className="h-14 w-14 rounded-2xl bg-card/80 border border-border/50 flex items-center justify-center">
                  <card.icon className="h-6 w-6 text-primary" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              </div>
            </FadeSection>
          ))}
        </div>
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
              <div className={`rounded-bento bg-gradient-to-br ${feat.gradient} border ${feat.borderColor} p-6 sm:p-8 h-full flex flex-col gap-4 group hover:shadow-card-hover hover:scale-[1.01] transition-all duration-300`}>
                <div className="h-11 w-11 rounded-2xl bg-card/80 border border-border/50 flex items-center justify-center">
                  <feat.icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <FadeSection>
          <div className="rounded-bento bg-gradient-to-br from-lime/15 via-lilac/10 to-pink/15 border border-border/50 p-10 sm:p-16 text-center">
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
