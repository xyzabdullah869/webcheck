/*
# Add Partners to Website Settings

## Summary
Adds a `partners` text array column to `website_settings` for displaying partner/trusted-by logos on the homepage.

## Changes
### Modified Tables
#### `website_settings`
- `partners` text[] default '{}' — list of partner/institution names

## Security
No new RLS needed — existing policies cover the new column.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'website_settings' AND column_name = 'partners') THEN
    ALTER TABLE website_settings ADD COLUMN partners text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;
