'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Save, Loader as Loader2, Power } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';
import { getAiAdminSettings, updateAiAdminSettings, type AiAdminSettings } from '@/lib/services/ai-admin-service';

export default function AdminAiSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<AiAdminSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const s = await getAiAdminSettings();
      if (s) setSettings(s);
      else setSettings({ is_enabled: true, model_name: 'gpt-4o-mini', system_prompt: '', max_tokens: 1024, temperature: 0.7 });
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const success = await updateAiAdminSettings(settings);
    setSaving(false);
    if (success) toast({ title: 'AI settings saved' });
    else toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">AI Assistant Settings</h1>
            <p className="mt-1 text-muted-foreground">Configure the AI tutor's behavior, model, and availability.</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        <Card className="overflow-hidden p-0 shadow-card">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20"><Sparkles className="h-6 w-6" /></div>
              <div>
                <h2 className="font-display text-lg font-bold">BioHub AI Configuration</h2>
                <p className="text-sm text-white/80">Control the AI tutor's model, prompt, and parameters</p>
              </div>
            </div>
          </div>
        </Card>

        {settings && (
          <div className="space-y-6">
            {/* Enable/Disable */}
            <Card className="flex items-center justify-between p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Power className="h-5 w-5" /></div>
                <div>
                  <p className="font-display text-sm font-semibold">AI Assistant Status</p>
                  <p className="text-xs text-muted-foreground">Enable or disable the AI tutor for all students</p>
                </div>
              </div>
              <Switch checked={settings.is_enabled} onCheckedChange={(v) => setSettings({ ...settings, is_enabled: v })} />
            </Card>

            {/* Model Configuration */}
            <Card className="space-y-5 p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Model Configuration</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Model Name</Label>
                  <Input value={settings.model_name} onChange={(e) => setSettings({ ...settings, model_name: e.target.value })} placeholder="gpt-4o-mini" />
                  <p className="text-xs text-muted-foreground">The AI model to use for responses</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input type="number" value={settings.max_tokens} onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value) || 1024 })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Temperature (0.0 - 2.0)</Label>
                  <Input type="number" step="0.1" min="0" max="2" value={settings.temperature} onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) || 0.7 })} />
                  <p className="text-xs text-muted-foreground">Lower = more focused, higher = more creative</p>
                </div>
              </div>
            </Card>

            {/* System Prompt */}
            <Card className="space-y-5 p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">System Prompt</h2>
              <p className="text-sm text-muted-foreground">This prompt defines the AI's behavior and personality as a tutor.</p>
              <Textarea value={settings.system_prompt} onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })} rows={8} className="font-mono text-sm" />
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
