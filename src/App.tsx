import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
    <AppLayout>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/feed" replace /> : <Index />} />
        <Route path="/login" element={user ? <Navigate to="/feed" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/feed" replace /> : <Register />} />
        <Route path="/feed" element={user ? <Feed /> : <Navigate to="/login" replace />} />
        <Route path="/explore" element={user ? <Explore /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
        <Route path="/profile/:userId" element={user ? <Profile /> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" replace />} />
        <Route path="/notifications" element={user ? <div className="flex-1 border-r border-border max-w-2xl"><div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3"><h1 className="font-display text-xl font-bold text-foreground">Notifications</h1></div><div className="py-16 text-center"><p className="text-muted-foreground text-sm">No notifications yet</p></div></div> : <Navigate to="/login" replace />} />
        <Route path="/messages" element={user ? <div className="flex-1 border-r border-border max-w-2xl"><div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3"><h1 className="font-display text-xl font-bold text-foreground">Messages</h1></div><div className="py-16 text-center"><p className="text-muted-foreground text-sm">No messages yet</p></div></div> : <Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
