'use client';

import * as React from 'react';
import { Settings, Save, Loader as Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: 'Settings saved' });
    }, 1000);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Admin Settings</h1>
            <p className="mt-1 text-muted-foreground">Platform-wide administrative configuration.</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        <Card className="space-y-5 p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Settings className="h-5 w-5" /></div>
            <div>
              <h2 className="font-display font-semibold">Platform Configuration</h2>
              <p className="text-xs text-muted-foreground">General platform settings</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input defaultValue="Bioinformatics Hub" />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input type="email" defaultValue="support@bioinformaticshub.com" />
            </div>
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Input defaultValue="USD" />
            </div>
            <div className="space-y-2">
              <Label>Max File Upload Size (MB)</Label>
              <Input type="number" defaultValue="50" />
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
