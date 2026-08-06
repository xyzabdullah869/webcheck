'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Globe, Bell, Shield, User, Save, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageTransition } from '@/components/page-transition';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function DashboardSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [fullName, setFullName] = React.useState(profile?.full_name ?? '');
  const [bio, setBio] = React.useState(profile?.bio ?? '');
  const [location, setLocation] = React.useState(profile?.location ?? '');
  const [avatarUrl, setAvatarUrl] = React.useState(profile?.avatar_url ?? '');

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

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setBio(profile.bio);
      setLocation(profile.location);
      setAvatarUrl(profile.avatar_url ?? '');
    }
  }, [profile]);

  const onSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, bio, location, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSaved(true);
      refreshProfile();
      setTimeout(() => setSaved(false), 2500);
      toast({ title: 'Profile updated' });
    }
  };

  const initials = (fullName || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your appearance, profile, notifications, and privacy.</p>
        </div>

        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="appearance" className="gap-1.5"><Sun className="h-4 w-4" /><span className="hidden sm:inline">Appearance</span></TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5"><User className="h-4 w-4" /><span className="hidden sm:inline">Profile</span></TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-4 w-4" /><span className="hidden sm:inline">Notifications</span></TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1.5"><Shield className="h-4 w-4" /><span className="hidden sm:inline">Privacy</span></TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Sun className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-display font-semibold">Theme</h2>
                  <p className="text-xs text-muted-foreground">Choose your preferred appearance</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {([ { id: 'light', label: 'Light', icon: Sun }, { id: 'dark', label: 'Dark', icon: Moon }, { id: 'system', label: 'System', icon: Globe }] as const).map((opt) => (
                  <button key={opt.id} onClick={() => setTheme(opt.id)} className={cn('flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all', theme === opt.id ? 'border-primary bg-primary/5 shadow-soft' : 'hover:border-primary/40')}>
                    <opt.icon className={cn('h-6 w-6', theme === opt.id ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-display font-semibold">Profile Photo</h2>
                  <p className="text-xs text-muted-foreground">Enter a URL for your avatar.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={onSaveProfile} disabled={saving} className="gap-2">
                  {saving ? 'Saving...' : saved ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Changes</>}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="divide-y shadow-soft">
              {[
                { key: 'courseUpdates', label: 'Course Updates', desc: 'Get notified when your courses have new lessons or announcements.' },
                { key: 'newMessages', label: 'New Messages', desc: 'Notifications for messages from instructors and the community.' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'A summary of your progress and recommendations every week.' },
                { key: 'promotions', label: 'Promotions & Offers', desc: 'Occasional emails about discounts and new features.' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-5">
                  <div className="pr-4">
                    <p className="font-display text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={notifications[item.key as keyof typeof notifications]} onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))} />
                </div>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="divide-y shadow-soft">
              {[
                { key: 'profilePublic', label: 'Public Profile', desc: 'Allow other learners to view your profile and achievements.' },
                { key: 'showProgress', label: 'Show Progress', desc: 'Display your learning progress on your public profile.' },
                { key: 'allowAnalytics', label: 'Usage Analytics', desc: 'Help us improve by sharing anonymous usage data.' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-5">
                  <div className="pr-4">
                    <p className="font-display text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={privacy[item.key as keyof typeof privacy]} onCheckedChange={(v) => setPrivacy((prev) => ({ ...prev, [item.key]: v }))} />
                </div>
              ))}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
