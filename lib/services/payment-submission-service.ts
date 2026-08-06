'use client';

import { createClient } from '@/lib/supabase/client';

export type PaymentSubmission = {
  id: string;
  order_id: string;
  user_id: string;
  payment_gateway_id: string | null;
  payment_gateway_code: string | null;
  screenshot_url: string | null;
  transaction_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export async function submitPaymentProof(params: {
  orderId: string;
  userId: string;
  gatewayId: string;
  gatewayCode: string;
  screenshotUrl: string;
  transactionId: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('payment_submissions').insert({
    order_id: params.orderId,
    user_id: params.userId,
    payment_gateway_id: params.gatewayId,
    payment_gateway_code: params.gatewayCode,
    screenshot_url: params.screenshotUrl,
    transaction_id: params.transactionId,
    status: 'pending',
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getPaymentSubmission(orderId: string): Promise<PaymentSubmission | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('payment_submissions')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as PaymentSubmission | null;
}

export async function getAllPaymentSubmissions(): Promise<(PaymentSubmission & { userName: string; userEmail: string; orderNumber: string })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('payment_submissions')
    .select('*, profiles!payment_submissions_user_id_fkey(full_name, email), orders!payment_submissions_order_id_fkey(order_number)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const profile = row.profiles as Record<string, unknown> | null;
    const order = row.orders as Record<string, unknown> | null;
    return {
      id: row.id as string,
      order_id: row.order_id as string,
      user_id: row.user_id as string,
      payment_gateway_id: (row.payment_gateway_id as string) ?? null,
      payment_gateway_code: (row.payment_gateway_code as string) ?? null,
      screenshot_url: (row.screenshot_url as string) ?? null,
      transaction_id: (row.transaction_id as string) ?? null,
      status: row.status as PaymentSubmission['status'],
      admin_notes: (row.admin_notes as string) ?? null,
      reviewed_at: (row.reviewed_at as string) ?? null,
      created_at: row.created_at as string,
      userName: (profile?.full_name as string) ?? 'Unknown',
      userEmail: (profile?.email as string) ?? '',
      orderNumber: (order?.order_number as string) ?? '',
    };
  });
}

export async function approvePaymentSubmission(
  submissionId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc('approve_payment_submission', {
    submission_id: submissionId,
    notes: notes ?? null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function rejectPaymentSubmission(
  submissionId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc('reject_payment_submission', {
    submission_id: submissionId,
    notes: notes ?? null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function uploadPaymentScreenshot(
  userId: string,
  orderId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() ?? 'png';
  const filePath = `${userId}/${orderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('payment-screenshots')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: urlData } = supabase.storage.from('payment-screenshots').getPublicUrl(filePath);
  return { success: true, url: urlData.publicUrl };
}
