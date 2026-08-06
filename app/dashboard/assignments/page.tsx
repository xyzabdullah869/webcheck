'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Loader as Loader2, Calendar, Award, ArrowRight, BookOpen, CircleCheck as CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { createClient } from '@/lib/supabase/client';
import {
  getStudentAssignments,
  getMySubmissions,
  type AssignmentWithCourse,
  type Submission,
} from '@/lib/services/assignment-service';
import { cn } from '@/lib/utils';

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = React.useState<AssignmentWithCourse[]>([]);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', userId);
      const courseIds = (enrollments ?? []).map((e: Record<string, unknown>) => e.course_id as string);

      const [assignData, subData] = await Promise.all([
        getStudentAssignments(courseIds),
        getMySubmissions(userId),
      ]);
      setAssignments(assignData);
      setSubmissions(subData);
      setLoading(false);
    })();
  }, []);

  const getSubmission = (assignmentId: string): Submission | undefined => {
    return submissions.find((s) => s.assignmentId === assignmentId);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      Submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Reviewed: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
      Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    return <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', colors[status] ?? colors.Pending)}>{status}</span>;
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Assignments</h1>
          <p className="mt-1 text-muted-foreground">View assignments, submit your work, and track grades.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : assignments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignments.map((a, i) => {
              const sub = getSubmission(a.id);
              const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && !sub;
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="p-5 shadow-soft transition-all hover:shadow-card">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                        <FileText className="h-5 w-5" />
                      </div>
                      {sub ? statusBadge(sub.status) : isOverdue ? (
                        <Badge variant="destructive">Overdue</Badge>
                      ) : (
                        <Badge variant="outline">Not Submitted</Badge>
                      )}
                    </div>
                    <p className="mt-3 font-display text-lg font-bold">{a.title}</p>
                    {a.courseTitle && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" /> {a.courseTitle}
                      </p>
                    )}
                    {a.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.description}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Award className="h-3 w-3" />Max: {a.maxScore}</span>
                      {a.dueDate && (
                        <span className={cn('flex items-center gap-1', isOverdue && 'text-rose-600')}>
                          <Calendar className="h-3 w-3" />
                          {new Date(a.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {sub && sub.grade !== null && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="font-semibold">Grade: {sub.grade}/{a.maxScore}</span>
                      </div>
                    )}
                    <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                      <Link href={`/dashboard/assignments/${a.id}`}>
                        {sub ? 'View Submission' : 'Submit Assignment'} <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 shadow-soft">
            <EmptyState
              icon={<FileText className="h-7 w-7" />}
              title="No assignments available"
              description="Assignments from your enrolled courses will appear here."
              action={{ label: 'Browse Courses', href: '/courses' }}
            />
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
