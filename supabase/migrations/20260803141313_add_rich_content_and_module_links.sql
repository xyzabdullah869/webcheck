/*
# Add Rich Content to Lessons + Module Links to Quizzes/Assignments

## Summary
This migration enhances the LMS content management system:
1. Adds `module_id` column to `quizzes` and `assignments` tables so they can be linked to specific modules (not just lessons).
2. Adds rich content columns to the `lessons` table to support notes, PDF files, PowerPoint files, downloadable resources, and external references — making lessons into full "topics" with diverse content types.

## Changes

### Modified Tables

#### `lessons` (topics)
- `content_type` (text, default 'video') — type of topic content: video, notes, pdf, slides, resource, reference
- `rich_content` (text, nullable) — rich text / HTML notes content for the topic
- `pdf_url` (text, nullable) — URL to a PDF file (stored in Supabase Storage)
- `pdf_storage_path` (text, nullable) — storage path for the PDF
- `slides_url` (text, nullable) — URL to PowerPoint/slides file
- `slides_storage_path` (text, nullable) — storage path for slides
- `resource_url` (text, nullable) — URL to a downloadable resource
- `resource_storage_path` (text, nullable) — storage path for the resource
- `external_references` (jsonb, default '[]') — array of external reference links [{ title, url, description }]
- `video_storage_path` already exists

#### `quizzes`
- `module_id` (uuid, nullable) — links quiz to a specific module (in addition to course_id)

#### `assignments`
- `module_id` (uuid, nullable) — links assignment to a specific module

## Security
- No RLS policy changes needed — existing policies on these tables already cover the new columns.
- No new tables created.
*/

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
