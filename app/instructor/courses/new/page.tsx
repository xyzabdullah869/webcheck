'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader as Loader2, BookOpen, DollarSign, Tag, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageTransition } from '@/components/page-transition';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

export default function CreateCoursePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    price: 0,
    price_pkr: 0,
    original_price: 0,
    level: 'Beginner',
    duration: '',
    language: 'English',
    thumbnail: '',
    trailer_url: '',
    category_id: '',
    status: 'Draft',
    featured: false,
    certificate_enabled: true,
  });
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.from('categories').select('id, name').order('name').then(({ data }: { data: { id: string; name: string }[] | null }) => {
      setCategories(data ?? []);
    });
  }, []);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent, status: 'Draft' | 'Published') => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const slug = form.slug || generateSlug(form.title);
    const { error } = await supabase.from('courses').insert({
      title: form.title,
      slug,
      short_description: form.short_description,
      description: form.description,
      price: form.price,
      price_pkr: form.price_pkr,
      original_price: form.original_price || null,
      level: form.level,
      duration: form.duration,
      language: form.language,
      thumbnail: form.thumbnail || null,
      trailer_url: form.trailer_url || null,
      category_id: form.category_id || null,
      instructor_id: user.id,
      status,
      lessons_count: 0,
      students_count: 0,
      rating: 0,
      reviews_count: 0,
      bestseller: false,
      is_new: true,
      featured: form.featured,
      certificate_enabled: form.certificate_enabled,
      tags: [],
      what_you_will_learn: [],
      requirements: [],
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Course ${status === 'Published' ? 'published' : 'saved as draft'}` });
      window.location.href = '/instructor/courses';
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/instructor/courses"><ArrowLeft className="mr-2 h-4 w-4" />My Courses</Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Create New Course</h1>
          <p className="mt-1 text-muted-foreground">Fill in the details below to create your course.</p>
        </div>

        <form className="space-y-6">
          {/* Basic info */}
          <Card className="space-y-5 p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Course Information
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Course Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) });
                  }}
                  placeholder="Introduction to Bioinformatics"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="introduction-to-bioinformatics"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Short Description</Label>
                <Input
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  placeholder="A brief one-line description shown on course cards"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Full Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="Detailed course description..."
                />
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="space-y-5 p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Pricing
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Set to 0 for a free course</p>
              </div>
              <div className="space-y-2">
                <Label>Original Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.original_price}
                  onChange={(e) => setForm({ ...form, original_price: parseFloat(e.target.value) || 0 })}
                  placeholder="For showing discount"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (PKR)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={form.price_pkr}
                  onChange={(e) => setForm({ ...form, price_pkr: parseFloat(e.target.value) || 0 })}
                  placeholder="0 = auto-calculate from USD"
                />
                <p className="text-xs text-muted-foreground">Leave 0 to auto-calculate from USD price</p>
              </div>
            </div>
          </Card>

          {/* Media + settings */}
          <Card className="space-y-5 p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Media & Settings
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label>Trailer Video URL</Label>
                <Input
                  value={form.trailer_url}
                  onChange={(e) => setForm({ ...form, trailer_url: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="10 hours"
                />
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Input
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  placeholder="English"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.certificate_enabled} onChange={(e) => setForm({ ...form, certificate_enabled: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                Certificate Enabled
              </label>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'Published')} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              Publish Course
            </Button>
            <Button type="button" variant="outline" onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'Draft')} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save as Draft
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
