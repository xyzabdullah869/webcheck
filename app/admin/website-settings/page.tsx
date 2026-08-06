'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Globe, User, Mail, Phone, MapPin, Share2, Clock, Search as SearchIcon, Save, Loader as Loader2, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  getWebsiteSettings,
  updateWebsiteSettings,
  type WebsiteSettings,
} from '@/lib/services/site-settings-service';
import { PageTransition } from '@/components/page-transition';

type TabId = 'general' | 'owner' | 'contact' | 'social' | 'hours' | 'seo';

const tabs: { id: TabId; label: string; icon: typeof Globe }[] = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'owner', label: 'Owner', icon: User },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'social', label: 'Social', icon: Share2 },
  { id: 'hours', label: 'Hours', icon: Clock },
  { id: 'seo', label: 'SEO', icon: SearchIcon },
];

export default function WebsiteSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabId>('general');

  React.useEffect(() => {
    (async () => {
      const s = await getWebsiteSettings();
      if (s) setSettings(s);
      setLoading(false);
    })();
  }, []);

  const handleChange = (field: keyof WebsiteSettings, value: string | string[] | boolean) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const result = await updateWebsiteSettings(settings);
    setSaving(false);
    if (result.success) {
      toast({ title: 'Settings saved', description: 'Website settings have been updated successfully.' });
    } else {
      toast({ title: 'Error', description: result.error ?? 'Failed to save settings', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageTransition>
    );
  }

  const s = settings!;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Website Settings</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your website information, contact details, and SEO configuration.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />Save Changes</>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'general' && (
            <Card className="space-y-5 p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">General Information</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Website Name</Label>
                  <Input value={s.websiteName} onChange={(e) => handleChange('websiteName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Short Name</Label>
                  <Input value={s.shortName} onChange={(e) => handleChange('shortName', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website Logo URL</Label>
                <Input
                  value={s.websiteLogo ?? ''}
                  onChange={(e) => handleChange('websiteLogo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">Leave empty to use the default DNA icon.</p>
              </div>
              <div className="space-y-2">
                <Label>Website Description</Label>
                <Textarea
                  value={s.websiteDescription}
                  onChange={(e) => handleChange('websiteDescription', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Copyright Text</Label>
                <Input
                  value={s.copyrightText ?? ''}
                  onChange={(e) => handleChange('copyrightText', e.target.value)}
                  placeholder="© 2024 Your Company. All rights reserved."
                />
              </div>
              <div className="space-y-2">
                <Label>Partners / Trusted By (comma-separated)</Label>
                <Input
                  value={(s.partners ?? []).join(', ')}
                  onChange={(e) =>
                    handleChange(
                      'partners',
                      e.target.value.split(',').map((p) => p.trim()).filter(Boolean)
                    )
                  }
                  placeholder="Harvard, MIT, Stanford, Genentech"
                />
                <p className="text-xs text-muted-foreground">Institution names shown in the &quot;Trusted By&quot; section on the homepage.</p>
              </div>
            </Card>
          )}

          {activeTab === 'owner' && (
            <Card className="space-y-5 p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Owner Information</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Owner Name</Label>
                  <Input value={s.ownerName ?? ''} onChange={(e) => handleChange('ownerName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Owner Designation</Label>
                  <Input
                    value={s.ownerDesignation ?? ''}
                    onChange={(e) => handleChange('ownerDesignation', e.target.value)}
                    placeholder="Founder & CEO"
                  />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'contact' && (
            <Card className="space-y-5 p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Contact Information</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input
                    value={s.supportEmail ?? ''}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    placeholder="support@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    value={s.contactEmail ?? ''}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="hello@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input
                    value={s.contactNumber ?? ''}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Number</Label>
                  <Input
                    value={s.whatsappNumber ?? ''}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                    placeholder="+1 555 000 0000"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="cursor-pointer">Enable WhatsApp Chat</Label>
                      <p className="text-xs text-muted-foreground">Show WhatsApp button on contact page and other pages.</p>
                    </div>
                    <Switch
                      checked={s.whatsappEnabled}
                      onCheckedChange={(checked) => handleChange('whatsappEnabled', checked)}
                    />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>WhatsApp Default Message</Label>
                  <Textarea
                    value={s.whatsappDefaultMessage ?? ''}
                    onChange={(e) => handleChange('whatsappDefaultMessage', e.target.value)}
                    rows={2}
                    placeholder="Hello! I have a question about your courses."
                  />
                  <p className="text-xs text-muted-foreground">This message will be pre-filled when users click the WhatsApp button.</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Office Address</Label>
                  <Textarea
                    value={s.officeAddress ?? ''}
                    onChange={(e) => handleChange('officeAddress', e.target.value)}
                    rows={2}
                    placeholder="123 Main Street, City, Country"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Google Maps Location URL</Label>
                  <Input
                    value={s.googleMapsLocation ?? ''}
                    onChange={(e) => handleChange('googleMapsLocation', e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'social' && (
            <Card className="space-y-5 p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Social Media Links</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Facebook URL</Label>
                  <Input value={s.facebookUrl ?? ''} onChange={(e) => handleChange('facebookUrl', e.target.value)} placeholder="https://facebook.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Instagram URL</Label>
                  <Input value={s.instagramUrl ?? ''} onChange={(e) => handleChange('instagramUrl', e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input value={s.linkedinUrl ?? ''} onChange={(e) => handleChange('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>YouTube URL</Label>
                  <Input value={s.youtubeUrl ?? ''} onChange={(e) => handleChange('youtubeUrl', e.target.value)} placeholder="https://youtube.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Twitter/X URL</Label>
                  <Input value={s.twitterUrl ?? ''} onChange={(e) => handleChange('twitterUrl', e.target.value)} placeholder="https://twitter.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>GitHub URL</Label>
                  <Input value={s.githubUrl ?? ''} onChange={(e) => handleChange('githubUrl', e.target.value)} placeholder="https://github.com/..." />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'hours' && (
            <Card className="space-y-5 p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Working Hours</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Working Hours</Label>
                  <Input
                    value={s.workingHours ?? ''}
                    onChange={(e) => handleChange('workingHours', e.target.value)}
                    placeholder="Mon - Fri: 9:00 AM - 6:00 PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Hours</Label>
                  <Input
                    value={s.supportHours ?? ''}
                    onChange={(e) => handleChange('supportHours', e.target.value)}
                    placeholder="24/7 Online Support"
                  />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'seo' && (
            <Card className="space-y-5 p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">SEO Configuration</h2>
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input value={s.seoTitle ?? ''} onChange={(e) => handleChange('seoTitle', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SEO Description</Label>
                <Textarea
                  value={s.seoDescription ?? ''}
                  onChange={(e) => handleChange('seoDescription', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>SEO Keywords (comma-separated)</Label>
                <Input
                  value={s.seoKeywords.join(', ')}
                  onChange={(e) =>
                    handleChange(
                      'seoKeywords',
                      e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                    )
                  }
                  placeholder="bioinformatics, courses, data science"
                />
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
