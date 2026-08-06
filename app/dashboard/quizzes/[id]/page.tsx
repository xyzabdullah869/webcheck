'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, CircleCheck as CheckCircle2, Circle, Loader as Loader2, Award, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
  getQuiz,
  getQuizQuestions,
  submitQuiz,
  getQuizResultHistory,
  type Quiz,
  type QuizQuestion,
  type QuizResult,
} from '@/lib/services/quiz-service';
import { cn } from '@/lib/utils';

export default function StudentQuizTakePage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;
  const { toast } = useToast();
  const [quiz, setQuiz] = React.useState<Quiz | null>(null);
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [history, setHistory] = React.useState<QuizResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [answers, setAnswers] = React.useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<QuizResult | null>(null);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      const [q, qs, hist] = await Promise.all([
        getQuiz(quizId),
        getQuizQuestions(quizId),
        getQuizResultHistory(userId, quizId),
      ]);
      setQuiz(q);
      setQuestions(qs);
      setHistory(hist);
      setLoading(false);
    })();
  }, [quizId]);

  const toggleAnswer = (questionId: string, optionId: string, questionType: string) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (questionType === 'single' || questionType === 'true_false') {
        return { ...prev, [questionId]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [questionId]: current.filter((id) => id !== optionId) };
      }
      return { ...prev, [questionId]: [...current, optionId] };
    });
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id] || answers[q.id].length === 0);
    if (unanswered.length > 0) {
      toast({ title: `${unanswered.length} question(s) unanswered`, variant: 'destructive' });
      return;
    }
    if (!quiz) return;

    setSubmitting(true);
    const formattedAnswers = questions.map((q) => ({
      questionId: q.id,
      selected: answers[q.id] ?? [],
    }));

    const res = await submitQuiz(quizId, quiz.courseId, formattedAnswers);
    setSubmitting(false);

    if (res.success && res.result) {
      setResult(res.result);
      toast({
        title: res.result.passed ? 'Quiz passed!' : 'Quiz completed',
        description: `Your score: ${res.result.score}%`,
      });
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageTransition>
    );
  }

  if (!quiz) {
    return (
      <PageTransition>
        <Card className="p-6 shadow-soft">
          <p className="text-center text-muted-foreground">Quiz not found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/quizzes">Back to Quizzes</Link>
          </Button>
        </Card>
      </PageTransition>
    );
  }

  if (result) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className={cn(
                'flex h-24 w-24 items-center justify-center rounded-full',
                result.passed ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
              )}
            >
              <Award className={cn('h-12 w-12', result.passed ? 'text-emerald-600' : 'text-amber-600')} />
            </motion.div>
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold">{result.score}%</h1>
            <p className="mt-1 text-muted-foreground">
              {result.passed ? 'Congratulations! You passed the quiz.' : 'You did not pass. Try again!'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Passing score: {quiz.passingScore}%</p>
          </div>
          <div className="flex justify-center gap-3">
            <Button onClick={() => { setResult(null); setAnswers({}); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Retake Quiz
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/quizzes">Back to Quizzes</Link>
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-3">
            <Link href="/dashboard/quizzes"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Quizzes</Link>
          </Button>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{quiz.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {questions.length} questions | Pass: {quiz.passingScore}% | Time limit: {quiz.timeLimit}s
          </p>
          {history.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Previous attempts: {history.length} | Best: {Math.max(...history.map((h) => h.score))}%
            </p>
          )}
        </div>

        {questions.length > 0 ? (
          <>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="p-5 shadow-soft">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                      <Badge variant="secondary">
                        {q.questionType === 'single' ? 'Single Choice' : q.questionType === 'multiple' ? 'Multiple Choice' : 'True/False'}
                      </Badge>
                    </div>
                    <p className="mt-3 font-medium">{q.question}</p>
                    <div className="mt-4 space-y-2">
                      {q.options.map((opt) => {
                        const selected = answers[q.id]?.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleAnswer(q.id, opt.id, q.questionType)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                              selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                            )}
                          >
                            {selected ? (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                            )}
                            <span className="text-sm">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button asChild variant="outline">
                <Link href="/dashboard/quizzes">Cancel</Link>
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Submit Quiz
              </Button>
            </div>
          </>
        ) : (
          <Card className="p-6 shadow-soft">
            <p className="text-center text-muted-foreground">This quiz has no questions yet.</p>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
