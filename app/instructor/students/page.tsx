'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Star, Loader as Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type StudentRow = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  courses: number;
  progress: number;
};

export default function InstructorStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = React.useState<StudentRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const supabase = createClient();
      // Get all courses by this instructor
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', user.id);
      
      if (!courses || courses.length === 0) { setLoading(false); return; }

      const courseIds = courses.map((c: Record<string, unknown>) => c.id as string);
      
      // Get enrollments for these courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('user_id, progress, course_id')
        .in('course_id', courseIds);

      if (!enrollments || enrollments.length === 0) { setLoading(false); return; }

      const userIds = Array.from(new Set(enrollments.map((e: Record<string, unknown>) => e.user_id as string)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles ?? []).map((p: Record<string, unknown>) => [p.id as string, p as Record<string, unknown>]));
      
      const studentMap = new Map<string, StudentRow>();
      for (const e of enrollments) {
        const uid = e.user_id as string;
        const profile = profileMap.get(uid) as Record<string, unknown> | undefined;
        if (!profile) continue;
        const existing = studentMap.get(uid) ?? {
          id: uid,
          name: (profile.full_name as string) ?? 'Unknown',
          email: (profile.email as string) ?? '',
          avatar: (profile.avatar_url as string) ?? null,
          courses: 0,
          progress: 0,
        };
        existing.courses += 1;
        existing.progress = Math.max(existing.progress, (e.progress as number) ?? 0);
        studentMap.set(uid, existing);
      }

      setStudents(Array.from(studentMap.values()));
      setLoading(false);
    })();
  }, [user]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Students</h1>
          <p className="mt-1 text-muted-foreground">View students enrolled in your courses and their progress.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><Users className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{students.length}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><BookOpen className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{students.filter((s) => s.progress >= 100).length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white"><Star className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{students.filter((s) => s.progress > 0 && s.progress < 100).length}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </Card>
        </div>

        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : students.length > 0 ? (
            <div className="space-y-3">
              {students.map((student, i) => (
                <motion.div key={student.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold overflow-hidden">
                    {student.avatar ? <img src={student.avatar} alt={student.name} className="h-full w-full object-cover" /> : student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold">{student.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold">{student.courses} course(s)</p>
                    <p className="text-xs text-muted-foreground">{student.progress}% avg progress</p>
                  </div>
                  <Badge variant={student.progress >= 100 ? 'default' : 'secondary'}>
                    {student.progress >= 100 ? 'Completed' : `${student.progress}%`}
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Users className="h-7 w-7" />} title="No students yet" description="Students will appear here once they enroll in your courses." />
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
