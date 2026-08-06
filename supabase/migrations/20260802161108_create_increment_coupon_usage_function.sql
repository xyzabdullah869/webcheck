/*
# Create increment_coupon_usage function

1. New Functions
- `increment_coupon_usage(coupon_code text)` — SECURITY DEFINER function that atomically 
  increments the used_count of a coupon by its code. Used after a successful payment.

2. Security
- SECURITY DEFINER so it can update coupons regardless of RLS (the student who paid 
  doesn't have UPDATE permission on coupons — only admins do).
- EXECUTE granted to authenticated role.
- Uses strict equality match on code (case-sensitive, uppercase).
*/

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE coupons 
  SET used_count = used_count + 1, 
      updated_at = now() 
  WHERE code = upper(coupon_code) AND is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(text) TO authenticated;
