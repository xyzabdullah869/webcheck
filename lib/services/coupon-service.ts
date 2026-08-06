'use client';

import { createClient } from '@/lib/supabase/client';
import type { DbCoupon } from '@/lib/database-types';

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

export type CouponValidation = {
  valid: boolean;
  coupon: Coupon | null;
  discountAmount: number;
  error?: string;
};

function mapCoupon(db: DbCoupon): Coupon {
  return {
    id: db.id,
    code: db.code,
    description: db.description,
    discountType: db.discount_type,
    discountValue: Number(db.discount_value),
    minOrderAmount: Number(db.min_order_amount),
    maxDiscountAmount: db.max_discount_amount ? Number(db.max_discount_amount) : null,
    usageLimit: db.usage_limit,
    usedCount: db.used_count,
    expiresAt: db.expires_at,
    isActive: db.is_active,
    createdAt: db.created_at,
  };
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  if (!code.trim()) {
    return { valid: false, coupon: null, discountAmount: 0, error: 'Enter a coupon code' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .ilike('code', code.trim())
    .maybeSingle();

  if (error || !data) {
    return { valid: false, coupon: null, discountAmount: 0, error: 'Invalid coupon code' };
  }

  const coupon = mapCoupon(data as DbCoupon);

  if (!coupon.isActive) {
    return { valid: false, coupon: null, discountAmount: 0, error: 'This coupon is no longer active' };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, coupon: null, discountAmount: 0, error: 'This coupon has expired' };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, coupon: null, discountAmount: 0, error: 'This coupon has reached its usage limit' };
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      coupon: null,
      discountAmount: 0,
      error: `Minimum order amount is $${coupon.minOrderAmount.toFixed(2)}`,
    };
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount !== null) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
  } else {
    discount = coupon.discountValue;
  }

  discount = Math.min(discount, subtotal);
  discount = Math.round(discount * 100) / 100;

  return { valid: true, coupon, discountAmount: discount };
}

export async function getAllCoupons(): Promise<Coupon[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []).map((d: Record<string, unknown>) => mapCoupon(d as unknown as DbCoupon));
}

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('coupons').insert({
    code: coupon.code.toUpperCase(),
    description: coupon.description,
    discount_type: coupon.discountType,
    discount_value: coupon.discountValue,
    min_order_amount: coupon.minOrderAmount,
    max_discount_amount: coupon.maxDiscountAmount,
    usage_limit: coupon.usageLimit,
    expires_at: coupon.expiresAt,
    is_active: coupon.isActive,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.discountType !== undefined) dbUpdates.discount_type = updates.discountType;
  if (updates.discountValue !== undefined) dbUpdates.discount_value = updates.discountValue;
  if (updates.minOrderAmount !== undefined) dbUpdates.min_order_amount = updates.minOrderAmount;
  if (updates.maxDiscountAmount !== undefined) dbUpdates.max_discount_amount = updates.maxDiscountAmount;
  if (updates.usageLimit !== undefined) dbUpdates.usage_limit = updates.usageLimit;
  if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  const { error } = await supabase.from('coupons').update(dbUpdates).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteCoupon(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
