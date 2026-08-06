'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CircleCheck, ArrowRight, BookOpen, Download } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/page-transition';
import { getOrderById, type Order, type OrderItem } from '@/lib/services/order-service';
import { Loader as Loader2 } from 'lucide-react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const [order, setOrder] = React.useState<Order | null>(null);
  const [items, setItems] = React.useState<OrderItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    (async () => {
      const result = await getOrderById(orderId);
      setOrder(result.order);
      setItems(result.items);
      setLoading(false);
    })();
  }, [orderId]);

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-2xl px-4 pb-20 pt-32 sm:px-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden p-0 shadow-card">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-center text-white">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20"
                  >
                    <CircleCheck className="h-10 w-10" />
                  </motion.div>
                  <h1 className="mt-4 font-display text-2xl font-bold">Payment Successful!</h1>
                  <p className="mt-2 text-sm text-white/80">
                    Your order has been confirmed and courses are now unlocked.
                  </p>
                </div>

                <div className="space-y-4 p-6">
                  {order && (
                    <div className="rounded-xl border p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Order Number</span>
                        <span className="font-semibold">{order.orderNumber}</span>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount Paid</span>
                        <span className="font-semibold">${order.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="font-semibold capitalize">{order.paymentGateway ?? '—'}</span>
                      </div>
                    </div>
                  )}

                  {items.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold">Purchased Courses:</p>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {item.courseThumbnail ? (
                                <img src={item.courseThumbnail} alt={item.courseTitle} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                              )}
                            </div>
                            <p className="flex-1 truncate text-sm font-medium">{item.courseTitle}</p>
                            <span className="text-sm font-bold">${item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="flex-1">
                      <Link href="/dashboard">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Start Learning
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link href="/dashboard/orders">
                        <Download className="mr-2 h-4 w-4" />
                        View Receipt
                      </Link>
                    </Button>
                  </div>

                  <Link href="/courses" className="flex items-center justify-center gap-1 pt-2 text-sm text-primary hover:underline">
                    Browse more courses <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            </motion.div>
          )}
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
