'use client';

import { createClient } from '@/lib/supabase/client';
import type { DbWebsiteSettings } from '@/lib/database-types';

export type WebsiteSettings = {
  websiteName: string;
  shortName: string;
  websiteLogo: string | null;
  websiteDescription: string;
  ownerName: string | null;
  ownerDesignation: string | null;
  supportEmail: string | null;
  contactEmail: string | null;
  contactNumber: string | null;
  whatsappNumber: string | null;
  whatsappEnabled: boolean;
  whatsappDefaultMessage: string | null;
  officeAddress: string | null;
  googleMapsLocation: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  workingHours: string | null;
  supportHours: string | null;
  copyrightText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  usdToPkrExchangeRate: number;
  partners: string[];
};

function mapDbToSettings(db: DbWebsiteSettings): WebsiteSettings {
  return {
    websiteName: db.website_name,
    shortName: db.short_name,
    websiteLogo: db.website_logo,
    websiteDescription: db.website_description,
    ownerName: db.owner_name,
    ownerDesignation: db.owner_designation,
    supportEmail: db.support_email,
    contactEmail: db.contact_email,
    contactNumber: db.contact_number,
    whatsappNumber: db.whatsapp_number,
    whatsappEnabled: db.whatsapp_enabled ?? true,
    whatsappDefaultMessage: db.whatsapp_default_message,
    officeAddress: db.office_address,
    googleMapsLocation: db.google_maps_location,
    facebookUrl: db.facebook_url,
    instagramUrl: db.instagram_url,
    linkedinUrl: db.linkedin_url,
    youtubeUrl: db.youtube_url,
    twitterUrl: db.twitter_url,
    githubUrl: db.github_url,
    workingHours: db.working_hours,
    supportHours: db.support_hours,
    copyrightText: db.copyright_text,
    seoTitle: db.seo_title,
    seoDescription: db.seo_description,
    seoKeywords: db.seo_keywords ?? [],
    usdToPkrExchangeRate: db.usd_to_pkr_exchange_rate ?? 285,
    partners: db.partners ?? [],
  };
}

export async function getWebsiteSettings(): Promise<WebsiteSettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('website_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) return null;
  return mapDbToSettings(data as DbWebsiteSettings);
}

export async function updateWebsiteSettings(
  updates: Partial<WebsiteSettings>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fieldMap: Record<keyof WebsiteSettings, string> = {
    websiteName: 'website_name',
    shortName: 'short_name',
    websiteLogo: 'website_logo',
    websiteDescription: 'website_description',
    ownerName: 'owner_name',
    ownerDesignation: 'owner_designation',
    supportEmail: 'support_email',
    contactEmail: 'contact_email',
    contactNumber: 'contact_number',
    whatsappNumber: 'whatsapp_number',
    whatsappEnabled: 'whatsapp_enabled',
    whatsappDefaultMessage: 'whatsapp_default_message',
    officeAddress: 'office_address',
    googleMapsLocation: 'google_maps_location',
    facebookUrl: 'facebook_url',
    instagramUrl: 'instagram_url',
    linkedinUrl: 'linkedin_url',
    youtubeUrl: 'youtube_url',
    twitterUrl: 'twitter_url',
    githubUrl: 'github_url',
    workingHours: 'working_hours',
    supportHours: 'support_hours',
    copyrightText: 'copyright_text',
    seoTitle: 'seo_title',
    seoDescription: 'seo_description',
    seoKeywords: 'seo_keywords',
    usdToPkrExchangeRate: 'usd_to_pkr_exchange_rate',
    partners: 'partners',
  };

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = fieldMap[key as keyof WebsiteSettings];
    if (dbKey) dbUpdates[dbKey] = value;
  }

  const { error } = await supabase
    .from('website_settings')
    .update(dbUpdates)
    .eq('id', 1);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
