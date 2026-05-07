import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, HeartPulse, GraduationCap, CalendarDays, ListChecks,
  Settings as SettingsIcon, MessageSquare, Info, Compass, LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const tiles = [
  { to: '/profile', icon: User, label: 'Profile', desc: 'Posts, followers, bio', tone: 'from-primary/20 to-primary/5' },
  { to: '/health-hub', icon: HeartPulse, label: 'Health', desc: 'Sleep, mood, readiness', tone: 'from-accent/20 to-accent/5' },
  { to: '/academy', icon: GraduationCap, label: 'Academy', desc: 'Lectures & courses', tone: 'from-peach/40 to-peach/10' },
  { to: '/explore', icon: Compass, label: 'Explore', desc: 'Discover recipes & tags', tone: 'from-primary/15 to-accent/10' },
  { to: '/planner', icon: CalendarDays, label: 'Meal Planner', desc: '7-day calendar', tone: 'from-accent/15 to-primary/10' },
  { to: '/shopping', icon: ListChecks, label: 'Shopping', desc: 'Smart lists & AI', tone: 'from-primary/20 to-peach/15' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings', desc: 'Language, account', tone: 'from-muted/60 to-muted/20' },
  { to: '/feedback', icon: MessageSquare, label: 'Feedback', desc: 'Report or suggest', tone: 'from-accent/15 to-peach/10' },
  { to: '/about', icon: Info, label: 'About', desc: 'Our story', tone: 'from-primary/10 to-accent/10' },
];

export default function Tools() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex-1 max-w-2xl mx-auto pb-24 md:pb-6 px-4 pt-4">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">Everything else, in one place.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <Link
              to={tile.to}
              className={`group block h-full rounded-3xl p-4 glass shadow-card hover:shadow-glow-pink transition-all bg-gradient-to-br ${tile.tone}`}
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-card/80 backdrop-blur shadow-sm mb-3 group-hover:scale-105 transition-transform">
                <tile.icon className="h-6 w-6 text-primary" strokeWidth={1.8} />
              </div>
              <div className="font-display font-bold text-base text-foreground">{tile.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{tile.desc}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      {user && (
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full rounded-2xl h-12 gap-2"
            onClick={async () => { await signOut(); navigate('/'); }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      )}
    </div>
  );
}
