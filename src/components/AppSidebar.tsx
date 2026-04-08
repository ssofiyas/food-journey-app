import { Home, Search, User, ChefHat, CalendarDays, ListChecks, LogOut, MessageSquare } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const mainNav = [
  { title: 'Home', url: '/feed', icon: Home },
  { title: 'Explore', url: '/explore', icon: Search },
  { title: 'Profile', url: '/profile', icon: User },
];

const toolsNav = [
  { title: 'Recipes', url: '/recipes', icon: ChefHat },
  { title: 'Planner', url: '/planner', icon: CalendarDays },
  { title: 'Shopping', url: '/shopping', icon: ListChecks },
  { title: 'Feedback', url: '/feedback', icon: MessageSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarContent className="pt-5">
        <div className={`flex items-center gap-2.5 px-4 pb-8 ${collapsed ? 'justify-center' : ''}`}>
          <div className="h-10 w-10 rounded-2xl gradient-hero flex items-center justify-center shrink-0 shadow-sm">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-display text-xl font-bold text-foreground tracking-tight">MealCraft</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg">
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-body text-foreground/80 transition-all hover:bg-muted hover:text-foreground"
                      activeClassName="font-semibold bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            {!collapsed && (
              <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tools</p>
            )}
            <SidebarMenu>
              {toolsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg">
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-body text-foreground/80 transition-all hover:bg-muted hover:text-foreground"
                      activeClassName="font-semibold bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {user && (
          <div className={`flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent p-[2px] shrink-0">
              <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
            {!collapsed && (
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
