'use client';

import { createClient } from '@/lib/supabase/client';
import type {
  DbReferralCode,
  DbReferralHistory,
  DbReferralReward,
  DbReferralSettings,
  DbWallet,
  DbTransaction,
} from '@/lib/database-types';

type ProfileRef = { id: string; email: string; full_name: string };

// ============================================================
// REFERRAL SERVICE
// ============================================================

export type ReferralStats = {
  code: string;
  link: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  walletBalance: number;
};

export type ReferralHistoryItem = {
  id: string;
  referredName: string;
  referredEmail: string;
  codeUsed: string;
  status: 'pending' | 'approved' | 'rejected' | 'credited';
  rewardAmount: number;
  date: string;
};

export async function getReferralCode(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return (data as DbReferralCode).code;
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const supabase = createClient();

  const [codeResult, historyResult, rewardsResult, walletResult] = await Promise.all([
    supabase.from('referral_codes').select('code').eq('user_id', userId).maybeSingle(),
    supabase.from('referral_history').select('id, referred_id, code_used, created_at').eq('referrer_id', userId).order('created_at', { ascending: false }),
    supabase.from('referral_rewards').select('id, status, reward_amount').eq('referrer_id', userId),
    supabase.from('wallets').select('balance').eq('user_id', userId).maybeSingle(),
  ]);

  const code = (codeResult.data as DbReferralCode | null)?.code ?? '';
  const history = (historyResult.data as DbReferralHistory[]) ?? [];
  const rewards = (rewardsResult.data as DbReferralReward[]) ?? [];
  const walletBalance = (walletResult.data as DbWallet | null)?.balance ?? 0;

  const totalReferrals = history.length;
  const successfulReferrals = rewards.filter((r) => r.status === 'credited').length;
  const pendingReferrals = rewards.filter((r) => r.status === 'pending' || r.status === 'approved').length;
  const totalRewards = rewards
    .filter((r) => r.status === 'credited')
    .reduce((sum, r) => sum + Number(r.reward_amount), 0);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bioinformaticshub.com';
  const link = code ? `${origin}/register?ref=${code}` : '';

  return {
    code,
    link,
    totalReferrals,
    successfulReferrals,
    pendingReferrals,
    totalRewards,
    walletBalance: Number(walletBalance),
  };
}

