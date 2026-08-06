'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FileText, Plus, Trash2, CreditCard as Edit3, Loader as Loader2, X, Calendar, Award, ArrowRight, BookOpen } from 'lucide-react';
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
import { createAssignment, updateAssignment, deleteAssignment, type AssignmentWithCourse } from '@/lib/services/assignment-service';
import { cn } from '@/lib/utils';

type CourseOption = { id: string; title: string };
type ModuleOption = { id: string; title: string; course_id: string };

export default function InstructorAssignmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = React.useState<AssignmentWithCourse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<AssignmentWithCourse | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [courses, setCourses] = React.useState<CourseOption[]>([]);
  const [modules, setModules] = React.useState<ModuleOption[]>([]);
  const [form, setForm] = React.useState({ courseId: '', moduleId: '' as string | null, title: '', description: '', dueDate: '', maxScore: 100, allowedFileTypes: 'PDF,DOCX,ZIP' });

  const loadAssignments = React.useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const supabase = createClient();
    const { data: courseData } = await supabase.from('courses').select('id').eq('instructor_id', user.id);
    const courseIds = (courseData ?? []).map((c: Record<string, unknown>) => c.id as string);
    if (courseIds.length === 0) { setLoading(false); return; }

    const { data } = await supabase
      .from('assignments')
      .select('*, courses(title), modules(title)')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });

    const mapped: AssignmentWithCourse[] = (data ?? []).map((row: Record<string, unknown>) => {
      const course = row.courses as Record<string, unknown> | undefined;
      const mod = row.modules as Record<string, unknown> | undefined;
      return {
        id: row.id as string, courseId: row.course_id as string, lessonId: (row.lesson_id as string) ?? null,
        moduleId: (row.module_id as string) ?? null, title: row.title as string, description: (row.description as string) ?? '',
        dueDate: (row.due_date as string) ?? null, maxScore: (row.max_score as number) ?? 100,
        allowedFileTypes: (row.allowed_file_types as string[]) ?? [], createdAt: (row.created_at as string) ?? '',
        courseTitle: course?.title as string | undefined, moduleTitle: (mod?.title as string) ?? undefined,
      };
    });
    setAssignments(mapped);
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
    loadAssignments();
  }, [user, loadAssignments]);

  const resetForm = () => { setForm({ courseId: '', moduleId: null, title: '', description: '', dueDate: '', maxScore: 100, allowedFileTypes: 'PDF,DOCX,ZIP' }); setEditing(null); };
  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (a: AssignmentWithCourse) => { setForm({ courseId: a.courseId, moduleId: a.moduleId, title: a.title, description: a.description, dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : '', maxScore: a.maxScore, allowedFileTypes: a.allowedFileTypes.join(',') }); setEditing(a); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId) { toast({ title: 'Select a course', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { courseId: form.courseId, moduleId: form.moduleId || null, title: form.title, description: form.description, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null, maxScore: form.maxScore, allowedFileTypes: form.allowedFileTypes.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) };
    const result = editing ? await updateAssignment(editing.id, payload) : await createAssignment(payload);
    setSaving(false);
    if (result.success) { toast({ title: editing ? 'Assignment updated' : 'Assignment created' }); setShowForm(false); resetForm(); loadAssignments(); }
    else toast({ title: 'Error', description: result.error, variant: 'destructive' });
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAssignment(id);
    if (result.success) { toast({ title: 'Assignment deleted' }); loadAssignments(); }
    else toast({ title: 'Error', description: result.error, variant: 'destructive' });
  };

  const filteredModules = form.courseId ? modules.filter((m) => m.course_id === form.courseId) : [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="font-display text-2xl font-bold sm:text-3xl">My Assignments</h1><p className="mt-1 text-muted-foreground">Create assignments for your courses and review submissions.</p></div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New Assignment</Button>
        </div>

        {loading ? (<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>) : assignments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignments.map((a, i) => {
              const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="p-5 shadow-soft transition-all hover:shadow-card">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white"><FileText className="h-5 w-5" /></div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Edit3 className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => handleDelete(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <p className="mt-3 font-display text-lg font-bold">{a.title}</p>
                    {a.courseTitle && <p className="flex items-center gap-1 text-xs text-muted-foreground"><BookOpen className="h-3 w-3" /> {a.courseTitle}</p>}
                    {a.moduleTitle && <Badge variant="secondary" className="mt-2">{a.moduleTitle}</Badge>}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Award className="h-3 w-3" />Max: {a.maxScore}</span>
                      {a.dueDate && <span className={cn('flex items-center gap-1', isOverdue && 'text-rose-600')}><Calendar className="h-3 w-3" />Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 shadow-soft"><EmptyState icon={<FileText className="h-7 w-7" />} title="No assignments yet" description="Create assignments for your courses and track student submissions." action={{ label: 'Create Assignment', onClick: openCreate }} /></Card>
        )}

        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
                <Card className="max-h-[90vh] overflow-y-auto p-6 shadow-float">
                  <div className="flex items-center justify-between"><h3 className="font-display text-lg font-bold">{editing ? 'Edit Assignment' : 'New Assignment'}</h3><button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="space-y-2"><Label>Course</Label><select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value, moduleId: null })} className="h-9 w-full rounded-md border bg-background px-3 text-sm" required disabled={!!editing}><option value="">Select a course</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
                    <div className="space-y-2"><Label>Module (optional)</Label><select value={form.moduleId ?? ''} onChange={(e) => setForm({ ...form, moduleId: e.target.value || null })} className="h-9 w-full rounded-md border bg-background px-3 text-sm" disabled={!form.courseId}><option value="">No specific module</option>{filteredModules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
                    <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="DNA Sequence Analysis Project" required /></div>
                    <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Analyze a given DNA sequence and submit a report" /></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Max Score</Label><Input type="number" min="1" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: parseInt(e.target.value) || 100 })} required /></div>
                    </div>
                    <div className="space-y-2"><Label>Allowed File Types (comma-separated)</Label><Input value={form.allowedFileTypes} onChange={(e) => setForm({ ...form, allowedFileTypes: e.target.value })} placeholder="PDF,DOCX,ZIP" /></div>
                    <div className="flex gap-2 pt-2"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{editing ? 'Update Assignment' : 'Create Assignment'}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
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
