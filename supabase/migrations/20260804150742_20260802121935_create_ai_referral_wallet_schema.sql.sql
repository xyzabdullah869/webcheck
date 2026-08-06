-- ============================================================
-- AI CHAT HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL DEFAULT '',
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  topics text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_chat_select_own" ON ai_chat_history;
CREATE POLICY "ai_chat_select_own"
ON ai_chat_history FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_chat_insert_own" ON ai_chat_history;
CREATE POLICY "ai_chat_insert_own"
ON ai_chat_history FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_chat_delete_own" ON ai_chat_history;
CREATE POLICY "ai_chat_delete_own"
ON ai_chat_history FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_chat_user ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_session ON ai_chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_created ON ai_chat_history(created_at DESC);

-- ============================================================
-- REFERRAL REWARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_history_id uuid NOT NULL REFERENCES referral_history(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'credited')),
  credited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_rewards_select" ON referral_rewards;
CREATE POLICY "referral_rewards_select"
ON referral_rewards FOR SELECT
TO authenticated
USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "referral_rewards_update_admin" ON referral_rewards;
CREATE POLICY "referral_rewards_update_admin"
ON referral_rewards FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "referral_rewards_insert_admin" ON referral_rewards;
CREATE POLICY "referral_rewards_insert_admin"
ON referral_rewards FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin') OR auth.uid() = referrer_id);

DROP POLICY IF EXISTS "referral_rewards_delete_admin" ON referral_rewards;
CREATE POLICY "referral_rewards_delete_admin"
ON referral_rewards FOR DELETE
TO authenticated USING (public.has_role('admin'));

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);

-- ============================================================
-- REFERRAL SETTINGS (single-row config)
-- ============================================================
CREATE TABLE IF NOT EXISTS referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_amount numeric NOT NULL DEFAULT 5.00,
  min_courses_for_reward int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_settings_select" ON referral_settings;
CREATE POLICY "referral_settings_select"
ON referral_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "referral_settings_update_admin" ON referral_settings;
CREATE POLICY "referral_settings_update_admin"
ON referral_settings FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "referral_settings_insert_admin" ON referral_settings;
CREATE POLICY "referral_settings_insert_admin"
ON referral_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));

INSERT INTO referral_settings (reward_amount, min_courses_for_reward, is_active)
SELECT 5.00, 1, true
WHERE NOT EXISTS (SELECT 1 FROM referral_settings);

-- ============================================================
-- AI SETTINGS (single-row config)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT true,
  model_name text NOT NULL DEFAULT 'gpt-4o-mini',
  system_prompt text NOT NULL DEFAULT 'You are BioHub AI, a knowledgeable bioinformatics tutor. Help students understand concepts in bioinformatics, molecular biology, genetics, genomics, proteomics, NGS, sequence alignment, BLAST, phylogenetics, Python, R, databases, and Linux. Guide students toward understanding rather than giving direct exam answers. Be encouraging and clear.',
  max_tokens int NOT NULL DEFAULT 1024,
  temperature numeric NOT NULL DEFAULT 0.7,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_settings_select" ON ai_settings;
CREATE POLICY "ai_settings_select"
ON ai_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "ai_settings_update_admin" ON ai_settings;
CREATE POLICY "ai_settings_update_admin"
ON ai_settings FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "ai_settings_insert_admin" ON ai_settings;
CREATE POLICY "ai_settings_insert_admin"
ON ai_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));

INSERT INTO ai_settings (is_enabled, model_name, system_prompt, max_tokens, temperature)
SELECT true, 'gpt-4o-mini',
  'You are BioHub AI, a knowledgeable bioinformatics tutor. Help students understand concepts in bioinformatics, molecular biology, genetics, genomics, proteomics, NGS, sequence alignment, BLAST, phylogenetics, Python, R, databases, and Linux. Guide students toward understanding rather than giving direct exam answers. Be encouraging and clear.',
  1024, 0.7
WHERE NOT EXISTS (SELECT 1 FROM ai_settings);

-- ============================================================
-- ADMIN WALLET OPERATION FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_wallet_operation(
  target_user_id uuid,
  operation text,
  amount numeric,
  op_description text,
  op_type text DEFAULT 'credit'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_wallet_id uuid;
  new_balance numeric;
  result jsonb;
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;
  IF operation NOT IN ('credit', 'debit') THEN
    RAISE EXCEPTION 'Invalid operation: must be credit or debit';
  END IF;
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;
  IF op_type NOT IN ('credit', 'debit', 'refund', 'payout', 'referral_bonus', 'course_purchase') THEN
    op_type := operation;
  END IF;
  SELECT id INTO target_wallet_id FROM wallets WHERE user_id = target_user_id;
  IF target_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id, balance) VALUES (target_user_id, 0) RETURNING id INTO target_wallet_id;
  END IF;
  IF operation = 'credit' THEN
    UPDATE wallets SET balance = balance + amount, updated_at = now() WHERE id = target_wallet_id;
    new_balance := (SELECT balance FROM wallets WHERE id = target_wallet_id);
  ELSIF operation = 'debit' THEN
    UPDATE wallets SET balance = balance - amount, updated_at = now() WHERE id = target_wallet_id;
    new_balance := (SELECT balance FROM wallets WHERE id = target_wallet_id);
  END IF;
  INSERT INTO transactions (wallet_id, user_id, amount, type, description)
  VALUES (target_wallet_id, target_user_id, amount, op_type, op_description);
  result := jsonb_build_object('success', true, 'wallet_id', target_wallet_id, 'new_balance', new_balance);
  RETURN result;
END;
$$;

-- ============================================================
-- ADMIN CREDIT REFERRAL REWARD FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_credit_referral_reward(reward_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reward_record RECORD;
  target_wallet_id uuid;
  new_balance numeric;
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;
  SELECT * INTO reward_record FROM referral_rewards WHERE id = reward_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;
  IF reward_record.status = 'credited' THEN
    RAISE EXCEPTION 'Reward already credited';
  END IF;
  UPDATE referral_rewards SET status = 'credited', credited_at = now() WHERE id = reward_id;
  SELECT id INTO target_wallet_id FROM wallets WHERE user_id = reward_record.referrer_id;
  IF target_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id, balance) VALUES (reward_record.referrer_id, 0) RETURNING id INTO target_wallet_id;
  END IF;
  UPDATE wallets SET balance = balance + reward_record.reward_amount, updated_at = now() WHERE id = target_wallet_id;
  new_balance := (SELECT balance FROM wallets WHERE id = target_wallet_id);
  INSERT INTO transactions (wallet_id, user_id, amount, type, description)
  VALUES (target_wallet_id, reward_record.referrer_id, reward_record.reward_amount, 'referral_bonus',
    'Referral reward for inviting a new student');
  RETURN jsonb_build_object('success', true, 'new_balance', new_balance);
END;
$$;

-- ============================================================
-- AUTO-CREATE WALLETS ON NEW USER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, currency) VALUES (NEW.id, 0, 'USD')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();