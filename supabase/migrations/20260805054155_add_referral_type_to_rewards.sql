/*
# Add referral_type column to referral_rewards

## Purpose
Track whether a referral reward came from a membership purchase or a course purchase.

## Changes
- Add `referral_type` (text, default 'membership') to referral_rewards table
- Values: 'membership' | 'course'
*/

ALTER TABLE referral_rewards
  ADD COLUMN IF NOT EXISTS referral_type text NOT NULL DEFAULT 'membership' CHECK (referral_type IN ('membership', 'course'));
