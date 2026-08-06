'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, RotateCcw, Loader as Loader2, ShoppingBag, DollarSign, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { getAllOrders, refundOrder, type Order } from '@/lib/services/order-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  failed: { label: 'Failed', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  refunded: { label: 'Refunded', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

type SortField = 'date' | 'amount' | 'orderNumber';
type SortDir = 'asc' | 'desc';

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = React.useState<(Order & { itemCount: number; userEmail: string })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all');
  const [sortField, setSortField] = React.useState<SortField>('date');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const [refundTarget, setRefundTarget] = React.useState<(Order & { itemCount: number; userEmail: string }) | null>(null);
  const [refundReason, setRefundReason] = React.useState('');
  const [processing, setProcessing] = React.useState(false);

  const loadOrders = React.useCallback(async () => {
    const data = await getAllOrders(200, 0);
    setOrders(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = orders
    .filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return o.orderNumber.toLowerCase().includes(q) || o.userEmail.toLowerCase().includes(q) || (o.paymentGateway ?? '').toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortField === 'amount') cmp = a.totalAmount - b.totalAmount;
      else if (sortField === 'orderNumber') cmp = a.orderNumber.localeCompare(b.orderNumber);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const totalRevenue = orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
  const paidCount = orders.filter((o) => o.status === 'paid').length;
  const refundedCount = orders.filter((o) => o.status === 'refunded').length;
  const refundedAmount = orders.filter((o) => o.status === 'refunded').reduce((sum, o) => sum + o.totalAmount, 0);

  const handleRefund = async () => {
    if (!refundTarget || !refundReason.trim()) return;
    setProcessing(true);
    const result = await refundOrder(refundTarget.id, refundReason);
    setProcessing(false);
    if (result.success) {
      toast({ title: 'Order refunded successfully' });
      setRefundTarget(null);
      setRefundReason('');
      loadOrders();
    } else {
      toast({ title: 'Refund failed', description: result.error, variant: 'destructive' });
    }
  };

  const SortHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th className={cn('pb-3 font-medium', className)}>
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {sortField === field && (
          sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        )}
      </button>
    </th>
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Orders Management</h1>
          <p className="mt-1 text-muted-foreground">View all orders, manage refunds, search, filter, and sort.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              <DollarSign className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{paidCount}</p>
            <p className="text-xs text-muted-foreground">Paid Orders</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
              <RotateCcw className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold">${refundedAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Refunded ({refundedCount})</p>
          </Card>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'paid', 'pending', 'failed', 'refunded'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, email, method..."
              className="w-full pl-9 sm:w-72"
            />
          </div>
        </div>

        {/* Orders table */}
        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <SortHeader field="orderNumber" label="Order #" />
                    <th className="pb-3 font-medium">Customer</th>
                    <SortHeader field="date" label="Date" />
                    <SortHeader field="amount" label="Amount" />
                    <th className="pb-3 font-medium">Items</th>
                    <th className="pb-3 font-medium">Method</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => {
                    const config = statusConfig[order.status] ?? statusConfig.pending;
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="py-3 font-semibold">{order.orderNumber}</td>
                        <td className="py-3 text-muted-foreground">{order.userEmail}</td>
                        <td className="py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 font-bold">${order.totalAmount.toFixed(2)}</td>
                        <td className="py-3 text-muted-foreground">{order.itemCount}</td>
                        <td className="py-3 capitalize text-muted-foreground">{order.paymentGateway ?? '—'}</td>
                        <td className="py-3">
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', config.color)}>
                            {config.label}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button asChild size="sm" variant="ghost">
                              <a href={`/dashboard/orders/${order.id}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                            {order.status === 'paid' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700"
                                onClick={() => { setRefundTarget(order); setRefundReason(''); }}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<ShoppingBag className="h-7 w-7" />}
              title="No orders found"
              description={search || filter !== 'all' ? 'Try adjusting your filters or search terms.' : 'Orders will appear here once students make purchases.'}
            />
          )}
        </Card>

        <ConfirmDialog
          open={!!refundTarget}
          onOpenChange={(open) => !open && setRefundTarget(null)}
          title="Refund Order"
          description={`Are you sure you want to refund order ${refundTarget?.orderNumber}? This will mark the order as refunded and the student will lose access to purchased courses. This action cannot be undone.`}
          confirmLabel="Confirm Refund"
          variant="destructive"
          onConfirm={async () => {
            if (!refundTarget || !refundReason.trim()) {
              toast({ title: 'Refund reason is required', variant: 'destructive' });
              return;
            }
            setProcessing(true);
            const result = await refundOrder(refundTarget.id, refundReason);
            setProcessing(false);
            if (result.success) {
              toast({ title: 'Order refunded successfully' });
              setRefundTarget(null);
              setRefundReason('');
              loadOrders();
            } else {
              toast({ title: 'Refund failed', description: result.error, variant: 'destructive' });
            }
          }}
        />
      </div>
    </PageTransition>
  );
}
