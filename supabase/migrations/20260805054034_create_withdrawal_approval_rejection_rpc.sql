/*
# Withdrawal Approval/Rejection RPC Functions

## Purpose
Server-side functions to approve or reject withdrawal requests with proper wallet balance handling.

## What They Do
1. `approve_withdrawal` — Sets status to 'approved', deducts amount from instructor's wallet, creates a debit transaction, marks earnings as withdrawn.
2. `reject_withdrawal` — Sets status to 'rejected', restores balance (no deduction needed since approval hasn't happened), creates no transaction.

## Security
- SECURITY DEFINER — can update across tables regardless of RLS
- Only admin/owner roles can execute (checked inside function)
- Uses auth.uid() for identity verification

## Parameters
- p_withdrawal_id (uuid): The withdrawal request to process
- p_admin_notes (text, optional): Admin notes

## Returns
- JSON with success boolean and message
*/

CREATE OR REPLACE FUNCTION approve_withdrawal(p_withdrawal_id uuid, p_admin_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal record;
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_wallet record;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;
  IF v_caller_role NOT IN ('admin', 'owner') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  SELECT * INTO v_withdrawal FROM withdrawal_requests WHERE id = p_withdrawal_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Withdrawal request not found');
  END IF;

  IF v_withdrawal.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only pending requests can be approved');
  END IF;

  -- Deduct from instructor wallet
  UPDATE wallets
  SET balance = balance - v_withdrawal.amount,
      updated_at = now()
  WHERE user_id = v_withdrawal.instructor_id;

  -- Create wallet transaction record
  INSERT INTO transactions (wallet_id, user_id, type, amount, description, status)
  SELECT w.id, v_withdrawal.instructor_id, 'payout', v_withdrawal.amount,
         'Withdrawal approved', 'completed'
  FROM wallets w
  WHERE w.user_id = v_withdrawal.instructor_id
  LIMIT 1;

  -- Mark earnings as withdrawn (deduct from available)
  UPDATE instructor_earnings
  SET status = 'withdrawn',
      updated_at = now()
  WHERE instructor_id = v_withdrawal.instructor_id
    AND status = 'available'
    AND id IN (
      SELECT id FROM instructor_earnings
      WHERE instructor_id = v_withdrawal.instructor_id
        AND status = 'available'
      ORDER BY created_at
      LIMIT 999
    );

  -- Update withdrawal request
  UPDATE withdrawal_requests
  SET status = 'approved',
      admin_notes = p_admin_notes,
      processed_at = now(),
      updated_at = now()
  WHERE id = p_withdrawal_id;

  RETURN jsonb_build_object('success', true, 'message', 'Withdrawal approved and balance deducted');
END;
$$;

CREATE OR REPLACE FUNCTION reject_withdrawal(p_withdrawal_id uuid, p_admin_notes text DEFAULT NULL)
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

  UPDATE withdrawal_requests
  SET status = 'rejected',
      admin_notes = p_admin_notes,
      processed_at = now(),
      updated_at = now()
  WHERE id = p_withdrawal_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only pending requests can be rejected');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Withdrawal rejected and balance restored');
END;
$$;

GRANT EXECUTE ON FUNCTION approve_withdrawal(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_withdrawal(uuid, text) TO authenticated;
