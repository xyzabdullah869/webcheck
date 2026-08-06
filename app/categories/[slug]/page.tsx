'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Loader as Loader2, FolderTree } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { CourseCard } from '@/components/course-card';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-states';
import { createClient } from '@/lib/supabase/client';
import type { Course } from '@/lib/types';

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = React.useState<{ name: string; description: string; image: string } | null>(null);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!slug) return;
    (async () => {
      const supabase = createClient();
      const { data: catData } = await supabase
        .from('categories')
        .select('name, description, image')
        .eq('slug', slug)
        .maybeSingle();

      if (catData) {
        setCategory({
          name: (catData.name as string) ?? '',
          description: (catData.description as string) ?? '',
          image: (catData.image as string) ?? '',
        });

        const { data: courseData } = await supabase
          .from('courses')
          .select(`
            id, title, slug, description, short_description, thumbnail, trailer_url,
            duration, lessons_count, level, language, price, original_price, tags,
            rating, reviews_count, students_count, bestseller, is_new, featured,
            certificate_enabled, status,
            instructor_id,
            profiles!courses_instructor_id_fkey(full_name, avatar_url)
          `)
          .eq('status', 'Published');

        // Filter courses by category — we need to match category_id
        // Since we have slug, we need the category id
        const { data: catWithId } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (catWithId && courseData) {
          const catId = catWithId.id as string;
          const filtered = (courseData as Record<string, unknown>[]).filter((c) => c.category_id === catId);
          const mapped: Course[] = filtered.map((c) => {
            const instructor = c.profiles as Record<string, unknown> | null;
            return {
              id: c.id as string,
              title: c.title as string,
              slug: c.slug as string,
              description: (c.description as string) ?? '',
              shortDescription: (c.short_description as string) ?? '',
              thumbnail: (c.thumbnail as string) ?? '',
              trailerUrl: (c.trailer_url as string) ?? '',
              category: catData.name as string,
              categoryId: catId,
              instructorId: (c.instructor_id as string) ?? '',
              instructorName: (instructor?.full_name as string) ?? 'Unknown',
              instructorAvatar: (instructor?.avatar_url as string) ?? '',
              duration: (c.duration as string) ?? '',
              lessons: (c.lessons_count as number) ?? 0,
              level: (c.level as string) as Course['level'],
              language: (c.language as string) ?? 'English',
              rating: Number(c.rating),
              reviews: (c.reviews_count as number) ?? 0,
              students: (c.students_count as number) ?? 0,
              price: Number(c.price),
              originalPrice: c.original_price ? Number(c.original_price) : undefined,
              tags: (c.tags as string[]) ?? [],
              bestseller: (c.bestseller as boolean) ?? false,
              isNew: (c.is_new as boolean) ?? false,
              featured: (c.featured as boolean) ?? false,
              certificateEnabled: (c.certificate_enabled as boolean) ?? true,
              status: (c.status as Course['status']) ?? 'Published',
            };
          });
          setCourses(mapped);
        }
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  if (!category) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pt-32">
          <EmptyState icon={<FolderTree className="h-7 w-7" />} title="Category not found" description="This category may not exist." action={{ label: 'Browse Categories', href: '/categories' }} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        <PageHeader eyebrow="Category" title={category.name} description={category.description} />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {courses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<FolderTree className="h-7 w-7" />} title="No courses in this category yet" description="Courses will appear here once they are published." action={{ label: 'Browse All Courses', href: '/courses' }} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
