'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownToLine, Clock, CircleCheck, Circle as XCircle, Loader as Loader2, ArrowLeft, StickyNote } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  getInstructorWithdrawals,
  createWithdrawalRequest,
  type WithdrawalRequest,
} from '@/lib/services/withdrawal-service';
import { getInstructorEarningsSummary, type InstructorEarningsSummary } from '@/lib/services/instructor-earnings-service';
import { cn } from '@/lib/utils';

const methods = [
  { code: 'easypaisa', label: 'EasyPaisa', fields: ['Number'] },
  { code: 'jazzcash', label: 'JazzCash', fields: ['Number'] },
  { code: 'bank_transfer', label: 'Bank Transfer', fields: ['Account Title', 'Account Number', 'Bank Name'] },
  { code: 'nayapay', label: 'NayaPay', fields: ['Number'] },
  { code: 'sadapay', label: 'SadaPay', fields: ['Number'] },
] as const;

const MIN_WITHDRAWAL = 500;

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

export default function InstructorWithdrawalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalRequest[]>([]);
  const [summary, setSummary] = React.useState<InstructorEarningsSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [method, setMethod] = React.useState<typeof methods[number]['code']>('easypaisa');
  const [methodFields, setMethodFields] = React.useState<Record<string, string>>({});
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    if (!user) return;
    const [w, s] = await Promise.all([
      getInstructorWithdrawals(user.id),
      getInstructorEarningsSummary(user.id),
    ]);
    setWithdrawals(w);
    setSummary(s);
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedMethod = methods.find((m) => m.code === method)!;
  const availableBalance = summary?.availableEarnings ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    if (amt < MIN_WITHDRAWAL) {
      toast({ title: `Minimum withdrawal is PKR ${MIN_WITHDRAWAL}`, variant: 'destructive' });
      return;
    }
    if (amt > availableBalance) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const allDetails = { ...methodFields };
    if (notes.trim()) allDetails['notes'] = notes.trim();
    const result = await createWithdrawalRequest(user.id, amt, method, allDetails);
    setSubmitting(false);

    if (result.success) {
      toast({ title: 'Withdrawal requested', description: 'Your request has been submitted for approval.' });
      setAmount('');
      setMethodFields({});
      setNotes('');
      setShowForm(false);
      loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link href="/instructor"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
            </Button>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Withdrawals</h1>
            <p className="mt-1 text-muted-foreground">Request payouts and track your withdrawal history.</p>
          </div>
          {!showForm && availableBalance >= MIN_WITHDRAWAL && (
            <Button onClick={() => setShowForm(true)}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Request Withdrawal
            </Button>
          )}
        </div>

        {/* Balance cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">PKR {(summary?.totalEarnings ?? 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">PKR {availableBalance.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Withdrawable Balance</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">PKR {(summary?.pendingEarnings ?? 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Withdrawal form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Request Withdrawal</h2>
              <p className="text-xs text-muted-foreground">Available: PKR {availableBalance.toFixed(0)} · Minimum: PKR {MIN_WITHDRAWAL}</p>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Amount (PKR)</Label>
                    <Input
                      type="number"
                      step="1"
                      min={MIN_WITHDRAWAL}
                      max={availableBalance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Withdrawal Method</Label>
                    <select
                      value={method}
                      onChange={(e) => {
                        setMethod(e.target.value as typeof method);
                        setMethodFields({});
                      }}
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      {methods.map((m) => (
                        <option key={m.code} value={m.code}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedMethod.fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label>{field}</Label>
                    <Input
                      value={methodFields[field] ?? ''}
                      onChange={(e) => setMethodFields((prev) => ({ ...prev, [field]: e.target.value }))}
                      placeholder={field}
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Any additional information for the admin..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit Request
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Withdrawal history */}
        <Card className="p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Withdrawal History</h2>
          {withdrawals.length > 0 ? (
            <div className="mt-4 space-y-2">
              {withdrawals.map((w, i) => {
                const config = statusConfig[w.status] ?? statusConfig.pending;
                return (
                  <motion.div key={w.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="flex items-center gap-4 rounded-xl border p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">PKR {w.amount.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {w.method.replace('_', ' ')} · {new Date(w.createdAt).toLocaleDateString()}
                        </p>
                        {w.adminNotes && <p className="text-xs text-muted-foreground mt-0.5">Note: {w.adminNotes}</p>}
                      </div>
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', config.color)}>
                        {config.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={<Wallet className="h-7 w-7" />}
                title="No withdrawals yet"
                description="Your withdrawal requests will appear here."
              />
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
