/*
# Create increment_coupon_usage function
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