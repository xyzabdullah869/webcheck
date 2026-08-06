-- Add module_id to quizzes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'module_id') THEN
    ALTER TABLE quizzes ADD COLUMN module_id uuid REFERENCES modules(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add module_id to assignments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'module_id') THEN
    ALTER TABLE assignments ADD COLUMN module_id uuid REFERENCES modules(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add rich content columns to lessons
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'content_type') THEN
    ALTER TABLE lessons ADD COLUMN content_type text NOT NULL DEFAULT 'video';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'rich_content') THEN
    ALTER TABLE lessons ADD COLUMN rich_content text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'pdf_url') THEN
    ALTER TABLE lessons ADD COLUMN pdf_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'pdf_storage_path') THEN
    ALTER TABLE lessons ADD COLUMN pdf_storage_path text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'slides_url') THEN
    ALTER TABLE lessons ADD COLUMN slides_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'slides_storage_path') THEN
    ALTER TABLE lessons ADD COLUMN slides_storage_path text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'resource_url') THEN
    ALTER TABLE lessons ADD COLUMN resource_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'resource_storage_path') THEN
    ALTER TABLE lessons ADD COLUMN resource_storage_path text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'external_references') THEN
    ALTER TABLE lessons ADD COLUMN external_references jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;