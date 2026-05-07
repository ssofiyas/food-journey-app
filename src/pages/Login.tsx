import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/recipes');
    } catch (error: any) {
      toast({
        title: 'Error signing in',
        description: error.message || 'Please check your credentials.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Anna sähköpostiosoite', variant: 'destructive' });
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast({ title: 'Virhe', description: error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Tarkista sähköpostisi',
      description: 'Lähetimme sinulle linkin salasanan nollaamiseen.',
    });
    setForgotMode(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ChefHat className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">
            {forgotMode ? 'Unohditko salasanan?' : 'Welcome back'}
          </CardTitle>
          <CardDescription className="font-body">
            {forgotMode
              ? 'Saat linkin salasanan nollaamiseen sähköpostiisi.'
              : 'Sign in to your MealCraft account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forgotMode ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="font-body">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={resetLoading}>
                {resetLoading && <Loader2 className="animate-spin" />}
                Lähetä nollauslinkki
              </Button>
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="flex w-full items-center justify-center gap-1 font-body text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Takaisin kirjautumiseen
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-body">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-body">Password</Label>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="font-body text-xs font-medium text-primary hover:underline"
                  >
                    Unohditko salasanan?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                Sign In
              </Button>
            </form>
          )}
          {!forgotMode && (
            <p className="mt-4 text-center font-body text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
