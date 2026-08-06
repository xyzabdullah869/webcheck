'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Crown, CircleCheck, Circle as XCircle, Clock, Loader as Loader2, Search, Eye, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type MembershipPurchase = {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  screenshot_url: string;
  transaction_id: string | null;
  status: string;
  referral_code: string | null;
  created_at: string;
  userName: string;
  userEmail: string;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

export default function AdminMembershipsPage() {
  const { toast } = useToast();
  const [purchases, setPurchases] = React.useState<MembershipPurchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = React.useState('');
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [viewScreenshot, setViewScreenshot] = React.useState<string | null>(null);

  const loadPurchases = React.useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('membership_purchases')
      .select('*, profiles!membership_purchases_user_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      setLoading(false);
      return;
    }

    const mapped: MembershipPurchase[] = (data as Record<string, unknown>[]).map((row) => {
      const profile = row.profiles as Record<string, unknown> | undefined;
      return {
        id: row.id as string,
        user_id: row.user_id as string,
        amount: Number(row.amount),
        payment_method: (row.payment_method as string) ?? '—',
        screenshot_url: (row.screenshot_url as string) ?? '',
        transaction_id: (row.transaction_id as string) ?? null,
        status: (row.status as string) ?? 'pending',
        referral_code: (row.referral_code as string) ?? null,
        created_at: (row.created_at as string) ?? '',
        userName: (profile?.full_name as string) ?? '—',
        userEmail: (profile?.email as string) ?? '—',
      };
    });
    setPurchases(mapped);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('approve_membership_purchase', { p_purchase_id: id });
    setProcessingId(null);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data && (data as Record<string, unknown>).success) {
      toast({ title: 'Membership approved', description: 'User is now a member. Referral reward credited if applicable.' });
      loadPurchases();
    } else {
      toast({ title: 'Error', description: ((data as Record<string, unknown>)?.error as string) ?? 'Unknown error', variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('reject_membership_purchase', { p_purchase_id: id });
    setProcessingId(null);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data && (data as Record<string, unknown>).success) {
      toast({ title: 'Membership rejected' });
      loadPurchases();
    } else {
      toast({ title: 'Error', description: ((data as Record<string, unknown>)?.error as string) ?? 'Unknown error', variant: 'destructive' });
    }
  };

  const filtered = purchases.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.userName.toLowerCase().includes(q) || p.userEmail.toLowerCase().includes(q) || p.payment_method.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount = purchases.filter((p) => p.status === 'pending').length;
  const approvedCount = purchases.filter((p) => p.status === 'approved').length;
  const totalRevenue = purchases.filter((p) => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Membership Purchases</h1>
          <p className="mt-1 text-muted-foreground">Review and approve membership payment submissions.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="h-5 w-5" /></div>
              <div><p className="font-display text-xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">Pending</p></div>
            </div>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"><CircleCheck className="h-5 w-5" /></div>
              <div><p className="font-display text-xl font-bold">{approvedCount}</p><p className="text-xs text-muted-foreground">Approved</p></div>
            </div>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><Crown className="h-5 w-5" /></div>
              <div><p className="font-display text-xl font-bold">PKR {totalRevenue.toFixed(0)}</p><p className="text-xs text-muted-foreground">Revenue</p></div>
            </div>
          </Card>
        </div>

        {/* Filter + Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
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
              {filtered.map((p, i) => {
                const config = statusConfig[p.status] ?? statusConfig.pending;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <div className="rounded-xl border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Crown className="h-5 w-5" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">PKR {p.amount.toFixed(0)}</p>
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', config.color)}>{config.label}</span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{p.userName} · {p.userEmail}</p>
                          <p className="text-xs text-muted-foreground capitalize">{p.payment_method} · {new Date(p.created_at).toLocaleDateString()}</p>
                          {p.transaction_id && <p className="text-xs text-muted-foreground">Txn: {p.transaction_id}</p>}
                          {p.referral_code && <p className="text-xs text-emerald-600">Ref: {p.referral_code}</p>}
                        </div>
                        <div className="flex gap-2">
                          {p.screenshot_url && (
                            <Button size="sm" variant="outline" onClick={() => setViewScreenshot(p.screenshot_url)}><Eye className="h-3.5 w-3.5" /></Button>
                          )}
                          {p.status === 'pending' && (
                            <>
                              <Button size="sm" disabled={processingId === p.id} onClick={() => handleApprove(p.id)}>
                                {processingId === p.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" disabled={processingId === p.id} onClick={() => handleReject(p.id)}>Reject</Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Crown className="h-7 w-7" />} title="No membership purchases" description="Membership payment submissions will appear here." />
          )}
        </Card>

        {/* Screenshot viewer modal */}
        {viewScreenshot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setViewScreenshot(null)}>
            <div className="relative max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setViewScreenshot(null)} className="absolute -right-2 -top-2 z-10 rounded-full bg-background p-1 shadow-lg"><X className="h-5 w-5" /></button>
              <img src={viewScreenshot} alt="Payment screenshot" className="max-h-[80vh] w-full rounded-xl border object-contain" />
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
