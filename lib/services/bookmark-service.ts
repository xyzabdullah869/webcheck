'use client';

import { createClient } from '@/lib/supabase/client';

export type BookmarkWithCourse = {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  level: string;
  price: number;
};

export async function toggleBookmark(courseId: string): Promise<{ bookmarked: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { bookmarked: false, error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', (existing as Record<string, unknown>).id as string);
    return { bookmarked: false };
  }

  const { error } = await supabase.from('bookmarks').insert({
    user_id: user.id,
    course_id: courseId,
  });

  if (error) return { bookmarked: false, error: error.message };
  return { bookmarked: true };
}

export async function isBookmarked(courseId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  return !!data;
}

export async function getBookmarkedCourseIds(): Promise<Set<string>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from('bookmarks')
    .select('course_id')
    .eq('user_id', user.id);

  return new Set((data ?? []).map((b: Record<string, unknown>) => b.course_id as string));
}

export async function getMyBookmarks(): Promise<BookmarkWithCourse[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('id, course_id, courses(id, title, slug, thumbnail, level, price)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (bookmarks ?? [])
    .filter((b: Record<string, unknown>) => b.courses)
    .map((b: Record<string, unknown>) => {
      const course = b.courses as Record<string, unknown>;
      return {
        id: b.id as string,
        courseId: course.id as string,
        title: course.title as string,
        slug: course.slug as string,
        thumbnail: (course.thumbnail as string) ?? null,
        level: (course.level as string) ?? 'Beginner',
        price: Number(course.price),
      };
    });
}
