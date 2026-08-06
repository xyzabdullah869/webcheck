'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Loader as Loader2, CircleCheck as CheckCircle2, Circle as XCircle, Clock, Mail, Phone, BookOpen, Award, Briefcase, Wrench, Link as LinkIcon, FileText, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { getAllApplications, approveApplication, rejectApplication, type InstructorApplication } from '@/lib/services/instructor-application-service';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

export default function AdminInstructorApplicationsPage() {
  const { toast } = useToast();
  const [applications, setApplications] = React.useState<InstructorApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reviewing, setReviewing] = React.useState<InstructorApplication | null>(null);
  const [adminNotes, setAdminNotes] = React.useState('');
  const [processing, setProcessing] = React.useState(false);

  const loadApplications = React.useCallback(async () => {
    const data = await getAllApplications();
    setApplications(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApprove = async () => {
    if (!reviewing) return;
    setProcessing(true);
    const result = await approveApplication(reviewing.id, adminNotes || undefined);
    setProcessing(false);
    if (result.success) {
      toast({ title: 'Application approved', description: 'User has been promoted to instructor.' });
      setReviewing(null);
      setAdminNotes('');
      loadApplications();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!reviewing) return;
    setProcessing(true);
    const result = await rejectApplication(reviewing.id, adminNotes || undefined);
    setProcessing(false);
    if (result.success) {
      toast({ title: 'Application rejected' });
      setReviewing(null);
      setAdminNotes('');
      loadApplications();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const filtered = applications.filter((a) => filter === 'all' || a.status === filter);
  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Instructor Applications</h1>
            <p className="mt-1 text-muted-foreground">Review and approve instructor applications from students.</p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="default">{pendingCount} pending</Badge>
          )}
        </div>

        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">
              {f}
            </Button>
          ))}
        </div>

        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((app, i) => {
                const config = statusConfig[app.status] ?? statusConfig.pending;
                return (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl border p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{app.full_name}</p>
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', config.color)}>{config.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{app.email}</p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {app.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.phone}</span>}
                            {app.qualification && <span className="flex items-center gap-1"><Award className="h-3 w-3" />{app.qualification}</span>}
                            {app.experience && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{app.experience}</span>}
                          </div>
                          {app.skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {app.skills.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                            </div>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {app.status === 'pending' && (
                        <Button size="sm" onClick={() => { setReviewing(app); setAdminNotes(app.admin_notes ?? ''); }}>
                          Review
                        </Button>
                      )}
                      {app.status !== 'pending' && app.admin_notes && (
                        <p className="max-w-xs text-xs italic text-muted-foreground">{app.admin_notes}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<GraduationCap className="h-7 w-7" />} title="No applications found" description={filter === 'pending' ? 'No pending applications to review.' : 'No applications match this filter.'} />
          )}
        </Card>

        <AnimatePresence>
          {reviewing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setReviewing(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
                <Card className="max-h-[90vh] overflow-y-auto p-6 shadow-float">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">Review Application</h3>
                    <button onClick={() => setReviewing(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border p-4">
                      <p className="font-semibold">{reviewing.full_name}</p>
                      <p className="text-xs text-muted-foreground">{reviewing.email}</p>
                      <div className="mt-3 space-y-2 text-sm">
                        {reviewing.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{reviewing.phone}</p>}
                        {reviewing.education && <p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" />{reviewing.education}</p>}
                        {reviewing.qualification && <p className="flex items-center gap-2"><Award className="h-4 w-4 text-muted-foreground" />{reviewing.qualification}</p>}
                        {reviewing.experience && <p className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" />{reviewing.experience}</p>}
                        {reviewing.bio && <p className="mt-2 text-muted-foreground">{reviewing.bio}</p>}
                        {reviewing.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {reviewing.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                          </div>
                        )}
                        {reviewing.portfolio_url && <p className="flex items-center gap-2"><LinkIcon className="h-4 w-4 text-muted-foreground" /><a href={reviewing.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{reviewing.portfolio_url}</a></p>}
                        {reviewing.cv_url && <p className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><a href={reviewing.cv_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View CV</a></p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Admin Notes (optional)</Label>
                      <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} placeholder="Feedback for the applicant..." />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleApprove} disabled={processing} className="flex-1">
                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Approve
                      </Button>
                      <Button onClick={handleReject} disabled={processing} variant="outline" className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50">
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
