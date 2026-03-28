import { Home, Search, Bell, Mail, User, ChefHat, CalendarDays, ListChecks, Settings, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  { title: 'Notifications', url: '/notifications', icon: Bell },
  { title: 'Messages', url: '/messages', icon: Mail },
  { title: 'Profile', url: '/profile', icon: User },
];

const toolsNav = [
  { title: 'Recipes', url: '/recipes', icon: ChefHat },
  { title: 'Meal Planner', url: '/planner', icon: CalendarDays },
  { title: 'Shopping List', url: '/shopping', icon: ListChecks },
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
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-4">
        {/* Logo */}
        <div className={`flex items-center gap-2 px-4 pb-4 ${collapsed ? 'justify-center' : ''}`}>
          <ChefHat className="h-8 w-8 text-primary shrink-0" />
          {!collapsed && <span className="font-display text-xl font-bold text-foreground">MealCraft</span>}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg">
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-4 rounded-full px-4 py-3 text-lg font-body text-foreground transition-colors hover:bg-muted"
                      activeClassName="font-semibold text-primary"
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupContent>
            {!collapsed && (
              <p className="px-4 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Tools</p>
            )}
            <SidebarMenu>
              {toolsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg">
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-4 rounded-full px-4 py-3 font-body text-foreground transition-colors hover:bg-muted"
                      activeClassName="font-semibold text-primary"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
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
          <div className={`flex items-center gap-3 rounded-full p-2 transition-colors hover:bg-muted cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
            {!collapsed && (
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="shrink-0">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
