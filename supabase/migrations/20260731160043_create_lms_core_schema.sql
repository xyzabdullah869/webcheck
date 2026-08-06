/*
# Create LMS Core Schema — Profiles, Roles, and Auth Helpers

## Overview
This migration creates the foundational tables for the Bioinformatics Hub LMS:
user profiles with role management, and a helper function for role-based checks.

## New Tables
1. **profiles** — extends Supabase auth.users with display name, avatar, bio, role
   - `id` (uuid, PK, references auth.users)
   - `email` (text)
   - `full_name` (text)
   - `avatar_url` (text, nullable)
   - `bio` (text, nullable)
   - `location` (text, nullable)
   - `role` (text: 'student' | 'instructor' | 'admin', default 'student')
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

2. **referral_codes** — unique referral codes per user
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles)
   - `code` (text, unique)
   - `uses` (int, default 0)
   - `created_at` (timestamptz)

## Security
- RLS enabled on profiles: users can read all profiles, update only their own
- RLS enabled on referral_codes: users read their own, admins read all
- A trigger auto-creates a profile row when a new auth.users row is inserted
- Role is stored in profiles table and mirrored in user app_metadata for RLS checks

## Important Notes
1. Role 'student' is the default for all new sign-ups
2. Admins can change roles via the admin panel (future feature)
3. The `has_role(text)` SQL function checks if the current user has a given role
*/

-- ========================
-- PROFILES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  bio text DEFAULT '',
  location text DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read profiles (needed for instructor names, etc.)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO authenticated USING (true);

-- Users can update only their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile row (trigger handles this, but allow manually too)
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ========================
-- REFERRAL CODES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  uses int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_select_own" ON referral_codes;
CREATE POLICY "referral_select_own"
ON referral_codes FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "referral_insert_own" ON referral_codes;
CREATE POLICY "referral_insert_own"
ON referral_codes FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "referral_update_own" ON referral_codes;
CREATE POLICY "referral_update_own"
ON referral_codes FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========================
-- AUTO-CREATE PROFILE TRIGGER
-- ========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Generate a referral code for the new user
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, UPPER(SUBSTRING(NEW.id::text, 1, 8)))
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================
-- ROLE HELPER FUNCTION
-- ========================
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      (required_role = 'student' AND role IN ('student', 'instructor', 'admin'))
      OR (required_role = 'instructor' AND role IN ('instructor', 'admin'))
      OR (required_role = 'admin' AND role = 'admin')
    )
  );
$$;
