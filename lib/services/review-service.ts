'use client';

import { createClient } from '@/lib/supabase/client';

export type CourseReview = {
  id: string;
  course_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  rating: number;
  comment: string;
  created_at: string;
};

export async function getCourseReviews(courseId: string): Promise<CourseReview[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('reviews')
    .select('id, course_id, user_id, rating, comment, created_at, profiles!reviews_user_id_fkey(full_name, avatar_url)')
    .eq('course_id', courseId)
    .eq('flagged', false)
    .order('created_at', { ascending: false });

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown> | null;
    return {
      id: row.id as string,
      course_id: row.course_id as string,
      user_id: row.user_id as string,
      user_name: (profile?.full_name as string) ?? 'Anonymous',
      user_avatar: (profile?.avatar_url as string) ?? null,
      rating: row.rating as number,
      comment: (row.comment as string) ?? '',
      created_at: row.created_at as string,
    };
  });
}

export async function submitCourseReview(
  courseId: string,
  userId: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('reviews')
      .update({ rating, comment, flagged: false })
      .eq('id', (existing as Record<string, unknown>).id as string);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const { error } = await supabase.from('reviews').insert({
    course_id: courseId,
    user_id: userId,
    rating,
    comment,
    flagged: false,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function hasUserReviewed(courseId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('reviews')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}
