'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Trash2, Pencil as Edit3, Loader as Loader2, X, Star, Upload, Smartphone, Wallet, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { cn } from '@/lib/utils';

type Gateway = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  is_test_mode: boolean;
  config: Record<string, unknown>;
  display_order: number;
  is_default: boolean;
};

const gatewayIcons: Record<string, typeof CreditCard> = {
  stripe: CreditCard,
  paypal: Wallet,
  easypaisa: Smartphone,
  jazzcash: Smartphone,
  bank_transfer: Building2,
};

const configFields = [
  { key: 'account_holder', label: 'Account Holder Name', placeholder: 'John Doe' },
  { key: 'account_number', label: 'Account Number', placeholder: '01234567890' },
  { key: 'iban', label: 'IBAN', placeholder: 'PK36SCBL0000000123456789' },
  { key: 'bank_name', label: 'Bank Name', placeholder: 'Standard Chartered' },
  { key: 'branch', label: 'Branch', placeholder: 'Main Branch, Karachi' },
  { key: 'qr_code_url', label: 'QR Code URL', placeholder: 'https://...qr-code.png' },
  { key: 'logo_url', label: 'Logo URL', placeholder: 'https://...logo.png' },
];

export default function AdminPaymentGatewaysPage() {
  const { toast } = useToast();
  const [gateways, setGateways] = React.useState<Gateway[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Gateway | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    code: '',
    name: '',
    description: '',
    is_enabled: true,
    is_test_mode: false,
    is_default: false,
    config: {} as Record<string, string>,
  });
  const [deleteTarget, setDeleteTarget] = React.useState<Gateway | null>(null);

  const loadGateways = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('payment_gateways')
      .select('*')
      .order('display_order', { ascending: true });
    setGateways((data ?? []) as Gateway[]);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadGateways();
  }, [loadGateways]);

  const resetForm = () => {
    setForm({ code: '', name: '', description: '', is_enabled: true, is_test_mode: false, is_default: false, config: {} });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (gw: Gateway) => {
    setForm({
      code: gw.code,
      name: gw.name,
      description: gw.description ?? '',
      is_enabled: gw.is_enabled,
      is_test_mode: gw.is_test_mode,
      is_default: String((gw.config as Record<string, unknown>)?.is_default) === 'true',
      config: (gw.config as Record<string, string>) ?? {},
    });
    setEditing(gw);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast({ title: 'Name and code are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const config = { ...form.config, is_default: form.is_default };

    if (editing) {
      const { error } = await supabase
        .from('payment_gateways')
        .update({
          name: form.name,
          description: form.description || null,
          is_enabled: form.is_enabled,
          is_test_mode: form.is_test_mode,
          config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editing.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Payment method updated' });
    } else {
      const { error } = await supabase.from('payment_gateways').insert({
        code: form.code.toLowerCase().replace(/\s+/g, '_'),
        name: form.name,
        description: form.description || null,
        is_enabled: form.is_enabled,
        is_test_mode: form.is_test_mode,
        config,
        display_order: gateways.length,
      });
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Payment method created' });
    }
    setSaving(false);
    setShowForm(false);
    resetForm();
    loadGateways();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('payment_gateways').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Payment method deleted' }); loadGateways(); }
  };

  const toggleEnabled = async (gw: Gateway) => {
    const supabase = createClient();
    await supabase.from('payment_gateways').update({ is_enabled: !gw.is_enabled }).eq('id', gw.id);
    setGateways((prev) => prev.map((g) => g.id === gw.id ? { ...g, is_enabled: !g.is_enabled } : g));
  };

  const setDefault = async (gw: Gateway) => {
    const supabase = createClient();
    const newConfig = { ...(gw.config as Record<string, unknown>), is_default: true };
    await supabase.from('payment_gateways').update({ config: newConfig }).eq('id', gw.id);
    const updated = gateways.map((g) => {
      if (g.id === gw.id) return { ...g, config: newConfig };
      const c = { ...(g.config as Record<string, unknown>), is_default: false };
      return { ...g, config: c };
    });
    setGateways(updated);
    toast({ title: `${gw.name} set as default` });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Payment Methods</h1>
            <p className="mt-1 text-muted-foreground">Create and manage unlimited payment methods for checkout.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Payment Method
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : gateways.length > 0 ? (
          <div className="space-y-3">
            {gateways.map((gw, i) => {
              const Icon = gatewayIcons[gw.code] ?? CreditCard;
              const config = gw.config as Record<string, string>;
              const isDefault = config?.is_default === 'true';
              return (
                <motion.div key={gw.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={cn('p-5 shadow-soft transition-all', !gw.is_enabled && 'opacity-60')}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', gw.is_enabled ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-muted text-muted-foreground')}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-display text-sm font-bold">{gw.name}</p>
                          {isDefault && <Badge className="gap-1"><Star className="h-3 w-3 fill-current" />Default</Badge>}
                          {gw.is_enabled ? <Badge variant="default">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                        </div>
                        {gw.description && <p className="text-xs text-muted-foreground">{gw.description}</p>}
                        {config?.account_number && <p className="text-xs text-muted-foreground">Account: {String(config.account_number)}</p>}
                        {config?.bank_name && <p className="text-xs text-muted-foreground">Bank: {String(config.bank_name)}</p>}
                        {!isDefault && gw.is_enabled && (
                          <Button size="sm" variant="ghost" onClick={() => setDefault(gw)} title="Set as default">
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openEdit(gw)}><Edit3 className="h-4 w-4" /></Button>
                        <label className="flex items-center gap-2">
                          <Switch checked={gw.is_enabled} onCheckedChange={() => toggleEnabled(gw)} />
                        </label>
                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(gw)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 shadow-soft">
            <EmptyState icon={<CreditCard className="h-7 w-7" />} title="No payment methods yet" description="Add payment methods like JazzCash, EasyPaisa, bank transfers, or any custom method." action={{ label: 'Add Payment Method', onClick: openCreate }} />
          </Card>
        )}

        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
                <Card className="max-h-[90vh] overflow-y-auto p-6 shadow-float">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">{editing ? 'Edit Payment Method' : 'New Payment Method'}</h3>
                    <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                  </div>
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Method Name *</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="JazzCash" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Code (unique key) *</Label>
                        <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="jazzcash" className="font-mono text-sm" required disabled={!!editing} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description / Instructions</Label>
                      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Transfer to the account below and upload your receipt." />
                    </div>

                    <div className="rounded-xl border p-4">
                      <p className="mb-3 text-sm font-semibold">Account Details</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {configFields.map((field) => (
                          <div key={field.key} className="space-y-2">
                            <Label>{field.label}</Label>
                            <Input
                              value={form.config[field.key] ?? ''}
                              onChange={(e) => setForm({ ...form, config: { ...form.config, [field.key]: e.target.value } })}
                              placeholder={field.placeholder}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <Switch checked={form.is_enabled} onCheckedChange={(v) => setForm({ ...form, is_enabled: v })} />
                        <span>Enabled</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Switch checked={form.is_default} onCheckedChange={(v) => setForm({ ...form, is_default: v })} />
                        <span>Set as Default</span>
                      </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {editing ? 'Update' : 'Create'} Payment Method
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Payment Method"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); }}
      />
    </PageTransition>
  );
}
