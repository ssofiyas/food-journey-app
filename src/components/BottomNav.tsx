import { Home, Users, BookOpen, LayoutGrid, Plus } from 'lucide-react';
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
    <nav className="fixed bottom-2 left-2 right-2 z-50 md:hidden glass-strong rounded-[2rem] safe-area-bottom shadow-glass">
      <div className="flex items-center justify-between h-14 px-1.5">
        {leftItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className="flex flex-col items-center gap-0.5 flex-1 min-w-0 py-1.5 text-muted-foreground transition-all"
            activeClassName="text-primary nav-glow-primary"
          >
            <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            <span className="text-[9px] font-semibold tracking-tight leading-none">{item.label}</span>
          </NavLink>
        ))}

        {/* Centered Add Post — hero pill */}
        <NavLink
          to="/feed"
          end
          className="flex flex-col items-center justify-center gap-0.5 -mt-6 mx-0.5 h-14 w-14 shrink-0 rounded-[1.25rem] gradient-primary text-primary-foreground shadow-glow-pink transition-transform hover:scale-105 active:scale-95 btn-bounce"
          activeClassName="ring-4 ring-primary/25"
        >
          <Plus className="h-6 w-6" strokeWidth={2.2} />
          <span className="text-[8px] font-bold tracking-tight leading-none">Post</span>
        </NavLink>

        {rightItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className="flex flex-col items-center gap-0.5 flex-1 min-w-0 py-1.5 text-muted-foreground transition-all"
            activeClassName="text-accent nav-glow-accent"
          >
            <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            <span className="text-[9px] font-semibold tracking-tight leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
