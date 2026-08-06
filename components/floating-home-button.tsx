'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Chrome as Home } from 'lucide-react';

export function FloatingHomeButton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
      className="fixed bottom-6 left-6 z-40"
    >
      <Link href="/" aria-label="Go to homepage">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-primary/20 transition-colors hover:bg-primary/90"
        >
          <Home className="h-5 w-5" />
        </motion.div>
      </Link>
    </motion.div>
  );
}
