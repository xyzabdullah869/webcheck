'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CirclePlay as PlayCircle, Clock, BookOpen, Loader as Loader2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { getContinueLearning, type StudentCourse } from '@/lib/services/student-dashboard-service';

export default function ContinueLearningPage() {
  const { user } = useAuth();
  const [courses, setCourses] = React.useState<StudentCourse[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const data = await getContinueLearning(user.id);
      setCourses(data);
      setLoading(false);
    })();
  }, [user]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Continue Learning</h1>
          <p className="mt-1 text-muted-foreground">Pick up where you left off.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : courses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {courses.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="group flex gap-4 p-5 shadow-soft transition-all hover:shadow-card">
                  <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <h3 className="truncate font-display text-base font-semibold">{course.title}</h3>
                      {course.instructor_name && (
                        <p className="truncate text-xs text-muted-foreground">{course.instructor_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{course.progress}% complete</span>
                        <Badge variant="secondary" className="text-[10px]">In Progress</Badge>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: `${course.progress}%` }} />
                      </div>
                      <Button asChild size="sm" className="w-full">
                        <Link href={`/courses/${course.slug}`}>
                          <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                          Resume Learning
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 shadow-soft">
            <EmptyState
              icon={<PlayCircle className="h-7 w-7" />}
              title="No courses in progress"
              description="Start a course to see it here. Your progress is saved automatically."
              action={{ label: 'Browse Courses', href: '/courses' }}
            />
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
