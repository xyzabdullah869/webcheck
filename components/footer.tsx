'use client';

import Link from 'next/link';
import { Dna, Twitter, Linkedin, Github, Youtube, Mail, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { footerLinks } from '@/lib/site';
import { useSiteSettings } from '@/lib/contexts/site-settings-context';

export function Footer() {
  const { settings } = useSiteSettings();
  const siteName = settings.websiteName || 'Bioinformatics Hub';
  const description = settings.websiteDescription || 'A premium online learning platform for bioinformatics, biotechnology, AI, programming, and data science.';
  const copyright = settings.copyrightText || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  const socials = [
    { icon: Twitter, href: settings.twitterUrl, label: 'Twitter' },
    { icon: Linkedin, href: settings.linkedinUrl, label: 'LinkedIn' },
    { icon: Github, href: settings.githubUrl, label: 'GitHub' },
    { icon: Youtube, href: settings.youtubeUrl, label: 'YouTube' },
    { icon: Facebook, href: settings.facebookUrl, label: 'Facebook' },
    { icon: Instagram, href: settings.instagramUrl, label: 'Instagram' },
    { icon: Mail, href: settings.contactEmail ? `mailto:${settings.contactEmail}` : null, label: 'Email' },
  ].filter((s) => s.href && s.href !== '#');

  return (
    <footer className="relative mt-24 border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                {settings.websiteLogo ? (
                  <img src={settings.websiteLogo} alt={siteName} className="h-5 w-5 object-contain" />
                ) : (
                  <Dna className="h-5 w-5" />
                )}
              </div>
              <span className="font-display text-lg font-bold tracking-tight">
                {siteName.split(' ')[0]}{' '}
                <span className="text-gradient">{siteName.split(' ').slice(1).join(' ') || 'Hub'}</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              {description}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-all hover:border-primary/30 hover:text-primary hover:shadow-soft"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                {heading}
              </h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {copyright}
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              Terms
            </Link>
            <Link href="/contact" className="transition-colors hover:text-primary">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
