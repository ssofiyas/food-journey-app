import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and emits a PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Salasana on liian lyhyt', description: 'Vähintään 6 merkkiä.', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Salasanat eivät täsmää', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'Virhe', description: error.message, variant: 'destructive' });
      return;
    }
    setSuccess(true);
    toast({ title: 'Salasana päivitetty', description: 'Voit nyt kirjautua sisään uudella salasanalla.' });
    await supabase.auth.signOut();
    setTimeout(() => navigate('/login'), 1500);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            {success ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <ChefHat className="h-6 w-6 text-primary" />}
          </div>
          <CardTitle className="font-display text-2xl">
            {success ? 'Salasana päivitetty' : 'Aseta uusi salasana'}
          </CardTitle>
          <CardDescription className="font-body">
            {success
              ? 'Sinut ohjataan kirjautumissivulle...'
              : ready
                ? 'Syötä uusi salasana alla.'
                : 'Vahvistetaan nollauslinkkiä...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="font-body">Uusi salasana</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!ready}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="font-body">Vahvista salasana</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={!ready}
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading || !ready}>
                {loading && <Loader2 className="animate-spin" />}
                Päivitä salasana
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
