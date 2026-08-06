'use client';

import { createClient } from '@/lib/supabase/client';
import type { DbPaymentSettings, DbPaymentGateway } from '@/lib/database-types';

export type PaymentSettings = {
  currency: string;
  currencySymbol: string;
  taxRate: number;
  taxEnabled: boolean;
  platformCommissionPercent: number;
  instructorCommissionPercent: number;
  fixedCommissionPerSale: number;
  minWithdrawalAmount: number;
};

export type PaymentGateway = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  isTestMode: boolean;
  displayOrder: number;
  config: Record<string, unknown>;
};

function mapSettings(db: DbPaymentSettings): PaymentSettings {
  return {
    currency: db.currency,
    currencySymbol: db.currency_symbol,
    taxRate: Number(db.tax_rate),
    taxEnabled: db.tax_enabled,
    platformCommissionPercent: Number(db.platform_commission_percent),
    instructorCommissionPercent: Number(db.instructor_commission_percent),
    fixedCommissionPerSale: Number(db.fixed_commission_per_sale),
    minWithdrawalAmount: Number(db.min_withdrawal_amount),
  };
}

function mapGateway(db: DbPaymentGateway): PaymentGateway {
  return {
    id: db.id,
    code: db.code,
    name: db.name,
    description: db.description,
    isEnabled: db.is_enabled,
    isTestMode: db.is_test_mode,
    displayOrder: db.display_order,
    config: db.config,
  };
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const supabase = createClient();
  const { data } = await supabase
    .from('payment_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (!data) {
    return {
      currency: 'USD',
      currencySymbol: '$',
      taxRate: 0,
      taxEnabled: false,
      platformCommissionPercent: 20,
      instructorCommissionPercent: 80,
      fixedCommissionPerSale: 0,
      minWithdrawalAmount: 50,
    };
  }
  return mapSettings(data as DbPaymentSettings);
}

export async function updatePaymentSettings(updates: Partial<PaymentSettings>): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fieldMap: Record<string, string> = {
    currency: 'currency',
    currencySymbol: 'currency_symbol',
    taxRate: 'tax_rate',
    taxEnabled: 'tax_enabled',
    platformCommissionPercent: 'platform_commission_percent',
    instructorCommissionPercent: 'instructor_commission_percent',
    fixedCommissionPerSale: 'fixed_commission_per_sale',
    minWithdrawalAmount: 'min_withdrawal_amount',
  };
  for (const [key, value] of Object.entries(updates)) {
    const dbKey = fieldMap[key];
    if (dbKey) dbUpdates[dbKey] = value;
  }
  const { error } = await supabase.from('payment_settings').update(dbUpdates).eq('id', 1);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getEnabledGateways(): Promise<PaymentGateway[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('payment_gateways')
    .select('*')
    .eq('is_enabled', true)
    .order('display_order', { ascending: true });
  return (data ?? []).map(mapGateway);
}

export async function getAllGateways(): Promise<PaymentGateway[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('payment_gateways')
    .select('*')
    .order('display_order', { ascending: true });
  return (data ?? []).map(mapGateway as (db: DbPaymentGateway) => PaymentGateway);
}

export async function updateGateway(id: string, updates: Partial<PaymentGateway> & { config?: Record<string, unknown> }): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled;
  if (updates.isTestMode !== undefined) dbUpdates.is_test_mode = updates.isTestMode;
  if (updates.config !== undefined) dbUpdates.config = updates.config;
  const { error } = await supabase.from('payment_gateways').update(dbUpdates).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export type PriceBreakdown = {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  currencySymbol: string;
};

export function calculatePriceBreakdown(
  subtotal: number,
  discountAmount: number,
  settings: PaymentSettings
): PriceBreakdown {
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = settings.taxEnabled
    ? Math.round(afterDiscount * (settings.taxRate / 100) * 100) / 100
    : 0;
  const totalAmount = Math.round((afterDiscount + taxAmount) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount,
    totalAmount,
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
  };
}

export function calculateCommission(
  price: number,
  settings: PaymentSettings
): { platformCommission: number; instructorEarnings: number } {
  const platformCommission = Math.round(
    (price * (settings.platformCommissionPercent / 100) + settings.fixedCommissionPerSale) * 100
  ) / 100;
  const instructorEarnings = Math.round((price - platformCommission) * 100) / 100;
  return { platformCommission, instructorEarnings };
}
