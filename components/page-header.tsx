'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <section className={cn('relative overflow-hidden border-b bg-muted/20 pt-32 pb-12 sm:pt-36', className)}>
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
      <div className="absolute -top-24 left-1/3 -z-10 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start gap-3"
        >
          {eyebrow && (
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              {eyebrow}
            </span>
          )}
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              {description}
            </p>
          )}
          {children}
        </motion.div>
      </div>
    </section>
  );
}
