'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldAlert, Chrome as Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute -top-24 left-1/4 -z-10 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />

      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
        <ShieldAlert className="h-10 w-10" />
      </div>

      <h1 className="mt-6 font-display text-6xl font-bold">403</h1>
      <p className="mt-2 font-display text-lg font-semibold">Access denied</p>
      <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
        You do not have permission to access this page. Please contact an administrator if you believe this is an error.
      </p>

      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
