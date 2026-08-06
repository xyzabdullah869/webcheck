'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, Star, Trash2, CreditCard as Edit3, Loader as Loader2, Quote } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/components/confirm-dialog';

type Testimonial = {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar_url: string | null;
  rating: number;
  featured: boolean;
  sort_order: number;
};

export default function AdminTestimonialsPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Testimonial[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Testimonial | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', role: '', content: '', avatar_url: '', rating: 5, featured: false, sort_order: 0 });

  const load = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('testimonials').select('*').order('sort_order', { ascending: true });
    setItems((data ?? []) as Testimonial[]);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = { ...form, avatar_url: form.avatar_url || null };
    if (editing) {
      const { error } = await supabase.from('testimonials').update(payload).eq('id', editing.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Testimonial updated' });
    } else {
      const { error } = await supabase.from('testimonials').insert(payload);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Testimonial created' });
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', role: '', content: '', avatar_url: '', rating: 5, featured: false, sort_order: 0 });
    load();
  };

  const [deleteTarget, setDeleteTarget] = React.useState<Testimonial | null>(null);

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('testimonials').delete().eq('id', id);
    setItems((prev) => prev.filter((t) => t.id !== id));
    toast({ title: 'Testimonial deleted' });
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from('testimonials').update({ featured: !current }).eq('id', id);
    setItems((prev) => prev.map((t) => t.id === id ? { ...t, featured: !current } : t));
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Testimonials</h1>
            <p className="mt-1 text-muted-foreground">Manage student testimonials shown on the homepage.</p>
          </div>
          <Button onClick={() => { setEditing(null); setForm({ name: '', role: '', content: '', avatar_url: '', rating: 5, featured: false, sort_order: 0 }); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Testimonial
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">{editing ? 'Edit Testimonial' : 'New Testimonial'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Role / Title</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="PhD Student" /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} required /></div>
              <div className="space-y-2"><Label>Avatar URL</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." /></div>
              <div className="space-y-2"><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="featured">Featured on homepage</Label>
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
        ) : items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-5 shadow-soft">
                  <div className="flex items-start justify-between">
                    <Quote className="h-6 w-6 text-primary/30" />
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(item); setForm({ name: item.name, role: item.role, content: item.content, avatar_url: item.avatar_url ?? '', rating: item.rating, featured: item.featured, sort_order: item.sort_order }); setShowForm(true); }}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.content}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold">{item.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex">{Array.from({ length: item.rating }).map((_, idx) => <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
                    <button onClick={() => toggleFeatured(item.id, item.featured)}>
                      <Badge variant={item.featured ? 'default' : 'secondary'}>{item.featured ? 'Featured' : 'Not Featured'}</Badge>
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 shadow-soft"><EmptyState icon={<Quote className="h-7 w-7" />} title="No testimonials yet" description="Add student testimonials to showcase on your homepage." /></Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Testimonial"
        description={`Are you sure you want to delete the testimonial from "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); }}
      />
    </PageTransition>
  );
}
