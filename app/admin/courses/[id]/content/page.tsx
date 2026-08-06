'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, CreditCard as Edit3, Loader as Loader2, X,
  Folder, FileText, Video, File, Download, Link as LinkIcon,
  ChevronUp, ChevronDown, BookOpen, Save, Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { CourseFilesManager } from '@/components/course-files-manager';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Module = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
};

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content_type: string;
  video_url: string;
  video_type: string;
  duration: string;
  rich_content: string | null;
  pdf_url: string | null;
  slides_url: string | null;
  resource_url: string | null;
  external_references: { title: string; url: string; description: string }[];
  order_index: number;
  preview: boolean;
};

type ExternalRef = { title: string; url: string; description: string };

export default function AdminCourseContentPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { toast } = useToast();
  const [course, setCourse] = React.useState<{ id: string; title: string; slug: string } | null>(null);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = React.useState<Record<string, Lesson[]>>({});
  const [expandedModule, setExpandedModule] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [showModuleForm, setShowModuleForm] = React.useState(false);
  const [editingModule, setEditingModule] = React.useState<Module | null>(null);
  const [moduleForm, setModuleForm] = React.useState({ title: '', description: '' });
  const [savingModule, setSavingModule] = React.useState(false);

  const [showLessonForm, setShowLessonForm] = React.useState(false);
  const [editingLesson, setEditingLesson] = React.useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = React.useState({
    title: '',
    description: '',
    content_type: 'video' as string,
    video_url: '',
    video_type: 'youtube' as string,
    duration: '',
    rich_content: '',
    pdf_url: '',
    slides_url: '',
    resource_url: '',
    external_references: [] as ExternalRef[],
    preview: false,
  });
  const [savingLesson, setSavingLesson] = React.useState(false);
  const [lessonModuleId, setLessonModuleId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    const supabase = createClient();
    const [{ data: courseData }, { data: moduleData }] = await Promise.all([
      supabase.from('courses').select('id, title, slug').eq('id', courseId).maybeSingle(),
      supabase.from('modules').select('*').eq('course_id', courseId).order('order_index', { ascending: true }),
    ]);

    setCourse(courseData as { id: string; title: string; slug: string } | null);
    const mods = (moduleData ?? []) as unknown as Module[];
    setModules(mods);

    if (mods.length > 0) {
      const moduleIds = mods.map((m) => m.id);
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('order_index', { ascending: true });

      const map: Record<string, Lesson[]> = {};
      (lessonData ?? []).forEach((l: Record<string, unknown>) => {
        const mid = l.module_id as string;
        if (!map[mid]) map[mid] = [];
        map[mid].push({
          id: l.id as string,
          module_id: mid,
          title: l.title as string,
          description: (l.description as string) ?? '',
          content_type: (l.content_type as string) ?? 'video',
          video_url: (l.video_url as string) ?? '',
          video_type: (l.video_type as string) ?? 'mp4',
          duration: (l.duration as string) ?? '',
          rich_content: (l.rich_content as string) ?? null,
          pdf_url: (l.pdf_url as string) ?? null,
          slides_url: (l.slides_url as string) ?? null,
          resource_url: (l.resource_url as string) ?? null,
          external_references: (l.external_references as ExternalRef[]) ?? [],
          order_index: (l.order_index as number) ?? 0,
          preview: (l.preview as boolean) ?? false,
        });
      });
      setLessonsByModule(map);
      if (expandedModule === null && mods.length > 0) setExpandedModule(mods[0].id);
    }

    setLoading(false);
  }, [courseId, expandedModule]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Module handlers
  const resetModuleForm = () => {
    setModuleForm({ title: '', description: '' });
    setEditingModule(null);
  };

  const openCreateModule = () => {
    resetModuleForm();
    setShowModuleForm(true);
  };

  const openEditModule = (mod: Module) => {
    setModuleForm({ title: mod.title, description: mod.description });
    setEditingModule(mod);
    setShowModuleForm(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSavingModule(true);
    const supabase = createClient();

    if (editingModule) {
      const { error } = await supabase
        .from('modules')
        .update({ title: moduleForm.title, description: moduleForm.description })
        .eq('id', editingModule.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Module updated' });
        setShowModuleForm(false);
        resetModuleForm();
        loadData();
      }
    } else {
      const { error } = await supabase.from('modules').insert({
        course_id: courseId,
        title: moduleForm.title,
        description: moduleForm.description,
        order_index: modules.length,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Module created' });
        setShowModuleForm(false);
        resetModuleForm();
        loadData();
      }
    }
    setSavingModule(false);
  };

  const handleDeleteModule = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Module deleted' });
      loadData();
    }
  };

  const reorderModule = async (id: string, direction: 'up' | 'down') => {
    const idx = modules.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= modules.length) return;

    const supabase = createClient();
    const mod1 = modules[idx];
    const mod2 = modules[swapIdx];
    await Promise.all([
      supabase.from('modules').update({ order_index: mod2.order_index }).eq('id', mod1.id),
      supabase.from('modules').update({ order_index: mod1.order_index }).eq('id', mod2.id),
    ]);
    loadData();
  };

  // Lesson handlers
  const resetLessonForm = () => {
    setLessonForm({
      title: '', description: '', content_type: 'video', video_url: '', video_type: 'youtube',
      duration: '', rich_content: '', pdf_url: '', slides_url: '', resource_url: '',
      external_references: [], preview: false,
    });
    setEditingLesson(null);
  };

  const openCreateLesson = (moduleId: string) => {
    resetLessonForm();
    setLessonModuleId(moduleId);
    setShowLessonForm(true);
  };

  const openEditLesson = (lesson: Lesson) => {
    setLessonForm({
      title: lesson.title,
      description: lesson.description,
      content_type: lesson.content_type,
      video_url: lesson.video_url,
      video_type: lesson.video_type,
      duration: lesson.duration,
      rich_content: lesson.rich_content ?? '',
      pdf_url: lesson.pdf_url ?? '',
      slides_url: lesson.slides_url ?? '',
      resource_url: lesson.resource_url ?? '',
      external_references: lesson.external_references ?? [],
      preview: lesson.preview,
    });
    setEditingLesson(lesson);
    setLessonModuleId(lesson.module_id);
    setShowLessonForm(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.title.trim() || !lessonModuleId) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSavingLesson(true);
    const supabase = createClient();

    const payload = {
      module_id: lessonModuleId,
      title: lessonForm.title,
      description: lessonForm.description,
      content_type: lessonForm.content_type,
      video_url: lessonForm.video_url || null,
      video_type: lessonForm.video_type,
      duration: lessonForm.duration || null,
      rich_content: lessonForm.rich_content || null,
      pdf_url: lessonForm.pdf_url || null,
      slides_url: lessonForm.slides_url || null,
      resource_url: lessonForm.resource_url || null,
      external_references: lessonForm.external_references,
      preview: lessonForm.preview,
    };

    if (editingLesson) {
      const { error } = await supabase.from('lessons').update(payload).eq('id', editingLesson.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Topic updated' });
        setShowLessonForm(false);
        resetLessonForm();
        loadData();
      }
    } else {
      const existing = lessonsByModule[lessonModuleId] ?? [];
      const { error } = await supabase.from('lessons').insert({
        ...payload,
        order_index: existing.length,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Topic created' });
        setShowLessonForm(false);
        resetLessonForm();
        loadData();
      }
    }
    setSavingLesson(false);
  };

  const handleDeleteLesson = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Topic deleted' });
      loadData();
    }
  };

  const reorderLesson = async (moduleId: string, lessonId: string, direction: 'up' | 'down') => {
    const lessons = lessonsByModule[moduleId] ?? [];
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;

    const supabase = createClient();
    const l1 = lessons[idx];
    const l2 = lessons[swapIdx];
    await Promise.all([
      supabase.from('lessons').update({ order_index: l2.order_index }).eq('id', l1.id),
      supabase.from('lessons').update({ order_index: l1.order_index }).eq('id', l2.id),
    ]);
    loadData();
  };

  const addExternalRef = () => {
    setLessonForm({
      ...lessonForm,
      external_references: [...lessonForm.external_references, { title: '', url: '', description: '' }],
    });
  };

  const updateExternalRef = (idx: number, field: keyof ExternalRef, value: string) => {
    const updated = lessonForm.external_references.map((r, i) =>
      i === idx ? { ...r, [field]: value } : r
    );
    setLessonForm({ ...lessonForm, external_references: updated });
  };

  const removeExternalRef = (idx: number) => {
    setLessonForm({
      ...lessonForm,
      external_references: lessonForm.external_references.filter((_, i) => i !== idx),
    });
  };

  const contentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'notes': return FileText;
      case 'pdf': return File;
      case 'slides': return File;
      case 'resource': return Download;
      case 'reference': return LinkIcon;
      default: return FileText;
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

  if (!course) {
    return (
      <PageTransition>
        <Card className="p-6 shadow-soft">
          <p className="text-center text-muted-foreground">Course not found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/courses">Back to Courses</Link>
          </Button>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-3">
            <Link href="/admin/courses"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Courses</Link>
          </Button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{course.title}</h1>
              <p className="mt-1 text-muted-foreground">Manage modules and topics for this course.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/courses/${course.id}/edit`}><Edit3 className="mr-1 h-4 w-4" /> Edit Course</Link>
              </Button>
              <Button onClick={openCreateModule} size="sm">
                <Plus className="mr-1 h-4 w-4" /> Add Module
              </Button>
            </div>
          </div>
        </div>

        {modules.length > 0 ? (
          <div className="space-y-4">
            {modules.map((mod, mi) => {
              const lessons = lessonsByModule[mod.id] ?? [];
              const isExpanded = expandedModule === mod.id;
              return (
                <motion.div key={mod.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: mi * 0.04 }}>
                  <Card className="shadow-soft">
                    <div className="flex items-center gap-3 border-b p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">MODULE {mi + 1}</span>
                        </div>
                        <p className="font-display text-base font-bold">{mod.title}</p>
                        {mod.description && <p className="truncate text-xs text-muted-foreground">{mod.description}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => reorderModule(mod.id, 'up')} disabled={mi === 0}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => reorderModule(mod.id, 'down')} disabled={mi === modules.length - 1}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setExpandedModule(isExpanded ? null : mod.id)}>
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditModule(mod)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => handleDeleteModule(mod.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-4">
                            {lessons.length > 0 ? (
                              <div className="space-y-2">
                                {lessons.map((lesson, li) => {
                                  const Icon = contentTypeIcon(lesson.content_type);
                                  return (
                                    <div key={lesson.id} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Icon className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium">{lesson.title}</p>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-[10px] capitalize">{lesson.content_type}</Badge>
                                          {lesson.duration && <span className="text-xs text-muted-foreground">{lesson.duration}</span>}
                                          {lesson.preview && <Badge variant="outline" className="text-[10px]">Free Preview</Badge>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button size="sm" variant="ghost" onClick={() => reorderLesson(mod.id, lesson.id, 'up')} disabled={li === 0}>
                                          <ChevronUp className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => reorderLesson(mod.id, lesson.id, 'down')} disabled={li === lessons.length - 1}>
                                          <ChevronDown className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => openEditLesson(lesson)}>
                                          <Edit3 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => handleDeleteLesson(lesson.id)}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="py-4 text-center text-sm text-muted-foreground">No topics yet. Add your first topic.</p>
                            )}
                            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => openCreateLesson(mod.id)}>
                              <Plus className="mr-1 h-3.5 w-3.5" /> Add Topic
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 shadow-soft">
            <EmptyState
              icon={<Folder className="h-7 w-7" />}
              title="No modules yet"
              description="Create modules to organize your course content, then add topics inside each module."
              action={{ label: 'Add Module', onClick: openCreateModule }}
            />
          </Card>
        )}

        <Card className="p-6 shadow-soft">
          <CourseFilesManager courseId={courseId} modules={modules.map((m) => ({ id: m.id, title: m.title }))} />
        </Card>

        {/* Module Form Modal */}
        <AnimatePresence>
          {showModuleForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setShowModuleForm(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
                <Card className="p-6 shadow-float">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">{editingModule ? 'Edit Module' : 'New Module'}</h3>
                    <button onClick={() => setShowModuleForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                  </div>
                  <form onSubmit={handleSaveModule} className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Module Title</Label>
                      <Input value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Introduction to DNA" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} rows={3} placeholder="What will students learn in this module?" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={savingModule}>
                        {savingModule ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {editingModule ? 'Update Module' : 'Create Module'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowModuleForm(false)}>Cancel</Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Lesson Form Modal */}
        <AnimatePresence>
          {showLessonForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setShowLessonForm(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
                <Card className="max-h-[90vh] overflow-y-auto p-6 shadow-float">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">{editingLesson ? 'Edit Topic' : 'New Topic'}</h3>
                    <button onClick={() => setShowLessonForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                  </div>
                  <form onSubmit={handleSaveLesson} className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Topic Title</Label>
                      <Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="DNA Structure and Function" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} placeholder="Brief description of this topic" />
                    </div>
                    <div className="space-y-2">
                      <Label>Content Type</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'video', label: 'Video', icon: Video },
                          { value: 'notes', label: 'Rich Text Notes', icon: FileText },
                          { value: 'pdf', label: 'PDF File', icon: File },
                          { value: 'slides', label: 'Slides/PPT', icon: File },
                          { value: 'resource', label: 'Downloadable', icon: Download },
                          { value: 'reference', label: 'External Ref', icon: LinkIcon },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <button key={opt.value} type="button" onClick={() => setLessonForm({ ...lessonForm, content_type: opt.value })}
                              className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
                                lessonForm.content_type === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/40')}>
                              <Icon className="h-3.5 w-3.5" /> {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {lessonForm.content_type === 'video' && (
                      <div className="space-y-3 rounded-lg border p-4">
                        <div className="space-y-2">
                          <Label>Video URL</Label>
                          <Input value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Video Type</Label>
                          <select value={lessonForm.video_type} onChange={(e) => setLessonForm({ ...lessonForm, video_type: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                            <option value="youtube">YouTube</option>
                            <option value="vimeo">Vimeo</option>
                            <option value="mp4">Direct MP4</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (e.g. "15:30")</Label>
                          <Input value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} placeholder="15:30" />
                        </div>
                      </div>
                    )}

                    {lessonForm.content_type === 'notes' && (
                      <div className="space-y-2">
                        <Label>Rich Text Notes</Label>
                        <Textarea value={lessonForm.rich_content} onChange={(e) => setLessonForm({ ...lessonForm, rich_content: e.target.value })} rows={8} placeholder="Write your notes here. You can use HTML for formatting (bold, italic, lists, etc.)" />
                        <p className="text-xs text-muted-foreground">Supports HTML formatting for rich text content.</p>
                      </div>
                    )}

                    {lessonForm.content_type === 'pdf' && (
                      <div className="space-y-2">
                        <Label>PDF URL</Label>
                        <Input value={lessonForm.pdf_url} onChange={(e) => setLessonForm({ ...lessonForm, pdf_url: e.target.value })} placeholder="https://... or upload to Supabase Storage" />
                        <p className="text-xs text-muted-foreground">Upload your PDF to Supabase Storage and paste the public URL here.</p>
                      </div>
                    )}

                    {lessonForm.content_type === 'slides' && (
                      <div className="space-y-2">
                        <Label>Slides/PPT URL</Label>
                        <Input value={lessonForm.slides_url} onChange={(e) => setLessonForm({ ...lessonForm, slides_url: e.target.value })} placeholder="https://... or upload to Supabase Storage" />
                      </div>
                    )}

                    {lessonForm.content_type === 'resource' && (
                      <div className="space-y-2">
                        <Label>Downloadable Resource URL</Label>
                        <Input value={lessonForm.resource_url} onChange={(e) => setLessonForm({ ...lessonForm, resource_url: e.target.value })} placeholder="https://... or upload to Supabase Storage" />
                      </div>
                    )}

                    {lessonForm.content_type === 'reference' && (
                      <div className="space-y-3">
                        <Label>External References</Label>
                        {lessonForm.external_references.map((ref, idx) => (
                          <div key={idx} className="flex flex-col gap-2 rounded-lg border p-3">
                            <div className="flex gap-2">
                              <Input value={ref.title} onChange={(e) => updateExternalRef(idx, 'title', e.target.value)} placeholder="Reference title" className="flex-1" />
                              <Button type="button" size="sm" variant="ghost" className="text-rose-600" onClick={() => removeExternalRef(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                            <Input value={ref.url} onChange={(e) => updateExternalRef(idx, 'url', e.target.value)} placeholder="https://..." />
                            <Input value={ref.description} onChange={(e) => updateExternalRef(idx, 'description', e.target.value)} placeholder="Brief description" />
                          </div>
                        ))}
                        <Button type="button" size="sm" variant="outline" onClick={addExternalRef}><Plus className="mr-1 h-3.5 w-3.5" /> Add Reference</Button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={lessonForm.preview} onChange={(e) => setLessonForm({ ...lessonForm, preview: e.target.checked })} className="h-4 w-4 rounded border-border" />
                        Allow free preview (non-enrolled students can access)
                      </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={savingLesson}>
                        {savingLesson ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {editingLesson ? 'Update Topic' : 'Create Topic'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowLessonForm(false)}>Cancel</Button>
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
