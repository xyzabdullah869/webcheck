import { createClient } from '@/lib/supabase/client';
import type { DbWithdrawalRequest } from '@/lib/database-types';

export type WithdrawalRequest = {
  id: string;
  amount: number;
  method: string;
  methodDetails: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  adminNotes: string | null;
  processedAt: string | null;
  createdAt: string;
};

function mapWithdrawal(db: DbWithdrawalRequest): WithdrawalRequest {
  return {
    id: db.id,
    amount: Number(db.amount),
    method: db.method,
    methodDetails: db.method_details,
    status: db.status,
    adminNotes: db.admin_notes,
    processedAt: db.processed_at,
    createdAt: db.created_at,
  };
}

export async function createWithdrawalRequest(
  instructorId: string,
  amount: number,
  method: string,
  methodDetails: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  if (amount <= 0) {
    return { success: false, error: 'Amount must be greater than 0' };
  }

  const { data: earnings } = await supabase
    .from('instructor_earnings')
    .select('amount, status')
    .eq('instructor_id', instructorId)
    .eq('status', 'available');

  const availableBalance = (earnings ?? []).reduce((sum: number, e: Record<string, unknown>) => sum + Number(e.amount), 0);

  if (amount > availableBalance) {
    return { success: false, error: `Insufficient balance. Available: PKR ${availableBalance.toFixed(0)}` };
  }

  const { error } = await supabase.from('withdrawal_requests').insert({
    instructor_id: instructorId,
    amount,
    method,
    method_details: methodDetails,
    status: 'pending',
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getInstructorWithdrawals(instructorId: string): Promise<WithdrawalRequest[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(mapWithdrawal);
}

export async function getAllWithdrawals(limit = 50): Promise<(WithdrawalRequest & { instructorName: string; instructorEmail: string })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*, profiles!withdrawal_requests_instructor_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const profile = row.profiles as Record<string, unknown> | undefined;
    return {
      ...mapWithdrawal(row as unknown as DbWithdrawalRequest),
      instructorName: (profile?.full_name as string) ?? '—',
      instructorEmail: (profile?.email as string) ?? '—',
    };
  });
}

export async function approveWithdrawal(id: string, adminNotes?: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('approve_withdrawal', {
    p_withdrawal_id: id,
    p_admin_notes: adminNotes ?? null,
  });
  if (error) return { success: false, error: error.message };
  if (data && !(data as Record<string, unknown>).success) {
    return { success: false, error: ((data as Record<string, unknown>).error as string) ?? 'Unknown error' };
  }
  return { success: true };
}

export async function rejectWithdrawal(id: string, adminNotes?: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('reject_withdrawal', {
    p_withdrawal_id: id,
    p_admin_notes: adminNotes ?? null,
  });
  if (error) return { success: false, error: error.message };
  if (data && !(data as Record<string, unknown>).success) {
    return { success: false, error: ((data as Record<string, unknown>).error as string) ?? 'Unknown error' };
  }
  return { success: true };
}

export async function markWithdrawalPaid(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('withdrawal_requests')
    .update({ status: 'paid', processed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'approved');
  if (error) return { success: false, error: error.message };
  return { success: true };
}
