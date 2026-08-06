'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, RotateCcw, Headphones } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/page-transition';

export default function FailedPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-2xl px-4 pb-20 pt-32 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden p-0 shadow-card">
              <div className="bg-gradient-to-r from-rose-500 to-red-500 p-8 text-center text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20"
                >
                  <XCircle className="h-10 w-10" />
                </motion.div>
                <h1 className="mt-4 font-display text-2xl font-bold">Payment Failed</h1>
                <p className="mt-2 text-sm text-white/80">
                  Your payment could not be processed. Please try again.
                </p>
              </div>

              <div className="space-y-4 p-6">
                {orderId && (
                  <div className="rounded-xl border p-4 text-center">
                    <p className="text-sm text-muted-foreground">Order Reference</p>
                    <p className="font-semibold">{orderId.slice(0, 8).toUpperCase()}</p>
                  </div>
                )}

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Your cart items have been preserved. You can try the payment again with a different method.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="flex-1">
                    <Link href="/checkout">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Try Again
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/contact">
                      <Headphones className="mr-2 h-4 w-4" />
                      Contact Support
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
