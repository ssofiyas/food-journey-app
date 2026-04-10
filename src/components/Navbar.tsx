import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChefHat, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass-strong">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <ChefHat className="h-7 w-7 text-primary" />
          <span>MealCraft</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {user ? (
            <>
              <Link to="/recipes" className="font-body text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Recipes
              </Link>
              <Link to="/planner" className="font-body text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Meal Planner
              </Link>
              <Link to="/shopping" className="font-body text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Shopping List
              </Link>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
                  <User className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
              <Button variant="default" onClick={() => navigate('/register')}>Get Started</Button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          {user ? (
            <div className="flex flex-col gap-3">
              <Link to="/recipes" className="font-body text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Recipes</Link>
              <Link to="/planner" className="font-body text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Meal Planner</Link>
              <Link to="/shopping" className="font-body text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Shopping List</Link>
              <Button variant="ghost" className="justify-start" onClick={handleSignOut}>Sign Out</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button variant="ghost" className="justify-start" onClick={() => { navigate('/login'); setMobileOpen(false); }}>Sign In</Button>
              <Button variant="default" onClick={() => { navigate('/register'); setMobileOpen(false); }}>Get Started</Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
