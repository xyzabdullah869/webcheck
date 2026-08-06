'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Users, Search, Loader as Loader2, Mail, Star, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { createClient } from '@/lib/supabase/client';

type Teacher = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
  courseCount: number;
  totalStudents: number;
};

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, bio, created_at')
        .eq('role', 'instructor')
        .order('created_at', { ascending: false });

      const instructorIds = (profiles ?? []).map((p: Record<string, unknown>) => p.id as string);
      let courseMap = new Map<string, { count: number; students: number }>();
      if (instructorIds.length > 0) {
        const { data: courses } = await supabase
          .from('courses')
          .select('instructor_id, students_count')
          .in('instructor_id', instructorIds);
        (courses ?? []).forEach((c: Record<string, unknown>) => {
          const id = c.instructor_id as string;
          const existing = courseMap.get(id) ?? { count: 0, students: 0 };
          existing.count += 1;
          existing.students += (c.students_count as number) ?? 0;
          courseMap.set(id, existing);
        });
      }

      const mapped: Teacher[] = (profiles ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        full_name: p.full_name as string,
        email: p.email as string,
        avatar_url: (p.avatar_url as string) ?? null,
        bio: (p.bio as string) ?? '',
        created_at: p.created_at as string,
        courseCount: courseMap.get(p.id as string)?.count ?? 0,
        totalStudents: courseMap.get(p.id as string)?.students ?? 0,
      }));
      setTeachers(mapped);
      setLoading(false);
    })();
  }, []);

  const filtered = teachers.filter((t) => !search.trim() || t.full_name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Teachers</h1>
          <p className="mt-1 text-muted-foreground">Manage instructor accounts and their course statistics.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><GraduationCap className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{teachers.length}</p>
            <p className="text-xs text-muted-foreground">Total Instructors</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><BookOpen className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{teachers.reduce((sum, t) => sum + t.courseCount, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Courses</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white"><Users className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{teachers.reduce((sum, t) => sum + t.totalStudents, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teachers..." className="pl-9" />
        </div>

        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((teacher, i) => (
                <motion.div key={teacher.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="p-5 shadow-soft transition-all hover:shadow-card">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold overflow-hidden">
                        {teacher.avatar_url ? <img src={teacher.avatar_url} alt={teacher.full_name} className="h-full w-full object-cover" /> : teacher.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{teacher.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{teacher.email}</p>
                      </div>
                    </div>
                    {teacher.bio && <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{teacher.bio}</p>}
                    <div className="mt-4 flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{teacher.courseCount} courses</span>
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{teacher.totalStudents} students</span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<GraduationCap className="h-7 w-7" />} title="No instructors found" description={search ? 'Try a different search.' : 'Instructors will appear here once they are assigned the instructor role.'} />
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
