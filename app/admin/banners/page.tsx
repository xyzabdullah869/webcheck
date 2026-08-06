'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, CreditCard as Edit3, Loader as Loader2, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/components/confirm-dialog';

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  button_text: string | null;
  position: string;
  active: boolean;
  sort_order: number;
};

export default function AdminBannersPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Banner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Banner | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', subtitle: '', image_url: '', link_url: '', button_text: '', position: 'home_top', active: true, sort_order: 0 });
  const [deleteTarget, setDeleteTarget] = React.useState<Banner | null>(null);

  const load = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
    setItems((data ?? []) as Banner[]);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = { ...form, subtitle: form.subtitle || null, image_url: form.image_url || null, link_url: form.link_url || null, button_text: form.button_text || null };
    if (editing) {
      const { error } = await supabase.from('banners').update(payload).eq('id', editing.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Banner updated' });
    } else {
      const { error } = await supabase.from('banners').insert(payload);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Banner created' });
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', subtitle: '', image_url: '', link_url: '', button_text: '', position: 'home_top', active: true, sort_order: 0 });
    load();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('banners').delete().eq('id', id);
    setItems((prev) => prev.filter((b) => b.id !== id));
    toast({ title: 'Banner deleted' });
  };

  const toggleActive = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from('banners').update({ active: !current }).eq('id', id);
    setItems((prev) => prev.map((b) => b.id === id ? { ...b, active: !current } : b));
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Banners</h1>
            <p className="mt-1 text-muted-foreground">Manage promotional banners displayed across the site.</p>
          </div>
          <Button onClick={() => { setEditing(null); setForm({ title: '', subtitle: '', image_url: '', link_url: '', button_text: '', position: 'home_top', active: true, sort_order: 0 }); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Banner
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">{editing ? 'Edit Banner' : 'New Banner'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Subtitle</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              <div className="space-y-2"><Label>Link URL</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/courses" /></div>
              <div className="space-y-2"><Label>Button Text</Label><Input value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} placeholder="Learn More" /></div>
              <div className="space-y-2"><Label>Position</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="home_top" /></div>
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="active">Active</Label>
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
            {items.map((banner, i) => (
              <motion.div key={banner.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="overflow-hidden shadow-soft">
                  {banner.image_url ? (
                    <div className="h-32 w-full overflow-hidden bg-muted">
                      <img src={banner.image_url} alt={banner.title} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-muted"><ImageIcon className="h-8 w-8 text-muted-foreground/40" /></div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{banner.title}</p>
                        {banner.subtitle && <p className="text-xs text-muted-foreground">{banner.subtitle}</p>}
                      </div>
                      <Badge variant={banner.active ? 'default' : 'secondary'}>{banner.active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <div className="mt-3 flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(banner); setForm({ title: banner.title, subtitle: banner.subtitle ?? '', image_url: banner.image_url ?? '', link_url: banner.link_url ?? '', button_text: banner.button_text ?? '', position: banner.position, active: banner.active, sort_order: banner.sort_order }); setShowForm(true); }}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(banner.id, banner.active)}>{banner.active ? 'Deactivate' : 'Activate'}</Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(banner)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 shadow-soft"><EmptyState icon={<ImageIcon className="h-7 w-7" />} title="No banners yet" description="Create promotional banners for your homepage." /></Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Banner"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); }}
      />
    </PageTransition>
  );
}
