'use client';

import * as React from 'react';
import Link from 'next/link';
import { ServerCrash, Chrome as Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute -top-24 right-1/4 -z-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
        <ServerCrash className="h-10 w-10" />
      </div>

      <h1 className="mt-6 font-display text-6xl font-bold">500</h1>
      <p className="mt-2 font-display text-lg font-semibold">Something went wrong</p>
      <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
        An unexpected error occurred. We are working to fix it. Please try again in a moment.
      </p>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={() => reset()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
