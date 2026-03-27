import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { useAuth } from '@/contexts/AuthContext';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex justify-center">
          <div className="flex w-full max-w-[1200px]">
            {/* Mobile header */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center border-b border-border bg-background/80 backdrop-blur-md px-4 h-14 md:hidden">
              <SidebarTrigger />
              <span className="font-display text-lg font-bold text-foreground ml-3">MealCraft</span>
            </div>
            <main className="flex-1 min-h-screen pt-14 md:pt-0">
              {children}
            </main>
            <RightSidebar />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
