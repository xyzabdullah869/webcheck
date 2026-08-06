'use client';

import { createClient } from '@/lib/supabase/client';

export type SearchResult = {
  id: string;
  type: 'course' | 'instructor' | 'category' | 'blog' | 'lesson';
  title: string;
  description: string;
  href: string;
  image: string | null;
  meta: string;
};

/**
 * Smart search across courses, instructors, categories, and lessons.
 * Uses Postgres full-text search via ILIKE for broad matching.
 */
export async function smartSearch(query: string, limit: number = 20): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const supabase = createClient();
  const term = query.trim();
  const results: SearchResult[] = [];

  // Search courses
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, short_description, thumbnail, level, status')
    .or(`title.ilike.%${term}%,short_description.ilike.%${term}%`)
    .eq('status', 'Published')
    .limit(8);

  (courses ?? []).forEach((c: Record<string, unknown>) => {
    results.push({
      id: c.id as string,
      type: 'course',
      title: c.title as string,
      description: (c.short_description as string) ?? '',
      href: `/courses/${c.slug}`,
      image: (c.thumbnail as string) ?? null,
      meta: c.level as string,
    });
  });

  // Search categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, description, image')
    .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    .limit(4);

  (categories ?? []).forEach((c: Record<string, unknown>) => {
    results.push({
      id: c.id as string,
      type: 'category',
      title: c.name as string,
      description: (c.description as string) ?? '',
      href: `/categories/${c.slug}`,
      image: (c.image as string) ?? null,
      meta: 'Category',
    });
  });

  // Search instructors (profiles with role instructor/admin)
  const { data: instructors } = await supabase
    .from('profiles')
    .select('id, full_name, bio, avatar_url, role')
    .or(`full_name.ilike.%${term}%,bio.ilike.%${term}%`)
    .in('role', ['instructor', 'admin'])
    .limit(4);

  (instructors ?? []).forEach((p: Record<string, unknown>) => {
    results.push({
      id: p.id as string,
      type: 'instructor',
      title: p.full_name as string,
      description: (p.bio as string) ?? '',
      href: `/instructors/${p.id}`,
      image: (p.avatar_url as string) ?? null,
      meta: 'Instructor',
    });
  });

  // Search lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, description, module_id, modules!inner(title, courses!inner(slug))')
    .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    .limit(4);

  (lessons ?? []).forEach((l: Record<string, unknown>) => {
    const modules = l.modules as Record<string, unknown> | null;
    const courseData = modules?.courses as Record<string, unknown> | null;
    results.push({
      id: l.id as string,
      type: 'lesson',
      title: l.title as string,
      description: (l.description as string) ?? '',
      href: courseData ? `/courses/${courseData.slug}/learn` : '/courses',
      image: null,
      meta: 'Lesson',
    });
  });

  return results.slice(0, limit);
}
