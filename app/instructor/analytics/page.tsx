'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, Users, Star, DollarSign, Loader as Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type CourseStat = {
  id: string;
  title: string;
  students_count: number;
  rating: number;
  price: number;
  status: string;
};

export default function InstructorAnalyticsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = React.useState<CourseStat[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('courses')
        .select('id, title, students_count, rating, price, status')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });
      setCourses((data ?? []) as CourseStat[]);
      setLoading(false);
    })();
  }, [user]);

  const totalStudents = courses.reduce((sum, c) => sum + (c.students_count ?? 0), 0);
  const avgRating = courses.length > 0 ? courses.reduce((sum, c) => sum + (c.rating ?? 0), 0) / courses.length : 0;
  const totalRevenue = courses.reduce((sum, c) => sum + (c.students_count ?? 0) * (c.price ?? 0), 0);

  const statCards = [
    { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'from-emerald-500 to-teal-500' },
    { label: 'Avg Rating', value: avgRating.toFixed(1), icon: Star, color: 'from-amber-500 to-orange-500' },
    { label: 'Est. Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'from-violet-500 to-purple-500' },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Course Analytics</h1>
          <p className="mt-1 text-muted-foreground">Performance metrics for your courses.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 shadow-soft">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" /> : stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Course Performance</h2>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : courses.length > 0 ? (
            <div className="mt-4 space-y-3">
              {courses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{course.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.students_count ?? 0} students</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" />{course.rating ?? 0}</span>
                        <span className="font-semibold text-foreground">${(course.price ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      course.status === 'Published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    )}>{course.status}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((course.students_count ?? 0) / Math.max(totalStudents, 1) * 100, 100)}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<TrendingUp className="h-7 w-7" />} title="No analytics yet" description="Create a course to see performance metrics." />
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
