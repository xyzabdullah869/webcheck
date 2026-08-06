'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Key, Plus, Search, Loader as Loader2, Pencil, Trash2, Power,
  Star, Zap, CircleAlert as AlertCircle, Activity, Shield, Server,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import {
  listProviders, createProvider, updateProvider, deleteProvider, setDefaultProvider,
  listKeys, createKey, updateKey, deleteKey, toggleKeyActive, testProviderConnection,
  type ApiProviderInput, type ApiKeyInput, type ProviderTestResult,
} from '@/lib/provider/provider-service';
import type { DbApiProvider, DbApiKey } from '@/lib/database-types';

const PROVIDER_NAMES = ['gemini', 'openrouter', 'openai', 'groq', 'claude'] as const;
const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  groq: 'Groq',
  claude: 'Anthropic Claude',
};

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  rate_limited: 'secondary',
  error: 'destructive',
  disabled: 'outline',
};

export default function AdminVCProvidersPage() {
  const { toast } = useToast();
  const [providers, setProviders] = React.useState<DbApiProvider[]>([]);
  const [allKeys, setAllKeys] = React.useState<Record<string, DbApiKey[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [providerDialog, setProviderDialog] = React.useState(false);
  const [editingProviderId, setEditingProviderId] = React.useState<string | null>(null);
  const [savingProvider, setSavingProvider] = React.useState(false);
  const [confirmDeleteProvider, setConfirmDeleteProvider] = React.useState<string | null>(null);
  const [keyDialog, setKeyDialog] = React.useState(false);
  const [keyProviderId, setKeyProviderId] = React.useState<string | null>(null);
  const [editingKeyId, setEditingKeyId] = React.useState<string | null>(null);
  const [savingKey, setSavingKey] = React.useState(false);
  const [confirmDeleteKey, setConfirmDeleteKey] = React.useState<string | null>(null);
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [testResult, setTestResult] = React.useState<Record<string, ProviderTestResult>>({});

  const [providerForm, setProviderForm] = React.useState<ApiProviderInput>({
    provider_name: 'gemini', display_name: '', base_url: null,
    is_default: false, priority: 0, is_active: true,
  });
  const [keyForm, setKeyForm] = React.useState<ApiKeyInput>({
    provider_id: '', key_name: '', secret_name: '', priority: 0, is_active: true, daily_limit: null,
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const providerData = await listProviders();
      setProviders(providerData);
      const keysMap: Record<string, DbApiKey[]> = {};
      for (const p of providerData) {
        keysMap[p.id] = await listKeys(p.id);
      }
      setAllKeys(keysMap);
    } catch {
      toast({ title: 'Failed to load providers', variant: 'destructive' });
    }
    setLoading(false);
  }, [toast]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const filtered = providers.filter(
    (p) => !search.trim() ||
      p.display_name.toLowerCase().includes(search.toLowerCase()) ||
      p.provider_name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateProvider = () => {
    setEditingProviderId(null);
    setProviderForm({ provider_name: 'gemini', display_name: '', base_url: null, is_default: false, priority: 0, is_active: true });
    setProviderDialog(true);
  };

  const openEditProvider = (p: DbApiProvider) => {
    setEditingProviderId(p.id);
    setProviderForm({
      provider_name: p.provider_name, display_name: p.display_name, base_url: p.base_url,
      is_default: p.is_default, priority: p.priority, is_active: p.is_active,
    });
    setProviderDialog(true);
  };

  const handleSaveProvider = async () => {
    if (!providerForm.display_name.trim()) {
      toast({ title: 'Display name is required', variant: 'destructive' });
      return;
    }
    setSavingProvider(true);
    try {
      if (editingProviderId) {
        await updateProvider(editingProviderId, providerForm);
        toast({ title: 'Provider updated' });
      } else {
        await createProvider(providerForm);
        toast({ title: 'Provider created' });
      }
      setProviderDialog(false);
      await loadData();
    } catch {
      toast({ title: 'Failed to save provider', variant: 'destructive' });
    }
    setSavingProvider(false);
  };

  const handleDeleteProvider = async (id: string) => {
    const ok = await deleteProvider(id);
    toast({ title: ok ? 'Provider deleted' : 'Failed to delete', variant: ok ? 'default' : 'destructive' });
    setConfirmDeleteProvider(null);
    if (ok) await loadData();
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultProvider(id);
    toast({ title: 'Default provider set' });
    await loadData();
  };

  const openCreateKey = (providerId: string) => {
    setKeyProviderId(providerId);
    setEditingKeyId(null);
    setKeyForm({ provider_id: providerId, key_name: '', secret_name: '', priority: 0, is_active: true, daily_limit: null });
    setKeyDialog(true);
  };

  const openEditKey = (key: DbApiKey, providerId: string) => {
    setKeyProviderId(providerId);
    setEditingKeyId(key.id);
    setKeyForm({
      provider_id: providerId, key_name: key.key_name, secret_name: key.secret_name,
      priority: key.priority, is_active: key.is_active, daily_limit: key.daily_limit,
    });
    setKeyDialog(true);
  };

  const handleSaveKey = async () => {
    if (!keyForm.key_name.trim() || !keyForm.secret_name.trim()) {
      toast({ title: 'Key name and secret name are required', variant: 'destructive' });
      return;
    }
    setSavingKey(true);
    try {
      if (editingKeyId) {
        await updateKey(editingKeyId, keyForm);
        toast({ title: 'API key updated' });
      } else {
        await createKey(keyForm);
        toast({ title: 'API key created' });
      }
      setKeyDialog(false);
      await loadData();
    } catch {
      toast({ title: 'Failed to save API key', variant: 'destructive' });
    }
    setSavingKey(false);
  };

  const handleDeleteKey = async (id: string) => {
    const ok = await deleteKey(id);
    toast({ title: ok ? 'API key deleted' : 'Failed to delete', variant: ok ? 'default' : 'destructive' });
    setConfirmDeleteKey(null);
    if (ok) await loadData();
  };

  const handleToggleKey = async (id: string, isActive: boolean) => {
    await toggleKeyActive(id, isActive);
    await loadData();
  };

  const handleTest = async (providerId: string) => {
    setTestingId(providerId);
    const result = await testProviderConnection(providerId);
    setTestResult((prev) => ({ ...prev, [providerId]: result }));
    toast({ title: result.success ? 'Connection successful' : 'Connection failed', description: result.message, variant: result.success ? 'default' : 'destructive' });
    setTestingId(null);
  };

  const totalKeys = Object.values(allKeys).reduce((sum, keys) => sum + keys.length, 0);
  const activeKeys = Object.values(allKeys).reduce((sum, keys) => sum + keys.filter((k) => k.is_active).length, 0);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">API Provider Management</h1>
            <p className="mt-1 text-muted-foreground">Configure AI providers and manage API keys with priority-based failover.</p>
          </div>
          <Button onClick={openCreateProvider} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Provider
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><Server className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{providers.length}</p>
            <p className="text-xs text-muted-foreground">Providers</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><Key className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{totalKeys}</p>
            <p className="text-xs text-muted-foreground">Total Keys</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white"><Activity className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{activeKeys}</p>
            <p className="text-xs text-muted-foreground">Active Keys</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white"><Star className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold truncate">{providers.find((p) => p.is_default)?.display_name ?? 'None'}</p>
            <p className="text-xs text-muted-foreground">Default Provider</p>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search providers..." className="pl-9" />
        </div>

        {loading ? (
          <Card className="flex justify-center p-12 shadow-soft"><Loader2 className="h-8 w-8 animate-spin text-primary" /></Card>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((provider, i) => {
              const keys = allKeys[provider.id] ?? [];
              const result = testResult[provider.id];
              return (
                <motion.div key={provider.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="p-6 shadow-soft">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                          <Server className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{provider.display_name}</p>
                            {provider.is_default && <Badge className="text-[10px] gap-1"><Star className="h-2.5 w-2.5" />Default</Badge>}
                            {!provider.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{provider.provider_name} · Priority {provider.priority}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleTest(provider.id)} disabled={testingId === provider.id}>
                          {testingId === provider.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1 h-3.5 w-3.5" />}
                          Test
                        </Button>
                        {!provider.is_default && provider.is_active && (
                          <Button size="sm" variant="ghost" onClick={() => handleSetDefault(provider.id)}>Set Default</Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => openEditProvider(provider)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDeleteProvider(provider.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>

                    {result && (
                      <div className={`mt-3 flex items-center gap-2 rounded-lg border p-2 text-xs ${result.success ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-destructive/20 bg-destructive/5 text-destructive'}`}>
                        {result.success ? <Shield className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        {result.message} · {result.latencyMs}ms
                      </div>
                    )}

                    {provider.base_url && (
                      <p className="mt-2 text-xs text-muted-foreground">{provider.base_url}</p>
                    )}

                    <div className="mt-4 border-t pt-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">API Keys ({keys.length})</p>
                        <Button size="sm" variant="outline" onClick={() => openCreateKey(provider.id)}>
                          <Plus className="mr-1 h-3 w-3" /> Add Key
                        </Button>
                      </div>
                      {keys.length > 0 ? (
                        <div className="space-y-2">
                          {keys.map((key) => (
                            <div key={key.id} className="flex items-center justify-between rounded-lg border p-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-xs font-medium">{key.key_name}</p>
                                  <Badge variant={STATUS_COLORS[key.status] ?? 'outline'} className="text-[9px] capitalize">{key.status}</Badge>
                                </div>
                                <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10px] text-muted-foreground">
                                  <span>Secret: {key.secret_name}</span>
                                  <span>Priority: {key.priority}</span>
                                  {key.daily_limit && <span>Limit: {key.daily_limit}/day</span>}
                                  <span>Usage: {key.usage_count}</span>
                                  {key.last_used_at && <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>}
                                </div>
                                {key.last_error && <p className="mt-0.5 truncate text-[10px] text-destructive">{key.last_error}</p>}
                              </div>
                              <div className="flex items-center gap-1">
                                <Switch checked={key.is_active} onCheckedChange={(v) => handleToggleKey(key.id, v)} />
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditKey(key, provider.id)}><Pencil className="h-3 w-3" /></Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setConfirmDeleteKey(key.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="py-4 text-center text-xs text-muted-foreground">No API keys configured. Add one to enable this provider.</p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 shadow-soft">
            <EmptyState icon={<Server className="h-7 w-7" />} title="No providers found" description="Add your first API provider to get started." />
          </Card>
        )}
      </div>

      <Dialog open={providerDialog} onOpenChange={setProviderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProviderId ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provider Type</Label>
              <Select value={providerForm.provider_name} onValueChange={(v) => {
                const name = v as ApiProviderInput['provider_name'];
                setProviderForm({ ...providerForm, provider_name: name, display_name: PROVIDER_LABELS[name] ?? name });
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDER_NAMES.map((p) => <SelectItem key={p} value={p}>{PROVIDER_LABELS[p]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={providerForm.display_name} onChange={(e) => setProviderForm({ ...providerForm, display_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Base URL (optional)</Label>
              <Input value={providerForm.base_url ?? ''} onChange={(e) => setProviderForm({ ...providerForm, base_url: e.target.value || null })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Priority (lower = higher priority)</Label>
              <Input type="number" value={providerForm.priority ?? 0} onChange={(e) => setProviderForm({ ...providerForm, priority: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch checked={providerForm.is_active ?? true} onCheckedChange={(v) => setProviderForm({ ...providerForm, is_active: v })} />
              <p className="text-sm font-medium">Active</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch checked={providerForm.is_default ?? false} onCheckedChange={(v) => setProviderForm({ ...providerForm, is_default: v })} />
              <div>
                <p className="text-sm font-medium">Set as Default</p>
                <p className="text-xs text-muted-foreground">Default provider is used first</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveProvider} disabled={savingProvider}>
              {savingProvider ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingProviderId ? 'Save' : 'Add Provider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={keyDialog} onOpenChange={setKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingKeyId ? 'Edit API Key' : 'Add API Key'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Key Name</Label>
              <Input value={keyForm.key_name ?? ''} onChange={(e) => setKeyForm({ ...keyForm, key_name: e.target.value })} placeholder="e.g. Gemini Key #1" />
            </div>
            <div className="space-y-2">
              <Label>Secret Name</Label>
              <Input value={keyForm.secret_name ?? ''} onChange={(e) => setKeyForm({ ...keyForm, secret_name: e.target.value })} placeholder="e.g. GEMINI_API_KEY_1" />
              <p className="text-xs text-muted-foreground">
                This is the name of the edge function secret. The actual key value is stored securely as a Supabase secret, never in the database.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input type="number" value={keyForm.priority ?? 0} onChange={(e) => setKeyForm({ ...keyForm, priority: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Daily Limit (optional)</Label>
                <Input type="number" value={keyForm.daily_limit ?? ''} onChange={(e) => setKeyForm({ ...keyForm, daily_limit: e.target.value ? parseInt(e.target.value) : null })} />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch checked={keyForm.is_active ?? true} onCheckedChange={(v) => setKeyForm({ ...keyForm, is_active: v })} />
              <p className="text-sm font-medium">Active</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveKey} disabled={savingKey}>
              {savingKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingKeyId ? 'Save' : 'Add Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteProvider !== null} onOpenChange={(v) => !v && setConfirmDeleteProvider(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Delete Provider?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will remove the provider and all its API keys. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteProvider(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDeleteProvider && handleDeleteProvider(confirmDeleteProvider)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteKey !== null} onOpenChange={(v) => !v && setConfirmDeleteKey(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Delete API Key?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove the API key. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteKey(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDeleteKey && handleDeleteKey(confirmDeleteKey)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
