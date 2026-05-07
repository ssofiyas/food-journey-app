import { Home, Users, BookOpen, LayoutGrid, ChefHat } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const leftItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/feed', icon: Users, label: 'Feed' },
];

const rightItems = [
  { to: '/recipes', icon: BookOpen, label: 'Recipes' },
  { to: '/tools', icon: LayoutGrid, label: 'Tools' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden glass-strong rounded-[2rem] safe-area-bottom shadow-glass">
      <div className="flex items-center justify-between h-16 px-2">
        {leftItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className="flex flex-col items-center gap-0.5 flex-1 py-2 text-muted-foreground transition-all"
            activeClassName="text-primary nav-glow-primary"
          >
            <item.icon className="h-5 w-5" strokeWidth={1.8} />
            <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
          </NavLink>
        ))}

        {/* Centered Kitchen — hero pill */}
        <NavLink
          to="/kitchen"
          end
          className="flex flex-col items-center justify-center gap-0.5 -mt-7 mx-1 h-16 w-16 rounded-[1.5rem] gradient-primary text-primary-foreground shadow-glow-pink transition-transform hover:scale-105 active:scale-95 btn-bounce"
          activeClassName="ring-4 ring-primary/25"
        >
          <ChefHat className="h-6 w-6" strokeWidth={2} />
          <span className="text-[9px] font-bold tracking-tight">Kitchen</span>
        </NavLink>

        {rightItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className="flex flex-col items-center gap-0.5 flex-1 py-2 text-muted-foreground transition-all"
            activeClassName="text-accent nav-glow-accent"
          >
            <item.icon className="h-5 w-5" strokeWidth={1.8} />
            <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
