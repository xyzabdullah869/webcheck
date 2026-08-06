'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Save, Loader as Loader2, DollarSign, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';
import { getWebsiteSettings, updateWebsiteSettings, type WebsiteSettings } from '@/lib/services/site-settings-service';

export default function AdminPricingPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const s = await getWebsiteSettings();
      if (s) setSettings(s);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const result = await updateWebsiteSettings({ usdToPkrExchangeRate: settings.usdToPkrExchangeRate });
    setSaving(false);
    if (result.success) toast({ title: 'Pricing settings saved', description: 'Exchange rate updated successfully.' });
    else toast({ title: 'Error', description: result.error ?? 'Failed to save', variant: 'destructive' });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PageTransition>
    );
  }

  const s = settings!;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Pricing Settings</h1>
            <p className="mt-1 text-muted-foreground">Configure exchange rates and pricing display options.</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="space-y-5 p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold">Exchange Rate</h2>
              </div>
              <div className="space-y-2">
                <Label>USD to PKR Exchange Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={s.usdToPkrExchangeRate}
                  onChange={(e) => setSettings({ ...s, usdToPkrExchangeRate: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  This rate is used to automatically convert USD course prices to PKR for display.
                </p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Preview: $29 ≈ PKR {(29 * s.usdToPkrExchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="space-y-5 p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold">Price Display</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Every course price is displayed in both USD and PKR across the site. The PKR price is calculated automatically from the exchange rate above, but each course can also have a manually set PKR price that overrides the calculation.
              </p>
              <p className="text-sm text-muted-foreground">
                To set individual course prices, edit each course from the Courses management page.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
