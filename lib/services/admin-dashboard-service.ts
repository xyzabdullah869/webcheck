'use client';

import { createClient } from '@/lib/supabase/client';

export type AdminStats = {
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  activeUsers: number;
  totalInstructors: number;
  pendingReferrals: number;
  totalReferralRewards: number;
  totalWalletBalance: number;
};

export type AdminRecentRegistration = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

export type AdminCategoryDistribution = {
  name: string;
  count: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createClient();

  const [students, courses, instructors, referrals, rewards, wallets, enrollments] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'Published'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'instructor'),
    supabase.from('referral_rewards').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('referral_rewards').select('reward_amount').eq('status', 'credited'),
    supabase.from('wallets').select('balance'),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }),
  ]);

  const totalRewards = (rewards.data ?? []).reduce((sum: number, r: Record<string, unknown>) => sum + (r.reward_amount as number), 0);
  const totalWalletBalance = (wallets.data ?? []).reduce((sum: number, w: Record<string, unknown>) => sum + (w.balance as number), 0);

  return {
    totalStudents: students.count ?? 0,
    totalCourses: courses.count ?? 0,
    totalRevenue: totalRewards,
    activeUsers: (students.count ?? 0) + (instructors.count ?? 0),
    totalInstructors: instructors.count ?? 0,
    pendingReferrals: referrals.count ?? 0,
    totalReferralRewards: totalRewards,
    totalWalletBalance,
  };
}

export async function getRecentRegistrations(limit = 5): Promise<AdminRecentRegistration[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((p) => ({
    id: p.id as string,
    full_name: (p.full_name as string) ?? 'Unknown',
    email: (p.email as string) ?? '',
    role: (p.role as string) ?? 'student',
    created_at: (p.created_at as string) ?? '',
  }));
}

export async function getCategoryDistribution(): Promise<AdminCategoryDistribution[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('courses')
    .select('category_id')
    .eq('status', 'Published');

  if (error || !data) return [];

  const countMap = new Map<string, number>();
  for (const row of data as Record<string, unknown>[]) {
    const catId = row.category_id as string;
    countMap.set(catId, (countMap.get(catId) ?? 0) + 1);
  }

  const categoryIds = Array.from(countMap.keys());
  if (categoryIds.length === 0) return [];

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .in('id', categoryIds);

  return (categories ?? []).map((c: Record<string, unknown>) => ({
    name: c.name as string,
    count: countMap.get(c.id as string) ?? 0,
  }));
}
