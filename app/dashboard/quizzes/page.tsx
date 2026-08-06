'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ClipboardList, Loader as Loader2, Clock, CircleCheck as CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { createClient } from '@/lib/supabase/client';
import { getStudentQuizzes, getQuizResults, type QuizWithCourse, type QuizResult } from '@/lib/services/quiz-service';

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = React.useState<QuizWithCourse[]>([]);
  const [results, setResults] = React.useState<QuizResult[]>([]);
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

      const [quizData, resultData] = await Promise.all([
        getStudentQuizzes(courseIds),
        getQuizResults(userId),
      ]);
      setQuizzes(quizData);
      setResults(resultData);
      setLoading(false);
    })();
  }, []);

  const getBestScore = (quizId: string): QuizResult | null => {
    const quizResults = results.filter((r) => r.quizId === quizId);
    if (quizResults.length === 0) return null;
    return quizResults.reduce((best, r) => (r.score > best.score ? r : best));
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Quizzes</h1>
          <p className="mt-1 text-muted-foreground">Take quizzes and track your scores.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : quizzes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz, i) => {
              const best = getBestScore(quiz.id);
              return (
                <motion.div key={quiz.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="p-5 shadow-soft transition-all hover:shadow-card">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      {best && (
                        <Badge variant={best.passed ? 'default' : 'destructive'}>
                          {best.score}%
                        </Badge>
                      )}
                    </div>
                    <p className="mt-3 font-display text-lg font-bold">{quiz.title}</p>
                    {quiz.courseTitle && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" /> {quiz.courseTitle}
                      </p>
                    )}
                    {quiz.moduleTitle && <Badge variant="secondary" className="mt-2">{quiz.moduleTitle}</Badge>}
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{quiz.timeLimit}s</span>
                      <span>Pass: {quiz.passingScore}%</span>
                    </div>
                    {best && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs">
                        {best.passed ? (
                          <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> <span className="text-emerald-600">Passed</span></>
                        ) : (
                          <span className="text-amber-600">Not passed yet</span>
                        )}
                        <span className="text-muted-foreground">({results.filter((r) => r.quizId === quiz.id).length} attempts)</span>
                      </div>
                    )}
                    <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                      <Link href={`/dashboard/quizzes/${quiz.id}`}>
                        {best ? 'Retake Quiz' : 'Start Quiz'} <ArrowRight className="ml-1 h-3 w-3" />
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
              icon={<ClipboardList className="h-7 w-7" />}
              title="No quizzes available"
              description="Quizzes from your enrolled courses will appear here."
              action={{ label: 'Browse Courses', href: '/courses' }}
            />
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
