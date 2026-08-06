/*
# Smart Virtual Classroom — Phase 1 Schema

Creates the complete backend infrastructure for the Smart Virtual Classroom system.
This is architecture-only — no teaching logic is stored yet.

## New Tables

1. **teachers** — Virtual AI teacher profiles managed by admin
   - Name, display name, photo, gender, voice provider, voice ID, teaching style, languages, bio, experience, active status

2. **batches** — Course batches with schedule and capacity
   - Batch name, course, assigned teacher, start/end dates, class days, class time, duration, max students (default 20), active status

3. **batch_students** — Enrollment mapping students to batches
   - Student user ID, batch ID, enrollment date

4. **batch_schedule** — Per-batch class schedule entries (architecture for future)
   - Batch ID, day of week, start time, end time, topic (nullable)

5. **teacher_assignments** — Links a teacher to a batch (one teacher per batch)
   - Teacher ID, batch ID, assigned_at

6. **api_providers** — Configurable AI API providers (Gemini, OpenRouter, OpenAI, Groq, Claude)
   - Provider name, display name, base URL, is default, priority, is active

7. **api_keys** — API keys per provider with priority-based failover
   - Provider ID, key name, encrypted key reference, priority, is active, daily limit, usage count, last used, last error, status

## Security
- RLS enabled on all tables
- All tables accessible to authenticated users (admin-managed data)
- Students can read batches and teachers (for enrollment selection)
- Only admin can write/modify (enforced at app layer via role checks)

## Important Notes
1. The `api_keys` table stores a key NAME and an edge-function-secret REFERENCE, never the raw API key value. Raw keys are stored as Supabase edge function secrets, not in the database.
2. `batch_schedule` is architecture-only for future class scheduling features.
3. `teacher_assignments` enforces one-teacher-per-batch via a unique constraint on batch_id.
*/

-- 1. teachers
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  profile_photo text,
  gender text CHECK (gender IN ('male', 'female') OR gender IS NULL),
  voice_provider text,
  voice_id text,
  teaching_style text CHECK (teaching_style IN ('friendly', 'professional', 'casual', 'academic') OR teaching_style IS NULL) DEFAULT 'friendly',
  languages text[] NOT NULL DEFAULT '{en}',
  bio text,
  experience text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_teachers" ON teachers;
CREATE POLICY "read_teachers" ON teachers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_teachers" ON teachers;
CREATE POLICY "insert_teachers" ON teachers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_teachers" ON teachers;
CREATE POLICY "update_teachers" ON teachers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_teachers" ON teachers;
CREATE POLICY "delete_teachers" ON teachers FOR DELETE TO authenticated USING (true);

-- 2. batches
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name text NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date,
  class_days text[] NOT NULL DEFAULT '{Mon,Wed,Fri}',
  class_time time NOT NULL DEFAULT '09:00',
  class_duration_minutes integer NOT NULL DEFAULT 60,
  max_students integer NOT NULL DEFAULT 20,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_batches" ON batches;
CREATE POLICY "read_batches" ON batches FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_batches" ON batches;
CREATE POLICY "insert_batches" ON batches FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_batches" ON batches;
CREATE POLICY "update_batches" ON batches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_batches" ON batches;
CREATE POLICY "delete_batches" ON batches FOR DELETE TO authenticated USING (true);

-- 3. batch_students
CREATE TABLE IF NOT EXISTS batch_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(batch_id, user_id)
);

ALTER TABLE batch_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_batch_students" ON batch_students;
CREATE POLICY "read_batch_students" ON batch_students FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_batch_students" ON batch_students;
CREATE POLICY "insert_batch_students" ON batch_students FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_batch_students" ON batch_students;
CREATE POLICY "update_batch_students" ON batch_students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_batch_students" ON batch_students;
CREATE POLICY "delete_batch_students" ON batch_students FOR DELETE TO authenticated USING (true);

-- 4. batch_schedule (architecture-only for future scheduling)
CREATE TABLE IF NOT EXISTS batch_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  topic text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE batch_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_batch_schedule" ON batch_schedule;
CREATE POLICY "read_batch_schedule" ON batch_schedule FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_batch_schedule" ON batch_schedule;
CREATE POLICY "insert_batch_schedule" ON batch_schedule FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_batch_schedule" ON batch_schedule;
CREATE POLICY "update_batch_schedule" ON batch_schedule FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_batch_schedule" ON batch_schedule;
CREATE POLICY "delete_batch_schedule" ON batch_schedule FOR DELETE TO authenticated USING (true);

-- 5. teacher_assignments (one teacher per batch)
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(batch_id)
);

ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_teacher_assignments" ON teacher_assignments;
CREATE POLICY "read_teacher_assignments" ON teacher_assignments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_teacher_assignments" ON teacher_assignments;
CREATE POLICY "insert_teacher_assignments" ON teacher_assignments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_teacher_assignments" ON teacher_assignments;
CREATE POLICY "update_teacher_assignments" ON teacher_assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_teacher_assignments" ON teacher_assignments;
CREATE POLICY "delete_teacher_assignments" ON teacher_assignments FOR DELETE TO authenticated USING (true);

-- 6. api_providers
CREATE TABLE IF NOT EXISTS api_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL CHECK (provider_name IN ('gemini', 'openrouter', 'openai', 'groq', 'claude')),
  display_name text NOT NULL,
  base_url text,
  is_default boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE api_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_api_providers" ON api_providers;
CREATE POLICY "read_api_providers" ON api_providers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_api_providers" ON api_providers;
CREATE POLICY "insert_api_providers" ON api_providers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_api_providers" ON api_providers;
CREATE POLICY "update_api_providers" ON api_providers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_api_providers" ON api_providers;
CREATE POLICY "delete_api_providers" ON api_providers FOR DELETE TO authenticated USING (true);

-- 7. api_keys
-- NOTE: This table stores a key NAME and a SECRET_NAME (the edge function secret reference),
-- never the raw API key value. Raw keys are stored as Supabase edge function secrets.
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES api_providers(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  secret_name text NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  daily_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  last_error text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rate_limited', 'error', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_api_keys" ON api_keys;
CREATE POLICY "read_api_keys" ON api_keys FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_api_keys" ON api_keys;
CREATE POLICY "insert_api_keys" ON api_keys FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_api_keys" ON api_keys;
CREATE POLICY "update_api_keys" ON api_keys FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_api_keys" ON api_keys;
CREATE POLICY "delete_api_keys" ON api_keys FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_batches_course ON batches(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_teacher ON batches(teacher_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_batch ON batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_user ON batch_students(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_schedule_batch ON batch_schedule(batch_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_batch ON teacher_assignments(batch_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider_id);
CREATE INDEX IF NOT EXISTS idx_api_providers_default ON api_providers(is_default);

-- Insert default providers
INSERT INTO api_providers (provider_name, display_name, base_url, priority) VALUES
('gemini', 'Google Gemini', 'https://generativelanguage.googleapis.com', 10),
('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1', 20),
('openai', 'OpenAI', 'https://api.openai.com/v1', 30),
('groq', 'Groq', 'https://api.groq.com/openai/v1', 40),
('claude', 'Anthropic Claude', 'https://api.anthropic.com/v1', 50)
ON CONFLICT DO NOTHING;
