import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site';

type SeoOptions = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

export function createMetadata({
  title,
  description = siteConfig.description,
  path = '',
  image,
  noIndex = false,
}: SeoOptions = {}): Metadata {
  const fullTitle = title
    ? `${title} | ${siteConfig.name}`
    : `${siteConfig.name} — Master Bioinformatics, Data Science & AI`;

  const url = `${siteConfig.url}${path}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      type: 'website',
      ...(image && { images: [{ url: image, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      ...(image && { images: [image] }),
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}
