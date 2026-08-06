'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Bell, CircleCheck as CheckCircle2, Clock, BookOpen, Trophy, Megaphone, Trash2, Loader as Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

const iconMap: Record<string, typeof Bell> = {
  assignment: BookOpen,
  quiz: Trophy,
  course: BookOpen,
  announcement: Megaphone,
  system: Bell,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadNotifications = React.useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, message, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user?.id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').delete().eq('id', id).eq('user_id', user?.id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Notifications</h1>
            <p className="mt-1 text-muted-foreground">Stay updated on your courses, quizzes, and announcements.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n, i) => {
              const Icon = iconMap[n.type] ?? Bell;
              return (
                <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className={cn('flex items-start gap-4 p-4 shadow-soft transition-colors', !n.read && 'border-primary/30 bg-primary/5')}>
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', n.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{n.title}</p>
                        {!n.read && <Badge className="h-1.5 w-1.5 rounded-full bg-primary p-0" />}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!n.read && (
                        <Button size="sm" variant="ghost" onClick={() => markAsRead(n.id)} aria-label="Mark as read">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => deleteNotification(n.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 shadow-soft">
            <EmptyState icon={<Bell className="h-7 w-7" />} title="No notifications" description="You're all caught up! New notifications will appear here." />
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
