'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Settings, Percent, DollarSign, Globe, Save, Loader as Loader2, Smartphone, Wallet, Building2, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';
import {
  getPaymentSettings,
  updatePaymentSettings,
  getAllGateways,
  updateGateway,
  type PaymentSettings,
  type PaymentGateway,
} from '@/lib/services/payment-service';
import { cn } from '@/lib/utils';

const gatewayIcons: Record<string, typeof CreditCard> = {
  stripe: CreditCard,
  paypal: Wallet,
  easypaisa: Smartphone,
  jazzcash: Smartphone,
  bank_transfer: Building2,
};

type Tab = 'gateways' | 'commission' | 'currency';

export default function AdminPaymentSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<PaymentSettings | null>(null);
  const [gateways, setGateways] = React.useState<PaymentGateway[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<Tab>('gateways');

  React.useEffect(() => {
    (async () => {
      const [s, g] = await Promise.all([getPaymentSettings(), getAllGateways()]);
      setSettings(s);
      setGateways(g);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const result = await updatePaymentSettings(settings);
    setSaving(false);
    if (result.success) {
      toast({ title: 'Payment settings saved' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const toggleGateway = async (gw: PaymentGateway) => {
    const result = await updateGateway(gw.id, { isEnabled: !gw.isEnabled });
    if (result.success) {
      setGateways((prev) => prev.map((g) => g.id === gw.id ? { ...g, isEnabled: !g.isEnabled } : g));
      toast({ title: `${gw.name} ${gw.isEnabled ? 'disabled' : 'enabled'}` });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const toggleTestMode = async (gw: PaymentGateway) => {
    const result = await updateGateway(gw.id, { isTestMode: !gw.isTestMode });
    if (result.success) {
      setGateways((prev) => prev.map((g) => g.id === gw.id ? { ...g, isTestMode: !g.isTestMode } : g));
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

  const tabs: { id: Tab; label: string; icon: typeof CreditCard }[] = [
    { id: 'gateways', label: 'Gateways', icon: CreditCard },
    { id: 'commission', label: 'Commission', icon: Percent },
    { id: 'currency', label: 'Currency & Tax', icon: Globe },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Payment Settings</h1>
            <p className="mt-1 text-muted-foreground">Configure payment gateways, commission rates, and currency.</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-soft' : 'border bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === 'gateways' && (
            <div className="space-y-3">
              {gateways.map((gw) => {
                const Icon = gatewayIcons[gw.code] ?? CreditCard;
                return (
                  <Card key={gw.id} className="flex items-center gap-4 p-5 shadow-soft">
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl',
                      gw.isEnabled ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-sm font-bold">{gw.name}</p>
                        {gw.isEnabled && <Badge variant="default">Active</Badge>}
                        {gw.isTestMode && gw.isEnabled && <Badge variant="outline">Test Mode</Badge>}
                      </div>
                      {gw.description && <p className="text-xs text-muted-foreground">{gw.description}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      {gw.isEnabled && (
                        <label className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Test</span>
                          <Switch checked={gw.isTestMode} onCheckedChange={() => toggleTestMode(gw)} />
                        </label>
                      )}
                      <label className="flex items-center gap-2">
                        <span className="text-sm font-medium">Enabled</span>
                        <Switch checked={gw.isEnabled} onCheckedChange={() => toggleGateway(gw)} />
                      </label>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === 'commission' && settings && (
            <Card className="space-y-5 p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Commission Configuration</h2>
              <p className="text-sm text-muted-foreground">Set how revenue is split between the platform and instructors.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Platform Commission (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.platformCommissionPercent}
                      onChange={(e) => setSettings({ ...settings, platformCommissionPercent: parseFloat(e.target.value) || 0 })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instructor Commission (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.instructorCommissionPercent}
                      onChange={(e) => setSettings({ ...settings, instructorCommissionPercent: parseFloat(e.target.value) || 0 })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Fixed Commission Per Sale (optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.fixedCommissionPerSale}
                      onChange={(e) => setSettings({ ...settings, fixedCommissionPerSale: parseFloat(e.target.value) || 0 })}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Added on top of the percentage commission for each sale.</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Minimum Withdrawal Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.minWithdrawalAmount}
                      onChange={(e) => setSettings({ ...settings, minWithdrawalAmount: parseFloat(e.target.value) || 0 })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'currency' && settings && (
            <Card className="space-y-5 p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Currency & Tax</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Currency Code</Label>
                  <Input
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase().slice(0, 3) })}
                    placeholder="USD"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency Symbol</Label>
                  <Input
                    value={settings.currencySymbol}
                    onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value.slice(0, 3) })}
                    placeholder="$"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="text-sm font-semibold">Enable Tax</p>
                      <p className="text-xs text-muted-foreground">Add tax to checkout totals</p>
                    </div>
                    <Switch
                      checked={settings.taxEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, taxEnabled: checked })}
                    />
                  </label>
                </div>
                {settings.taxEnabled && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Tax Rate (%)</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.taxRate}
                        onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
