'use client';

import * as React from 'react';
import type { CartItem } from '@/lib/services/order-service';

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  hasItem: (courseId: string) => boolean;
  totalItems: number;
  subtotal: number;
};

const CartContext = React.createContext<CartContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  hasItem: () => false,
  totalItems: 0,
  subtotal: 0,
});

const STORAGE_KEY = 'biohub_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = React.useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.courseId === item.courseId)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = React.useCallback((courseId: string) => {
    setItems((prev) => prev.filter((i) => i.courseId !== courseId));
  }, []);

  const clearCart = React.useCallback(() => setItems([]), []);

  const hasItem = React.useCallback(
    (courseId: string) => items.some((i) => i.courseId === courseId),
    [items]
  );

  const totalItems = items.length;
  const subtotal = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, hasItem, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return React.useContext(CartContext);
}
