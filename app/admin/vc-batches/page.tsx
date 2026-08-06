'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Layers, Plus, Search, Loader as Loader2, Pencil, Trash2, Copy, Power, Users, Calendar, Clock, CircleAlert as AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
  listBatches, createBatch, updateBatch, deleteBatch, toggleBatchActive, duplicateBatch,
  type BatchWithCounts, type BatchInput,
} from '@/lib/batches/batch-service';
import { listTeachers } from '@/lib/teachers/teacher-service';
import type { DbTeacher } from '@/lib/database-types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminVCBatchesPage() {
  const { toast } = useToast();
  const [batches, setBatches] = React.useState<BatchWithCounts[]>([]);
  const [teachers, setTeachers] = React.useState<DbTeacher[]>([]);
  const [courses, setCourses] = React.useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<BatchInput>({
    batch_name: '', course_id: null, teacher_id: null,
    start_date: new Date().toISOString().split('T')[0], end_date: null,
    class_days: ['Mon', 'Wed', 'Fri'], class_time: '09:00',
    class_duration_minutes: 60, max_students: 20, is_active: true,
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [batchData, teacherData] = await Promise.all([listBatches(), listTeachers()]);
      setBatches(batchData);
      setTeachers(teacherData);
      const supabase = createClient();
      const { data: courseData } = await supabase.from('courses').select('id, title').order('title');
      setCourses((courseData ?? []) as { id: string; title: string }[]);
    } catch {
      toast({ title: 'Failed to load data', variant: 'destructive' });
    }
    setLoading(false);
  }, [toast]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const filtered = batches.filter((b) => !search.trim() || b.batch_name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditingId(null);
    setForm({ batch_name: '', course_id: null, teacher_id: null, start_date: new Date().toISOString().split('T')[0], end_date: null, class_days: ['Mon', 'Wed', 'Fri'], class_time: '09:00', class_duration_minutes: 60, max_students: 20, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (batch: BatchWithCounts) => {
    setEditingId(batch.id);
    setForm({
      batch_name: batch.batch_name, course_id: batch.course_id, teacher_id: batch.teacher_id,
      start_date: batch.start_date, end_date: batch.end_date, class_days: batch.class_days,
      class_time: batch.class_time, class_duration_minutes: batch.class_duration_minutes,
      max_students: batch.max_students, is_active: batch.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.batch_name.trim()) { toast({ title: 'Batch name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateBatch(editingId, form);
        toast({ title: 'Batch updated' });
      } else {
        await createBatch(form);
        toast({ title: 'Batch created' });
      }
      setDialogOpen(false);
      await loadData();
    } catch {
      toast({ title: 'Failed to save batch', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteBatch(id);
    toast({ title: ok ? 'Batch deleted' : 'Failed to delete', variant: ok ? 'default' : 'destructive' });
    setConfirmDelete(null);
    if (ok) await loadData();
  };

  const handleDuplicate = async (id: string) => {
    const result = await duplicateBatch(id);
    toast({ title: result ? 'Batch duplicated' : 'Failed to duplicate', variant: result ? 'default' : 'destructive' });
    if (result) await loadData();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleBatchActive(id, isActive);
    await loadData();
  };

  const toggleDay = (day: string) => {
    setForm((f) => {
      const days = f.class_days ?? [];
      return { ...f, class_days: days.includes(day) ? days.filter((d) => d !== day) : [...days, day] };
    });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Batch Management</h1>
            <p className="mt-1 text-muted-foreground">Create and manage course batches for the Virtual Classroom.</p>
          </div>
          <Button onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
            <Plus className="mr-2 h-4 w-4" /> New Batch
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><Layers className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{batches.length}</p>
            <p className="text-xs text-muted-foreground">Total Batches</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><Power className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{batches.filter((b) => b.is_active).length}</p>
            <p className="text-xs text-muted-foreground">Active Batches</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white"><Users className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{batches.reduce((s, b) => s + b.enrolled_count, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Enrolled</p>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search batches..." className="pl-9" />
        </div>

        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((batch, i) => {
                const isFull = batch.enrolled_count >= batch.max_students;
                return (
                  <motion.div key={batch.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <div className="flex items-center justify-between rounded-xl border p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{batch.batch_name}</p>
                          {isFull && <Badge variant="destructive" className="text-[10px]">Full</Badge>}
                          {!batch.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {batch.course_title && <span>{batch.course_title}</span>}
                          {batch.teacher_name && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{batch.teacher_name}</span>}
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{batch.start_date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{batch.class_time} ({batch.class_duration_minutes}m)</span>
                          <span>{batch.class_days.join(', ')}</span>
                          <span className={isFull ? 'font-semibold text-destructive' : ''}>{batch.enrolled_count}/{batch.max_students} students</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={batch.is_active} onCheckedChange={(v) => handleToggle(batch.id, v)} />
                        <Button size="icon" variant="ghost" onClick={() => openEdit(batch)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDuplicate(batch.id)}><Copy className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(batch.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Layers className="h-7 w-7" />} title="No batches found" description="Create your first batch to get started." />
          )}
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Batch' : 'Create Batch'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Batch Name</Label>
              <Input value={form.batch_name} onChange={(e) => setForm({ ...form, batch_name: e.target.value })} placeholder="e.g. Morning Batch - Section A" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={form.course_id ?? '__none'} onValueChange={(v) => setForm({ ...form, course_id: v === '__none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No course</SelectItem>
                    {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned Teacher</Label>
                <Select value={form.teacher_id ?? '__none'} onValueChange={(v) => setForm({ ...form, teacher_id: v === '__none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No teacher</SelectItem>
                    {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.display_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date ?? ''} onChange={(e) => setForm({ ...form, end_date: e.target.value || null })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Class Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${(form.class_days ?? []).includes(day) ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Class Time</Label>
                <Input type="time" value={form.class_time} onChange={(e) => setForm({ ...form, class_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={form.class_duration_minutes} onChange={(e) => setForm({ ...form, class_duration_minutes: parseInt(e.target.value) || 60 })} />
              </div>
              <div className="space-y-2">
                <Label>Max Students</Label>
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 20, 30, 40, 50, 100].map((n) => (
                    <button key={n} type="button" onClick={() => setForm({ ...form, max_students: n })}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${form.max_students === n ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <Input type="number" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: parseInt(e.target.value) || 20 })} placeholder="Custom value" />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <p className="text-sm font-medium">Active</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? 'Save Changes' : 'Create Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete !== null} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Delete Batch?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove the batch and all student enrollments. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && handleDelete(confirmDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
