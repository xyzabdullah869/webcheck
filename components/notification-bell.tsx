'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Clock, BookOpen, Trophy, Megaphone, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationItem,
} from '@/lib/services/notification-service';
import { cn } from '@/lib/utils';

const iconMap: Record<string, typeof Bell> = {
  assignment: BookOpen,
  quiz: Trophy,
  course: BookOpen,
  announcement: Megaphone,
  system: SettingsIcon,
  certificate: Trophy,
  payment: Bell,
  wallet: Bell,
  referral: Bell,
  lesson: BookOpen,
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const loadNotifications = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [notifs, count] = await Promise.all([
      getNotifications(user.id, 8),
      getUnreadCount(user.id),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    if (open) loadNotifications();
  }, [open, loadNotifications]);

  React.useEffect(() => {
    if (user) {
      getUnreadCount(user.id).then(setUnreadCount);
    }
  }, [user]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed right-2 top-16 z-[60] w-80 max-w-[calc(100vw-1rem)] rounded-2xl border bg-card shadow-float"
          >
            <div className="flex items-center justify-between border-b p-3">
              <h3 className="font-display text-sm font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((notif) => {
                    const Icon = iconMap[notif.type] ?? Bell;
                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          'group flex items-start gap-3 p-3 transition-colors hover:bg-muted/40',
                          !notif.read && 'bg-primary/5'
                        )}
                      >
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          notif.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notif.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {formatTimeAgo(notif.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkRead(notif.id)}
                              className="rounded p-1 text-muted-foreground hover:text-primary"
                              aria-label="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notif.id)}
                            className="rounded p-1 text-muted-foreground hover:text-rose-500"
                            aria-label="Delete notification"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
                </div>
              )}
            </div>

            <div className="border-t p-2">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
