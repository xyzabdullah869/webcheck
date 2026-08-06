'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, BookOpen, ArrowRight, Loader as Loader2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

type PendingSubmission = {
  id: string;
  order_id: string;
  gateway_code: string;
  screenshot_url: string;
  transaction_id: string | null;
  status: string;
  created_at: string;
  order?: {
    order_number: string;
    total_amount: number;
  };
};

export default function PaymentPendingPage() {
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = React.useState<PendingSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('payment_submissions')
        .select('id, order_id, gateway_code, screenshot_url, transaction_id, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setSubmissions((data ?? []) as PendingSubmission[]);
      setLoading(false);
    })();
  }, [user, authLoading]);

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden p-0 shadow-card">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20"
                >
                  <Clock className="h-10 w-10" />
                </motion.div>
                <h1 className="mt-4 font-display text-2xl font-bold">Payment Pending</h1>
                <p className="mt-2 text-sm text-white/80">
                  Your payment is under review. Please wait up to 24 hours for admin approval.
                </p>
              </div>

              <div className="space-y-4 p-6">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : submissions.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No payment submissions found.</p>
                    <Button asChild className="mt-4"><Link href="/courses">Browse Courses <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold capitalize">{sub.gateway_code}</p>
                            <p className="text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleString()}</p>
                            {sub.transaction_id && <p className="text-xs text-muted-foreground">Txn: {sub.transaction_id}</p>}
                          </div>
                          <Badge variant={sub.status === 'pending' ? 'outline' : sub.status === 'approved' ? 'default' : 'destructive'}>
                            {sub.status}
                          </Badge>
                        </div>
                        {sub.screenshot_url && (
                          <div className="mt-3">
                            <img src={sub.screenshot_url} alt="Payment proof" className="h-20 rounded-lg border object-cover" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/dashboard">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Go to Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/courses">
                      Browse Courses <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
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
