import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChefHat, ListChecks, Heart, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-food.jpg';

const features = [
  {
    icon: ChefHat,
    title: 'Manage Recipes',
    description: 'Save, organize, and discover recipes. Search by cuisine, meal type, or ingredients.',
  },
  {
    icon: CalendarDays,
    title: 'Plan Your Week',
    description: 'Drag and drop recipes into a weekly calendar. Plan breakfast, lunch, and dinner.',
  },
  {
    icon: ListChecks,
    title: 'Smart Shopping',
    description: 'Auto-generate shopping lists from your meal plan, grouped by category.',
  },
  {
    icon: Heart,
    title: 'Save Favorites',
    description: 'Bookmark your go-to recipes for quick access whenever you need them.',
  },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto grid min-h-[70vh] items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-sm font-medium text-primary">
              <ChefHat className="h-4 w-4" />
              Your kitchen companion
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Plan meals,<br />
              <span className="text-primary">cook smarter</span>
            </h1>
            <p className="max-w-md font-body text-lg text-muted-foreground">
              Organize your recipes, plan weekly meals, and automatically generate shopping lists. Cooking made simple.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="xl" onClick={() => navigate('/register')}>
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="xl" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          </div>
          <div className="relative animate-slide-in-right" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <div className="overflow-hidden rounded-2xl shadow-hero">
              <img
                src={heroImage}
                alt="Fresh ingredients and prepared meals on a wooden table"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-xl bg-card p-4 shadow-card-hover">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ListChecks className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">Shopping List</p>
                  <p className="font-body text-xs text-muted-foreground">Auto-generated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Everything you need
            </h2>
            <p className="mt-3 font-body text-lg text-muted-foreground">
              From recipe collection to grocery checkout
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group rounded-xl bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 font-body text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Ready to simplify your meals?
          </h2>
          <p className="mx-auto mt-3 max-w-lg font-body text-lg text-muted-foreground">
            Join MealCraft today and take the stress out of meal planning.
          </p>
          <Button variant="hero" size="xl" className="mt-8" onClick={() => navigate('/register')}>
            Start Planning
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-2 font-display text-sm font-semibold text-muted-foreground">
            <ChefHat className="h-4 w-4" />
            MealCraft
          </div>
          <p className="font-body text-xs text-muted-foreground">
            © {new Date().getFullYear()} MealCraft. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
