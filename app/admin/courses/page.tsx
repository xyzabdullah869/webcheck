'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Loader as Loader2, Eye, CreditCard as Edit3, Star, Users, Clock, Search, EyeOff, FolderTree, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  status: string;
  level: string;
  price: number;
  students_count: number;
  rating: number;
  lessons_count: number;
  instructor_name: string | null;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = React.useState<AdminCourse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'Published' | 'Draft' | 'Archived' | 'Pending Review'>('all');
  const [deleteTarget, setDeleteTarget] = React.useState<AdminCourse | null>(null);
  const { toast } = useToast();

  const loadCourses = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug, thumbnail, status, level, price, students_count, rating, lessons_count, instructor_id')
      .order('created_at', { ascending: false });

    const instructorIds = Array.from(new Set((data ?? []).map((c: Record<string, unknown>) => c.instructor_id as string).filter(Boolean)));
    let instructorMap = new Map<string, string>();
    if (instructorIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', instructorIds);
      (profiles ?? []).forEach((p: Record<string, unknown>) => instructorMap.set(p.id as string, p.full_name as string));
    }

    const mapped: AdminCourse[] = (data ?? []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      title: c.title as string,
      slug: c.slug as string,
      thumbnail: (c.thumbnail as string) ?? null,
      status: (c.status as string) ?? 'Draft',
      level: (c.level as string) ?? 'Beginner',
      price: Number(c.price),
      students_count: (c.students_count as number) ?? 0,
      rating: Number(c.rating),
      lessons_count: (c.lessons_count as number) ?? 0,
      instructor_name: c.instructor_id ? instructorMap.get(c.instructor_id as string) ?? null : null,
    }));
    setCourses(mapped);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filtered = courses.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search.trim()) return c.title.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const supabase = createClient();

    // Clean up storage files before deleting the DB record
    if (deleteTarget.thumbnail) {
      const thumbPath = deleteTarget.thumbnail.split('/course-thumbnails/')[1];
      if (thumbPath) {
        await supabase.storage.from('course-thumbnails').remove([thumbPath]).catch(() => {});
      }
    }

    // Remove all course files from storage
    const { data: files } = await supabase.from('course_files').select('file_url').eq('course_id', deleteTarget.id);
    if (files && files.length > 0) {
      const filePaths = files
        .map((f: Record<string, unknown>) => (f.file_url as string)?.split('/course-files/')[1])
        .filter(Boolean) as string[];
      if (filePaths.length > 0) {
        await supabase.storage.from('course-files').remove(filePaths).catch(() => {});
      }
    }

    const { data, error } = await supabase.rpc('delete_course_cascade', { p_course_id: deleteTarget.id });

    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else if (data && (data as Record<string, unknown>).success) {
      toast({ title: 'Course deleted', description: `"${deleteTarget.title}" and all related data have been removed.` });
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } else if (data) {
      toast({ title: 'Delete failed', description: ((data as Record<string, unknown>).error as string) ?? 'Unknown error', variant: 'destructive' });
    }
  };

  const statusColors: Record<string, string> = {
    Published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Archived: 'bg-muted text-muted-foreground',
    'Pending Review': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Courses Management</h1>
            <p className="mt-1 text-muted-foreground">Create, edit, and manage all courses on the platform.</p>
          </div>
          <Button asChild>
            <Link href="/admin/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Courses', value: courses.length, color: 'from-blue-500 to-cyan-500' },
            { label: 'Published', value: courses.filter((c) => c.status === 'Published').length, color: 'from-emerald-500 to-teal-500' },
            { label: 'Drafts', value: courses.filter((c) => c.status === 'Draft').length, color: 'from-amber-500 to-orange-500' },
            { label: 'Total Students', value: courses.reduce((sum, c) => sum + c.students_count, 0), color: 'from-violet-500 to-purple-500' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 shadow-soft">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.color)}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'Published', 'Draft', 'Archived', 'Pending Review'] as const).map((f) => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">
                {f === 'all' ? 'All' : f}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="pl-9 sm:w-64" />
          </div>
        </div>

        {/* Course list */}
        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="flex flex-col gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500"><BookOpen className="h-6 w-6 text-white" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{course.title}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', statusColors[course.status] ?? statusColors.Draft)}>{course.status}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.students_count}</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" />{course.rating}</span>
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.lessons_count} lessons</span>
                        <Badge variant="secondary">{course.level}</Badge>
                        <span className="font-semibold text-foreground">${course.price.toFixed(2)}</span>
                        {course.instructor_name && <span>by {course.instructor_name}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/courses/${course.slug}`} target="_blank">
                          {course.status === 'Published' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/courses/${course.id}/content`}>
                          <FolderTree className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/courses/${course.id}/edit`}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/20"
                        onClick={() => setDeleteTarget(course)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<BookOpen className="h-7 w-7" />} title="No courses found" description={search || filter !== 'all' ? 'Try adjusting your filters.' : 'Create your first course to get started.'} action={filter === 'all' && !search ? { label: 'Create Course', href: '/admin/courses/new' } : undefined} />
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Course"
        description={`This will permanently delete "${deleteTarget?.title}" and all its modules, lessons, quizzes, assignments, enrollments, reviews, progress records, and uploaded files. This action cannot be undone.`}
        confirmLabel="Delete Course"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}
