'use client';

import { createClient } from '@/lib/supabase/client';
import type { DbWallet, DbTransaction } from '@/lib/database-types';

type ProfileRef = { id: string; email: string; full_name: string };

// ============================================================
// WALLET SERVICE
// ============================================================

export type WalletInfo = {
  balance: number;
  currency: string;
};

export type WalletTransactionItem = {
  id: string;
  amount: number;
  type: 'credit' | 'debit' | 'refund' | 'payout' | 'referral_bonus' | 'course_purchase';
  description: string;
  status: 'completed' | 'pending';
  date: string;
};

export async function getWallet(userId: string): Promise<WalletInfo> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('wallets')
    .select('balance, currency')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return { balance: 0, currency: 'USD' };
  return {
    balance: Number((data as DbWallet).balance),
    currency: (data as DbWallet).currency,
  };
}

export async function getWalletTransactions(userId: string): Promise<WalletTransactionItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, type, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as DbTransaction[]).map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    type: t.type,
    description: t.description,
    status: 'completed' as const,
    date: t.created_at,
  }));
}

// ============================================================
// ADMIN WALLET SERVICE
// ============================================================

export type AdminWalletUser = {
  userId: string;
  name: string;
  email: string;
  balance: number;
  currency: string;
  transactionCount: number;
};

export async function adminGetAllWallets(): Promise<AdminWalletUser[]> {
  const supabase = createClient();

  const { data: wallets, error } = await supabase
    .from('wallets')
    .select('id, user_id, balance, currency')
    .order('updated_at', { ascending: false });

  if (error || !wallets) return [];

  const userIds = (wallets as DbWallet[]).map((w) => w.user_id);
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);

  const { data: txnCounts } = await supabase
    .from('transactions')
    .select('user_id')
    .in('user_id', userIds);

  const profileMap = new Map<string, ProfileRef>(
    (profiles as ProfileRef[] ?? []).map((p) => [p.id, p])
  );
  const txnCountMap = new Map<string, number>();
  (txnCounts as { user_id: string }[] ?? []).forEach((t) => {
    const uid = t.user_id;
    txnCountMap.set(uid, (txnCountMap.get(uid) ?? 0) + 1);
  });

  return (wallets as DbWallet[]).map((w) => {
    const profile = profileMap.get(w.user_id);
    return {
      userId: w.user_id,
      name: profile?.full_name ?? 'Unknown',
      email: profile?.email ?? '',
      balance: Number(w.balance),
      currency: w.currency,
      transactionCount: txnCountMap.get(w.user_id) ?? 0,
    };
  });
}

export async function adminWalletOperation(
  userId: string,
  operation: 'credit' | 'debit',
  amount: number,
  description: string,
  type?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('admin_wallet_operation', {
    target_user_id: userId,
    operation,
    amount,
    op_description: description,
    op_type: type ?? operation,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; new_balance: number };
  return { success: true, newBalance: result.new_balance };
}

export async function adminGetAllTransactions(): Promise<
  (WalletTransactionItem & { userName: string; userEmail: string })[]
> {
  const supabase = createClient();
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, user_id, amount, type, description, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !transactions) return [];

  const userIds = Array.from(new Set((transactions as DbTransaction[]).map((t) => t.user_id)));
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);

  const profileMap = new Map<string, ProfileRef>(
    (profiles as ProfileRef[] ?? []).map((p) => [p.id, p])
  );

  return (transactions as DbTransaction[]).map((t) => {
    const profile = profileMap.get(t.user_id);
    return {
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      description: t.description,
      status: 'completed' as const,
      date: t.created_at,
      userName: profile?.full_name ?? 'Unknown',
      userEmail: profile?.email ?? '',
    };
  });
}
