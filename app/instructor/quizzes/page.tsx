'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ClipboardList, Plus, Trash2, CreditCard as Edit3, Loader as Loader2, X, CircleHelp as HelpCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { createQuiz, updateQuiz, deleteQuiz, type QuizWithCourse } from '@/lib/services/quiz-service';
import { cn } from '@/lib/utils';

type CourseOption = { id: string; title: string };
type ModuleOption = { id: string; title: string; course_id: string };

export default function InstructorQuizzesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = React.useState<QuizWithCourse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<QuizWithCourse | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [courses, setCourses] = React.useState<CourseOption[]>([]);
  const [modules, setModules] = React.useState<ModuleOption[]>([]);
  const [form, setForm] = React.useState({ courseId: '', moduleId: '' as string | null, title: '', description: '', passingScore: 70, timeLimit: 600 });

  const loadQuizzes = React.useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const supabase = createClient();
    const { data: courseData } = await supabase.from('courses').select('id').eq('instructor_id', user.id);
    const courseIds = (courseData ?? []).map((c: Record<string, unknown>) => c.id as string);
    if (courseIds.length === 0) { setLoading(false); return; }

    const { data: quizData } = await supabase
      .from('quizzes')
      .select('*, courses(title), modules(title)')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });

    const mapped: QuizWithCourse[] = (quizData ?? []).map((row: Record<string, unknown>) => {
      const course = row.courses as Record<string, unknown> | undefined;
      const mod = row.modules as Record<string, unknown> | undefined;
      return {
        id: row.id as string, courseId: row.course_id as string, lessonId: (row.lesson_id as string) ?? null,
        moduleId: (row.module_id as string) ?? null, title: row.title as string, description: (row.description as string) ?? '',
        passingScore: (row.passing_score as number) ?? 70, timeLimit: (row.time_limit as number) ?? 600, createdAt: (row.created_at as string) ?? '',
        courseTitle: course?.title as string | undefined, moduleTitle: (mod?.title as string) ?? undefined,
      };
    });
    setQuizzes(mapped);
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = createClient();
      const { data: courseData } = await supabase.from('courses').select('id, title').eq('instructor_id', user.id).order('title', { ascending: true });
      setCourses((courseData ?? []) as CourseOption[]);
      const { data: moduleData } = await supabase.from('modules').select('id, title, course_id').order('order_index', { ascending: true });
      setModules((moduleData ?? []) as ModuleOption[]);
    })();
    loadQuizzes();
  }, [user, loadQuizzes]);

  const resetForm = () => { setForm({ courseId: '', moduleId: null, title: '', description: '', passingScore: 70, timeLimit: 600 }); setEditing(null); };
  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (quiz: QuizWithCourse) => { setForm({ courseId: quiz.courseId, moduleId: quiz.moduleId, title: quiz.title, description: quiz.description, passingScore: quiz.passingScore, timeLimit: quiz.timeLimit }); setEditing(quiz); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId) { toast({ title: 'Select a course', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { courseId: form.courseId, moduleId: form.moduleId || null, title: form.title, description: form.description, passingScore: form.passingScore, timeLimit: form.timeLimit };
    const result = editing ? await updateQuiz(editing.id, payload) : await createQuiz(payload);
    setSaving(false);
    if (result.success) { toast({ title: editing ? 'Quiz updated' : 'Quiz created' }); setShowForm(false); resetForm(); loadQuizzes(); }
    else toast({ title: 'Error', description: result.error, variant: 'destructive' });
  };

  const handleDelete = async (id: string) => {
    const result = await deleteQuiz(id);
    if (result.success) { toast({ title: 'Quiz deleted' }); loadQuizzes(); }
    else toast({ title: 'Error', description: result.error, variant: 'destructive' });
  };

  const filteredModules = form.courseId ? modules.filter((m) => m.course_id === form.courseId) : [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="font-display text-2xl font-bold sm:text-3xl">My Quizzes</h1><p className="mt-1 text-muted-foreground">Create and manage quizzes for your courses.</p></div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New Quiz</Button>
        </div>

        {loading ? (<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>) : quizzes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz, i) => (
              <motion.div key={quiz.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-5 shadow-soft transition-all hover:shadow-card">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><ClipboardList className="h-5 w-5" /></div>
                    <div className="flex gap-1">
                      <Button asChild size="sm" variant="ghost"><Link href={`/instructor/quizzes/${quiz.id}`}><HelpCircle className="h-3.5 w-3.5" /></Link></Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(quiz)}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => handleDelete(quiz.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <p className="mt-3 font-display text-lg font-bold">{quiz.title}</p>
                  {quiz.courseTitle && <p className="text-xs text-muted-foreground">{quiz.courseTitle}</p>}
                  {quiz.moduleTitle && <Badge variant="secondary" className="mt-2">{quiz.moduleTitle}</Badge>}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground"><span>Pass: {quiz.passingScore}%</span><span>Time: {quiz.timeLimit}s</span></div>
                  <Button asChild size="sm" variant="outline" className="mt-3 w-full"><Link href={`/instructor/quizzes/${quiz.id}`}>Manage Questions <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 shadow-soft"><EmptyState icon={<ClipboardList className="h-7 w-7" />} title="No quizzes yet" description="Create quizzes with MCQ and True/False questions for your courses." action={{ label: 'Create Quiz', onClick: openCreate }} /></Card>
        )}

        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
                <Card className="max-h-[90vh] overflow-y-auto p-6 shadow-float">
                  <div className="flex items-center justify-between"><h3 className="font-display text-lg font-bold">{editing ? 'Edit Quiz' : 'New Quiz'}</h3><button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="space-y-2"><Label>Course</Label><select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value, moduleId: null })} className="h-9 w-full rounded-md border bg-background px-3 text-sm" required disabled={!!editing}><option value="">Select a course</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
                    <div className="space-y-2"><Label>Module (optional)</Label><select value={form.moduleId ?? ''} onChange={(e) => setForm({ ...form, moduleId: e.target.value || null })} className="h-9 w-full rounded-md border bg-background px-3 text-sm" disabled={!form.courseId}><option value="">No specific module</option>{filteredModules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
                    <div className="space-y-2"><Label>Quiz Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Introduction to DNA Quiz" required /></div>
                    <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Test your knowledge on DNA basics" /></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Passing Score (%)</Label><Input type="number" min="0" max="100" value={form.passingScore} onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) || 0 })} required /></div>
                      <div className="space-y-2"><Label>Time Limit (seconds)</Label><Input type="number" min="0" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: parseInt(e.target.value) || 0 })} required /></div>
                    </div>
                    <div className="flex gap-2 pt-2"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{editing ? 'Update Quiz' : 'Create Quiz'}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
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
