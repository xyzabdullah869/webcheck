'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Loader as Loader2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { CourseCard } from '@/components/course-card';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-states';
import { createClient } from '@/lib/supabase/client';
import type { Course } from '@/lib/types';

export default function CoursesPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [levelFilter, setLevelFilter] = React.useState<string>('all');
  const [sort, setSort] = React.useState<'popular' | 'newest' | 'rating'>('popular');

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('courses')
        .select('id, title, slug, short_description, thumbnail, level, price, price_pkr, original_price, rating, reviews_count, students_count, lessons_count, duration, featured, bestseller, is_new, certificate_enabled, categories(name), profiles!courses_instructor_id_fkey(full_name, avatar_url)')
        .eq('status', 'Published')
        .order('created_at', { ascending: false });

      const mapped: Course[] = (data ?? []).map((c: Record<string, unknown>) => {
        const category = c.categories as Record<string, unknown> | null;
        const profile = c.profiles as Record<string, unknown> | null;
        return {
          id: c.id as string,
          title: c.title as string,
          slug: c.slug as string,
          description: (c.short_description as string) ?? '',
          thumbnail: (c.thumbnail as string) ?? '',
          category: (category?.name as string) ?? 'General',
          categoryId: '',
          instructorId: '',
          instructorName: (profile?.full_name as string) ?? '',
          instructorAvatar: (profile?.avatar_url as string) ?? '',
          level: (c.level as Course['level']) ?? 'Beginner',
          duration: (c.duration as string) ?? '',
          lessons: (c.lessons_count as number) ?? 0,
          rating: Number(c.rating),
          reviews: (c.reviews_count as number) ?? 0,
          students: (c.students_count as number) ?? 0,
          price: Number(c.price),
          pricePkr: Number(c.price_pkr ?? 0),
          originalPrice: c.original_price ? Number(c.original_price) : undefined,
          featured: (c.featured as boolean) ?? false,
          certificateEnabled: (c.certificate_enabled as boolean) ?? true,
          tags: [],
        };
      });
      setCourses(mapped);
      setLoading(false);
    })();
  }, []);

  const filtered = courses
    .filter((c) => {
      if (levelFilter !== 'all' && c.level !== levelFilter) return false;
      if (search.trim() && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'newest') return 0;
      if (sort === 'rating') return b.rating - a.rating;
      return b.students - a.students;
    });

  return (
    <>
      <Navbar />
      <PageHeader
        title="All Courses"
        description="Explore our complete catalog of expert-led courses in bioinformatics, AI, data science, and programming."
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'Beginner', 'Intermediate', 'Advanced'].map((l) => (
              <Button
                key={l}
                variant={levelFilter === l ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLevelFilter(l)}
                className="capitalize"
              >
                {l === 'all' ? 'All Levels' : l}
              </Button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </div>
          ) : (
            <Card className="p-6 shadow-soft">
              <EmptyState
                icon={<BookOpen className="h-7 w-7" />}
                title="No courses found"
                description={search || levelFilter !== 'all' ? 'Try adjusting your filters.' : 'Courses will appear here once published.'}
              />
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
