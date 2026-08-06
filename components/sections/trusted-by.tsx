'use client';

import { motion } from 'framer-motion';
import { useSiteSettings } from '@/lib/contexts/site-settings-context';

export function TrustedBy() {
  const { settings } = useSiteSettings();
  const partners = settings.partners ?? [];

  if (partners.length === 0) return null;

  return (
    <section className="border-y bg-muted/20 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Trusted by leading institutions and research labs
        </motion.p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {partners.map((partner, i) => (
            <motion.span
              key={partner}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="font-display text-lg font-bold tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {partner}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
