'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Wallet, CircleCheck, Circle as XCircle, Clock, Loader as Loader2, ArrowRight, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import {
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
  type WithdrawalRequest,
} from '@/lib/services/withdrawal-service';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

export default function AdminWithdrawalsPage() {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = React.useState<(WithdrawalRequest & { instructorName: string; instructorEmail: string })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  const [search, setSearch] = React.useState('');
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const loadWithdrawals = React.useCallback(async () => {
    const data = await getAllWithdrawals(100);
    setWithdrawals(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const result = await approveWithdrawal(id);
    setProcessingId(null);
    if (result.success) {
      toast({ title: 'Withdrawal approved', description: 'Balance deducted from instructor wallet.' });
      loadWithdrawals();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const result = await rejectWithdrawal(id);
    setProcessingId(null);
    if (result.success) {
      toast({ title: 'Withdrawal rejected', description: 'Instructor balance restored.' });
      loadWithdrawals();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleMarkPaid = async (id: string) => {
    setProcessingId(id);
    const result = await markWithdrawalPaid(id);
    setProcessingId(null);
    if (result.success) {
      toast({ title: 'Withdrawal marked as paid' });
      loadWithdrawals();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const filtered = withdrawals.filter((w) => {
    if (filter !== 'all' && w.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return w.instructorName.toLowerCase().includes(q) || w.instructorEmail.toLowerCase().includes(q) || w.method.toLowerCase().includes(q);
    }
    return true;
  });
  const pendingAmount = withdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);
  const paidAmount = withdrawals.filter((w) => w.status === 'paid').reduce((sum, w) => sum + w.amount, 0);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Withdrawal Requests</h1>
          <p className="mt-1 text-muted-foreground">Review and process instructor withdrawal requests.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">PKR {pendingAmount.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CircleCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">PKR {paidAmount.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Paid Out</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">{withdrawals.length}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter + Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'paid', 'rejected'] as const).map((f) => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">
                {f}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, method..." className="pl-9 sm:w-64" />
          </div>
        </div>

        {/* List */}
        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((w, i) => {
                const config = statusConfig[w.status] ?? statusConfig.pending;
                return (
                  <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <div className="rounded-xl border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">PKR {w.amount.toFixed(0)}</p>
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', config.color)}>
                              {config.label}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {w.instructorName} · {w.instructorEmail}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {w.method.replace('_', ' ')} · {new Date(w.createdAt).toLocaleDateString()}
                          </p>
                          {w.adminNotes && (
                            <p className="mt-1 text-xs italic text-muted-foreground">Admin: {w.adminNotes}</p>
                          )}
                        </div>
                        {w.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" disabled={processingId === w.id} onClick={() => handleApprove(w.id)}>
                              {processingId === w.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" disabled={processingId === w.id} onClick={() => handleReject(w.id)}>
                              Reject
                            </Button>
                          </div>
                        )}
                        {w.status === 'approved' && (
                          <Button size="sm" className="border-emerald-200 text-emerald-600" disabled={processingId === w.id} onClick={() => handleMarkPaid(w.id)}>
                            {processingId === w.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Wallet className="h-7 w-7" />} title="No withdrawal requests" description="Instructor withdrawal requests will appear here." />
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
