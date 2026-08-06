DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'website_settings' AND column_name = 'partners') THEN
    ALTER TABLE website_settings ADD COLUMN partners text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;