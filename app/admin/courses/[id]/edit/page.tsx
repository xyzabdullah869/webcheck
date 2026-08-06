'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader as Loader2, BookOpen, DollarSign, Tag, Brain, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function AdminEditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '', slug: '', short_description: '', description: '', price: 0, price_pkr: 0, original_price: 0,
    level: 'Beginner', duration: '', language: 'English', thumbnail: '', trailer_url: '', category_id: '', status: 'Draft',
    featured: false, certificate_enabled: true, teaching_mode: 'instructor' as 'instructor' | 'ai',
  });
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    const courseId = params.id as string;
    const supabase = createClient();
    (async () => {
      const [{ data: course }, { data: cats }] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
        supabase.from('categories').select('id, name').order('name'),
      ]);
      if (course) {
        setForm({
          title: (course.title as string) ?? '',
          slug: (course.slug as string) ?? '',
          short_description: (course.short_description as string) ?? '',
          description: (course.description as string) ?? '',
          price: Number(course.price),
          price_pkr: Number(course.price_pkr ?? 0),
          original_price: course.original_price ? Number(course.original_price) : 0,
          level: (course.level as string) ?? 'Beginner',
          duration: (course.duration as string) ?? '',
          language: (course.language as string) ?? 'English',
          thumbnail: (course.thumbnail as string) ?? '',
          trailer_url: (course.trailer_url as string) ?? '',
          category_id: (course.category_id as string) ?? '',
          status: (course.status as string) ?? 'Draft',
          featured: (course.featured as boolean) ?? false,
          certificate_enabled: (course.certificate_enabled as boolean) ?? true,
          teaching_mode: ((course.teaching_mode as string) ?? 'instructor') as 'instructor' | 'ai',
        });
      }
      setCategories((cats ?? []) as { id: string; name: string }[]);
      setLoading(false);
    })();
  }, [params.id]);

  const handleSave = async (newStatus?: string) => {
    const courseId = params.id as string;
    setSaving(true);
    const supabase = createClient();
    const updates: Record<string, unknown> = {
      title: form.title, slug: form.slug, short_description: form.short_description,
      description: form.description, price: form.price, price_pkr: form.price_pkr, original_price: form.original_price || null,
      level: form.level, duration: form.duration, language: form.language,
      thumbnail: form.thumbnail || null, trailer_url: form.trailer_url || null,
      category_id: form.category_id || null, featured: form.featured, certificate_enabled: form.certificate_enabled,
      teaching_mode: form.teaching_mode,
      updated_at: new Date().toISOString(),
    };
    if (newStatus) updates.status = newStatus;
    const { error } = await supabase.from('courses').update(updates).eq('id', courseId);
    setSaving(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Course updated' }); router.push('/admin/courses'); }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm"><Link href="/admin/courses"><ArrowLeft className="mr-2 h-4 w-4" />Courses</Link></Button>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Edit Course</h1>
          <p className="mt-1 text-muted-foreground">Update course details and publication status.</p>
        </div>
        <div className="space-y-6">
          <Card className="space-y-5 p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Course Information</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>Course Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>URL Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="font-mono text-sm" /></div>
              <div className="space-y-2"><Label>Category</Label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2"><Label>Short Description</Label><Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Full Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
            </div>
          </Card>
          <Card className="space-y-5 p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Pricing</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label>Price ($)</Label><Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Price (PKR)</Label><Input type="number" step="1" min="0" value={form.price_pkr} onChange={(e) => setForm({ ...form, price_pkr: parseFloat(e.target.value) || 0 })} placeholder="0 = auto-calculate" /></div>
              <div className="space-y-2"><Label>Original Price ($)</Label><Input type="number" step="0.01" min="0" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: parseFloat(e.target.value) || 0 })} /></div>
            </div>
          </Card>
          <Card className="space-y-5 p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Tag className="h-5 w-5 text-primary" />Media & Settings</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label>Thumbnail URL</Label><Input value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} /></div>
              <div className="space-y-2"><Label>Trailer Video URL</Label><Input value={form.trailer_url} onChange={(e) => setForm({ ...form, trailer_url: e.target.value })} /></div>
              <div className="space-y-2"><Label>Level</Label>
                <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
              <div className="space-y-2"><Label>Language</Label><Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option>Draft</option><option>Published</option><option>Archived</option><option>Pending Review</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.certificate_enabled} onChange={(e) => setForm({ ...form, certificate_enabled: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />Certificate Enabled</label>
            </div>
            {/* Teaching Mode */}
            <div className="space-y-3 border-t pt-4">
              <div>
                <p className="text-sm font-semibold">Teaching Mode</p>
                <p className="text-xs text-muted-foreground">Choose how students learn this course.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setForm({ ...form, teaching_mode: 'instructor' })} className={cn('flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all', form.teaching_mode === 'instructor' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><User className="h-5 w-5" /></div>
                  <div><p className="text-sm font-semibold">Instructor Teaching</p><p className="text-xs text-muted-foreground">Students learn from uploaded videos, PDFs, and materials.</p></div>
                </button>
                <button type="button" onClick={() => setForm({ ...form, teaching_mode: 'ai' })} className={cn('flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all', form.teaching_mode === 'ai' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white"><Brain className="h-5 w-5" /></div>
                  <div><p className="text-sm font-semibold">AI Teaching</p><p className="text-xs text-muted-foreground">AI teacher uses uploaded materials to teach automatically.</p></div>
                </button>
              </div>
            </div>
          </Card>
          <div className="flex gap-2">
            <Button onClick={() => handleSave()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Changes
            </Button>
            {form.status !== 'Published' && (
              <Button variant="outline" onClick={() => handleSave('Published')} disabled={saving}>Publish</Button>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
