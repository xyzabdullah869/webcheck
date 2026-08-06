/*
# Create LMS Student Schema — Enrollments, Progress, Quizzes, Assignments, Certificates, Reviews, Bookmarks, Notifications
*/

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress int DEFAULT 0,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, course_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollments_select_own" ON enrollments;
CREATE POLICY "enrollments_select_own"
ON enrollments FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role('instructor'));

DROP POLICY IF EXISTS "enrollments_insert_own" ON enrollments;
CREATE POLICY "enrollments_insert_own"
ON enrollments FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_update_own" ON enrollments;
CREATE POLICY "enrollments_update_own"
ON enrollments FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_delete_own" ON enrollments;
CREATE POLICY "enrollments_delete_own"
ON enrollments FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  watch_position int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progress_select_own" ON lesson_progress;
CREATE POLICY "progress_select_own"
ON lesson_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role('instructor'));

DROP POLICY IF EXISTS "progress_insert_own" ON lesson_progress;
CREATE POLICY "progress_insert_own"
ON lesson_progress FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "progress_update_own" ON lesson_progress;
CREATE POLICY "progress_update_own"
ON lesson_progress FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "progress_delete_own" ON lesson_progress;
CREATE POLICY "progress_delete_own"
ON lesson_progress FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  passing_score int DEFAULT 70,
  time_limit int DEFAULT 600,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_select" ON quizzes;
CREATE POLICY "quizzes_select"
ON quizzes FOR SELECT
TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = quizzes.course_id AND courses.status = 'Published')
  OR public.has_role('instructor')
);

DROP POLICY IF EXISTS "quizzes_insert_instructor" ON quizzes;
CREATE POLICY "quizzes_insert_instructor"
ON quizzes FOR INSERT
TO authenticated WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "quizzes_update_instructor" ON quizzes;
CREATE POLICY "quizzes_update_instructor"
ON quizzes FOR UPDATE
TO authenticated USING (public.has_role('instructor')) WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "quizzes_delete_instructor" ON quizzes;
CREATE POLICY "quizzes_delete_instructor"
ON quizzes FOR DELETE
TO authenticated USING (public.has_role('instructor'));

CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  question_type text DEFAULT 'single' CHECK (question_type IN ('single', 'multiple')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  explanation text DEFAULT '',
  order_index int DEFAULT 0
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_questions_select" ON quiz_questions;
CREATE POLICY "quiz_questions_select"
ON quiz_questions FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM quizzes
    JOIN courses ON courses.id = quizzes.course_id
    WHERE quizzes.id = quiz_questions.quiz_id AND courses.status = 'Published'
  )
  OR public.has_role('instructor')
);

DROP POLICY IF EXISTS "quiz_questions_insert_instructor" ON quiz_questions;
CREATE POLICY "quiz_questions_insert_instructor"
ON quiz_questions FOR INSERT
TO authenticated WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "quiz_questions_update_instructor" ON quiz_questions;
CREATE POLICY "quiz_questions_update_instructor"
ON quiz_questions FOR UPDATE
TO authenticated USING (public.has_role('instructor')) WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "quiz_questions_delete_instructor" ON quiz_questions;
CREATE POLICY "quiz_questions_delete_instructor"
ON quiz_questions FOR DELETE
TO authenticated USING (public.has_role('instructor'));

CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb DEFAULT '[]'::jsonb,
  taken_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_results_select_own" ON quiz_results;
CREATE POLICY "quiz_results_select_own"
ON quiz_results FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role('instructor'));

DROP POLICY IF EXISTS "quiz_results_insert_own" ON quiz_results;
CREATE POLICY "quiz_results_insert_own"
ON quiz_results FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "quiz_results_delete_own" ON quiz_results;
CREATE POLICY "quiz_results_delete_own"
ON quiz_results FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  due_date timestamptz,
  max_score int DEFAULT 100,
  allowed_file_types text[] DEFAULT '{PDF,DOCX,ZIP}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_select" ON assignments;
CREATE POLICY "assignments_select"
ON assignments FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = assignments.course_id AND courses.status = 'Published')
  OR public.has_role('instructor')
);

DROP POLICY IF EXISTS "assignments_insert_instructor" ON assignments;
CREATE POLICY "assignments_insert_instructor"
ON assignments FOR INSERT
TO authenticated WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "assignments_update_instructor" ON assignments;
CREATE POLICY "assignments_update_instructor"
ON assignments FOR UPDATE
TO authenticated USING (public.has_role('instructor')) WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "assignments_delete_instructor" ON assignments;
CREATE POLICY "assignments_delete_instructor"
ON assignments FOR DELETE
TO authenticated USING (public.has_role('instructor'));

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  file_url text DEFAULT '',
  file_name text DEFAULT '',
  file_type text DEFAULT '',
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Submitted', 'Reviewed', 'Approved')),
  submitted_at timestamptz DEFAULT now(),
  grade int,
  feedback text,
  reviewed_at timestamptz
);

ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submissions_select_own" ON assignment_submissions;
CREATE POLICY "submissions_select_own"
ON assignment_submissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role('instructor'));

DROP POLICY IF EXISTS "submissions_insert_own" ON assignment_submissions;
CREATE POLICY "submissions_insert_own"
ON assignment_submissions FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "submissions_update_instructor" ON assignment_submissions;
CREATE POLICY "submissions_update_instructor"
ON assignment_submissions FOR UPDATE
TO authenticated
USING (public.has_role('instructor'))
WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "submissions_delete_own" ON assignment_submissions;
CREATE POLICY "submissions_delete_own"
ON assignment_submissions FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_id text UNIQUE NOT NULL,
  course_name text NOT NULL,
  score int DEFAULT 0,
  issue_date timestamptz DEFAULT now(),
  verification_url text DEFAULT ''
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certificates_select_own" ON certificates;
CREATE POLICY "certificates_select_own"
ON certificates FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role('instructor'));

DROP POLICY IF EXISTS "certificates_select_public_verify" ON certificates;
CREATE POLICY "certificates_select_public_verify"
ON certificates FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "certificates_insert_instructor" ON certificates;
CREATE POLICY "certificates_insert_instructor"
ON certificates FOR INSERT
TO authenticated WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "certificates_delete_admin" ON certificates;
CREATE POLICY "certificates_delete_admin"
ON certificates FOR DELETE
TO authenticated USING (public.has_role('admin'));

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
CREATE POLICY "reviews_select_public"
ON reviews FOR SELECT
TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = reviews.course_id AND courses.status = 'Published')
  OR public.has_role('instructor')
);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own"
ON reviews FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own"
ON reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role('admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own"
ON reviews FOR DELETE
TO authenticated USING (auth.uid() = user_id OR public.has_role('admin'));

CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmarks_select_own" ON bookmarks;
CREATE POLICY "bookmarks_select_own"
ON bookmarks FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_insert_own" ON bookmarks;
CREATE POLICY "bookmarks_insert_own"
ON bookmarks FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_delete_own" ON bookmarks;
CREATE POLICY "bookmarks_delete_own"
ON bookmarks FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('assignment', 'quiz', 'course', 'announcement', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own"
ON notifications FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own"
ON notifications FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own"
ON notifications FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);