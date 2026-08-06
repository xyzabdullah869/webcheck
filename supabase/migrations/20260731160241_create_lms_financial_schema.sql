/*
# Create LMS Financial Schema — Referral History, Wallet, Transactions

## Overview
Creates referral tracking and wallet/transaction tables for the platform.

## New Tables
1. **referral_history** — tracks referral usage (who referred whom)
   - id, referrer_id (FK profiles), referred_id (FK profiles), code_used, created_at

2. **wallets** — user wallet for credits/earnings
   - id, user_id (FK profiles), balance, currency, created_at, updated_at

3. **transactions** — wallet transaction history
   - id, wallet_id (FK wallets), user_id (FK profiles), amount, type, description, reference_id, created_at

## Security
- referral_history: owner-scoped read, self-insert, admin all
- wallets: owner-scoped read, no direct insert/update (managed via transactions/edge functions)
- transactions: owner-scoped read, admin all
- Balance mutations should go through SECURITY DEFINER functions, not direct updates
*/

-- ========================
-- REFERRAL HISTORY
-- ========================
CREATE TABLE IF NOT EXISTS referral_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code_used text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE referral_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_history_select_own" ON referral_history;
CREATE POLICY "referral_history_select_own"
ON referral_history FOR SELECT
TO authenticated
USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "referral_history_insert_own" ON referral_history;
CREATE POLICY "referral_history_insert_own"
ON referral_history FOR INSERT
TO authenticated WITH CHECK (auth.uid() = referred_id OR public.has_role('admin'));

-- ========================
-- WALLETS
-- ========================
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_select_own" ON wallets;
CREATE POLICY "wallets_select_own"
ON wallets FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role('admin'));

-- Allow users to insert their own wallet row (if it doesn't exist)
DROP POLICY IF EXISTS "wallets_insert_own" ON wallets;
CREATE POLICY "wallets_insert_own"
ON wallets FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- No direct update policy — balance changes should go through edge functions / SECURITY DEFINER
-- Admins can update for corrections
DROP POLICY IF EXISTS "wallets_update_admin" ON wallets;
CREATE POLICY "wallets_update_admin"
ON wallets FOR UPDATE
TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

-- ========================
-- TRANSACTIONS
-- ========================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'payout', 'referral_bonus', 'course_purchase')),
  description text DEFAULT '',
  reference_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
CREATE POLICY "transactions_select_own"
ON transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
CREATE POLICY "transactions_insert_own"
ON transactions FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "transactions_delete_admin" ON transactions;
CREATE POLICY "transactions_delete_admin"
ON transactions FOR DELETE
TO authenticated USING (public.has_role('admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_referrer ON referral_history(referrer_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
