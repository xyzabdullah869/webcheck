'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Moon,
  Sun,
  Globe,
  Bell,
  Shield,
  User,
  Save,
  Check,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = React.useState(false);

  const [notifications, setNotifications] = React.useState({
    courseUpdates: true,
    newMessages: true,
    weeklyDigest: false,
    promotions: false,
  });

  const [privacy, setPrivacy] = React.useState({
    profilePublic: true,
    showProgress: true,
    allowAnalytics: true,
  });

  const onSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Settings"
          title="Account settings"
          description="Manage your appearance, language, notifications, and privacy preferences."
        />

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Tabs defaultValue="appearance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="appearance" className="gap-1.5">
                <Sun className="h-4 w-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-1.5">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
            </TabsList>

            {/* Appearance */}
            <TabsContent value="appearance" className="space-y-6">
              <Card className="p-6 shadow-soft">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold">Theme</h2>
                    <p className="text-xs text-muted-foreground">Choose your preferred appearance</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {([
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Globe },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all',
                        theme === opt.id
                          ? 'border-primary bg-primary/5 shadow-soft'
                          : 'hover:border-primary/40'
                      )}
                    >
                      <opt.icon className={cn('h-6 w-6', theme === opt.id ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold">Language</h2>
                    <p className="text-xs text-muted-foreground">Select your interface language</p>
                  </div>
                </div>
                <div className="mt-5 max-w-xs">
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="hi">हिन्दी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </TabsContent>

            {/* Profile */}
            <TabsContent value="profile">
              <Card className="p-6 shadow-soft">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border">
                    <AvatarImage src="" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-display font-semibold">Profile photo</h2>
                    <p className="text-xs text-muted-foreground">JPG, PNG. Max 2MB.</p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline">Change</Button>
                      <Button size="sm" variant="ghost" className="text-rose-500 hover:text-rose-600">Remove</Button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" placeholder="Your full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="your-username" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input id="bio" placeholder="Tell us about yourself" />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <Card className="divide-y shadow-soft">
                {[
                  { key: 'courseUpdates', label: 'Course updates', desc: 'Get notified when your courses have new lessons or announcements.' },
                  { key: 'newMessages', label: 'New messages', desc: 'Notifications for messages from instructors and the community.' },
                  { key: 'weeklyDigest', label: 'Weekly digest', desc: 'A summary of your progress and recommendations every week.' },
                  { key: 'promotions', label: 'Promotions & offers', desc: 'Occasional emails about discounts and new features.' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-5">
                    <div className="pr-4">
                      <p className="font-display text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(v) =>
                        setNotifications((prev) => ({ ...prev, [item.key]: v }))
                      }
                    />
                  </div>
                ))}
              </Card>
            </TabsContent>

            {/* Privacy */}
            <TabsContent value="privacy">
              <Card className="divide-y shadow-soft">
                {[
                  { key: 'profilePublic', label: 'Public profile', desc: 'Allow other learners to view your profile and achievements.' },
                  { key: 'showProgress', label: 'Show progress', desc: 'Display your learning progress on your public profile.' },
                  { key: 'allowAnalytics', label: 'Usage analytics', desc: 'Help us improve by sharing anonymous usage data.' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-5">
                    <div className="pr-4">
                      <p className="font-display text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={privacy[item.key as keyof typeof privacy]}
                      onCheckedChange={(v) =>
                        setPrivacy((prev) => ({ ...prev, [item.key]: v }))
                      }
                    />
                  </div>
                ))}
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-end gap-3"
          >
            <Button variant="outline">Cancel</Button>
            <Button onClick={onSave} className="gap-2">
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
