'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { pricingPlans } from '@/lib/data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FaqSection } from '@/components/sections/faq-section';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const [billing, setBilling] = React.useState<'monthly' | 'yearly'>('monthly');

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          description="Start free, upgrade when you are ready. No hidden fees, cancel anytime."
        >
          {/* Billing toggle */}
          <div className="mt-6 inline-flex items-center gap-1 rounded-full border bg-card p-1 shadow-soft">
            {(['monthly', 'yearly'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={cn(
                  'relative rounded-full px-5 py-2 text-sm font-medium transition-colors',
                  billing === b ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {billing === b && (
                  <motion.span
                    layoutId="billing-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative capitalize">{b}</span>
                {b === 'yearly' && (
                  <span className="relative ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    -20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </PageHeader>

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan, i) => {
              const price =
                billing === 'yearly' && plan.price > 0
                  ? Math.round(plan.price * 0.8)
                  : plan.price;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Card
                    className={cn(
                      'relative flex h-full flex-col p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card',
                      plan.highlighted && 'border-primary shadow-glow ring-1 ring-primary/30'
                    )}
                  >
                    {plan.highlighted && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1 border-0 bg-primary text-primary-foreground shadow-glow">
                        <Sparkles className="h-3 w-3" />
                        Most Popular
                      </Badge>
                    )}
                    <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="font-display text-4xl font-bold">${price}</span>
                      <span className="text-sm text-muted-foreground">
                        /{plan.period === 'forever' ? 'forever' : billing === 'yearly' ? 'mo' : 'mo'}
                      </span>
                    </div>
                    {billing === 'yearly' && plan.price > 0 && (
                      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                        Billed annually — save 20%
                      </p>
                    )}
                    <Button
                      asChild
                      variant={plan.highlighted ? 'default' : 'outline'}
                      className="mt-6 w-full"
                    >
                      <a href="/dashboard">
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <ul className="mt-6 space-y-3 border-t pt-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Need a custom plan for your institution?{' '}
            <a href="/contact" className="font-semibold text-primary hover:underline">
              Contact our team
            </a>
          </p>
        </div>

        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
