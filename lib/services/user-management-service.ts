'use client';

import { createClient } from '@/lib/supabase/client';

export async function updateUserRole(
  targetUserId: string,
  newRole: 'student' | 'instructor' | 'admin' | 'owner'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc('update_user_role', {
    target_user_id: targetUserId,
    new_role: newRole,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getAllUsers(): Promise<{
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role, created_at')
    .order('created_at', { ascending: false });
  return (data ?? []) as {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    created_at: string;
  }[];
}
