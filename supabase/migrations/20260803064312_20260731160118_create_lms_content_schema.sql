/*
# Create LMS Content Schema — Categories, Courses, Modules, Lessons
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  color text DEFAULT '',
  image text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public"
ON categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin"
ON categories FOR INSERT
TO authenticated WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin"
ON categories FOR UPDATE
TO authenticated USING (public.has_role('instructor')) WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin"
ON categories FOR DELETE
TO authenticated USING (public.has_role('admin'));

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  short_description text DEFAULT '',
  what_you_will_learn text[] DEFAULT '{}',
  requirements text[] DEFAULT '{}',
  thumbnail text DEFAULT '',
  trailer_url text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  instructor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  duration text DEFAULT '',
  lessons_count int DEFAULT 0,
  level text NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  language text DEFAULT 'English',
  price numeric DEFAULT 0,
  original_price numeric,
  tags text[] DEFAULT '{}',
  rating numeric DEFAULT 0,
  reviews_count int DEFAULT 0,
  students_count int DEFAULT 0,
  bestseller boolean DEFAULT false,
  is_new boolean DEFAULT false,
  featured boolean DEFAULT false,
  certificate_enabled boolean DEFAULT true,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Published', 'Draft', 'Archived', 'Pending Review')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select_published" ON courses;
CREATE POLICY "courses_select_published"
ON courses FOR SELECT
TO anon, authenticated USING (status = 'Published' OR public.has_role('instructor'));

DROP POLICY IF EXISTS "courses_insert_instructor" ON courses;
CREATE POLICY "courses_insert_instructor"
ON courses FOR INSERT
TO authenticated WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "courses_update_instructor" ON courses;
CREATE POLICY "courses_update_instructor"
ON courses FOR UPDATE
TO authenticated
USING (public.has_role('instructor'))
WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "courses_delete_admin" ON courses;
CREATE POLICY "courses_delete_admin"
ON courses FOR DELETE
TO authenticated USING (public.has_role('admin'));

CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules_select" ON modules;
CREATE POLICY "modules_select"
ON modules FOR SELECT
TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.status = 'Published')
  OR public.has_role('instructor')
);

DROP POLICY IF EXISTS "modules_insert_instructor" ON modules;
CREATE POLICY "modules_insert_instructor"
ON modules FOR INSERT
TO authenticated WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "modules_update_instructor" ON modules;
CREATE POLICY "modules_update_instructor"
ON modules FOR UPDATE
TO authenticated USING (public.has_role('instructor')) WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "modules_delete_instructor" ON modules;
CREATE POLICY "modules_delete_instructor"
ON modules FOR DELETE
TO authenticated USING (public.has_role('instructor'));

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  video_url text DEFAULT '',
  video_type text DEFAULT 'mp4' CHECK (video_type IN ('mp4', 'youtube', 'vimeo')),
  video_storage_path text DEFAULT '',
  duration text DEFAULT '',
  duration_seconds int DEFAULT 0,
  order_index int DEFAULT 0,
  preview boolean DEFAULT false,
  has_quiz boolean DEFAULT false,
  has_assignment boolean DEFAULT false,
  resources jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_select" ON lessons;
CREATE POLICY "lessons_select"
ON lessons FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM modules
    JOIN courses ON courses.id = modules.course_id
    WHERE modules.id = lessons.module_id AND courses.status = 'Published'
  )
  OR public.has_role('instructor')
);

DROP POLICY IF EXISTS "lessons_insert_instructor" ON lessons;
CREATE POLICY "lessons_insert_instructor"
ON lessons FOR INSERT
TO authenticated WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "lessons_update_instructor" ON lessons;
CREATE POLICY "lessons_update_instructor"
ON lessons FOR UPDATE
TO authenticated USING (public.has_role('instructor')) WITH CHECK (public.has_role('instructor'));

DROP POLICY IF EXISTS "lessons_delete_instructor" ON lessons;
CREATE POLICY "lessons_delete_instructor"
ON lessons FOR DELETE
TO authenticated USING (public.has_role('instructor'));

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);