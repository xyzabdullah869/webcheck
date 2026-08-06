'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Loader as Loader2, Pencil, Trash2, Power, Globe, Mic, CircleAlert as AlertCircle, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import {
  listTeachers, createTeacher, updateTeacher, deleteTeacher, toggleTeacherActive,
  type TeacherInput,
} from '@/lib/teachers/teacher-service';
import type { DbTeacher } from '@/lib/database-types';

const TEACHING_STYLES = ['friendly', 'professional', 'casual', 'academic'] as const;
const VOICE_PROVIDERS = ['elevenlabs', 'azure', 'google', 'openai', 'amazon'] as const;

export default function AdminVCTeachersPage() {
  const { toast } = useToast();
  const [teachers, setTeachers] = React.useState<DbTeacher[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<TeacherInput>({
    name: '', display_name: '', profile_photo: null, gender: null,
    voice_provider: null, voice_id: null, teaching_style: 'friendly',
    languages: ['en'], bio: null, experience: null, is_active: true,
  });
  const [languageInput, setLanguageInput] = React.useState('');

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTeachers();
      setTeachers(data);
    } catch {
      toast({ title: 'Failed to load teachers', variant: 'destructive' });
    }
    setLoading(false);
  }, [toast]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const filtered = teachers.filter((t) => !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()) || t.display_name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', display_name: '', profile_photo: null, gender: null, voice_provider: null, voice_id: null, teaching_style: 'friendly', languages: ['en'], bio: null, experience: null, is_active: true });
    setLanguageInput('');
    setDialogOpen(true);
  };

  const openEdit = (teacher: DbTeacher) => {
    setEditingId(teacher.id);
    setForm({
      name: teacher.name, display_name: teacher.display_name, profile_photo: teacher.profile_photo,
      gender: teacher.gender, voice_provider: teacher.voice_provider, voice_id: teacher.voice_id,
      teaching_style: teacher.teaching_style, languages: teacher.languages, bio: teacher.bio,
      experience: teacher.experience, is_active: teacher.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.display_name.trim()) { toast({ title: 'Name and display name are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateTeacher(editingId, form);
        toast({ title: 'Teacher updated' });
      } else {
        await createTeacher(form);
        toast({ title: 'Teacher created' });
      }
      setDialogOpen(false);
      await loadData();
    } catch {
      toast({ title: 'Failed to save teacher', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteTeacher(id);
    toast({ title: ok ? 'Teacher deleted' : 'Failed to delete', variant: ok ? 'default' : 'destructive' });
    setConfirmDelete(null);
    if (ok) await loadData();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleTeacherActive(id, isActive);
    await loadData();
  };

  const addLanguage = () => {
    if (languageInput.trim() && !(form.languages ?? []).includes(languageInput.trim())) {
      setForm({ ...form, languages: [...(form.languages ?? ['en']), languageInput.trim()] });
      setLanguageInput('');
    }
  };

  const removeLanguage = (lang: string) => {
    setForm({ ...form, languages: (form.languages ?? []).filter((l) => l !== lang) });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Virtual Teacher Management</h1>
            <p className="mt-1 text-muted-foreground">Create and manage AI teacher profiles assigned to batches.</p>
          </div>
          <Button onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
            <Plus className="mr-2 h-4 w-4" /> New Teacher
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><GraduationCap className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{teachers.length}</p>
            <p className="text-xs text-muted-foreground">Total Teachers</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><Power className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{teachers.filter((t) => t.is_active).length}</p>
            <p className="text-xs text-muted-foreground">Active Teachers</p>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teachers..." className="pl-9" />
        </div>

        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((teacher, i) => (
                <motion.div key={teacher.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="p-5 shadow-soft transition-all hover:shadow-card">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold overflow-hidden">
                        {teacher.profile_photo ? <img src={teacher.profile_photo} alt={teacher.display_name} className="h-full w-full object-cover" /> : teacher.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{teacher.display_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{teacher.name}</p>
                      </div>
                      <Switch checked={teacher.is_active} onCheckedChange={(v) => handleToggle(teacher.id, v)} />
                    </div>
                    {teacher.bio && <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{teacher.bio}</p>}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {teacher.teaching_style && <Badge variant="secondary" className="text-[10px] capitalize">{teacher.teaching_style}</Badge>}
                      {teacher.languages.map((l) => <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>)}
                      {teacher.voice_provider && <Badge variant="outline" className="text-[10px] gap-1"><Mic className="h-2.5 w-2.5" />{teacher.voice_provider}</Badge>}
                    </div>
                    {teacher.experience && <p className="mt-2 text-xs text-muted-foreground">{teacher.experience}</p>}
                    <div className="mt-4 flex items-center gap-2 border-t pt-3">
                      <Button size="sm" variant="outline" onClick={() => openEdit(teacher)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(teacher.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<GraduationCap className="h-7 w-7" />} title="No teachers found" description="Create your first virtual teacher profile." />
          )}
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Teacher' : 'Create Teacher'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Smith" />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={form.display_name ?? ''} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="e.g. Mr. John" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender ?? '__none'} onValueChange={(v) => setForm({ ...form, gender: v === '__none' ? null : v as 'male' | 'female' })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Not specified</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teaching Style</Label>
                <Select value={form.teaching_style ?? 'friendly'} onValueChange={(v) => setForm({ ...form, teaching_style: v as TeacherInput['teaching_style'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEACHING_STYLES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Voice Provider</Label>
                <Select value={form.voice_provider ?? '__none'} onValueChange={(v) => setForm({ ...form, voice_provider: v === '__none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {VOICE_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Voice ID</Label>
                <Input value={form.voice_id ?? ''} onChange={(e) => setForm({ ...form, voice_id: e.target.value || null })} placeholder="e.g. voice_123" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Profile Photo URL</Label>
              <Input value={form.profile_photo ?? ''} onChange={(e) => setForm({ ...form, profile_photo: e.target.value || null })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Languages</Label>
              <div className="flex gap-2">
                <Input value={languageInput} onChange={(e) => setLanguageInput(e.target.value)} placeholder="e.g. en, ur" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLanguage(); } }} />
                <Button type="button" variant="outline" onClick={addLanguage}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(form.languages ?? []).map((l) => (
                  <Badge key={l} variant="secondary" className="gap-1">
                    <Globe className="h-2.5 w-2.5" />{l}
                    <button onClick={() => removeLanguage(l)} className="ml-1 text-xs">&times;</button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={form.bio ?? ''} onChange={(e) => setForm({ ...form, bio: e.target.value || null })} rows={2} placeholder="Teacher bio..." />
            </div>
            <div className="space-y-2">
              <Label>Experience</Label>
              <Textarea value={form.experience ?? ''} onChange={(e) => setForm({ ...form, experience: e.target.value || null })} rows={2} placeholder="Teaching experience..." />
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
              {editingId ? 'Save Changes' : 'Create Teacher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete !== null} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Delete Teacher?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove the teacher profile. Batches assigned to this teacher will need reassignment.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && handleDelete(confirmDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
