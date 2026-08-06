'use client';

import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent', className)}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" role="status" aria-label={message}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <LoadingSpinner className="h-6 w-6" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl border bg-card p-5 shadow-soft', className)}>
      <div className="h-10 w-10 rounded-xl bg-muted" />
      <div className="mt-3 h-6 w-3/4 rounded bg-muted" />
      <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-muted" />
        <div className="h-5 w-12 rounded-full bg-muted" />
      </div>
      <div className="mt-3 h-7 w-20 rounded bg-muted" />
      <div className="mt-2 h-3 w-16 rounded bg-muted" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="flex items-center gap-3">
            {i === 0 && <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />}
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border shadow-soft">
      <div className="border-b bg-muted/30 p-4">
        <div className="h-5 w-1/4 animate-pulse rounded bg-muted" />
      </div>
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="aspect-video bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-4 w-1/4 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl border bg-card p-6 shadow-soft', className)}>
      <div className="h-5 w-1/4 rounded bg-muted" />
      <div className="mt-4 h-64 rounded-lg bg-muted/50" />
    </div>
  );
}

export function ListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border p-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
