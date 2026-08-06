'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderTree, Loader as Loader2, CreditCard as Edit3, Trash2, Search, Star, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { cn } from '@/lib/utils';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  image: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  courseCount: number;
};

const defaultForm = { name: '', slug: '', description: '', icon: 'FolderTree', color: 'from-blue-500 to-cyan-500', image: '', is_active: true, is_featured: false, sort_order: 0 };

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(defaultForm);

  const loadCategories = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true });

    // Get course counts
    const cats = (data ?? []) as Record<string, unknown>[];
    const withCounts = await Promise.all(
      cats.map(async (cat) => {
        const { count } = await supabase
          .from('courses')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', cat.id as string);
        return {
          id: cat.id as string,
          name: cat.name as string,
          slug: cat.slug as string,
          description: (cat.description as string) ?? '',
          icon: (cat.icon as string) ?? 'FolderTree',
          color: (cat.color as string) ?? '',
          image: (cat.image as string) ?? '',
          is_active: (cat.is_active as boolean) ?? true,
          is_featured: (cat.is_featured as boolean) ?? false,
          sort_order: (cat.sort_order as number) ?? 0,
          courseCount: count ?? 0,
        };
      })
    );
    setCategories(withCounts);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const slug = form.slug || generateSlug(form.name);
    const payload = {
      name: form.name,
      slug,
      description: form.description,
      icon: form.icon,
      color: form.color,
      image: form.image,
      is_active: form.is_active,
      is_featured: form.is_featured,
      sort_order: form.sort_order,
    };

    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Category updated' });
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Category created' });
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    setForm(defaultForm);
    loadCategories();
  };

  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Category deleted' }); loadCategories(); }
  };

  const toggleActive = async (cat: Category) => {
    const supabase = createClient();
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
  };

  const toggleFeatured = async (cat: Category) => {
    const supabase = createClient();
    await supabase.from('categories').update({ is_featured: !cat.is_featured }).eq('id', cat.id);
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_featured: !c.is_featured } : c));
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon,
      color: cat.color, image: cat.image, is_active: cat.is_active, is_featured: cat.is_featured, sort_order: cat.sort_order,
    });
    setShowForm(true);
  };

  const filtered = categories.filter((c) => !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Categories</h1>
            <p className="mt-1 text-muted-foreground">Manage course categories for the platform.</p>
          </div>
          <Button onClick={() => { setEditing(null); setForm(defaultForm); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Category
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories..." className="pl-9" />
        </div>

        {showForm && (
          <Card className="p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">{editing ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} required /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="font-mono text-sm" /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Icon (Lucide name)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
              <div className="space-y-2"><Label>Color (Tailwind gradient)</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 rounded-xl border p-3 flex-1">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <span className="text-sm font-medium">Active</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border p-3 flex-1">
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                  <span className="text-sm font-medium">Featured</span>
                </label>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={cn('p-5 shadow-soft transition-all hover:shadow-card', !cat.is_active && 'opacity-60')}>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                      <FolderTree className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toggleFeatured(cat)} title="Toggle featured">
                        <Star className={cn('h-3.5 w-3.5', cat.is_featured && 'fill-amber-400 text-amber-400')} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(cat)} title="Toggle active">
                        {cat.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(cat)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <p className="mt-3 font-display text-base font-bold">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px]">{cat.slug}</Badge>
                    <Badge variant="outline">{cat.courseCount} {cat.courseCount === 1 ? 'course' : 'courses'}</Badge>
                    {cat.is_featured && <Badge className="gap-1"><Star className="h-3 w-3 fill-current" />Featured</Badge>}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 shadow-soft"><EmptyState icon={<FolderTree className="h-7 w-7" />} title="No categories yet" description="Create categories to organize your courses." /></Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); }}
      />
    </PageTransition>
  );
}
