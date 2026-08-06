'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Clock, BookOpen, Award, TrendingUp, Loader as Loader2, CircleCheck as CheckCircle2, Trophy, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/page-transition';
import { useAuth } from '@/lib/contexts/auth-context';
import { getStudentStats, getContinueLearning, getRecentActivity, type StudentStats, type StudentCourse, type StudentActivity } from '@/lib/services/student-dashboard-service';
import { cn } from '@/lib/utils';

export default function DashboardAiAssistantPage() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<StudentStats | null>(null);
  const [courses, setCourses] = React.useState<StudentCourse[]>([]);
  const [activities, setActivities] = React.useState<StudentActivity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [s, c, a] = await Promise.all([
        getStudentStats(user.id),
        getContinueLearning(user.id),
        getRecentActivity(user.id),
      ]);
      setStats(s);
      setCourses(c);
      setActivities(a);
      setLoading(false);
    })();
  }, [user]);

  const learningHours = stats?.totalLearningHours ?? 0;
  const completedLessons = stats?.completedLessons ?? 0;
  const certificates = stats?.certificates ?? 0;
  const enrolled = stats?.enrolledCourses ?? 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">AI Tutor Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Your personalized learning progress and AI tutoring overview.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/ai-tutor">
              <Sparkles className="mr-2 h-4 w-4" />
              Start AI Tutor
            </Link>
          </Button>
        </div>

        {/* Progress stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Learning Hours', value: learningHours, icon: Clock, color: 'from-blue-500 to-cyan-500' },
            { label: 'Completed Lessons', value: completedLessons, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
            { label: 'Certificates', value: certificates, icon: Award, color: 'from-violet-500 to-purple-500' },
            { label: 'Enrolled Courses', value: enrolled, icon: BookOpen, color: 'from-amber-500 to-orange-500' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
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

        {/* AI Tutor CTA */}
        <Card className="overflow-hidden p-0 shadow-card">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold">AI Interactive Tutor</h2>
                <p className="text-sm text-white/80">Get step-by-step lessons, quizzes, and personalized guidance from your AI tutor.</p>
              </div>
              <Button asChild size="lg" variant="secondary" className="hidden sm:flex">
                <Link href="/dashboard/ai-tutor">
                  Start Learning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Button asChild size="lg" variant="secondary" className="mt-4 w-full sm:hidden">
              <Link href="/dashboard/ai-tutor">
                Start Learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Continue learning + Recent activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Continue Learning</h2>
            {loading ? (
              <div className="mt-4 space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
                ))}
              </div>
            ) : courses.length > 0 ? (
              <div className="mt-4 space-y-3">
                {courses.slice(0, 3).map((course) => (
                  <Link key={course.id} href={`/courses/${course.slug}`}>
                    <div className="group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40">
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold">{course.title}</p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${course.progress}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-primary">{course.progress}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No courses in progress. Start learning to see your progress here.</p>
            )}
          </Card>

          <Card className="p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Recent Activity</h2>
            {loading ? (
              <div className="mt-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="mt-4 space-y-2">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 rounded-xl border p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {activity.type === 'quiz' ? <Trophy className="h-4 w-4" /> : activity.type === 'lesson' ? <CheckCircle2 className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No recent activity. Your learning activity will appear here.</p>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
