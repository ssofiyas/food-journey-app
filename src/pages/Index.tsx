import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChefHat, ArrowRight, Users, Utensils, CalendarDays } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <ChefHat className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">MealCraft</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/login')}>Sign in</Button>
          <Button variant="default" className="rounded-full" onClick={() => navigate('/register')}>Sign up</Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="font-display text-5xl font-bold leading-tight text-foreground md:text-6xl">
            What's <span className="text-primary">cooking</span> today?
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Share recipes, plan meals, and connect with food lovers.
            Your social kitchen starts here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="hero" size="xl" className="rounded-full" onClick={() => navigate('/register')}>
              Join MealCraft
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> Social feed</span>
            <span className="flex items-center gap-1.5"><Utensils className="h-4 w-4 text-primary" /> Recipe sharing</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" /> Meal planning</span>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MealCraft
      </footer>
    </div>
  );
}
