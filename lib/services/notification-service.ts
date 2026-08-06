'use client';

import { createClient } from '@/lib/supabase/client';

export type NotificationItem = {
  id: string;
  userId: string;
  type: 'course' | 'lesson' | 'assignment' | 'quiz' | 'certificate' | 'payment' | 'wallet' | 'referral' | 'announcement' | 'system';
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function mapNotification(db: Record<string, unknown>): NotificationItem {
  return {
    id: db.id as string,
    userId: db.user_id as string,
    type: db.type as NotificationItem['type'],
    title: db.title as string,
    message: db.message as string,
    link: (db.link as string) ?? null,
    read: (db.read as boolean) ?? false,
    createdAt: db.created_at as string,
  };
}

export async function getNotifications(userId: string, limit: number = 20): Promise<NotificationItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((d: Record<string, unknown>) => mapNotification(d));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
}

export async function deleteNotification(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('notifications').delete().eq('id', id);
}

export async function createNotification(params: {
  userId: string;
  type: NotificationItem['type'];
  title: string;
  message: string;
  link?: string | null;
}): Promise<void> {
  const supabase = createClient();
  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? null,
  });
}

export async function broadcastNotification(params: {
  type: NotificationItem['type'];
  title: string;
  message: string;
  link?: string | null;
  audience?: 'all' | 'students' | 'instructors';
}): Promise<{ success: boolean; error?: string; count?: number }> {
  const supabase = createClient();

  let query = supabase.from('profiles').select('id');
  if (params.audience === 'students') {
    query = query.eq('role', 'student');
  } else if (params.audience === 'instructors') {
    query = query.in('role', ['instructor', 'admin', 'owner']);
  }

  const { data: users, error: userError } = await query;
  if (userError || !users) return { success: false, error: userError?.message ?? 'Failed to fetch users' };
  if (users.length === 0) return { success: true, count: 0 };

  const rows = users.map((u: Record<string, unknown>) => ({
    user_id: u.id as string,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? null,
  }));

  const { error } = await supabase.from('notifications').insert(rows);
  if (error) return { success: false, error: error.message };
  return { success: true, count: rows.length };
}

export async function sendIndividualNotification(params: {
  userId: string;
  type: NotificationItem['type'];
  title: string;
  message: string;
  link?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
