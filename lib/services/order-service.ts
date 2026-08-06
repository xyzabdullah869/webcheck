'use client';

import { createClient } from '@/lib/supabase/client';
import type { DbOrder, DbOrderItem } from '@/lib/database-types';
import { getPaymentSettings, calculateCommission, calculatePriceBreakdown, type PriceBreakdown } from './payment-service';
import { validateCoupon } from './coupon-service';

export type Order = {
  id: string;
  userId: string;
  orderNumber: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: string | null;
  paymentGateway: string | null;
  paymentReference: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  couponCode: string | null;
  currency: string;
  notes: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
  price: number;
  instructorId: string | null;
  platformCommission: number;
  instructorEarnings: number;
};

export type CartItem = {
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  instructorId: string | null;
  instructorName: string | null;
};

function mapOrder(db: DbOrder): Order {
  return {
    id: db.id,
    userId: db.user_id,
    orderNumber: db.order_number,
    status: db.status,
    paymentMethod: db.payment_method,
    paymentGateway: db.payment_gateway,
    paymentReference: db.payment_reference,
    subtotal: Number(db.subtotal),
    discountAmount: Number(db.discount_amount),
    taxAmount: Number(db.tax_amount),
    totalAmount: Number(db.total_amount),
    couponCode: db.coupon_code,
    currency: db.currency,
    notes: db.notes,
    paidAt: db.paid_at,
    refundedAt: db.refunded_at,
    refundReason: db.refund_reason,
    createdAt: db.created_at,
  };
}

function mapOrderItem(db: DbOrderItem): OrderItem {
  return {
    id: db.id,
    courseId: db.course_id,
    courseTitle: db.course_title,
    courseThumbnail: db.course_thumbnail,
    price: Number(db.price),
    instructorId: db.instructor_id,
    platformCommission: Number(db.platform_commission),
    instructorEarnings: Number(db.instructor_earnings),
  };
}

function generateOrderNumber(): string {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export type CreateOrderInput = {
  items: CartItem[];
  paymentMethod: string;
  paymentGateway: string;
  couponCode?: string;
  referralCode?: string;
  notes?: string;
};

export type CreateOrderResult = {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  breakdown?: PriceBreakdown;
  error?: string;
};

export async function createOrder(input: CreateOrderInput, userId: string): Promise<CreateOrderResult> {
  const supabase = createClient();
  const settings = await getPaymentSettings();

  const subtotal = input.items.reduce((sum, item) => sum + item.price, 0);
  if (subtotal <= 0) {
    return { success: false, error: 'Cart is empty or all items are free' };
  }

  let discountAmount = 0;
  let couponCode: string | null = null;

  if (input.couponCode) {
    const validation = await validateCoupon(input.couponCode, subtotal);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    discountAmount = validation.discountAmount;
    couponCode = validation.coupon!.code;
  }

  const breakdown = calculatePriceBreakdown(subtotal, discountAmount, settings);
  const orderNumber = generateOrderNumber();

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: userId,
      status: 'pending',
      payment_method: input.paymentMethod,
      payment_gateway: input.paymentGateway,
      subtotal: breakdown.subtotal,
      discount_amount: breakdown.discountAmount,
      tax_amount: breakdown.taxAmount,
      total_amount: breakdown.totalAmount,
      coupon_code: couponCode,
      referral_code: input.referralCode ?? null,
      currency: breakdown.currency,
      notes: input.notes ?? null,
    })
    .select('id, order_number')
    .single();

  if (orderError || !orderData) {
    return { success: false, error: orderError?.message ?? 'Failed to create order' };
  }

  const orderId = (orderData as Record<string, unknown>).id as string;
  const createdOrderNumber = (orderData as Record<string, unknown>).order_number as string;

  const orderItems = input.items.map((item) => {
    const { platformCommission, instructorEarnings } = calculateCommission(item.price, settings);
    return {
      order_id: orderId,
      course_id: item.courseId,
      course_title: item.title,
      course_thumbnail: item.thumbnail,
      price: item.price,
      instructor_id: item.instructorId,
      platform_commission: platformCommission,
      instructor_earnings: instructorEarnings,
    };
  });

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  return {
    success: true,
    orderId,
    orderNumber: createdOrderNumber,
    breakdown,
  };
}

export async function completeOrderRPC(orderId: string, paymentReference: string, paymentMethod?: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc('complete_order', {
    order_uuid: orderId,
    payment_ref: paymentReference,
    payment_method: paymentMethod ?? null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function markOrderPaid(orderId: string, paymentReference: string, paymentMethod?: string): Promise<{ success: boolean; error?: string }> {
  return completeOrderRPC(orderId, paymentReference, paymentMethod);
}

export async function markOrderFailed(orderId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('orders')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function refundOrder(orderId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      refund_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getUserOrders(userId: string): Promise<(Order & { itemCount: number })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const items = row.order_items as Record<string, unknown>[] | undefined;
    return {
      ...mapOrder(row as unknown as DbOrder),
      itemCount: items?.[0]?.count as number ?? 0,
    };
  });
}

export async function getOrderById(orderId: string): Promise<{ order: Order | null; items: OrderItem[] }> {
  const supabase = createClient();
  const { data: orderData } = await supabase
    .from('orders')
    .select('*, profiles!orders_user_id_fkey(email)')
    .eq('id', orderId)
    .maybeSingle();

  if (!orderData) return { order: null, items: [] };

  const { data: itemsData } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  const mapped = mapOrder(orderData as unknown as DbOrder);
  const profile = (orderData as Record<string, unknown>).profiles as Record<string, unknown> | undefined;
  return {
    order: { ...mapped, userId: (profile?.id as string) ?? mapped.userId },
    items: (itemsData ?? []).map((d: Record<string, unknown>) => mapOrderItem(d as unknown as DbOrderItem)),
  };
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  return (data ?? []).map((d: Record<string, unknown>) => mapOrderItem(d as unknown as DbOrderItem));
}

export async function getAllOrders(limit = 50, offset = 0): Promise<(Order & { itemCount: number; userEmail: string })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(count), profiles!orders_user_id_fkey(email)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const items = row.order_items as Record<string, unknown>[] | undefined;
    const profile = row.profiles as Record<string, unknown> | undefined;
    return {
      ...mapOrder(row as unknown as DbOrder),
      itemCount: items?.[0]?.count as number ?? 0,
      userEmail: (profile?.email as string) ?? '—',
    };
  });
}

export async function hasUserPurchasedCourse(userId: string, courseId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .maybeSingle();

  if (!data) return false;

  const { data: item } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', (data as Record<string, unknown>).id as string)
    .eq('course_id', courseId)
    .maybeSingle();

  return !!item;
}

export async function isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  return !!data;
}
