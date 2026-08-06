'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Clock, CircleCheck as CheckCircle2, Circle as XCircle, Loader as Loader2, Image as ImageIcon, X, Eye, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { getAllPaymentSubmissions, approvePaymentSubmission, rejectPaymentSubmission } from '@/lib/services/payment-submission-service';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

export default function AdminPaymentSubmissionsPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = React.useState<Awaited<ReturnType<typeof getAllPaymentSubmissions>>>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reviewingId, setReviewingId] = React.useState<string | null>(null);
  const [adminNotes, setAdminNotes] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  const [viewingScreenshot, setViewingScreenshot] = React.useState<string | null>(null);

  const loadSubmissions = React.useCallback(async () => {
    const data = await getAllPaymentSubmissions();
    setSubmissions(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleApprove = async () => {
    if (!reviewingId) return;
    setProcessing(true);
    const result = await approvePaymentSubmission(reviewingId, adminNotes || undefined);
    setProcessing(false);
    if (result.success) {
      toast({ title: 'Payment approved', description: 'User has been enrolled automatically.' });
      setReviewingId(null);
      setAdminNotes('');
      loadSubmissions();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!reviewingId) return;
    setProcessing(true);
    const result = await rejectPaymentSubmission(reviewingId, adminNotes || undefined);
    setProcessing(false);
    if (result.success) {
      toast({ title: 'Payment rejected' });
      setReviewingId(null);
      setAdminNotes('');
      loadSubmissions();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const filtered = submissions.filter((s) => filter === 'all' || s.status === filter);
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Payment Submissions</h1>
            <p className="mt-1 text-muted-foreground">Review payment proofs and approve or reject them.</p>
          </div>
          {pendingCount > 0 && <Badge variant="default">{pendingCount} pending</Badge>}
        </div>

        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>

        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((sub, i) => {
                const config = statusConfig[sub.status] ?? statusConfig.pending;
                return (
                  <motion.div key={sub.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><CreditCard className="h-5 w-5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{sub.userName}</p>
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', config.color)}>{config.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{sub.userEmail}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Order: {sub.orderNumber}</span>
                          <span>Method: {sub.payment_gateway_code ?? '—'}</span>
                          <span>TXN: {sub.transaction_id ?? '—'}</span>
                          <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.screenshot_url && (
                          <Button size="sm" variant="ghost" onClick={() => setViewingScreenshot(sub.screenshot_url)}><Eye className="h-4 w-4" /></Button>
                        )}
                        {sub.status === 'pending' && (
                          <Button size="sm" onClick={() => { setReviewingId(sub.id); setAdminNotes(sub.admin_notes ?? ''); }}>Review</Button>
                        )}
                        {sub.admin_notes && sub.status !== 'pending' && (
                          <p className="max-w-xs text-xs italic text-muted-foreground">{sub.admin_notes}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Clock className="h-7 w-7" />} title="No payment submissions" description={filter === 'pending' ? 'No pending payments to review.' : 'No submissions match this filter.'} />
          )}
        </Card>

        {/* Review modal */}
        {reviewingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setReviewingId(null)}>
            <Card className="w-full max-w-md p-6 shadow-float" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">Review Payment</h3>
                <button onClick={() => setReviewingId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Admin Notes (optional)</Label>
                  <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} placeholder="Feedback for the user..." />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApprove} disabled={processing} className="flex-1">
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Approve & Enroll
                  </Button>
                  <Button onClick={handleReject} disabled={processing} variant="outline" className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50">
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Screenshot viewer */}
        {viewingScreenshot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setViewingScreenshot(null)}>
            <div className="relative max-h-[90vh] max-w-3xl">
              <button onClick={() => setViewingScreenshot(null)} className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-lg"><X className="h-4 w-4" /></button>
              <img src={viewingScreenshot} alt="Payment screenshot" className="max-h-[90vh] rounded-xl object-contain" />
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
