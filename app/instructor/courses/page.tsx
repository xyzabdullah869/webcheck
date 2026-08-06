'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Users, DollarSign, TrendingUp, CreditCard as Edit3, Eye, Loader as Loader2, EyeOff, Star, FolderTree, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type InstructorCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  status: string;
  price: number;
  studentsCount: number;
  rating: number;
  lessonsCount: number;
  level: string;
};

export default function InstructorCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = React.useState<InstructorCourse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteTarget, setDeleteTarget] = React.useState<InstructorCourse | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('courses')
        .select('id, title, slug, thumbnail, status, price, students_count, rating, lessons_count, level')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });
      setCourses((data ?? []) as InstructorCourse[]);
      setLoading(false);
    })();
  }, [user]);

  const totalStudents = courses.reduce((sum, c) => sum + (c.studentsCount ?? 0), 0);
  const totalRevenue = courses.reduce((sum, c) => sum + (c.price ?? 0) * (c.studentsCount ?? 0), 0);
  const publishedCount = courses.filter((c) => c.status === 'Published').length;

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

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link href="/instructor">Dashboard</Link>
            </Button>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">My Courses</h1>
            <p className="mt-1 text-muted-foreground">Manage your course catalog, pricing, and publication status.</p>
          </div>
          <Button asChild>
            <Link href="/instructor/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{courses.length}</p>
            <p className="text-xs text-muted-foreground">Total Courses</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              <DollarSign className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold">${totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Est. Revenue</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{publishedCount}</p>
            <p className="text-xs text-muted-foreground">Published</p>
          </Card>
        </div>

        {/* Course list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-3">
            {courses.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="flex flex-col gap-4 p-4 shadow-soft transition-all hover:shadow-card sm:flex-row sm:items-center">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{course.title}</p>
                      <Badge variant={course.status === 'Published' ? 'default' : 'outline'}>
                        {course.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.studentsCount ?? 0}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3" />{course.rating ?? 0}</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.lessonsCount ?? 0} lessons</span>
                      <span>{course.level}</span>
                      <span className="font-semibold text-foreground">${(course.price ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/courses/${course.slug}`} target="_blank">
                        {course.status === 'Published' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/instructor/courses/${course.id}/content`}>
                        <FolderTree className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/instructor/courses/${course.id}/edit`}>
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
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 shadow-soft">
            <EmptyState
              icon={<BookOpen className="h-7 w-7" />}
              title="No courses yet"
              description="Create your first course to start selling on the platform."
              action={{ label: 'Create Course', href: '/instructor/courses/new' }}
            />
          </Card>
        )}
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
