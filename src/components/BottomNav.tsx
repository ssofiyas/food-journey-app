import { Home, Search, Plus, HeartPulse, GraduationCap } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useNavigate } from 'react-router-dom';


const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/explore', icon: Search, label: 'Explore' },
  { to: '/health-hub', icon: HeartPulse, label: 'Health' },
  { to: '/academy', icon: GraduationCap, label: 'Learn' },
];

export function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className="flex flex-col items-center gap-0.5 px-3 py-2 text-muted-foreground transition-all"
            activeClassName="text-primary nav-glow-primary"
          >
            <item.icon className="h-6 w-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}

        <button
          onClick={() => navigate('/feed', { state: { openCompose: true } })}
          className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95 btn-bounce"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>

        {navItems.slice(2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className="flex flex-col items-center gap-0.5 px-3 py-2 text-muted-foreground transition-all"
            activeClassName="text-accent nav-glow-accent"
          >
            <item.icon className="h-6 w-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
