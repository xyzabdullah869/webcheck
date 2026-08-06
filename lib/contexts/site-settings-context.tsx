'use client';

import * as React from 'react';
import { getWebsiteSettings, type WebsiteSettings } from '@/lib/services/site-settings-service';
import { siteConfig } from '@/lib/site';

type SiteSettingsContextValue = {
  settings: WebsiteSettings;
  loading: boolean;
  refresh: () => Promise<void>;
};

const defaultSettings: WebsiteSettings = {
  websiteName: siteConfig.name,
  shortName: siteConfig.shortName,
  websiteLogo: null,
  websiteDescription: siteConfig.description,
  ownerName: null,
  ownerDesignation: null,
  supportEmail: siteConfig.email,
  contactEmail: siteConfig.email,
  contactNumber: siteConfig.phone,
  whatsappNumber: null,
  whatsappEnabled: true,
  whatsappDefaultMessage: null,
  officeAddress: siteConfig.address,
  googleMapsLocation: null,
  facebookUrl: null,
  instagramUrl: null,
  linkedinUrl: siteConfig.social.linkedin ?? null,
  youtubeUrl: siteConfig.social.youtube ?? null,
  twitterUrl: siteConfig.social.twitter ?? null,
  githubUrl: siteConfig.social.github ?? null,
  workingHours: null,
  supportHours: null,
  copyrightText: null,
  seoTitle: null,
  seoDescription: null,
  seoKeywords: [],
  usdToPkrExchangeRate: 285,
  partners: [],
};

const SiteSettingsContext = React.createContext<SiteSettingsContextValue>({
  settings: defaultSettings,
  loading: true,
  refresh: async () => {},
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<WebsiteSettings>(defaultSettings);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    const s = await getWebsiteSettings();
    if (s) setSettings(s);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return React.useContext(SiteSettingsContext);
}
