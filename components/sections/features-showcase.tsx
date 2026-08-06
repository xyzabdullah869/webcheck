'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Gift, Wallet, ArrowRight } from 'lucide-react';
import { SectionTitle } from '@/components/section-title';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Sparkles,
    title: 'AI Bioinformatics Assistant',
    description:
      'Get instant help from your personal AI tutor. Ask about BLAST, NGS, Python, R, phylogenetics, and more. Available 24/7 to guide your learning.',
    href: '/ai-assistant',
    cta: 'Try AI Assistant',
    color: 'from-blue-500 to-cyan-500',
    badge: 'AI Powered',
  },
  {
    icon: Gift,
    title: 'Refer & Earn Program',
    description:
      'Invite friends to join and earn cash rewards for every successful referral. Share your unique code and watch your earnings grow.',
    href: '/referrals',
    cta: 'Start Earning',
    color: 'from-violet-500 to-purple-500',
    badge: 'Earn Rewards',
  },
  {
    icon: Wallet,
    title: 'Digital Wallet',
    description:
      'Manage your referral rewards, cashback, and transactions in one place. Full transparency on every credit and debit.',
    href: '/wallet',
    cta: 'View Wallet',
    color: 'from-emerald-500 to-teal-500',
    badge: 'Track Earnings',
  },
];

export function FeaturesShowcase() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Platform Features"
          title="More than just courses"
          description="Powerful tools designed to accelerate your bioinformatics journey — from AI tutoring to earning rewards."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
            >
              <Card className="group relative h-full overflow-hidden p-6 shadow-soft transition-shadow hover:shadow-card">
                <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${feature.color} opacity-10 transition-opacity group-hover:opacity-20`} />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-soft transition-transform group-hover:scale-110`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>

                  <Button asChild variant="ghost" size="sm" className="mt-4 -ml-2 group-hover:text-primary">
                    <Link href={feature.href}>
                      {feature.cta}
                      <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
