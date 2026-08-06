'use client';

import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Stat } from '@/lib/types';

type StatsCardProps = {
  stat: Stat;
  index?: number;
};

export function StatsCard({ stat, index = 0 }: StatsCardProps) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[stat.icon] ?? Icons.Sparkles;
  const hasData = stat.value > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="relative overflow-hidden p-6 text-center shadow-soft transition-shadow hover:shadow-card">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {hasData ? (
              `${stat.value.toLocaleString()}${stat.suffix}`
            ) : (
              <span className="text-muted-foreground/40">—</span>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
        </div>
      </Card>
    </motion.div>
  );
}
