'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
  className?: string;
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  center = true,
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        center && 'items-center text-center',
        className
      )}
    >
      {eyebrow && (
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"
        >
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={cn(
          'font-display text-3xl font-bold tracking-tight sm:text-4xl',
          center && 'max-w-2xl'
        )}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={cn(
            'text-base text-muted-foreground sm:text-lg',
            center && 'max-w-2xl'
          )}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
