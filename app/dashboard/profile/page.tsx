'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, MapPin, Calendar, BookOpen, Award, Clock, Save, Loader as Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { getStudentStats, type StudentStats } from '@/lib/services/student-dashboard-service';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [stats, setStats] = React.useState<StudentStats | null>(null);
  const [fullName, setFullName] = React.useState(profile?.full_name ?? '');
  const [bio, setBio] = React.useState(profile?.bio ?? '');
  const [location, setLocation] = React.useState(profile?.location ?? '');
  const [avatarUrl, setAvatarUrl] = React.useState(profile?.avatar_url ?? '');

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setBio(profile.bio);
      setLocation(profile.location);
      setAvatarUrl(profile.avatar_url ?? '');
    }
  }, [profile]);

  React.useEffect(() => {
    if (user) {
      (async () => {
        const s = await getStudentStats(user.id);
        setStats(s);
      })();
    }
  }, [user]);

  const onSave = async () => {
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
      refreshProfile();
      toast({ title: 'Profile updated' });
    }
  };

  const initials = (fullName || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Profile</h1>
          <p className="mt-1 text-muted-foreground">Manage your personal information and view your learning stats.</p>
        </div>

        {/* Profile header */}
        <Card className="overflow-hidden p-0 shadow-card">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <Avatar className="h-24 w-24 border-4 border-background">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
                <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h2 className="font-display text-xl font-bold">{fullName || 'Student'}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">{profile?.role ?? 'student'}</Badge>
                  {location && <Badge variant="outline"><MapPin className="mr-1 h-3 w-3" />{location}</Badge>}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Enrolled Courses', value: stats?.enrolledCourses ?? 0, icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
            { label: 'Completed Lessons', value: stats?.completedLessons ?? 0, icon: Award, color: 'from-emerald-500 to-teal-500' },
            { label: 'Certificates', value: stats?.certificates ?? 0, icon: Award, color: 'from-violet-500 to-purple-500' },
            { label: 'Learning Hours', value: stats?.totalLearningHours ?? 0, icon: Clock, color: 'from-amber-500 to-orange-500' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Edit form */}
        <Card className="p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Edit Profile</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={onSave} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
            </Button>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
