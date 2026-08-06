'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Chrome as Home, Compass, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute -top-24 left-1/3 -z-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <p className="font-display text-[120px] font-bold leading-none hero-gradient sm:text-[180px]">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          The page you're looking for doesn't exist or has been moved. Let's
          get you back on track.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/courses">
              <Compass className="mr-2 h-4 w-4" />
              Explore courses
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
