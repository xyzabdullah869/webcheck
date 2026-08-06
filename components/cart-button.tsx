'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Trash2, ArrowRight, Loader as Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CartButton() {
  const { items, totalItems, subtotal, removeItem } = useCart();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Cart"
      >
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {totalItems}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed right-4 top-20 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border bg-card shadow-float"
            >
              <div className="flex items-center justify-between border-b p-4">
                <h3 className="font-display text-sm font-bold">Shopping Cart ({totalItems})</h3>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Your cart is empty</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.courseId} className="flex gap-3">
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{item.title}</p>
                          <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.courseId)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-display text-sm font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <Button asChild className="w-full" size="sm">
                    <Link href="/checkout" onClick={() => setOpen(false)}>
                      Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
