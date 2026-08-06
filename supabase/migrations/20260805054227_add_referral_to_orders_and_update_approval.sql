/*
# Add Referral Code to Orders + Process Course Referral Earnings

## Purpose
1. Add `referral_code` column to orders table so students can attach a referral code at checkout
2. Update `approve_payment_submission` to process course referral commission (10%) when an order with a referral code is approved

## Changes
- `orders.referral_code` (text, nullable) — referral code used at checkout
- Updated `approve_payment_submission` function to call `process_referral_earnings` for course referrals
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS referral_code text;

-- Update approve_payment_submission to process referral earnings
CREATE OR REPLACE FUNCTION approve_payment_submission(submission_id uuid, notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
  order_record RECORD;
  item RECORD;
  v_referral_processed boolean := false;
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT * INTO sub_record FROM payment_submissions WHERE id = submission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  IF sub_record.status != 'pending' THEN
    RAISE EXCEPTION 'Submission already reviewed';
  END IF;

  UPDATE payment_submissions SET status = 'approved', admin_notes = notes, reviewed_at = now()
    WHERE id = submission_id;

  SELECT * INTO order_record FROM orders WHERE id = sub_record.order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  UPDATE orders SET status = 'paid', paid_at = now(), updated_at = now() WHERE id = sub_record.order_id;

  FOR item IN SELECT course_id, instructor_id, price, platform_commission, instructor_earnings FROM order_items WHERE order_id = sub_record.order_id LOOP
    INSERT INTO enrollments (user_id, course_id, progress)
    VALUES (order_record.user_id, item.course_id, 0)
    ON CONFLICT (user_id, course_id) DO NOTHING;

    IF item.instructor_id IS NOT NULL THEN
      INSERT INTO instructor_earnings (instructor_id, order_id, order_item_id, course_id, amount, platform_fee, status)
      VALUES (item.instructor_id, sub_record.order_id, NULL, item.course_id, item.instructor_earnings, item.platform_commission, 'pending');
    END IF;
  END LOOP;

  -- Process course referral earnings if referral code was used
  IF order_record.referral_code IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM referral_rewards
      WHERE referrer_id = (
        SELECT user_id FROM referral_codes WHERE code = order_record.referral_code
      )
      AND referred_id = order_record.user_id
      AND referral_type = 'course'
    ) INTO v_referral_processed;

    IF NOT v_referral_processed THEN
      PERFORM process_referral_earnings(
        'course',
        order_record.user_id,
        order_record.total_amount,
        order_record.referral_code
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', sub_record.order_id);
END;
$$;
