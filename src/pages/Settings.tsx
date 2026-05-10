import { useState, useEffect } from 'react';
import { ArrowLeft, User, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Locale } from '@/i18n/translations';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { locale, setLocale } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, username, bio, location, website')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            full_name: (data as any).full_name || '',
            username: (data as any).username || '',
            bio: (data as any).bio || '',
            location: (data as any).location || '',
            website: (data as any).website || '',
          });
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          username: form.username || null,
          bio: form.bio,
          location: form.location,
          website: form.website,
        })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Profile updated!' });
      navigate('/profile');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-2xl">
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold text-foreground">Edit Profile</h1>
        <Button variant="hero" className="rounded-full ml-auto" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{form.full_name || 'Your name'}</p>
            <p className="text-sm text-muted-foreground">{form.username ? `@${form.username}` : 'Set a username'}</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="rounded-bento border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-primary" />
            <Label className="font-display font-semibold">Language</Label>
          </div>
          <div className="flex gap-2">
            {([{ value: 'en', label: 'English' }, { value: 'fi', label: 'Suomi' }] as const).map(lang => (
              <button
                key={lang.value}
                onClick={() => setLocale(lang.value as Locale)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  locale === lang.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name">Name</Label>
            <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="your_username" />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell the world about yourself" maxLength={160} />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Helsinki, Finland" />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://yoursite.com" />
          </div>
        </div>
      </div>
    </div>
  );
}
