'use client';

import { motion } from 'framer-motion';
import { Inbox, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <p className="mt-4 font-display font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button asChild={!!action.href} onClick={action.onClick} size="sm" className="mt-4">
          {action.href ? <a href={action.href}>{action.label}</a> : action.label}
        </Button>
      )}
    </motion.div>
  );
}

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground/40">
        <SearchIcon className="h-6 w-6" />
      </div>
      <p className="mt-4 font-display font-semibold">No results found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Try searching for something else{query ? ` instead of "${query}"` : ''}.
      </p>
    </div>
  );
}
