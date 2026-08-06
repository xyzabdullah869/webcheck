'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Download, Eye, Loader as Loader2, CircleCheck, XCircle, Clock, RotateCcw, CreditCard, Calendar, Package, TrendingUp, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { getUserOrders, type Order } from '@/lib/services/order-service';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; icon: typeof CircleCheck; color: string; border: string; bg: string }> = {
  paid: { label: 'Paid', icon: CircleCheck, color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
  refunded: { label: 'Refunded', icon: RotateCcw, color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-muted-foreground', border: 'border-muted', bg: 'bg-muted/20' },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<(Order & { itemCount: number })[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const data = await getUserOrders(user.id);
      setOrders(data);
      setLoading(false);
    })();
  }, [user]);

  const totalSpent = orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
  const paidCount = orders.filter((o) => o.status === 'paid').length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Order History</h1>
            <p className="mt-1 text-muted-foreground">View your purchases, download receipts, and track payment status.</p>
          </div>

          {/* Summary stats */}
          {!loading && orders.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="p-4 shadow-soft">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Package className="h-5 w-5" />
                </div>
                <p className="mt-2 font-display text-xl font-bold">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </Card>
              <Card className="p-4 shadow-soft">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CircleCheck className="h-5 w-5" />
                </div>
                <p className="mt-2 font-display text-xl font-bold">{paidCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </Card>
              <Card className="p-4 shadow-soft">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="h-5 w-5" />
                </div>
                <p className="mt-2 font-display text-xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </Card>
              <Card className="p-4 shadow-soft">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="mt-2 font-display text-xl font-bold">${totalSpent.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </Card>
            </div>
          )}

          {/* Filter tabs */}
          {!loading && orders.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {(['all', 'paid', 'pending'] as const).map((f) => (
                <Badge key={f} variant="secondary" className="px-3 py-1.5 capitalize">
                  {f === 'all' ? 'All Orders' : f === 'paid' ? 'Completed' : 'Pending'}
                </Badge>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order, i) => {
                const config = statusConfig[order.status] ?? statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className={cn('overflow-hidden border-l-4 shadow-soft transition-all hover:shadow-card', config.border)}>
                      {/* Status bar */}
                      <div className={cn('flex items-center gap-2 px-5 py-2', config.bg)}>
                        <StatusIcon className={cn('h-4 w-4', config.color)} />
                        <span className={cn('text-xs font-semibold', config.color)}>{config.label}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                        {/* Icon + order number */}
                        <div className="flex items-center gap-3 sm:w-56">
                          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', config.bg, config.color)}>
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-bold">{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{order.itemCount} item(s)</p>
                          </div>
                        </div>

                        {/* Payment details */}
                        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5" />
                            <span className="capitalize">{order.paymentGateway ?? '—'}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          {order.couponCode && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              Coupon: {order.couponCode}
                            </span>
                          )}
                        </div>

                        {/* Amount + actions */}
                        <div className="flex items-center justify-between gap-4 border-t pt-3 sm:border-t-0 sm:pt-0">
                          <div className="text-right">
                            <p className="font-display text-lg font-bold">${order.totalAmount.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/dashboard/orders/${order.id}`}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                <span className="hidden sm:inline">View</span>
                              </Link>
                            </Button>
                            {order.status === 'paid' && (
                              <Button asChild size="sm">
                                <Link href={`/dashboard/orders/${order.id}?download=1`}>
                                  <Download className="mr-1.5 h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Receipt</span>
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="p-6 shadow-soft">
              <EmptyState
                icon={<ShoppingBag className="h-7 w-7" />}
                title="No orders yet"
                description="Your purchase history will appear here once you buy a course."
                action={{ label: 'Browse Courses', href: '/courses' }}
              />
            </Card>
          )}
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