export async function getReferralHistory(userId: string): Promise<ReferralHistoryItem[]> {
  const supabase = createClient();

  const { data: history, error } = await supabase
    .from('referral_history')
    .select('id, referred_id, code_used, created_at')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  if (error || !history) return [];

  const referredIds = (history as DbReferralHistory[]).map((h) => h.referred_id);
  if (referredIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', referredIds);

  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select('id, referral_history_id, status, reward_amount')
    .eq('referrer_id', userId);

  const profileMap = new Map<string, ProfileRef>(
    (profiles as ProfileRef[] ?? []).map((p) => [p.id, p])
  );
  const rewardMap = new Map<string, DbReferralReward>(
    (rewards as DbReferralReward[] ?? []).map((r) => [r.referral_history_id, r])
  );

  return (history as DbReferralHistory[]).map((h) => {
    const profile = profileMap.get(h.referred_id);
    const reward = rewardMap.get(h.id);
    return {
      id: h.id,
      referredName: profile?.full_name ?? 'Unknown',
      referredEmail: profile?.email ?? '',
      codeUsed: h.code_used,
      status: reward?.status ?? 'pending',
      rewardAmount: reward ? Number(reward.reward_amount) : 0,
      date: h.created_at,
    };
  });
}

export async function getReferralSettings(): Promise<DbReferralSettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('referral_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as DbReferralSettings;
}

export async function trackReferralSignup(
  referrerCode: string,
  referredUserId: string
): Promise<boolean> {
  const supabase = createClient();

  const { data: codeRecord } = await supabase
    .from('referral_codes')
    .select('user_id, code')
    .eq('code', referrerCode)
    .maybeSingle();

  if (!codeRecord) return false;

  const referrerId = (codeRecord as DbReferralCode).user_id;
  if (referrerId === referredUserId) return false;

  const { data: existing } = await supabase
    .from('referral_history')
    .select('id')
    .eq('referred_id', referredUserId)
    .maybeSingle();

  if (existing) return false;

  const { error: historyError } = await supabase.from('referral_history').insert({
    referrer_id: referrerId,
    referred_id: referredUserId,
    code_used: referrerCode,
  });

  if (historyError) {
    console.error('Failed to track referral:', historyError.message);
    return false;
  }

  const settings = await getReferralSettings();
  const rewardAmount = settings?.reward_amount ?? 5;

  const { data: historyRecord } = await supabase
    .from('referral_history')
    .select('id')
    .eq('referred_id', referredUserId)
    .maybeSingle();

  if (historyRecord) {
    await supabase.from('referral_rewards').insert({
      referral_history_id: (historyRecord as DbReferralHistory).id,
      referrer_id: referrerId,
      referred_id: referredUserId,
      reward_amount: rewardAmount,
      status: 'pending',
    });
  }

  return true;
}

// ============================================================
// ADMIN REFERRAL SERVICE
// ============================================================

export type AdminReferralItem = {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  referredEmail: string;
  codeUsed: string;
  rewardAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'credited';
  date: string;
};

export async function adminGetAllReferrals(): Promise<AdminReferralItem[]> {
  const supabase = createClient();

  const { data: rewards, error } = await supabase
    .from('referral_rewards')
    .select('id, referrer_id, referred_id, reward_amount, status, created_at')
    .order('created_at', { ascending: false });

  if (error || !rewards) return [];

  const allUserIds = new Set<string>();
  (rewards as DbReferralReward[]).forEach((r) => {
    allUserIds.add(r.referrer_id);
    allUserIds.add(r.referred_id);
  });

  if (allUserIds.size === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', Array.from(allUserIds));

  const profileMap = new Map<string, ProfileRef>(
    (profiles as ProfileRef[] ?? []).map((p) => [p.id, p])
  );

  return (rewards as DbReferralReward[]).map((r) => {
    const referrer = profileMap.get(r.referrer_id);
    const referred = profileMap.get(r.referred_id);
    return {
      id: r.id,
      referrerName: referrer?.full_name ?? 'Unknown',
      referrerEmail: referrer?.email ?? '',
      referredName: referred?.full_name ?? 'Unknown',
      referredEmail: referred?.email ?? '',
      codeUsed: '',
      rewardAmount: Number(r.reward_amount),
      status: r.status,
      date: r.created_at,
    };
  });
}

export async function adminUpdateReferralStatus(
  rewardId: string,
  status: 'approved' | 'rejected'
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('referral_rewards')
    .update({ status })
    .eq('id', rewardId);
  return !error;
}

export async function adminCreditReferralReward(rewardId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('admin_credit_referral_reward', {
    reward_id: rewardId,
  });
  if (error) {
    console.error('Failed to credit referral reward:', error.message);
    return false;
  }
  return !!data;
}

export async function adminUpdateReferralSettings(
  rewardAmount: number,
  minCourses: number,
  isActive: boolean,
  membershipFee?: number,
  membershipReferralReward?: number,
  courseReferralCommissionPercent?: number,
  membershipEnabled?: boolean
): Promise<boolean> {
  const supabase = createClient();
  const { data: existing } = await supabase.from('referral_settings').select('id').limit(1).maybeSingle();

  const updateData: Record<string, unknown> = {
    reward_amount: rewardAmount,
    min_courses_for_reward: minCourses,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  if (membershipFee !== undefined) updateData.membership_fee = membershipFee;
  if (membershipReferralReward !== undefined) updateData.membership_referral_reward = membershipReferralReward;
  if (courseReferralCommissionPercent !== undefined) updateData.course_referral_commission_percent = courseReferralCommissionPercent;
  if (membershipEnabled !== undefined) updateData.membership_enabled = membershipEnabled;

  if (existing) {
    const { error } = await supabase
      .from('referral_settings')
      .update(updateData)
      .eq('id', (existing as DbReferralSettings).id);
    return !error;
  } else {
    const { error } = await supabase.from('referral_settings').insert(updateData);
    return !error;
  }
}

export type AdminReferralAnalytics = {
  totalReferrals: number;
  totalRewardsCredited: number;
  totalRewardAmount: number;
  pendingRewards: number;
};

export async function adminGetReferralAnalytics(): Promise<AdminReferralAnalytics> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('referral_rewards')
    .select('status, reward_amount');

  if (error || !data) return { totalReferrals: 0, totalRewardsCredited: 0, totalRewardAmount: 0, pendingRewards: 0 };

  const rewards = data as DbReferralReward[];
  return {
    totalReferrals: rewards.length,
    totalRewardsCredited: rewards.filter((r) => r.status === 'credited').length,
    totalRewardAmount: rewards
      .filter((r) => r.status === 'credited')
      .reduce((sum, r) => sum + Number(r.reward_amount), 0),
    pendingRewards: rewards.filter((r) => r.status === 'pending').length,
  };
}
