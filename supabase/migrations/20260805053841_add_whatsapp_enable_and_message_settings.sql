/*
# Add WhatsApp Enable/Disable and Default Message Settings

## Purpose
Extend the website_settings table to support admin-controlled WhatsApp configuration:
- Enable/disable WhatsApp button globally
- Set a default pre-filled message for WhatsApp links

## Changes
1. Add `whatsapp_enabled` (boolean, default true) to website_settings
2. Add `whatsapp_default_message` (text, nullable) to website_settings

## Security
No new RLS changes needed — website_settings already has admin-only write policies.
*/

ALTER TABLE website_settings
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE website_settings
  ADD COLUMN IF NOT EXISTS whatsapp_default_message text;
