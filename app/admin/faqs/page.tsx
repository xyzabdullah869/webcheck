'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, CreditCard as Edit3, Loader as Loader2, CircleHelp as HelpCircle } from 'lucide-react';
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

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  published: boolean;
};

export default function AdminFaqsPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Faq[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Faq | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ question: '', answer: '', category: 'General', sort_order: 0, published: true });

  const load = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('faqs').select('*').order('sort_order', { ascending: true });
    setItems((data ?? []) as Faq[]);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    if (editing) {
      const { error } = await supabase.from('faqs').update(form).eq('id', editing.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'FAQ updated' });
    } else {
      const { error } = await supabase.from('faqs').insert(form);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'FAQ created' });
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    setForm({ question: '', answer: '', category: 'General', sort_order: 0, published: true });
    load();
  };

  const [deleteTarget, setDeleteTarget] = React.useState<Faq | null>(null);

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('faqs').delete().eq('id', id);
    setItems((prev) => prev.filter((f) => f.id !== id));
    toast({ title: 'FAQ deleted' });
  };

  const togglePublished = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from('faqs').update({ published: !current }).eq('id', id);
    setItems((prev) => prev.map((f) => f.id === id ? { ...f, published: !current } : f));
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">FAQs</h1>
            <p className="mt-1 text-muted-foreground">Manage frequently asked questions for the FAQ page.</p>
          </div>
          <Button onClick={() => { setEditing(null); setForm({ question: '', answer: '', category: 'General', sort_order: 0, published: true }); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New FAQ
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">{editing ? 'Edit FAQ' : 'New FAQ'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>Question</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Answer</Label><Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} required /></div>
              <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="published" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="published">Published</Label>
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
          <div className="space-y-3">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold">{item.question}</p>
                        <Badge variant="secondary">{item.category}</Badge>
                        {!item.published && <Badge variant="outline">Draft</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(item); setForm({ question: item.question, answer: item.answer, category: item.category, sort_order: item.sort_order, published: item.published }); setShowForm(true); }}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => togglePublished(item.id, item.published)}><Badge variant={item.published ? 'default' : 'secondary'}>{item.published ? 'Published' : 'Draft'}</Badge></Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 shadow-soft"><EmptyState icon={<HelpCircle className="h-7 w-7" />} title="No FAQs yet" description="Add frequently asked questions for your students." /></Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete FAQ"
        description="Are you sure you want to delete this FAQ? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); }}
      />
    </PageTransition>
  );
}
