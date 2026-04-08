import { useState, useEffect } from 'react';
import { MessageSquare, Bug, Flag, Send, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type FeedbackType = 'bug' | 'suggestion' | 'report';

const typeConfig = {
  bug: { icon: Bug, label: 'Bug Report', color: 'text-destructive' },
  suggestion: { icon: MessageSquare, label: 'Suggestion', color: 'text-primary' },
  report: { icon: Flag, label: 'Report Content', color: 'text-accent' },
};

interface FeedbackItem {
  id: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function Feedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<FeedbackItem[]>([]);
  const [showForm, setShowForm] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setHistory(data as any);
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const handleSubmit = async () => {
    if (!user || !subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        type,
        subject: subject.trim(),
        message: message.trim(),
      } as any);
      if (error) throw error;
      toast({ title: 'Feedback sent!', description: 'Thank you for helping us improve.' });
      setSubject('');
      setMessage('');
      fetchHistory();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 border-r border-border max-w-2xl">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <h1 className="font-display text-xl font-bold text-foreground">Feedback</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Report bugs, suggest features, or flag content</p>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Type selector */}
        <div className="flex gap-2">
          {(Object.keys(typeConfig) as FeedbackType[]).map(t => {
            const cfg = typeConfig[t];
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all border ${
                  type === t
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                }`}
              >
                <cfg.icon className="h-4 w-4" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <div className="space-y-3">
          <Input
            placeholder="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="rounded-xl"
          />
          <Textarea
            placeholder={
              type === 'bug' ? 'Describe the bug and steps to reproduce...'
                : type === 'report' ? 'Describe what content is inappropriate and why...'
                : 'Share your idea or suggestion...'
            }
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="rounded-xl min-h-[120px]"
          />
          <Button
            className="w-full rounded-xl gap-2"
            onClick={handleSubmit}
            disabled={!subject.trim() || !message.trim() || sending}
          >
            <Send className="h-4 w-4" />
            {sending ? 'Sending...' : 'Submit Feedback'}
          </Button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Your Submissions</h2>
            <div className="space-y-2">
              {history.map(item => {
                const cfg = typeConfig[item.type as FeedbackType] || typeConfig.suggestion;
                return (
                  <div key={item.id} className="rounded-xl border border-border p-3 bg-card">
                    <div className="flex items-center gap-2 mb-1">
                      <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      <span className="text-sm font-medium text-foreground flex-1 truncate">{item.subject}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        item.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.status === 'resolved' ? <CheckCircle className="h-3 w-3 inline mr-0.5" /> : <Clock className="h-3 w-3 inline mr-0.5" />}
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.message}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
