import { Home, PieChart, Heart, User, Settings } from 'lucide-react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';

const items = [
  { to: '/home', icon: Home },
  { to: '/explore', icon: PieChart },
  { to: '/feed', icon: Heart },
  { to: '/profile', icon: User },
  { to: '/settings', icon: Settings },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden rounded-full bg-card shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)] border border-border/40 safe-area-bottom">
      <div className="flex items-center justify-between h-14 px-2">
        {items.map((item) => {
          const active = pathname === item.to || (item.to === '/home' && pathname === '/');
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={`flex items-center justify-center flex-1 h-12 transition-all ${active ? '' : 'text-muted-foreground'}`}
            >
              {active ? (
                <span className="flex items-center justify-center h-12 w-12 rounded-full bg-foreground text-background shadow-lg">
                  <item.icon className="h-5 w-5" strokeWidth={2} />
                </span>
              ) : (
                <item.icon className="h-5 w-5" strokeWidth={1.8} />
              )}
            </RouterNavLink>
          );
        })}
      </div>
    </nav>
  );
}
