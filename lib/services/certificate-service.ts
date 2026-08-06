'use client';

import { createClient } from '@/lib/supabase/client';

export async function generateCertificate(
  userId: string,
  courseId: string
): Promise<{ success: boolean; certificateId?: string; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('generate_certificate', {
    p_user_id: userId,
    p_course_id: courseId,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, certificateId: data as string };
}

export async function checkAndGenerateCertificate(
  userId: string,
  courseId: string
): Promise<{ success: boolean; certificateId?: string; error?: string }> {
  const supabase = createClient();

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('progress')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!enrollment) return { success: false, error: 'Not enrolled' };

  const progress = (enrollment as Record<string, unknown>).progress as number;
  if (progress < 100) return { success: false, error: 'Course not complete' };

  return generateCertificate(userId, courseId);
}
