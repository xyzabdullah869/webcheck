'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, CreditCard as Edit3, Loader as Loader2, X, CircleCheck as CheckCircle2, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import {
  getQuiz,
  getQuizQuestions,
  addQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  type Quiz,
  type QuizQuestion,
  type QuizOption,
} from '@/lib/services/quiz-service';
import { cn } from '@/lib/utils';

export default function AdminQuizDetailPage() {
  const params = useParams();
  const quizId = params.id as string;
  const { toast } = useToast();
  const [quiz, setQuiz] = React.useState<Quiz | null>(null);
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<QuizQuestion | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    question: '',
    questionType: 'single' as 'single' | 'multiple' | 'true_false',
    options: [
      { id: 'opt-a', text: '', isCorrect: false },
      { id: 'opt-b', text: '', isCorrect: false },
    ] as QuizOption[],
    explanation: '',
  });

  const loadData = React.useCallback(async () => {
    const [q, qs] = await Promise.all([getQuiz(quizId), getQuizQuestions(quizId)]);
    setQuiz(q);
    setQuestions(qs);
    setLoading(false);
  }, [quizId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm({
      question: '',
      questionType: 'single',
      options: [
        { id: 'opt-a', text: '', isCorrect: false },
        { id: 'opt-b', text: '', isCorrect: false },
      ],
      explanation: '',
    });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (q: QuizQuestion) => {
    setForm({
      question: q.question,
      questionType: q.questionType,
      options: q.options.length > 0 ? q.options : [
        { id: 'opt-a', text: '', isCorrect: false },
        { id: 'opt-b', text: '', isCorrect: false },
      ],
      explanation: q.explanation,
    });
    setEditing(q);
    setShowForm(true);
  };

  const setTrueFalseOptions = () => {
    setForm({
      ...form,
      questionType: 'true_false',
      options: [
        { id: 'true', text: 'True', isCorrect: false },
        { id: 'false', text: 'False', isCorrect: false },
      ],
    });
  };

  const addOption = () => {
    const n = form.options.length;
    setForm({
      ...form,
      options: [...form.options, { id: `opt-${String.fromCharCode(97 + n)}`, text: '', isCorrect: false }],
    });
  };

  const removeOption = (idx: number) => {
    if (form.options.length <= 2) return;
    setForm({ ...form, options: form.options.filter((_, i) => i !== idx) });
  };

  const updateOption = (idx: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const updated = form.options.map((o, i) => (i === idx ? { ...o, [field]: value } : o));
    if (field === 'isCorrect' && value && form.questionType === 'single') {
      updated.forEach((o, i) => { if (i !== idx) o.isCorrect = false; });
    }
    setForm({ ...form, options: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim()) {
      toast({ title: 'Question text is required', variant: 'destructive' });
      return;
    }
    if (form.questionType !== 'true_false') {
      const hasCorrect = form.options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        toast({ title: 'Mark at least one correct answer', variant: 'destructive' });
        return;
      }
    }
    setSaving(true);

    const payload = {
      quizId,
      question: form.question,
      questionType: form.questionType,
      options: form.questionType === 'true_false'
        ? form.options.map((o) => ({ ...o, text: o.id === 'true' ? 'True' : 'False' }))
        : form.options,
      explanation: form.explanation,
      orderIndex: editing?.orderIndex ?? questions.length,
    };

    const result = editing
      ? await updateQuizQuestion(editing.id, payload)
      : await addQuizQuestion(payload);

    setSaving(false);

    if (result.success) {
      toast({ title: editing ? 'Question updated' : 'Question added' });
      setShowForm(false);
      resetForm();
      loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteQuizQuestion(id);
    if (result.success) {
      toast({ title: 'Question deleted' });
      loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const questionTypeBadge = (type: string) => {
    if (type === 'single') return <Badge variant="secondary">Single Choice</Badge>;
    if (type === 'multiple') return <Badge variant="secondary">Multiple Choice</Badge>;
    return <Badge variant="secondary">True/False</Badge>;
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-3">
            <Link href="/admin/quizzes"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Quizzes</Link>
          </Button>
          {quiz && (
            <>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{quiz.title}</h1>
              <p className="mt-1 text-muted-foreground">
                Passing score: {quiz.passingScore}% | Time limit: {quiz.timeLimit}s | {questions.length} questions
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Questions</h2>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                        {questionTypeBadge(q.questionType)}
                      </div>
                      <p className="mt-2 font-medium">{q.question}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm',
                              opt.isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-border'
                            )}
                          >
                            {opt.isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
                            {opt.text}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="mt-2 text-xs text-muted-foreground">Explanation: {q.explanation}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(q)}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => handleDelete(q.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
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
              icon={<Plus className="h-7 w-7" />}
              title="No questions yet"
              description="Add MCQ or True/False questions to this quiz."
              action={{ label: 'Add Question', onClick: openCreate }}
            />
          </Card>
        )}

        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl"
              >
                <Card className="max-h-[90vh] overflow-y-auto p-6 shadow-float">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">{editing ? 'Edit Question' : 'Add Question'}</h3>
                    <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={form.questionType === 'single' ? 'default' : 'outline'}
                          onClick={() => setForm({ ...form, questionType: 'single' })}
                        >
                          Single Choice
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={form.questionType === 'multiple' ? 'default' : 'outline'}
                          onClick={() => setForm({ ...form, questionType: 'multiple' })}
                        >
                          Multiple Choice
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={form.questionType === 'true_false' ? 'default' : 'outline'}
                          onClick={setTrueFalseOptions}
                        >
                          True/False
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Input
                        value={form.question}
                        onChange={(e) => setForm({ ...form, question: e.target.value })}
                        placeholder="What is the structure of DNA?"
                        required
                      />
                    </div>
                    {form.questionType !== 'true_false' ? (
                      <div className="space-y-3">
                        <Label>Options (check the correct answer{form.questionType === 'multiple' ? 's' : ''})</Label>
                        {form.options.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateOption(idx, 'isCorrect', !opt.isCorrect)}
                              className={cn(
                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                opt.isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted-foreground/30'
                              )}
                            >
                              {opt.isCorrect && <CheckCircle2 className="h-4 w-4" />}
                            </button>
                            <Input
                              value={opt.text}
                              onChange={(e) => updateOption(idx, 'text', e.target.value)}
                              placeholder={`Option ${idx + 1}`}
                              className="flex-1"
                            />
                            {form.options.length > 2 && (
                              <Button type="button" size="sm" variant="ghost" className="text-rose-600" onClick={() => removeOption(idx)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button type="button" size="sm" variant="outline" onClick={addOption}>
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add Option
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Label>Correct Answer</Label>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            size="sm"
                            variant={form.options[0]?.isCorrect ? 'default' : 'outline'}
                            onClick={() => {
                              const updated = [
                                { id: 'true', text: 'True', isCorrect: true },
                                { id: 'false', text: 'False', isCorrect: false },
                              ];
                              setForm({ ...form, options: updated });
                            }}
                          >
                            True
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={form.options[1]?.isCorrect ? 'default' : 'outline'}
                            onClick={() => {
                              const updated = [
                                { id: 'true', text: 'True', isCorrect: false },
                                { id: 'false', text: 'False', isCorrect: true },
                              ];
                              setForm({ ...form, options: updated });
                            }}
                          >
                            False
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Explanation (optional)</Label>
                      <Input
                        value={form.explanation}
                        onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                        placeholder="Brief explanation of the correct answer"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {editing ? 'Update Question' : 'Add Question'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
