import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AppLayout } from "@/layouts/AppLayout";
import { OnboardingQuiz } from "@/components/OnboardingQuiz";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Settings from "./pages/Settings";
import Recipes from "./pages/Recipes";
import MealPlanner from "./pages/MealPlanner";
import ShoppingList from "./pages/ShoppingList";
import Feedback from "./pages/Feedback";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import HealthHub from "./pages/HealthHub";
import Academy from "./pages/Academy";
import Kitchen from "./pages/Kitchen";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setNeedsOnboarding(false); return; }
    supabase
      .from('user_onboarding' as any)
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setNeedsOnboarding(!(data as any)?.onboarding_completed);
      });
  }, [user]);

  if (needsOnboarding === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (needsOnboarding && user) {
    return <OnboardingQuiz onComplete={() => setNeedsOnboarding(false)} />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <OnboardingGate>
      <AppLayout>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/home" replace /> : <Index />} />
          <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/home" replace /> : <Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/home" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/health-hub" element={user ? <HealthHub /> : <Navigate to="/login" replace />} />
          <Route path="/academy" element={user ? <Academy /> : <Navigate to="/login" replace />} />
          <Route path="/kitchen" element={user ? <Kitchen /> : <Navigate to="/login" replace />} />
          <Route path="/feed" element={user ? <Feed /> : <Navigate to="/login" replace />} />
          <Route path="/explore" element={user ? <Explore /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/profile/:userId" element={user ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" replace />} />
          <Route path="/recipes" element={user ? <Recipes /> : <Navigate to="/login" replace />} />
          <Route path="/planner" element={user ? <MealPlanner /> : <Navigate to="/login" replace />} />
          <Route path="/shopping" element={user ? <ShoppingList /> : <Navigate to="/login" replace />} />
          <Route path="/feedback" element={user ? <Feedback /> : <Navigate to="/login" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/notifications" element={user ? <div className="flex-1 border-r border-border max-w-2xl"><div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3"><h1 className="font-display text-xl font-bold text-foreground">Notifications</h1></div><div className="py-16 text-center"><p className="text-muted-foreground text-sm">No notifications yet</p></div></div> : <Navigate to="/login" replace />} />
          <Route path="/messages" element={user ? <div className="flex-1 border-r border-border max-w-2xl"><div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3"><h1 className="font-display text-xl font-bold text-foreground">Messages</h1></div><div className="py-16 text-center"><p className="text-muted-foreground text-sm">No messages yet</p></div></div> : <Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </OnboardingGate>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
