'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, X, Loader as Loader2, Send, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { broadcastNotification } from '@/lib/services/notification-service';

type Announcement = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  audience: string;
};

export default function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', message: '', audience: 'all' });
  const [deleteTarget, setDeleteTarget] = React.useState<Announcement | null>(null);

  const loadAnnouncements = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, created_at')
      .eq('type', 'announcement')
      .order('created_at', { ascending: false })
      .limit(50);
    setAnnouncements((data ?? []) as Announcement[]);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Announcement deleted' });
      loadAnnouncements();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const result = await broadcastNotification({
      type: 'announcement',
      title: form.title,
      message: form.message,
      audience: form.audience === 'all' ? 'all' : form.audience === 'students' ? 'students' : 'instructors',
    });

    if (result.success) {
      toast({ title: 'Announcement sent', description: `Delivered to ${result.count ?? 0} users.` });
      setForm({ title: '', message: '', audience: 'all' });
      setShowForm(false);
      loadAnnouncements();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Announcements</h1>
            <p className="mt-1 text-muted-foreground">Send platform-wide announcements to all users.</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </div>

        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((ann, i) => (
                <motion.div key={ann.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{ann.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{ann.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(ann.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">All Users</Badge>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(ann)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Megaphone className="h-7 w-7" />} title="No announcements yet" description="Send your first announcement to all platform users." action={{ label: 'Create Announcement', onClick: () => setShowForm(true) }} />
          )}
        </Card>

        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
                <Card className="p-6 shadow-float">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">New Announcement</h3>
                    <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                  </div>
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Important update" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Your announcement..." required />
                    </div>
                    <div className="space-y-2">
                      <Label>Audience</Label>
                      <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                        <option value="all">All Users</option>
                        <option value="students">Students Only</option>
                        <option value="instructors">Instructors & Admins</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Send Announcement
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Announcement"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); }}
      />
    </PageTransition>
  );
}
