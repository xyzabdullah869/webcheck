import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { type UserRole, roleHierarchy } from '@/lib/auth-types';

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const user = await requireAuth();
  if (roleHierarchy[user.role] < roleHierarchy[role]) {
    redirect('/403');
  }
  return user;
}
