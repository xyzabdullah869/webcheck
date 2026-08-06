'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, CircleCheck as CheckCircle2, Award, Flame, Play, TrendingUp, BookOpen, Trophy, ArrowRight, Loader as Loader2, Sparkles, ClipboardList, FileText, Brain, Calendar, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-states';
import { PageTransition } from '@/components/page-transition';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  getStudentStats,
  getContinueLearning,
  getRecentActivity,
  type StudentStats,
  type StudentCourse,
  type StudentActivity,
} from '@/lib/services/student-dashboard-service';
import { getQuizResults, type QuizResult } from '@/lib/services/quiz-service';
import { getMySubmissions, type Submission } from '@/lib/services/assignment-service';
import { cn } from '@/lib/utils';

const activityIcons: Record<string, LucideIcon> = {
  lesson: CheckCircle2,
  quiz: Trophy,
  enrollment: BookOpen,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<StudentStats | null>(null);
  const [courses, setCourses] = React.useState<StudentCourse[]>([]);
  const [activities, setActivities] = React.useState<StudentActivity[]>([]);
  const [quizResults, setQuizResults] = React.useState<QuizResult[]>([]);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [s, c, a, qr, subs] = await Promise.all([
        getStudentStats(user.id),
        getContinueLearning(user.id),
        getRecentActivity(user.id),
        getQuizResults(user.id),
        getMySubmissions(user.id),
      ]);
      setStats(s);
      setCourses(c);
      setActivities(a);
      setQuizResults(qr);
      setSubmissions(subs);
      setLoading(false);
    })();
  }, [user]);

  const statCards = [
    { label: 'Learning Hours', value: stats?.totalLearningHours ?? null, icon: Clock, color: 'from-blue-500 to-cyan-500' },
    { label: 'Completed Lessons', value: stats?.completedLessons ?? null, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
    { label: 'Certificates', value: stats?.certificates ?? null, icon: Award, color: 'from-violet-500 to-purple-500' },
    { label: 'Enrolled Courses', value: stats?.enrolledCourses ?? null, icon: BookOpen, color: 'from-amber-500 to-orange-500' },
  ];

  const recentQuizResults = quizResults.slice(0, 3);
  const recentSubmissions = submissions.slice(0, 3);
  const pendingAssignments = submissions.filter((s) => s.status === 'Pending' || s.status === 'Submitted');

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="mt-1 text-muted-foreground">Continue your learning journey where you left off.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/ai-tutor">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Tutor
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/courses">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Courses
              </Link>
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" /> : (stat.value ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick access: AI Tutor + Quizzes + Assignments */}
        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Link href="/dashboard/ai-tutor">
              <Card className="group flex items-center gap-3 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white transition-transform group-hover:scale-110">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI Tutor</p>
                  <p className="text-xs text-muted-foreground">Get help with your courses</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Card>
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Link href="/dashboard/quizzes">
              <Card className="group flex items-center gap-3 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white transition-transform group-hover:scale-110">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">My Quizzes</p>
                  <p className="text-xs text-muted-foreground">{quizResults.length} attempts</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Card>
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link href="/dashboard/assignments">
              <Card className="group flex items-center gap-3 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white transition-transform group-hover:scale-110">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Assignments</p>
                  <p className="text-xs text-muted-foreground">{pendingAssignments.length} pending</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Continue learning */}
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Continue Learning</h2>
            {courses.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/courses">View all</Link>
              </Button>
            )}
          </div>
          {loading ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {courses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link href={`/courses/${course.slug}/learn`}>
                    <div className="group flex gap-4 rounded-xl border p-4 transition-all hover:bg-muted/40 hover:shadow-soft">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                            <BookOpen className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div>
                          <p className="truncate text-sm font-semibold">{course.title}</p>
                          {course.instructor_name && (
                            <p className="truncate text-xs text-muted-foreground">{course.instructor_name}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: `${course.progress}%` }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{course.progress}% complete</span>
                            <span className="flex items-center gap-1 text-xs font-medium text-primary transition-colors group-hover:gap-2">
                              <Play className="h-3 w-3" /> Resume
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                icon={<BookOpen className="h-7 w-7" />}
                title="No courses in progress"
                description="Browse our catalog and enroll in a course to start learning."
                action={{ label: 'Browse Courses', href: '/courses' }}
              />
            </div>
          )}
        </Card>

        {/* Quiz scores + Assignment status */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Recent Quiz Scores</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/quizzes">View all</Link>
              </Button>
            </div>
            {recentQuizResults.length > 0 ? (
              <div className="mt-4 space-y-2">
                {recentQuizResults.map((result, i) => (
                  <motion.div key={result.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40">
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        result.passed ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400')}>
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">Quiz Score: {result.score}%</p>
                        <p className="text-xs text-muted-foreground">{new Date(result.takenAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={result.passed ? 'default' : 'destructive'}>
                        {result.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  icon={<Trophy className="h-7 w-7" />}
                  title="No quiz attempts yet"
                  description="Take quizzes from your courses to see scores here."
                />
              </div>
            )}
          </Card>

          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Assignment Status</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/assignments">View all</Link>
              </Button>
            </div>
            {recentSubmissions.length > 0 ? (
              <div className="mt-4 space-y-2">
                {recentSubmissions.map((sub, i) => (
                  <motion.div key={sub.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40">
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        sub.status === 'Approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        sub.status === 'Submitted' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400')}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{sub.fileName}</p>
                        <p className="text-xs text-muted-foreground">{sub.status} · {new Date(sub.submittedAt).toLocaleDateString()}</p>
                      </div>
                      {sub.grade !== null && <Badge variant="secondary">{sub.grade}</Badge>}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  icon={<FileText className="h-7 w-7" />}
                  title="No assignments submitted"
                  description="Submit assignments from your courses to track them here."
                />
              </div>
            )}
          </Card>
        </div>

        {/* Recent activity */}
        <Card className="p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Recent Activity</h2>
          {activities.length > 0 ? (
            <div className="mt-4 space-y-2">
              {activities.map((activity, i) => {
                const Icon = activityIcons[activity.type] ?? Sparkles;
                return (
                  <motion.div key={activity.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="flex items-center gap-4 rounded-xl border p-3 transition-colors hover:bg-muted/40">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                icon={<TrendingUp className="h-7 w-7" />}
                title="No recent activity"
                description="Your learning activity will appear here as you progress through courses."
              />
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
