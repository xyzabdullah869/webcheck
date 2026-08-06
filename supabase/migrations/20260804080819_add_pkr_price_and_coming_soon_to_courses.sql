-- Add PKR price and coming_soon columns to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price_pkr numeric DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS coming_soon boolean DEFAULT false;

-- Add exchange rate and partners to website_settings
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS usd_to_pkr_exchange_rate numeric DEFAULT 285;
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS partners text[] DEFAULT '{}';

-- Create testimonials table
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

-- Create faqs table
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

-- Create banners table
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

-- Create hero_sections table (single row, id=1)
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

-- Insert default hero section if not exists
INSERT INTO hero_sections (id)
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM hero_sections WHERE id = 1);

-- Enable RLS on new tables
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_sections ENABLE ROW LEVEL SECURITY;

-- RLS policies for testimonials (public read, admin write)
CREATE POLICY "read_testimonials" ON testimonials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_testimonials_admin" ON testimonials FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "update_testimonials_admin" ON testimonials FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "delete_testimonials_admin" ON testimonials FOR DELETE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- RLS policies for faqs (public read, admin write)
CREATE POLICY "read_faqs" ON faqs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_faqs_admin" ON faqs FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "update_faqs_admin" ON faqs FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "delete_faqs_admin" ON faqs FOR DELETE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- RLS policies for banners (public read, admin write)
CREATE POLICY "read_banners" ON banners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_banners_admin" ON banners FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "update_banners_admin" ON banners FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "delete_banners_admin" ON banners FOR DELETE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- RLS policies for hero_sections (public read, admin write)
CREATE POLICY "read_hero_sections" ON hero_sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "update_hero_sections_admin" ON hero_sections FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Create storage buckets for course files
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('course-media', 'course-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course-media (public read, authenticated write)
CREATE POLICY "read_course_media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'course-media');
CREATE POLICY "write_course_media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-media');
CREATE POLICY "update_course_media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'course-media');
CREATE POLICY "delete_course_media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'course-media');

-- Storage policies for course-files (authenticated read own, write own)
CREATE POLICY "read_course_files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'course-files');
CREATE POLICY "write_course_files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-files');
CREATE POLICY "update_course_files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'course-files');
CREATE POLICY "delete_course_files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'course-files');
