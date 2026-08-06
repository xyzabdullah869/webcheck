'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageCircle, Send, CircleCheck as CheckCircle2, Clock, Twitter, Linkedin, Github, Youtube, Facebook, Instagram } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSiteSettings } from '@/lib/contexts/site-settings-context';

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const [submitted, setSubmitted] = React.useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const contactInfo = [
    { icon: Mail, label: 'Email Us', value: settings.contactEmail ?? settings.supportEmail ?? '—', href: settings.contactEmail ? `mailto:${settings.contactEmail}` : '#' },
    { icon: Phone, label: 'Call Us', value: settings.contactNumber ?? '—', href: settings.contactNumber ? `tel:${settings.contactNumber.replace(/\s/g, '')}` : '#' },
    { icon: MessageCircle, label: 'WhatsApp', value: settings.whatsappNumber ?? '—', href: settings.whatsappEnabled && settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}${settings.whatsappDefaultMessage ? `?text=${encodeURIComponent(settings.whatsappDefaultMessage)}` : ''}` : '#' },
    { icon: MapPin, label: 'Visit Us', value: settings.officeAddress ?? '—', href: settings.googleMapsLocation ?? '#' },
    { icon: Clock, label: 'Hours', value: settings.workingHours ?? '—', href: '#' },
  ];

  const socialLinks = [
    { icon: Twitter, label: 'Twitter', href: settings.twitterUrl },
    { icon: Linkedin, label: 'LinkedIn', href: settings.linkedinUrl },
    { icon: Github, label: 'GitHub', href: settings.githubUrl },
    { icon: Youtube, label: 'YouTube', href: settings.youtubeUrl },
    { icon: Facebook, label: 'Facebook', href: settings.facebookUrl },
    { icon: Instagram, label: 'Instagram', href: settings.instagramUrl },
  ].filter((s) => s.href && s.href !== '#');

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Contact"
          title="Get in touch"
          description="Questions about courses, partnerships, or institutional plans? We'd love to hear from you."
        />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <Card className="p-6 shadow-soft sm:p-8">
                <h2 className="font-display text-xl font-bold">Send us a message</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fill out the form and we'll get back to you within 24 hours.
                </p>

                {submitted ? (
                  <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-10 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                    <h3 className="mt-4 font-display text-lg font-bold">Message sent!</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Thank you for reaching out. We'll be in touch shortly.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => setSubmitted(false)}>
                      Send another
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" placeholder="Your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="How can we help?" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" placeholder="Tell us more..." rows={5} required />
                    </div>
                    <Button type="submit" size="lg" className="w-full sm:w-auto">
                      <Send className="mr-2 h-4 w-4" />
                      Send message
                    </Button>
                  </form>
                )}
              </Card>
            </motion.div>

            {/* Info + map + social */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <Card className="p-6 shadow-soft">
                <h3 className="font-display font-semibold">Contact details</h3>
                <div className="mt-4 space-y-4">
                  {contactInfo.map((item) => (
                    <a key={item.label} href={item.href} className="flex items-start gap-3 group">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium group-hover:text-primary">{item.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </Card>

              <Card className="overflow-hidden p-0 shadow-soft">
                <div className="flex items-center justify-between border-b p-4">
                  <p className="font-display text-sm font-semibold">Find us on the map</p>
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="relative aspect-video bg-muted">
                  <iframe
                    title="Office location map"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-71.13%2C42.35%2C-71.09%2C42.37&layer=mapnik"
                    className="h-full w-full border-0"
                    loading="lazy"
                  />
                </div>
              </Card>

              <Card className="p-5 shadow-soft">
                <p className="font-display text-sm font-semibold">Follow us</p>
                <div className="mt-3 flex gap-2">
                  {socialLinks.map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-all hover:border-primary/30 hover:text-primary hover:shadow-soft"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </Card>

              {settings.whatsappEnabled && settings.whatsappNumber && (
                <Button asChild size="lg" className="w-full bg-emerald-500 text-white hover:bg-emerald-600">
                  <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}${settings.whatsappDefaultMessage ? `?text=${encodeURIComponent(settings.whatsappDefaultMessage)}` : ''}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Chat on WhatsApp
                  </a>
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
