CREATE TABLE IF NOT EXISTS website_settings (
  id integer PRIMARY KEY DEFAULT 1,
  website_name text NOT NULL DEFAULT 'Bioinformatics Hub',
  short_name text NOT NULL DEFAULT 'BioHub',
  website_logo text,
  website_description text NOT NULL DEFAULT 'A premium online learning platform for bioinformatics, biotechnology, AI, programming, and data science.',
  owner_name text,
  owner_designation text,
  support_email text,
  contact_email text,
  contact_number text,
  whatsapp_number text,
  office_address text,
  google_maps_location text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  youtube_url text,
  twitter_url text,
  github_url text,
  working_hours text,
  support_hours text,
  copyright_text text,
  seo_title text,
  seo_description text,
  seo_keywords text[] DEFAULT '{}',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "website_settings_select_public" ON website_settings;
CREATE POLICY "website_settings_select_public"
  ON website_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "website_settings_insert_admin" ON website_settings;
CREATE POLICY "website_settings_insert_admin"
  ON website_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "website_settings_update_admin" ON website_settings;
CREATE POLICY "website_settings_update_admin"
  ON website_settings FOR UPDATE
  TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

INSERT INTO website_settings (id, website_name, short_name, website_description, seo_title, seo_description, seo_keywords)
VALUES (
  1,
  'Bioinformatics Hub',
  'BioHub',
  'A premium online learning platform for bioinformatics, biotechnology, AI, programming, and data science.',
  'Bioinformatics Hub — Master Bioinformatics, Data Science & AI',
  'A premium online learning platform for bioinformatics, biotechnology, AI, programming, and data science. Learn from world-class instructors and earn certificates.',
  ARRAY['bioinformatics','online courses','data science','biotechnology','AI','programming','LMS']
)
ON CONFLICT (id) DO NOTHING;