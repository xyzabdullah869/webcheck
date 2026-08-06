'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Settings, Mic, PenTool, Eye, DollarSign, FileText, Loader as Loader2, Save, Brain, ChartBar as BarChart3, Activity, Zap, Check, Users, Circle as XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';
import { getAiSettings, updateAiSettings, getVoiceSettings, updateVoiceSettings, getPromptTemplates, updatePromptTemplate } from '@/lib/ai/settings-service';
import { getAdminUsageStats } from '@/lib/ai/analytics-engine';
import type { AiSettings, VoiceSettings } from '@/lib/ai/types';

export default function AdminAISettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('general');

  const [settings, setSettings] = React.useState<AiSettings | null>(null);
  const [voiceSettings, setVoiceSettings] = React.useState<VoiceSettings | null>(null);
  const [templates, setTemplates] = React.useState<{ id: string; name: string; templateKey: string; description: string | null; promptText: string; variables: string[]; isActive: boolean }[]>([]);
  const [stats, setStats] = React.useState<{ totalRequests: number; totalTokens: number; totalCost: number; totalUsers: number; byProvider: Record<string, { requests: number; tokens: number; cost: number }>; byRequestType: Record<string, { requests: number; tokens: number; cost: number }>; recentLogs: { id: string; provider: string; model: string; requestType: string; totalTokens: number; estimatedCostUsd: number; success: boolean; createdAt: string }[] } | null>(null);
  const [editingTemplate, setEditingTemplate] = React.useState<string | null>(null);
  const [templateText, setTemplateText] = React.useState('');

  React.useEffect(() => {
    (async () => {
      const [s, vs, t, st] = await Promise.all([
        getAiSettings(), getVoiceSettings(), getPromptTemplates(), getAdminUsageStats(),
      ]);
      setSettings(s); setVoiceSettings(vs); setTemplates(t); setStats(st);
      setLoading(false);
    })();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const ok = await updateAiSettings(settings);
    setSaving(false);
    toast({ title: ok ? 'Settings saved' : 'Failed to save', variant: ok ? 'default' : 'destructive' });
  };

  const handleSaveVoice = async () => {
    if (!voiceSettings) return;
    setSaving(true);
    const ok = await updateVoiceSettings(voiceSettings);
    setSaving(false);
    toast({ title: ok ? 'Voice settings saved' : 'Failed to save', variant: ok ? 'default' : 'destructive' });
  };

  const handleSaveTemplate = async (id: string) => {
    const ok = await updatePromptTemplate(id, templateText);
    toast({ title: ok ? 'Template saved' : 'Failed to save', variant: ok ? 'default' : 'destructive' });
    if (ok) setEditingTemplate(null);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">AI Teacher Settings</h1>
          <p className="mt-1 text-muted-foreground">Configure the AI Virtual Teacher system, voice, analytics, and prompts.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="general"><Settings className="mr-1 h-4 w-4" />General</TabsTrigger>
            <TabsTrigger value="voice"><Mic className="mr-1 h-4 w-4" />Voice</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="mr-1 h-4 w-4" />Analytics</TabsTrigger>
            <TabsTrigger value="prompts"><FileText className="mr-1 h-4 w-4" />Prompts</TabsTrigger>
            <TabsTrigger value="features"><PenTool className="mr-1 h-4 w-4" />Features</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">AI Provider Configuration</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>AI Provider</Label>
                  <Select value={settings?.provider ?? 'openai'} onValueChange={(v) => setSettings(s => s ? { ...s, provider: v as AiSettings['provider'] } : s)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={settings?.apiModel ?? ''} onChange={(e) => setSettings(s => s ? { ...s, apiModel: e.target.value } : s)} placeholder="gpt-4o-mini" />
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input type="number" value={settings?.maxTokens ?? 2000} onChange={(e) => setSettings(s => s ? { ...s, maxTokens: parseInt(e.target.value) || 2000 } : s)} />
                </div>
                <div className="space-y-2">
                  <Label>Temperature</Label>
                  <Input type="number" step="0.1" min="0" max="2" value={settings?.temperature ?? 0.7} onChange={(e) => setSettings(s => s ? { ...s, temperature: parseFloat(e.target.value) || 0.7 } : s)} />
                </div>
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select value={settings?.defaultLanguage ?? 'en'} onValueChange={(v) => setSettings(s => s ? { ...s, defaultLanguage: v as AiSettings['defaultLanguage'] } : s)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ur">Urdu</SelectItem>
                      <SelectItem value="roman-ur">Roman Urdu</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Session Tokens</Label>
                  <Input type="number" value={settings?.maxSessionTokens ?? 100000} onChange={(e) => setSettings(s => s ? { ...s, maxSessionTokens: parseInt(e.target.value) || 100000 } : s)} />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>System Prompt (optional override)</Label>
                <Textarea value={settings?.systemPrompt ?? ''} onChange={(e) => setSettings(s => s ? { ...s, systemPrompt: e.target.value } : s)} rows={3} placeholder="Custom system prompt for the AI teacher..." />
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border p-3">
                <Switch checked={settings?.isEnabled ?? true} onCheckedChange={(v) => setSettings(s => s ? { ...s, isEnabled: v } : s)} />
                <div><p className="text-sm font-medium">AI Teacher Enabled</p><p className="text-xs text-muted-foreground">Toggle to enable/disable the entire AI system</p></div>
              </div>
              <Button onClick={handleSaveSettings} disabled={saving} className="mt-4">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Settings
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <Card className="p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Voice Engine Settings</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Voice</Label>
                  <Select value={voiceSettings?.defaultVoice ?? 'female'} onValueChange={(v) => setVoiceSettings(s => s ? { ...s, defaultVoice: v as VoiceSettings['defaultVoice'] } : s)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={voiceSettings?.tone ?? 'friendly'} onValueChange={(v) => setVoiceSettings(s => s ? { ...s, tone: v as VoiceSettings['tone'] } : s)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Speaking Speed ({voiceSettings?.speakingSpeed ?? 1.0}x)</Label>
                  <Input type="number" step="0.1" min="0.5" max="2.0" value={voiceSettings?.speakingSpeed ?? 1.0} onChange={(e) => setVoiceSettings(s => s ? { ...s, speakingSpeed: parseFloat(e.target.value) || 1.0 } : s)} />
                </div>
                <div className="space-y-2">
                  <Label>Pitch</Label>
                  <Input type="number" step="0.1" min="0" max="2" value={voiceSettings?.pitch ?? 1.0} onChange={(e) => setVoiceSettings(s => s ? { ...s, pitch: parseFloat(e.target.value) || 1.0 } : s)} />
                </div>
                <div className="space-y-2">
                  <Label>Volume</Label>
                  <Input type="number" step="0.1" min="0" max="1" value={voiceSettings?.volume ?? 1.0} onChange={(e) => setVoiceSettings(s => s ? { ...s, volume: parseFloat(e.target.value) || 1.0 } : s)} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border p-3">
                <Switch checked={voiceSettings?.isEnabled ?? true} onCheckedChange={(v) => setVoiceSettings(s => s ? { ...s, isEnabled: v } : s)} />
                <div><p className="text-sm font-medium">Voice Enabled</p><p className="text-xs text-muted-foreground">Enable text-to-speech for the AI teacher</p></div>
              </div>
              <Button onClick={handleSaveVoice} disabled={saving} className="mt-4">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Voice Settings
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {stats && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Total Requests', value: stats.totalRequests.toString(), icon: Activity, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Total Tokens', value: stats.totalTokens.toLocaleString(), icon: Zap, color: 'from-amber-500 to-orange-500' },
                    { label: 'Total Cost', value: `$${stats.totalCost.toFixed(4)}`, icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
                    { label: 'Active Users', value: stats.totalUsers.toString(), icon: Users, color: 'from-rose-500 to-pink-500' },
                  ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <Card className="p-5 shadow-soft">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                        <p className="mt-3 font-display text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="p-6 shadow-soft">
                    <h2 className="font-display text-lg font-semibold">By Provider</h2>
                    <div className="mt-4 space-y-2">
                      {Object.entries(stats.byProvider).map(([provider, data]) => (
                        <div key={provider} className="flex items-center justify-between rounded-lg border p-3">
                          <div><p className="text-sm font-semibold capitalize">{provider}</p><p className="text-xs text-muted-foreground">{data.requests} requests</p></div>
                          <div className="text-right"><p className="text-sm font-semibold">{data.tokens.toLocaleString()} tokens</p><p className="text-xs text-muted-foreground">${data.cost.toFixed(4)}</p></div>
                        </div>
                      ))}
                      {Object.keys(stats.byProvider).length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No usage data yet</p>}
                    </div>
                  </Card>
                  <Card className="p-6 shadow-soft">
                    <h2 className="font-display text-lg font-semibold">By Request Type</h2>
                    <div className="mt-4 space-y-2">
                      {Object.entries(stats.byRequestType).map(([type, data]) => (
                        <div key={type} className="flex items-center justify-between rounded-lg border p-3">
                          <div><p className="text-sm font-semibold capitalize">{type}</p><p className="text-xs text-muted-foreground">{data.requests} requests</p></div>
                          <div className="text-right"><p className="text-sm font-semibold">{data.tokens.toLocaleString()} tokens</p><p className="text-xs text-muted-foreground">${data.cost.toFixed(4)}</p></div>
                        </div>
                      ))}
                      {Object.keys(stats.byRequestType).length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No usage data yet</p>}
                    </div>
                  </Card>
                </div>

                <Card className="p-6 shadow-soft">
                  <h2 className="font-display text-lg font-semibold">Recent Activity</h2>
                  <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                    {stats.recentLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <div className="flex items-center gap-2">
                          {log.success ? <Check className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                          <div>
                            <p className="font-medium capitalize">{log.requestType}</p>
                            <p className="text-xs text-muted-foreground">{log.provider} / {log.model}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium">{log.totalTokens} tokens</p>
                          <p className="text-xs text-muted-foreground">${log.estimatedCostUsd.toFixed(4)}</p>
                        </div>
                      </div>
                    ))}
                    {stats.recentLogs.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No recent activity</p>}
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="prompts" className="space-y-4">
            <Card className="p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Prompt Templates</h2>
              <p className="mt-1 text-sm text-muted-foreground">Customize how the AI teacher responds in different scenarios.</p>
              <div className="mt-4 space-y-3">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-semibold">{tpl.name}</p><p className="text-xs text-muted-foreground">{tpl.description}</p></div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{tpl.templateKey}</Badge>
                        <Button variant="outline" size="sm" onClick={() => { setEditingTemplate(tpl.id); setTemplateText(tpl.promptText); }}>Edit</Button>
                      </div>
                    </div>
                    {editingTemplate === tpl.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea value={templateText} onChange={(e) => setTemplateText(e.target.value)} rows={8} className="font-mono text-xs" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveTemplate(tpl.id)}><Save className="mr-1 h-3.5 w-3.5" />Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card className="p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Classroom Features</h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <Mic className="h-5 w-5 text-primary" />
                  <div className="flex-1"><p className="text-sm font-medium">Voice Conversation</p><p className="text-xs text-muted-foreground">Enable text-to-speech and speech recognition in the AI classroom</p></div>
                  <Switch checked={settings?.voiceEnabled ?? true} onCheckedChange={(v) => setSettings(s => s ? { ...s, voiceEnabled: v } : s)} />
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <PenTool className="h-5 w-5 text-primary" />
                  <div className="flex-1"><p className="text-sm font-medium">Whiteboard</p><p className="text-xs text-muted-foreground">Enable the AI whiteboard for diagrams and visual explanations</p></div>
                  <Switch checked={settings?.whiteboardEnabled ?? true} onCheckedChange={(v) => setSettings(s => s ? { ...s, whiteboardEnabled: v } : s)} />
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <Eye className="h-5 w-5 text-primary" />
                  <div className="flex-1"><p className="text-sm font-medium">Visual Learning Panel</p><p className="text-xs text-muted-foreground">Enable automatic display of images, charts, and code blocks</p></div>
                  <Switch checked={settings?.visualLearningEnabled ?? true} onCheckedChange={(v) => setSettings(s => s ? { ...s, visualLearningEnabled: v } : s)} />
                </div>
              </div>
              <Button onClick={handleSaveSettings} disabled={saving} className="mt-4">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Features
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
