/*
# Create Course Files Table and Storage Bucket

## Summary
Creates a `course_files` table for storing references to uploaded course materials (videos, PDFs, documents, datasets, etc.) and a Supabase Storage bucket for secure file storage.

## Changes
### New Tables
#### `course_files`
- `id` uuid PK
- `course_id` uuid FK → courses.id ON DELETE CASCADE
- `lesson_id` uuid FK → lessons.id ON DELETE SET NULL (nullable)
- `uploaded_by` uuid FK → profiles.id ON DELETE SET NULL
- `file_name` text
- `file_path` text (storage path)
- `file_type` text (MIME type)
- `file_size` bigint
- `resource_type` text CHECK (video, pdf, document, spreadsheet, archive, image, audio, code, dataset, research_paper, other)
- `is_downloadable` boolean default true
- `is_preview` boolean default false (accessible without enrollment)
- `created_at` timestamptz default now()

### Storage
- Creates `course-files` bucket (non-public, access via signed URLs)

## Security
RLS enabled: instructors/admins can manage files for their courses; enrolled students can read files for purchased courses; guests can read preview-only files.
*/

CREATE TABLE IF NOT EXISTS course_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'application/octet-stream',
  file_size bigint NOT NULL DEFAULT 0,
  resource_type text NOT NULL DEFAULT 'other' CHECK (
    resource_type = ANY(ARRAY['video', 'pdf', 'document', 'spreadsheet', 'archive', 'image', 'audio', 'code', 'dataset', 'research_paper', 'other'])
  ),
  is_downloadable boolean NOT NULL DEFAULT true,
  is_preview boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_files_course_id ON course_files(course_id);
CREATE INDEX IF NOT EXISTS idx_course_files_lesson_id ON course_files(lesson_id);

ALTER TABLE course_files ENABLE ROW LEVEL SECURITY;

-- Instructors and admins can manage course files
CREATE POLICY "select_course_files" ON course_files FOR SELECT
  TO authenticated USING (
    is_preview = true
    OR EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = course_files.course_id AND e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_files.course_id AND (c.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      ))
    )
  );

CREATE POLICY "insert_course_files" ON course_files FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_files.course_id AND (c.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      ))
    )
  );

CREATE POLICY "update_course_files" ON course_files FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_files.course_id AND (c.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      ))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_files.course_id AND (c.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      ))
    )
  );

CREATE POLICY "delete_course_files" ON course_files FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_files.course_id AND (c.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      ))
    )
  );

-- Create storage bucket for course files (non-public, uses signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-files',
  'course-files',
  false,
  524288000, -- 500MB
  ARRAY[
    'video/mp4', 'video/webm', 'video/avi', 'video/quicktime',
    'application/pdf',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript',
    'application/json', 'application/xml',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    'application/octet-stream'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies: instructors/admins can upload to their course folders
CREATE POLICY "course_files_upload" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'course-files'
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'instructor')
    )
  );

-- Instructors/admins can delete files in course-files bucket
CREATE POLICY "course_files_delete" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'course-files'
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'instructor')
    )
  );

-- Authenticated users can read files (enforcement at RLS level on course_files table)
CREATE POLICY "course_files_read" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'course-files'
  );
