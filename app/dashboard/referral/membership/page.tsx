'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Crown, Loader as Loader2, Upload, CreditCard, Wallet, Smartphone, Building2, CircleCheck } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageTransition } from '@/components/page-transition';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

const gatewayIcons: Record<string, typeof CreditCard> = {
  stripe: CreditCard,
  paypal: Wallet,
  easypaisa: Smartphone,
  jazzcash: Smartphone,
  bank_transfer: Building2,
};

type Gateway = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  config: Record<string, unknown>;
  display_order: number;
};

export default function MembershipPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [gateways, setGateways] = React.useState<Gateway[]>([]);
  const [selectedGateway, setSelectedGateway] = React.useState<Gateway | null>(null);
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  const [transactionId, setTransactionId] = React.useState('');
  const [referralCode, setReferralCode] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [membershipFee, setMembershipFee] = React.useState(300);
  const [membershipEnabled, setMembershipEnabled] = React.useState(true);
  const [referralReward, setReferralReward] = React.useState(100);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: settings } = await supabase.from('referral_settings').select('*').limit(1).maybeSingle();
      if (settings) {
        setMembershipFee(Number((settings as Record<string, unknown>).membership_fee ?? 300));
        setMembershipEnabled((settings as Record<string, unknown>).membership_enabled as boolean ?? true);
        setReferralReward(Number((settings as Record<string, unknown>).membership_referral_reward ?? 100));
      }
      const { data: gws } = await supabase.from('payment_gateways').select('*').eq('is_enabled', true).order('display_order', { ascending: true });
      setGateways((gws ?? []) as Gateway[]);
      if (gws && gws.length > 0) setSelectedGateway(gws[0] as Gateway);
      setLoading(false);
    })();
  }, []);

  // Check for ref code in URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(ref);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/dashboard/referral/membership');
      return;
    }
    if (!selectedGateway) {
      toast({ title: 'Please select a payment method', variant: 'destructive' });
      return;
    }
    if (!screenshot) {
      toast({ title: 'Please upload a payment screenshot', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    // Upload screenshot
    const fileExt = screenshot.name.split('.').pop();
    const fileName = `${user.id}/membership-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('payment-screenshots').upload(fileName, screenshot);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('payment-screenshots').getPublicUrl(fileName);

    // Resolve referrer from referral code
    let referrerId: string | null = null;
    if (referralCode.trim()) {
      const { data: codeRecord } = await supabase.from('referral_codes').select('user_id').eq('code', referralCode.trim()).maybeSingle();
      if (codeRecord) referrerId = (codeRecord as Record<string, unknown>).user_id as string;
    }

    const { error } = await supabase.from('membership_purchases').insert({
      user_id: user.id,
      amount: membershipFee,
      payment_method: selectedGateway.code,
      screenshot_url: urlData.publicUrl,
      transaction_id: transactionId.trim() || null,
      referral_code: referralCode.trim() || null,
      referrer_id: referrerId,
      status: 'pending',
    });

    setSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Payment submitted', description: 'Your membership payment is under review. Please wait up to 24 hours.' });
      router.push('/checkout/pending');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        <Footer />
      </>
    );
  }

  if (!membershipEnabled) {
    return (
      <>
        <Navbar />
        <PageTransition>
          <main className="mx-auto max-w-2xl px-4 py-32 text-center sm:px-6">
            <Card className="p-8 shadow-card">
              <Crown className="mx-auto h-12 w-12 text-muted-foreground" />
              <h1 className="mt-4 font-display text-2xl font-bold">Membership Unavailable</h1>
              <p className="mt-2 text-muted-foreground">Membership purchases are currently disabled.</p>
              <Button asChild className="mt-6"><Link href="/courses">Browse Courses</Link></Button>
            </Card>
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
        <main className="mx-auto max-w-2xl px-4 py-32 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden p-0 shadow-card">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-8 text-center text-white">
                <Crown className="mx-auto h-12 w-12" />
                <h1 className="mt-4 font-display text-2xl font-bold">Buy Membership</h1>
                <p className="mt-2 text-sm text-white/80">Unlock full access to the platform as a registered member.</p>
                <p className="mt-4 font-display text-3xl font-bold">PKR {membershipFee}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                {/* Payment Method */}
                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  {gateways.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payment methods available. Please contact support.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {gateways.map((gw) => {
                        const Icon = gatewayIcons[gw.code] ?? CreditCard;
                        const config = gw.config as Record<string, string>;
                        return (
                          <button
                            key={gw.id}
                            type="button"
                            onClick={() => setSelectedGateway(gw)}
                            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selectedGateway?.id === gw.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                          >
                            <Icon className="h-5 w-5 shrink-0 text-primary" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{gw.name}</p>
                              {config?.account_number && <p className="truncate text-xs text-muted-foreground">{String(config.account_number)}</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {selectedGateway && (
                    <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                      {selectedGateway.description && <p>{selectedGateway.description}</p>}
                      {(() => {
                        const config = selectedGateway.config as Record<string, string>;
                        return (
                          <>
                            {config?.account_holder && <p>Account Holder: {String(config.account_holder)}</p>}
                            {config?.account_number && <p>Account Number: {String(config.account_number)}</p>}
                            {config?.bank_name && <p>Bank: {String(config.bank_name)}</p>}
                            {config?.iban && <p>IBAN: {String(config.iban)}</p>}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Referral Code */}
                <div className="space-y-2">
                  <Label>Referral Code (optional)</Label>
                  <Input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Enter referral code" />
                  {referralCode && <p className="text-xs text-emerald-600">Referrer will earn PKR {referralReward} when your membership is approved.</p>}
                </div>

                {/* Transaction ID */}
                <div className="space-y-2">
                  <Label>Transaction ID (optional)</Label>
                  <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Transaction reference number" />
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-2">
                  <Label>Payment Screenshot *</Label>
                  <div className="rounded-xl border-2 border-dashed p-4">
                    {screenshot ? (
                      <div className="flex items-center gap-3">
                        <CircleCheck className="h-5 w-5 text-emerald-500" />
                        <p className="flex-1 truncate text-sm">{screenshot.name}</p>
                        <Button type="button" size="sm" variant="outline" onClick={() => setScreenshot(null)}>Remove</Button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center gap-2 py-4">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload payment screenshot</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setScreenshot(e.target.files[0]); }} />
                      </label>
                    )}
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={submitting || !selectedGateway || !screenshot}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Payment Proof · PKR {membershipFee}
                </Button>
              </form>
            </Card>
          </motion.div>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
