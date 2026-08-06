'use client';

import { createClient } from '@/lib/supabase/client';

export type InstructorApplication = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  education: string | null;
  qualification: string | null;
  experience: string | null;
  skills: string[];
  bio: string | null;
  portfolio_url: string | null;
  cv_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationInput = {
  full_name: string;
  email: string;
  phone: string;
  education: string;
  qualification: string;
  experience: string;
  skills: string[];
  bio: string;
  portfolio_url: string;
  cv_url: string;
};

export async function submitInstructorApplication(
  userId: string,
  data: ApplicationInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('instructor_applications')
    .select('id, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && (existing as Record<string, unknown>).status === 'pending') {
    return { success: false, error: 'You already have a pending application. Please wait for admin review.' };
  }

  const { error } = await supabase.from('instructor_applications').insert({
    user_id: userId,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone || null,
    education: data.education || null,
    qualification: data.qualification || null,
    experience: data.experience || null,
    skills: data.skills,
    bio: data.bio || null,
    portfolio_url: data.portfolio_url || null,
    cv_url: data.cv_url || null,
    status: 'pending',
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getMyApplication(userId: string): Promise<InstructorApplication | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('instructor_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as InstructorApplication | null;
}

export async function getAllApplications(): Promise<InstructorApplication[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('instructor_applications')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as InstructorApplication[];
}

export async function approveApplication(
  applicationId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc('approve_instructor_application', {
    application_id: applicationId,
    notes: notes ?? null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function rejectApplication(
  applicationId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc('reject_instructor_application', {
    application_id: applicationId,
    notes: notes ?? null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
