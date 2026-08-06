'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Send, Loader as Loader2, X, Users, GraduationCap, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';
import { broadcastNotification, sendIndividualNotification } from '@/lib/services/notification-service';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Audience = 'all' | 'students' | 'instructors' | 'individual';
type UserOption = { id: string; full_name: string; email: string; role: string };

const audienceConfig: Record<Audience, { label: string; icon: typeof Users; color: string }> = {
  all: { label: 'All Users', icon: Users, color: 'from-blue-500 to-cyan-500' },
  students: { label: 'Students', icon: GraduationCap, color: 'from-emerald-500 to-teal-500' },
  instructors: { label: 'Instructors & Admins', icon: User, color: 'from-violet-500 to-purple-500' },
  individual: { label: 'Individual User', icon: User, color: 'from-amber-500 to-orange-500' },
};

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [audience, setAudience] = React.useState<Audience>('all');
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [link, setLink] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [users, setUsers] = React.useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [recentSent, setRecentSent] = React.useState<{ title: string; message: string; count: number; date: string }[]>([]);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .order('full_name', { ascending: true });
      setUsers((data ?? []) as UserOption[]);
    })();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      !searchQuery.trim() ||
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Title and message are required', variant: 'destructive' });
      return;
    }

    setSending(true);

    let result: { success: boolean; error?: string; count?: number };

    if (audience === 'individual') {
      if (!selectedUserId) {
        toast({ title: 'Select a user', variant: 'destructive' });
        setSending(false);
        return;
      }
      result = await sendIndividualNotification({
        userId: selectedUserId,
        type: 'announcement',
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || null,
      });
      if (result.success) result.count = 1;
    } else {
      result = await broadcastNotification({
        type: 'announcement',
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || null,
        audience: audience === 'all' ? 'all' : audience === 'students' ? 'students' : 'instructors',
      });
    }

    setSending(false);

    if (result.success) {
      toast({
        title: 'Notification sent',
        description: `Delivered to ${result.count ?? 0} user(s).`,
      });
      setRecentSent((prev) => [
        { title: title.trim(), message: message.trim(), count: result.count ?? 0, date: new Date().toISOString() },
        ...prev.slice(0, 4),
      ]);
      setTitle('');
      setMessage('');
      setLink('');
      setSelectedUserId('');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Send Notifications</h1>
          <p className="mt-1 text-muted-foreground">Send announcements to all users, specific groups, or individual users.</p>
        </div>

        {/* Audience selector */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(audienceConfig) as Audience[]).map((key) => {
            const config = audienceConfig[key];
            const Icon = config.icon;
            const active = audience === key;
            return (
              <button
                key={key}
                onClick={() => setAudience(key)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all',
                  active ? 'border-primary bg-primary/5 shadow-soft' : 'border-border hover:border-primary/40'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white transition-transform',
                  config.color,
                  active && 'scale-110'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{config.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Individual user selector */}
        {audience === 'individual' && (
          <Card className="p-5 shadow-soft">
            <Label>Select User</Label>
            <div className="relative mt-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="mb-3"
              />
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border p-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm transition-colors',
                      selectedUserId === u.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold">
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{u.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                  </button>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No users found</p>
              )}
            </div>
          </Card>
        )}

        {/* Notification form */}
        <Card className="p-6 shadow-soft">
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label>Notification Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Important update"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Your announcement message..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/dashboard or https://..."
              />
              <p className="text-xs text-muted-foreground">Users can click the notification to open this link.</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
              <Megaphone className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Sending to: <span className="font-semibold text-foreground">{audienceConfig[audience].label}</span>
                {audience === 'individual' && selectedUserId && (
                  <span> ({users.find((u) => u.id === selectedUserId)?.email})</span>
                )}
              </p>
            </div>
            <Button type="submit" disabled={sending} size="lg" className="w-full sm:w-auto">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Notification
            </Button>
          </form>
        </Card>

        {/* Recent sent */}
        {recentSent.length > 0 && (
          <Card className="p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Recently Sent</h2>
            <div className="mt-4 space-y-3">
              {recentSent.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <Badge variant="secondary">{item.count} recipient(s)</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
