ALTER TABLE courses ADD COLUMN IF NOT EXISTS price_pkr numeric DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS coming_soon boolean DEFAULT false;

ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS usd_to_pkr_exchange_rate numeric DEFAULT 285;
-- partners column already added in previous migration, but IF NOT EXISTS is safe
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS partners text[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  content text NOT NULL,
  avatar_url text,
  rating integer DEFAULT 5,
  featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'General',
  sort_order integer DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_url text,
  button_text text,
  position text DEFAULT 'home_top',
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hero_sections (
  id integer PRIMARY KEY DEFAULT 1,
  badge text DEFAULT 'Premium Learning Platform',
  title text NOT NULL DEFAULT 'Master Bioinformatics with Expert-Led Courses',
  subtitle text DEFAULT 'Learn from industry experts and advance your career',
  primary_button_text text DEFAULT 'Explore Courses',
  primary_button_link text DEFAULT '/courses',
  secondary_button_text text DEFAULT 'Become an Instructor',
  secondary_button_link text DEFAULT '/instructor',
  image_url text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO hero_sections (id)
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM hero_sections WHERE id = 1);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_testimonials" ON testimonials;
CREATE POLICY "read_testimonials" ON testimonials FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_testimonials_admin" ON testimonials;
CREATE POLICY "insert_testimonials_admin" ON testimonials FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "update_testimonials_admin" ON testimonials;
CREATE POLICY "update_testimonials_admin" ON testimonials FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "delete_testimonials_admin" ON testimonials;
CREATE POLICY "delete_testimonials_admin" ON testimonials FOR DELETE TO authenticated USING (public.has_role('admin'));

DROP POLICY IF EXISTS "read_faqs" ON faqs;
CREATE POLICY "read_faqs" ON faqs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_faqs_admin" ON faqs;
CREATE POLICY "insert_faqs_admin" ON faqs FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "update_faqs_admin" ON faqs;
CREATE POLICY "update_faqs_admin" ON faqs FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "delete_faqs_admin" ON faqs;
CREATE POLICY "delete_faqs_admin" ON faqs FOR DELETE TO authenticated USING (public.has_role('admin'));

DROP POLICY IF EXISTS "read_banners" ON banners;
CREATE POLICY "read_banners" ON banners FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_banners_admin" ON banners;
CREATE POLICY "insert_banners_admin" ON banners FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "update_banners_admin" ON banners;
CREATE POLICY "update_banners_admin" ON banners FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "delete_banners_admin" ON banners;
CREATE POLICY "delete_banners_admin" ON banners FOR DELETE TO authenticated USING (public.has_role('admin'));

DROP POLICY IF EXISTS "read_hero_sections" ON hero_sections;
CREATE POLICY "read_hero_sections" ON hero_sections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "update_hero_sections_admin" ON hero_sections;
CREATE POLICY "update_hero_sections_admin" ON hero_sections FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-media', 'course-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "read_course_media" ON storage.objects;
CREATE POLICY "read_course_media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'course-media');
DROP POLICY IF EXISTS "write_course_media" ON storage.objects;
CREATE POLICY "write_course_media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-media');
DROP POLICY IF EXISTS "update_course_media" ON storage.objects;
CREATE POLICY "update_course_media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'course-media');
DROP POLICY IF EXISTS "delete_course_media" ON storage.objects;
CREATE POLICY "delete_course_media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'course-media');