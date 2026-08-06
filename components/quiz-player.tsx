'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CircleCheck as CheckCircle2, Circle as XCircle, RotateCcw, ChevronRight, Trophy, CircleAlert as AlertCircle } from 'lucide-react';
import type { Quiz } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type QuizState = 'intro' | 'playing' | 'result';

export function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const [state, setState] = React.useState<QuizState>('intro');
  const [currentQ, setCurrentQ] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = React.useState(quiz.timeLimit);
  const [showReview, setShowReview] = React.useState(false);

  React.useEffect(() => {
    if (state !== 'playing') return;
    if (timeLeft <= 0) {
      setState('result');
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [state, timeLeft]);

  const question = quiz.questions[currentQ];
  const selected = answers[question?.id] ?? [];

  const toggleAnswer = (optId: string) => {
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (question.type === 'single') {
        return { ...prev, [question.id]: [optId] };
      }
      return {
        ...prev,
        [question.id]: current.includes(optId) ? current.filter((id) => id !== optId) : [...current, optId],
      };
    });
  };

  const next = () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setState('result');
    }
  };

  const prev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const score = React.useMemo(() => {
    let correct = 0;
    quiz.questions.forEach((q) => {
      const userAnswers = answers[q.id] ?? [];
      const correctIds = q.options.filter((o) => o.correct).map((o) => o.id);
      const allCorrect = correctIds.every((id) => userAnswers.includes(id)) && userAnswers.length === correctIds.length;
      if (allCorrect) correct++;
    });
    return Math.round((correct / quiz.questions.length) * 100);
  }, [answers, quiz.questions]);

  const passed = score >= quiz.passingScore;
  const correctCount = quiz.questions.filter((q) => {
    const userAnswers = answers[q.id] ?? [];
    const correctIds = q.options.filter((o) => o.correct).map((o) => o.id);
    return correctIds.every((id) => userAnswers.includes(id)) && userAnswers.length === correctIds.length;
  }).length;

  const restart = () => {
    setState('intro');
    setCurrentQ(0);
    setAnswers({});
    setTimeLeft(quiz.timeLimit);
    setShowReview(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (state === 'intro') {
    return (
      <Card className="p-8 text-center shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Trophy className="h-8 w-8" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold">{quiz.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{quiz.description}</p>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border p-4">
            <p className="font-display text-2xl font-bold">{quiz.questions.length}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-display text-2xl font-bold">{formatTime(quiz.timeLimit)}</p>
            <p className="text-xs text-muted-foreground">Time limit</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-display text-2xl font-bold">{quiz.passingScore}%</p>
            <p className="text-xs text-muted-foreground">Pass score</p>
          </div>
        </div>
        <Button size="lg" className="mt-6" onClick={() => setState('playing')}>
          Start quiz
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>
    );
  }

  if (state === 'result') {
    return (
      <div className="space-y-6">
        <Card className={cn('p-8 text-center shadow-soft', passed ? 'border-emerald-500/30' : 'border-rose-500/30')}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          >
            {passed ? (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
                <XCircle className="h-10 w-10" />
              </div>
            )}
          </motion.div>
          <h2 className="mt-4 font-display text-2xl font-bold">{passed ? 'Congratulations!' : 'Keep practicing'}</h2>
          <p className="mt-1 text-muted-foreground">
            {passed ? 'You passed the quiz.' : 'You did not reach the passing score.'}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl border p-4">
              <p className={cn('font-display text-3xl font-bold', passed ? 'text-emerald-500' : 'text-rose-500')}>{score}%</p>
              <p className="text-xs text-muted-foreground">Your score</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-display text-3xl font-bold">{correctCount}/{quiz.questions.length}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-display text-3xl font-bold">{quiz.passingScore}%</p>
              <p className="text-xs text-muted-foreground">Required</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => setShowReview(!showReview)}>
              {showReview ? 'Hide review' : 'Review answers'}
            </Button>
            <Button onClick={restart}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake quiz
            </Button>
          </div>
        </Card>

        <AnimatePresence>
          {showReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {quiz.questions.map((q, qi) => {
                const userAnswers = answers[q.id] ?? [];
                const correctIds = q.options.filter((o) => o.correct).map((o) => o.id);
                const isCorrect = correctIds.every((id) => userAnswers.includes(id)) && userAnswers.length === correctIds.length;
                return (
                  <Card key={q.id} className="p-5 shadow-soft">
                    <div className="flex items-start gap-3">
                      {isCorrect ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{qi + 1}. {q.question}</p>
                        <div className="mt-3 space-y-2">
                          {q.options.map((opt) => {
                            const userSelected = userAnswers.includes(opt.id);
                            return (
                              <div
                                key={opt.id}
                                className={cn(
                                  'flex items-center gap-2 rounded-lg border p-2.5 text-sm',
                                  opt.correct && 'border-emerald-500/30 bg-emerald-500/5',
                                  userSelected && !opt.correct && 'border-rose-500/30 bg-rose-500/5',
                                  !opt.correct && !userSelected && 'border-border'
                                )}
                              >
                                <span className={cn(
                                  'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                                  opt.correct ? 'bg-emerald-500 text-white' : userSelected ? 'bg-rose-500 text-white' : 'bg-muted'
                                )}>
                                  {opt.correct ? <CheckCircle2 className="h-3 w-3" /> : userSelected ? <XCircle className="h-3 w-3" /> : null}
                                </span>
                                {opt.text}
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Explanation: </span>{q.explanation}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Playing state
  const progressPct = ((currentQ + 1) / quiz.questions.length) * 100;

  return (
    <Card className="p-6 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Question {currentQ + 1} of {quiz.questions.length}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border bg-muted/30 px-3 py-1">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className={cn('text-sm font-semibold tabular-nums', timeLeft < 60 && 'text-rose-500')}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <div className="mt-6">
        <h3 className="font-display text-lg font-semibold">{question.question}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {question.type === 'single' ? 'Select one answer' : 'Select all that apply'}
        </p>
        <div className="mt-4 space-y-2">
          {question.options.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleAnswer(opt.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left text-sm transition-all',
                  isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                )}
              >
                <span className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                  isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                )}>
                  {opt.id.toUpperCase()}
                </span>
                {opt.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={prev} disabled={currentQ === 0}>
          Previous
        </Button>
        <div className="flex gap-1">
          {quiz.questions.map((q, i) => (
            <div
              key={q.id}
              className={cn(
                'h-2 w-2 rounded-full',
                i === currentQ ? 'bg-primary' : answers[q.id] ? 'bg-primary/40' : 'bg-muted'
              )}
            />
          ))}
        </div>
        <Button onClick={next} disabled={selected.length === 0}>
          {currentQ === quiz.questions.length - 1 ? 'Finish' : 'Next'}
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
