/*
# Create Notifications Table

## Summary
Creates a `notifications` table for dynamic user notifications (course published, lesson added, assignment uploaded, quiz available, certificate generated, payment successful, wallet updated, referral reward received, announcements).

## Changes
### New Tables
#### `notifications`
- `id` uuid PK
- `user_id` uuid FK → profiles.id ON DELETE CASCADE
- `type` text CHECK (course, lesson, assignment, quiz, certificate, payment, wallet, referral, announcement, system)
- `title` text
- `message` text
- `link` text nullable
- `read` boolean default false
- `created_at` timestamptz default now()

## Security
RLS enabled with 4 policies: users can CRUD only their own notifications.
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system' CHECK (
    type = ANY(ARRAY['course', 'lesson', 'assignment', 'quiz', 'certificate', 'payment', 'wallet', 'referral', 'announcement', 'system'])
  ),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
