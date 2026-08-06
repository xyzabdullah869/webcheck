'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageCircle, ArrowRight } from 'lucide-react';
import { useSiteSettings } from '@/lib/contexts/site-settings-context';
import { SectionTitle } from '@/components/section-title';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const items = [
  { icon: Mail, label: 'Email', value: 'hello@yourdomain.com', href: 'mailto:hello@yourdomain.com' },
  { icon: Phone, label: 'Phone', value: '+1 (000) 000-0000', href: 'tel:+10000000000' },
  { icon: MapPin, label: 'Office', value: 'Your office address here', href: '#' },
];

export function ContactPreview() {
  const { settings } = useSiteSettings();

  const items = [
    { icon: Mail, label: 'Email', value: settings.contactEmail ?? settings.supportEmail ?? '—', href: settings.contactEmail ? `mailto:${settings.contactEmail}` : '#' },
    { icon: Phone, label: 'Phone', value: settings.contactNumber ?? '—', href: settings.contactNumber ? `tel:${settings.contactNumber.replace(/\s/g, '')}` : '#' },
    { icon: MapPin, label: 'Office', value: settings.officeAddress ?? '—', href: settings.googleMapsLocation ?? '#' },
  ].filter((item) => item.value !== '—');

  return (
    <section className="bg-muted/20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Get in touch"
          title="Have questions? We are here to help"
          description="Reach out about courses, partnerships, or institutional plans."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.length > 0 ? items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="flex h-full flex-col items-center gap-3 p-6 text-center shadow-soft transition-shadow hover:shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
                <p className="font-display text-sm font-medium">{item.value}</p>
              </Card>
            </motion.div>
          )) : (
            <div className="md:col-span-3">
              <Card className="flex flex-col items-center gap-3 p-8 text-center shadow-soft">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <p className="font-display text-sm font-semibold">Get in touch</p>
                <p className="text-sm text-muted-foreground">Contact information will appear here once configured by the admin.</p>
              </Card>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-xl px-6">
            <Link href="/contact">
              Contact us
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {settings.whatsappEnabled && settings.whatsappNumber && (
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6">
              <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}${settings.whatsappDefaultMessage ? `?text=${encodeURIComponent(settings.whatsappDefaultMessage)}` : ''}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat on WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
