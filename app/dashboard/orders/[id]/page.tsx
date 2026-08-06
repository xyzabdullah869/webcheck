'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, CircleCheck, Circle as XCircle, Clock, RotateCcw, Loader as Loader2, Printer } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { useSiteSettings } from '@/lib/contexts/site-settings-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { getOrderById, type Order, type OrderItem } from '@/lib/services/order-service';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; icon: typeof CircleCheck; color: string }> = {
  paid: { label: 'Paid', icon: CircleCheck, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  failed: { label: 'Failed', icon: XCircle, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  refunded: { label: 'Refunded', icon: RotateCcw, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-muted text-muted-foreground' },
};

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [items, setItems] = React.useState<OrderItem[]>([]);
  const [userEmail, setUserEmail] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!orderId) return;
    (async () => {
      const result = await getOrderById(orderId);
      setOrder(result.order);
      setItems(result.items);
      if (user?.email) {
        setUserEmail(user.email);
      } else if (result.order) {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', result.order.userId)
          .maybeSingle();
        if (profile) setUserEmail((profile as Record<string, unknown>).email as string);
      }
      setLoading(false);
    })();
  }, [orderId, user]);

  React.useEffect(() => {
    if (searchParams.get('download') === '1' && !loading) {
      window.print();
    }
  }, [searchParams, loading]);

  const siteName = settings.websiteName || 'Bioinformatics Hub';
  const siteLogo = settings.websiteLogo;
  const siteEmail = settings.contactEmail || settings.supportEmail || '';
  const sitePhone = settings.contactNumber || '';
  const siteAddress = settings.officeAddress || '';
  const siteWhatsapp = settings.whatsappNumber || '';
  const copyrightText = settings.copyrightText || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 pt-32">
          <p>Order not found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  const config = statusConfig[order.status] ?? statusConfig.pending;
  const StatusIcon = config.icon;
  const invoiceNumber = `INV-${order.orderNumber.replace('ORD-', '')}`;

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 print:pt-8">
          <div className="mb-6 flex items-center justify-between print:hidden">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />Print / Save PDF
            </Button>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden p-0 shadow-card print:shadow-none">
              {/* Invoice header */}
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-white print:bg-blue-600">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    {siteLogo ? (
                      <img src={siteLogo} alt={siteName} className="h-12 w-12 object-contain rounded-lg bg-white/10 p-1" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold">
                        {siteName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h1 className="font-display text-2xl font-bold">{siteName}</h1>
                      <p className="text-sm text-white/80">{siteAddress || 'Online Learning Platform'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="font-display text-xl font-bold">INVOICE</h2>
                    <p className="text-sm text-white/80">{invoiceNumber}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                      <StatusIcon className="h-3.5 w-3.5" />
                      {config.label}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Invoice meta */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billed To</p>
                    <div className="mt-2 rounded-xl border p-4">
                      <p className="font-semibold">{userEmail || 'Customer'}</p>
                      <p className="text-xs text-muted-foreground">Order: {order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Details</p>
                    <div className="mt-2 rounded-xl border p-4 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Method</span>
                        <span className="font-medium capitalize">{order.paymentGateway ?? '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Reference</span>
                        <span className="font-medium">{order.paymentReference ?? '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', config.color)}>{config.label}</span>
                      </div>
                      {order.paidAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Paid On</span>
                          <span className="font-medium">{new Date(order.paidAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-medium">Course</th>
                        <th className="pb-2 text-right font-medium">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-muted">
                                {item.courseThumbnail ? (
                                  <img src={item.courseThumbnail} alt={item.courseTitle} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                                )}
                              </div>
                              <span className="font-medium">{item.courseTitle}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right font-semibold">${item.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-6 ml-auto max-w-xs space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                      <span className="text-emerald-600">-${order.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${order.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-display text-base font-bold">
                    <span>Total</span>
                    <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment instructions / bank details */}
                {order.status !== 'paid' && (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Payment Instructions</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Please complete your payment using one of the available methods and upload your receipt for admin approval.
                    </p>
                  </div>
                )}

                {order.status === 'paid' && (
                  <div className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400">
                    <CircleCheck className="h-4 w-4" />
                    Payment received on {order.paidAt ? new Date(order.paidAt).toLocaleDateString() : '—'}
                  </div>
                )}

                {order.refundReason && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-400">
                    <p className="font-semibold">Refund Reason</p>
                    <p>{order.refundReason}</p>
                  </div>
                )}

                {/* Footer with contact info */}
                <div className="mt-8 border-t pt-6">
                  <div className="grid gap-4 sm:grid-cols-3 text-xs text-muted-foreground">
                    <div>
                      <p className="font-semibold text-foreground">{siteName}</p>
                      {siteAddress && <p>{siteAddress}</p>}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Contact</p>
                      {siteEmail && <p>{siteEmail}</p>}
                      {sitePhone && <p>{sitePhone}</p>}
                      {siteWhatsapp && <p>WhatsApp: {siteWhatsapp}</p>}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Social</p>
                      {settings.facebookUrl && <p>Facebook</p>}
                      {settings.linkedinUrl && <p>LinkedIn</p>}
                      {settings.youtubeUrl && <p>YouTube</p>}
                    </div>
                  </div>
                  <p className="mt-4 text-center text-xs text-muted-foreground">{copyrightText}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
