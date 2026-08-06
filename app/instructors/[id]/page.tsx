'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Users, BookOpen, Battery as Twitter, Link as Linkedin, GitFork as Github, Globe, ArrowLeft, Loader as Loader2, GraduationCap } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-states';
import { CourseCard } from '@/components/course-card';
import { createClient } from '@/lib/supabase/client';
import type { Course } from '@/lib/types';

export default function InstructorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [instructor, setInstructor] = React.useState<{
    full_name: string; email: string; avatar_url: string | null; bio: string; location: string;
  } | null>(null);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url, bio, location')
        .eq('id', id)
        .maybeSingle();

      if (profile) {
        setInstructor(profile as { full_name: string; email: string; avatar_url: string | null; bio: string; location: string });

        const { data: courseData } = await supabase
          .from('courses')
          .select(`
            id, title, slug, description, short_description, thumbnail, trailer_url,
            duration, lessons_count, level, language, price, original_price, tags,
            rating, reviews_count, students_count, bestseller, is_new, featured,
            certificate_enabled, status,
            profiles!courses_instructor_id_fkey(full_name, avatar_url),
            categories(name)
          `)
          .eq('instructor_id', id)
          .eq('status', 'Published');

        const mapped: Course[] = (courseData ?? []).map((c: Record<string, unknown>) => {
          const row = c as Record<string, unknown>;
          const cat = row.categories as Record<string, unknown> | null;
          return {
            id: row.id as string,
            title: row.title as string,
            slug: row.slug as string,
            description: (row.description as string) ?? '',
            shortDescription: (row.short_description as string) ?? '',
            thumbnail: (row.thumbnail as string) ?? '',
            trailerUrl: (row.trailer_url as string) ?? '',
            category: (cat?.name as string) ?? '',
            categoryId: '',
            instructorId: id,
            instructorName: profile.full_name as string,
            instructorAvatar: (profile.avatar_url as string) ?? '',
            duration: (row.duration as string) ?? '',
            lessons: (row.lessons_count as number) ?? 0,
            level: (row.level as string) as Course['level'],
            language: (row.language as string) ?? 'English',
            rating: Number(row.rating),
            reviews: (row.reviews_count as number) ?? 0,
            students: (row.students_count as number) ?? 0,
            price: Number(row.price),
            originalPrice: row.original_price ? Number(row.original_price) : undefined,
            tags: (row.tags as string[]) ?? [],
            bestseller: (row.bestseller as boolean) ?? false,
            isNew: (row.is_new as boolean) ?? false,
            featured: (row.featured as boolean) ?? false,
            certificateEnabled: (row.certificate_enabled as boolean) ?? true,
            status: (row.status as Course['status']) ?? 'Published',
          };
        });
        setCourses(mapped);
      }
      setLoading(false);
    })();
  }, [id]);

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

  if (!instructor) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pt-32">
          <EmptyState icon={<GraduationCap className="h-7 w-7" />} title="Instructor not found" description="This instructor profile may not exist." action={{ label: 'View All Instructors', href: '/instructors' }} />
        </main>
        <Footer />
      </>
    );
  }

  const totalStudents = courses.reduce((sum, c) => sum + c.students, 0);

  return (
    <>
      <Navbar />
      <main>
        <PageHeader eyebrow="Instructor" title={instructor.full_name} description={instructor.bio || 'Bioinformatics instructor and educator.'} />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Instructor card */}
          <Card className="overflow-hidden p-0 shadow-card">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <div className="px-6 pb-6">
              <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-background">
                  {instructor.avatar_url ? (
                    <Image src={instructor.avatar_url} alt={instructor.full_name} fill sizes="96px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-2xl font-bold">{instructor.full_name.charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <h2 className="font-display text-xl font-bold">{instructor.full_name}</h2>
                  {instructor.location && <p className="text-sm text-muted-foreground">{instructor.location}</p>}
                </div>
                <div className="flex gap-4 pb-2">
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold">{courses.length}</p>
                    <p className="text-xs text-muted-foreground">Courses</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold">{totalStudents.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Courses */}
          <div className="mt-12">
            <h2 className="font-display text-2xl font-bold">Courses by {instructor.full_name}</h2>
            {courses.length > 0 ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} />
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState icon={<BookOpen className="h-7 w-7" />} title="No courses yet" description="This instructor hasn't published any courses yet." />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
