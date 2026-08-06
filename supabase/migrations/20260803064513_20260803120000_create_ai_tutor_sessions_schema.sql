/*
# AI Tutor Sessions Schema

## Overview
Creates tables for storing AI tutoring sessions, lesson progress tracking,
quiz scores, and revision schedules for the enhanced AI Tutor system.

## New Tables
1. **ai_tutor_sessions** — stores AI tutoring sessions with lesson content
2. **ai_tutor_progress** — tracks per-topic learning progress with spaced repetition

## Security
- Both tables are owner-scoped (auth.uid() = user_id) for all CRUD operations
- RLS enabled on both tables
*/

CREATE TABLE IF NOT EXISTS ai_tutor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  session_title text NOT NULL DEFAULT '',
  current_topic text NOT NULL DEFAULT '',
  lesson_content jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_step int NOT NULL DEFAULT 0,
  total_steps int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  quiz_data jsonb DEFAULT '{}'::jsonb,
  weak_topics text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_tutor_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_tutor_sessions_select_own" ON ai_tutor_sessions;
CREATE POLICY "ai_tutor_sessions_select_own"
ON ai_tutor_sessions FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_tutor_sessions_insert_own" ON ai_tutor_sessions;
CREATE POLICY "ai_tutor_sessions_insert_own"
ON ai_tutor_sessions FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_tutor_sessions_update_own" ON ai_tutor_sessions;
CREATE POLICY "ai_tutor_sessions_update_own"
ON ai_tutor_sessions FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_tutor_sessions_delete_own" ON ai_tutor_sessions;
CREATE POLICY "ai_tutor_sessions_delete_own"
ON ai_tutor_sessions FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_user ON ai_tutor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_status ON ai_tutor_sessions(status);

CREATE TABLE IF NOT EXISTS ai_tutor_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  topic text NOT NULL,
  lessons_completed int NOT NULL DEFAULT 0,
  quizzes_passed int NOT NULL DEFAULT 0,
  quizzes_failed int NOT NULL DEFAULT 0,
  mastery_level int NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 4),
  last_review_date timestamptz,
  next_review_date timestamptz,
  review_interval_days int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, topic)
);

ALTER TABLE ai_tutor_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_tutor_progress_select_own" ON ai_tutor_progress;
CREATE POLICY "ai_tutor_progress_select_own"
ON ai_tutor_progress FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_tutor_progress_insert_own" ON ai_tutor_progress;
CREATE POLICY "ai_tutor_progress_insert_own"
ON ai_tutor_progress FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_tutor_progress_update_own" ON ai_tutor_progress;
CREATE POLICY "ai_tutor_progress_update_own"
ON ai_tutor_progress FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_tutor_progress_delete_own" ON ai_tutor_progress;
CREATE POLICY "ai_tutor_progress_delete_own"
ON ai_tutor_progress FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_tutor_progress_user ON ai_tutor_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_progress_topic ON ai_tutor_progress(topic);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_progress_review ON ai_tutor_progress(next_review_date);