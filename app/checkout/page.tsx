'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, Trash2, ArrowRight, ArrowLeft, Loader as Loader2, Tag, Check, X, Lock, CreditCard, Wallet, Smartphone, Building2, Upload, CircleCheck as CheckCircle2, Image as ImageIcon, Clock } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { useCart } from '@/lib/contexts/cart-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getEnabledGateways, getPaymentSettings, calculatePriceBreakdown, type PaymentGateway, type PaymentSettings } from '@/lib/services/payment-service';
import { validateCoupon, type Coupon } from '@/lib/services/coupon-service';
import { createOrder, type CartItem } from '@/lib/services/order-service';
import { submitPaymentProof, uploadPaymentScreenshot, getPaymentSubmission } from '@/lib/services/payment-submission-service';
import { cn } from '@/lib/utils';

const gatewayIcons: Record<string, typeof CreditCard> = {
  stripe: CreditCard,
  paypal: Wallet,
  easypaisa: Smartphone,
  jazzcash: Smartphone,
  bank_transfer: Building2,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, clearCart, subtotal } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [gateways, setGateways] = React.useState<PaymentGateway[]>([]);
  const [settings, setSettings] = React.useState<PaymentSettings | null>(null);
  const [selectedGateway, setSelectedGateway] = React.useState<PaymentGateway | null>(null);
  const [couponCode, setCouponCode] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [couponStatus, setCouponStatus] = React.useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [couponError, setCouponError] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [referralCode, setReferralCode] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [orderId, setOrderId] = React.useState<string | null>(null);
  const [transactionId, setTransactionId] = React.useState('');
  const [screenshotFile, setScreenshotFile] = React.useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [existingSubmission, setExistingSubmission] = React.useState<'pending' | 'approved' | 'rejected' | null>(null);

  React.useEffect(() => {
    (async () => {
      const [g, s] = await Promise.all([getEnabledGateways(), getPaymentSettings()]);
      setGateways(g);
      setSettings(s);
      const defaultGw = g.find((gw) => (gw.config as Record<string, unknown>)?.is_default === true) ?? g[0];
      if (defaultGw) setSelectedGateway(defaultGw);
      setLoading(false);
    })();
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, loading, router]);

  React.useEffect(() => {
    if (orderId && user) {
      (async () => {
        const sub = await getPaymentSubmission(orderId);
        if (sub) setExistingSubmission(sub.status);
      })();
    }
  }, [orderId, user]);

  const breakdown = settings ? calculatePriceBreakdown(subtotal, discountAmount, settings) : null;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponStatus('checking');
    setCouponError('');
    const result = await validateCoupon(couponCode, subtotal);
    if (result.valid) {
      setAppliedCoupon(result.coupon);
      setDiscountAmount(result.discountAmount);
      setCouponStatus('valid');
    } else {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponStatus('invalid');
      setCouponError(result.error ?? 'Invalid coupon');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    setCouponStatus('idle');
    setCouponError('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum 10MB', variant: 'destructive' });
      return;
    }
    setScreenshotFile(file);
  };

  const handleUpload = async () => {
    if (!screenshotFile || !user || !orderId) return;
    setUploading(true);
    const result = await uploadPaymentScreenshot(user.id, orderId, screenshotFile);
    setUploading(false);
    if (result.success && result.url) {
      setScreenshotUrl(result.url);
      toast({ title: 'Screenshot uploaded' });
    } else {
      toast({ title: 'Upload failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleCreateOrder = async () => {
    if (!user) return;
    if (items.length === 0) { toast({ title: 'Cart is empty', variant: 'destructive' }); return; }
    if (!selectedGateway) { toast({ title: 'Select a payment method', variant: 'destructive' }); return; }

    setSubmitting(true);
    const result = await createOrder(
      {
        items,
        paymentMethod: selectedGateway.code,
        paymentGateway: selectedGateway.code,
        couponCode: appliedCoupon?.code,
        referralCode: referralCode.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      user.id
    );

    if (!result.success) {
      toast({ title: 'Order failed', description: result.error, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    setOrderId(result.orderId!);
    setSubmitting(false);
    toast({ title: 'Order created', description: 'Now submit your payment proof below.' });
  };

  const handleSubmitPayment = async () => {
    if (!user || !orderId || !selectedGateway) return;
    if (!screenshotUrl) { toast({ title: 'Please upload payment screenshot', variant: 'destructive' }); return; }

    setSubmitting(true);
    const result = await submitPaymentProof({
      orderId,
      userId: user.id,
      gatewayId: selectedGateway.id,
      gatewayCode: selectedGateway.code,
      screenshotUrl,
      transactionId: transactionId.trim() || null,
    });

    setSubmitting(false);
    if (result.success) {
      toast({ title: 'Payment submitted!', description: 'Your payment is pending admin approval.' });
      setExistingSubmission('pending');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        <Footer />
      </>
    );
  }

  if (items.length === 0 && !orderId) {
    return (
      <>
        <Navbar />
        <PageTransition>
          <main className="mx-auto max-w-2xl px-4 pb-20 pt-32 sm:px-6">
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"><ShoppingCart className="h-8 w-8 text-muted-foreground" /></div>
              <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
              <p className="text-muted-foreground">Browse courses and add some to your cart before checking out.</p>
              <Button asChild><Link href="/courses"><ArrowLeft className="mr-2 h-4 w-4" />Browse Courses</Link></Button>
            </div>
          </main>
        </PageTransition>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Checkout</h1>
            <p className="mt-1 text-muted-foreground">Complete your purchase and start learning.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              {/* Cart items */}
              <Card className="p-6 shadow-soft">
                <h2 className="font-display text-lg font-semibold">Order Items ({items.length})</h2>
                <div className="mt-4 space-y-3">
                  {items.map((item, i) => (
                    <motion.div key={item.courseId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex gap-4 rounded-xl border p-3">
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.thumbnail ? <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500" />}
                      </div>
                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div><p className="truncate text-sm font-semibold">{item.title}</p>{item.instructorName && <p className="truncate text-xs text-muted-foreground">{item.instructorName}</p>}</div>
                        <p className="font-display text-sm font-bold">${item.price.toFixed(2)}</p>
                      </div>
                      {!orderId && <button onClick={() => removeItem(item.courseId)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Payment method */}
              {!orderId && (
                <Card className="p-6 shadow-soft">
                  <h2 className="font-display text-lg font-semibold">Payment Method</h2>
                  {gateways.length === 0 ? (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400">
                      <Lock className="h-4 w-4" />No payment methods are currently enabled. Please contact support.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {gateways.map((gw) => {
                        const Icon = gatewayIcons[gw.code] ?? CreditCard;
                        const config = gw.config as Record<string, string>;
                        const isSelected = selectedGateway?.id === gw.id;
                        return (
                          <button key={gw.id} onClick={() => setSelectedGateway(gw)} className={cn('w-full rounded-xl border p-4 text-left transition-all', isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/30')}>
                            <div className="flex items-center gap-3">
                              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}><Icon className="h-5 w-5" /></div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold">{gw.name}</p>
                                {gw.description && <p className="text-xs text-muted-foreground">{gw.description}</p>}
                              </div>
                              {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                            </div>
                            {isSelected && config && (config.account_number || config.iban || config.bank_name) && (
                              <div className="mt-3 rounded-lg border bg-muted/30 p-3 text-xs">
                                {config.account_holder && <p><span className="text-muted-foreground">Account Holder:</span> {String(config.account_holder)}</p>}
                                {config.account_number && <p><span className="text-muted-foreground">Account Number:</span> {String(config.account_number)}</p>}
                                {config.iban && <p><span className="text-muted-foreground">IBAN:</span> {String(config.iban)}</p>}
                                {config.bank_name && <p><span className="text-muted-foreground">Bank:</span> {String(config.bank_name)}</p>}
                                {config.branch && <p><span className="text-muted-foreground">Branch:</span> {String(config.branch)}</p>}
                                {config.qr_code_url && <div className="mt-2"><img src={String(config.qr_code_url)} alt="QR Code" className="h-24 w-24 rounded-lg" /></div>}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}

              {/* Payment confirmation after order is created */}
              {orderId && (
                <Card className="p-6 shadow-soft">
                  <h2 className="font-display text-lg font-semibold">Submit Payment Proof</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Transfer the amount to the selected method, then upload your receipt. Transaction ID is optional.</p>

                  {existingSubmission === 'pending' ? (
                    <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/30 dark:bg-amber-900/10">
                      <Clock className="h-8 w-8 text-amber-500" />
                      <p className="font-semibold text-amber-700 dark:text-amber-400">Payment Under Review</p>
                      <p className="text-sm text-muted-foreground">Your payment proof has been submitted and is pending admin approval. You will be notified once approved.</p>
                      <div className="flex gap-2">
                        <Button asChild variant="outline"><Link href="/checkout/pending">View Payment Status</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard">Go to Dashboard</Link></Button>
                      </div>
                    </div>
                  ) : existingSubmission === 'approved' ? (
                    <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900/30 dark:bg-emerald-900/10">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">Payment Approved!</p>
                      <p className="text-sm text-muted-foreground">Your payment has been approved and you are now enrolled.</p>
                      <Button asChild className="mt-2"><Link href="/dashboard">Start Learning <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Transaction ID (optional)</Label>
                        <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="TXN123456789 (optional)" />
                        <p className="text-xs text-muted-foreground">You may enter the transaction reference number if you have one.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Screenshot *</Label>
                        <div className="rounded-xl border-2 border-dashed p-6 text-center">
                          <input type="file" id="screenshot" accept="image/*" onChange={handleFileSelect} className="hidden" />
                          <label htmlFor="screenshot" className="cursor-pointer flex flex-col items-center gap-2">
                            {screenshotFile ? <ImageIcon className="h-8 w-8 text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                            <span className="text-sm text-muted-foreground">{screenshotFile ? screenshotFile.name : 'Click to select screenshot'}</span>
                          </label>
                        </div>
                        {screenshotFile && !screenshotUrl && (
                          <Button size="sm" variant="outline" onClick={handleUpload} disabled={uploading} className="w-full">
                            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : <><Upload className="mr-2 h-4 w-4" />Upload Screenshot</>}
                          </Button>
                        )}
                        {screenshotUrl && (
                          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                            <CheckCircle2 className="h-4 w-4" /> Screenshot uploaded successfully
                          </div>
                        )}
                      </div>
                      <Button onClick={handleSubmitPayment} disabled={submitting || !screenshotUrl} className="w-full">
                        {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <>Submit Payment Proof</>}
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              {!orderId && (
                <Card className="p-6 shadow-soft">
                  <Label htmlFor="notes">Order Notes (optional)</Label>
                  <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." className="mt-2" />
                </Card>
              )}
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-2">
              <Card className="lg:sticky lg:top-24 overflow-hidden p-0 shadow-card">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5 text-white">
                  <h2 className="font-display text-lg font-bold">Order Summary</h2>
                </div>
                <div className="space-y-4 p-6">
                  {!orderId && (
                    <div>
                      <Label className="text-xs">Coupon Code</Label>
                      {appliedCoupon ? (
                        <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                          <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-emerald-600" /><div><p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{appliedCoupon.code}</p><p className="text-xs text-emerald-600">{appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% off` : `$${appliedCoupon.discountValue} off`}</p></div></div>
                          <button onClick={removeCoupon} className="text-emerald-600 hover:text-emerald-800"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <div className="mt-2 flex gap-2">
                          <Input value={couponCode} onChange={(e) => { setCouponCode(e.target.value); setCouponStatus('idle'); setCouponError(''); }} placeholder="Enter code" className="text-sm" />
                          <Button size="sm" variant="outline" onClick={applyCoupon} disabled={couponStatus === 'checking' || !couponCode.trim()}>{couponStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}</Button>
                        </div>
                      )}
                      {couponStatus === 'invalid' && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
                    </div>
                  )}

                  {/* Referral Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Referral Code (optional)</label>
                    <Input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Enter referral code" className="text-sm" />
                    {referralCode && <p className="text-xs text-emerald-600">Referrer will earn 10% commission on your purchase.</p>}
                  </div>

                  <div className="border-t pt-4" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">${breakdown?.subtotal.toFixed(2) ?? '0.00'}</span></div>
                    {discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-emerald-600">Discount</span><span className="font-medium text-emerald-600">-${breakdown?.discountAmount.toFixed(2)}</span></div>}
                    {breakdown && breakdown.taxAmount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({settings?.taxRate}%)</span><span className="font-medium">${breakdown.taxAmount.toFixed(2)}</span></div>}
                  </div>
                  <div className="border-t pt-4" />
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-bold">Total</span>
                    <span className="font-display text-2xl font-bold text-primary">{settings?.currencySymbol}{breakdown?.totalAmount.toFixed(2) ?? '0.00'}</span>
                  </div>

                  {!orderId ? (
                    <Button className="w-full" size="lg" onClick={handleCreateOrder} disabled={submitting || gateways.length === 0}>
                      {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Order...</> : <><Lock className="mr-2 h-4 w-4" />Create Order</>}
                    </Button>
                  ) : (
                    <div className="rounded-lg border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                      Order #{orderId.slice(0, 8).toUpperCase()} created. Submit payment proof above.
                    </div>
                  )}
                  <p className="text-center text-xs text-muted-foreground">By completing this purchase, you agree to our Terms of Service and Privacy Policy.</p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
