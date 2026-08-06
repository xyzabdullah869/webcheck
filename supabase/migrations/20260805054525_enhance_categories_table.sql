/*
# Enhance Categories Table

## Purpose
Add fields needed for full dynamic category management:
- is_active (boolean) — enable/disable categories
- is_featured (boolean) — show on homepage
- sort_order (integer) — custom ordering
- display_description (text) — optional longer description for category detail page

## Changes
- Add 4 columns to categories table
- Add index on sort_order for efficient ordering
*/

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS display_description text;

CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON categories(sort_order);
