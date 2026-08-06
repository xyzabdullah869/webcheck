'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import { CourseCard } from '@/components/course-card';
import { SectionTitle } from '@/components/section-title';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-states';
import { createClient } from '@/lib/supabase/client';
import type { Course } from '@/lib/types';

export function FeaturedCourses() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('courses')
        .select('id, title, slug, short_description, thumbnail, level, price, price_pkr, original_price, rating, reviews_count, students_count, lessons_count, duration, featured, bestseller, is_new, certificate_enabled, categories(name), profiles!courses_instructor_id_fkey(full_name)')
        .eq('status', 'Published')
        .order('students_count', { ascending: false })
        .limit(6);

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
          instructorAvatar: '',
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

  const featured = courses.filter((c) => c.featured);
  const display = featured.length > 0 ? featured : courses;

  return (
    <section className="bg-muted/20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionTitle
            center={false}
            eyebrow="Featured"
            title="Popular courses this week"
            description="Hand-picked by our team and loved by thousands of learners."
          />
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/courses">
              View all courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {!loading && display.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {display.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </div>
        ) : !loading ? (
          <div className="mt-12">
            <EmptyState
              icon={<BookOpen className="h-7 w-7" />}
              title="No courses published yet"
              description="Our team is preparing expert-led courses in bioinformatics, AI, and data science. Check back soon!"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
