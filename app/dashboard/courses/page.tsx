'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CircleCheck as CheckCircle2, Play, Loader as Loader2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type EnrolledCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  level: string;
  duration: string;
  instructor_name: string | null;
  progress: number;
  completed_at: string | null;
};

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = React.useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'in-progress' | 'completed'>('all');

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, progress, completed_at, course_id')
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map((e: Record<string, unknown>) => e.course_id as string);
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title, slug, thumbnail, level, duration, instructor_id')
        .in('id', courseIds);

      const instructorIds = Array.from(new Set(
        (courseData ?? []).map((c: Record<string, unknown>) => c.instructor_id as string).filter(Boolean)
      ));
      let instructorMap = new Map<string, string>();
      if (instructorIds.length > 0) {
        const { data: instructors } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', instructorIds);
        (instructors ?? []).forEach((p: Record<string, unknown>) => {
          instructorMap.set(p.id as string, p.full_name as string);
        });
      }

      const merged: EnrolledCourse[] = (enrollments ?? []).map((e: Record<string, unknown>) => {
        const course = (courseData ?? []).find((c: Record<string, unknown>) => c.id === e.course_id);
        if (!course) return null;
        return {
          id: course.id as string,
          title: course.title as string,
          slug: course.slug as string,
          thumbnail: (course.thumbnail as string) ?? null,
          level: (course.level as string) ?? 'Beginner',
          duration: (course.duration as string) ?? '',
          instructor_name: course.instructor_id ? instructorMap.get(course.instructor_id as string) ?? null : null,
          progress: e.progress as number,
          completed_at: (e.completed_at as string) ?? null,
        };
      }).filter(Boolean) as EnrolledCourse[];

      setCourses(merged);
      setLoading(false);
    })();
  }, [user]);

  const filtered = courses.filter((c) => {
    if (filter === 'in-progress' && c.progress >= 100) return false;
    if (filter === 'completed' && c.progress < 100) return false;
    if (query.trim()) {
      return c.title.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Courses</h1>
          <p className="mt-1 text-muted-foreground">Track your enrolled courses and learning progress.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(['all', 'in-progress', 'completed'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f === 'in-progress' ? 'In Progress' : f === 'completed' ? 'Completed' : 'All'}
              </Button>
            ))}
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="group flex h-full flex-col overflow-hidden shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                  <Link href={`/courses/${course.slug}`} className="block">
                    <div className="relative aspect-video overflow-hidden">
                      {course.thumbnail ? (
                        <Image src={course.thumbnail} alt={course.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                      )}
                      {course.progress >= 100 && (
                        <Badge className="absolute right-3 top-3 border-0 bg-emerald-500 text-white">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 font-display text-base font-semibold">{course.title}</h3>
                      {course.instructor_name && (
                        <p className="mt-1 text-xs text-muted-foreground">{course.instructor_name}</p>
                      )}
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration || '—'}</span>
                        <Badge variant="secondary">{course.level}</Badge>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">{course.progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className={cn('h-full rounded-full transition-all', course.progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500')} style={{ width: `${course.progress}%` }} />
                        </div>
                      </div>
                      <Button asChild size="sm" className="mt-4 w-full">
                        <Link href={`/courses/${course.slug}`}>
                          <Play className="mr-1.5 h-3.5 w-3.5" />
                          {course.progress >= 100 ? 'Review Course' : 'Continue'}
                        </Link>
                      </Button>
                    </div>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 shadow-soft">
            <EmptyState
              icon={<BookOpen className="h-7 w-7" />}
              title={query || filter !== 'all' ? 'No courses match your filters' : 'No enrolled courses yet'}
              description={query || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Browse our catalog and enroll in a course to get started.'}
              action={filter === 'all' && !query ? { label: 'Browse Courses', href: '/courses' } : undefined}
            />
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
