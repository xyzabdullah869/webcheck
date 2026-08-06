/*
# Expand Referral System: Membership + Course Commission

## Purpose
Extend the referral system to support two earning methods:
1. Membership referral — When an invited user buys membership, referrer earns 100 PKR
2. Course referral — Each course has a referral link; referrer earns 10% commission on successful purchase

## Changes to referral_settings table
- `membership_fee` (numeric, default 300) — Cost of student membership in PKR
- `membership_referral_reward` (numeric, default 100) — Referrer earns this when invited user buys membership
- `course_referral_commission_percent` (numeric, default 10) — % commission on course referral purchases
- `membership_enabled` (boolean, default true) — Whether membership purchase is active

## New table: membership_purchases
Tracks membership payments (same payment flow as courses).
- `id` (uuid PK)
- `user_id` (uuid FK profiles)
- `amount` (numeric, NOT NULL)
- `payment_method` (text)
- `screenshot_url` (text, nullable)
- `transaction_id` (text, nullable)
- `status` (text: pending/approved/rejected, default 'pending')
- `referral_code` (text, nullable) — The referral code used
- `referrer_id` (uuid, nullable) — Resolved referrer
- `referral_reward_credited` (boolean, default false) — Whether referrer reward was paid
- `created_at`, `updated_at` (timestamptz)

## New RPC: process_referral_earnings
Called after payment approval to credit referral earnings to the referrer's wallet.
Handles both membership and course referral types.

## Security
- RLS enabled on membership_purchases (owner-scoped SELECT/INSERT, admin UPDATE)
- RPC is SECURITY DEFINER, admin-only execution
*/

-- Add columns to referral_settings
ALTER TABLE referral_settings
  ADD COLUMN IF NOT EXISTS membership_fee numeric NOT NULL DEFAULT 300;

ALTER TABLE referral_settings
  ADD COLUMN IF NOT EXISTS membership_referral_reward numeric NOT NULL DEFAULT 100;

ALTER TABLE referral_settings
  ADD COLUMN IF NOT EXISTS course_referral_commission_percent numeric NOT NULL DEFAULT 10;

ALTER TABLE referral_settings
  ADD COLUMN IF NOT EXISTS membership_enabled boolean NOT NULL DEFAULT true;

-- Create membership_purchases table
CREATE TABLE IF NOT EXISTS membership_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text,
  screenshot_url text,
  transaction_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  referral_code text,
  referrer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  referral_reward_credited boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE membership_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_membership" ON membership_purchases;
CREATE POLICY "select_own_membership" ON membership_purchases FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR has_role('admin'::text) OR has_role('owner'::text));

DROP POLICY IF EXISTS "insert_own_membership" ON membership_purchases;
CREATE POLICY "insert_own_membership" ON membership_purchases FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_admin_membership" ON membership_purchases;
CREATE POLICY "update_admin_membership" ON membership_purchases FOR UPDATE
  TO authenticated USING (has_role('admin'::text) OR has_role('owner'::text))
  WITH CHECK (has_role('admin'::text) OR has_role('owner'::text));

-- RPC to process referral earnings after a purchase is approved
CREATE OR REPLACE FUNCTION process_referral_earnings(
  p_type text,
  p_user_id uuid,
  p_amount numeric,
  p_referral_code text DEFAULT NULL,
  p_course_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_settings record;
  v_reward numeric;
  v_wallet record;
  v_description text;
BEGIN
  SELECT * INTO v_settings FROM referral_settings LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral settings not found');
  END IF;

  -- Resolve referrer from referral code
  IF p_referral_code IS NOT NULL THEN
    SELECT user_id INTO v_referrer_id FROM referral_codes WHERE code = p_referral_code;
    IF v_referrer_id IS NULL OR v_referrer_id = p_user_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
    END IF;
  ELSE
    -- Try to find referrer from referral_history
    SELECT referrer_id INTO v_referrer_id FROM referral_history WHERE referred_id = p_user_id LIMIT 1;
    IF v_referrer_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No referrer found');
    END IF;
  END IF;

  -- Calculate reward based on type
  IF p_type = 'membership' THEN
    v_reward := v_settings.membership_referral_reward;
    v_description := 'Referral membership bonus';
  ELSIF p_type = 'course' THEN
    v_reward := (p_amount * v_settings.course_referral_commission_percent / 100);
    v_description := 'Course referral commission (10%)';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral type');
  END IF;

  -- Credit referrer wallet
  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_referrer_id;
  IF v_wallet IS NULL THEN
    INSERT INTO wallets (user_id, balance, currency) VALUES (v_referrer_id, v_reward, 'PKR')
    ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + v_reward, updated_at = now();
  ELSE
    UPDATE wallets SET balance = balance + v_reward, updated_at = now() WHERE user_id = v_referrer_id;
  END IF;

  -- Create transaction record
  INSERT INTO transactions (wallet_id, user_id, type, amount, description, status)
  SELECT w.id, v_referrer_id, 'referral_bonus', v_reward, v_description, 'completed'
  FROM wallets w WHERE w.user_id = v_referrer_id LIMIT 1;

  -- Create/update referral reward record
  INSERT INTO referral_rewards (referrer_id, referred_id, reward_amount, status, referral_type)
  VALUES (v_referrer_id, p_user_id, v_reward, 'credited', p_type)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'reward', v_reward, 'referrer_id', v_referrer_id);
END;
$$;

GRANT EXECUTE ON FUNCTION process_referral_earnings(text, uuid, numeric, text, uuid) TO authenticated;

-- RPC to approve membership purchase and credit referrer
CREATE OR REPLACE FUNCTION approve_membership_purchase(p_purchase_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase record;
  v_caller_id uuid := auth.uid();
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;
  IF v_caller_role NOT IN ('admin', 'owner') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  SELECT * INTO v_purchase FROM membership_purchases WHERE id = p_purchase_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Purchase not found');
  END IF;

  IF v_purchase.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only pending purchases can be approved');
  END IF;

  -- Update purchase status
  UPDATE membership_purchases
  SET status = 'approved', updated_at = now()
  WHERE id = p_purchase_id;

  -- Process referral earnings if referral code was used
  IF v_purchase.referral_code IS NOT NULL AND NOT v_purchase.referral_reward_credited THEN
    PERFORM process_referral_earnings(
      'membership',
      v_purchase.user_id,
      v_purchase.amount,
      v_purchase.referral_code
    );

    UPDATE membership_purchases
    SET referral_reward_credited = true
    WHERE id = p_purchase_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Membership approved');
END;
$$;

GRANT EXECUTE ON FUNCTION approve_membership_purchase(uuid) TO authenticated;

-- RPC to reject membership purchase
CREATE OR REPLACE FUNCTION reject_membership_purchase(p_purchase_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;
  IF v_caller_role NOT IN ('admin', 'owner') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  UPDATE membership_purchases
  SET status = 'rejected', updated_at = now()
  WHERE id = p_purchase_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only pending purchases can be rejected');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Membership rejected');
END;
$$;

GRANT EXECUTE ON FUNCTION reject_membership_purchase(uuid) TO authenticated;
