'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Gift, Users, DollarSign, Clock, CircleCheck, Loader as Loader2, Circle as XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import {
  adminGetAllReferrals,
  adminUpdateReferralStatus,
  adminCreditReferralReward,
  adminGetReferralAnalytics,
  adminUpdateReferralSettings,
  getReferralSettings,
  type AdminReferralItem,
  type AdminReferralAnalytics,
} from '@/lib/services/referral-service';
import type { DbReferralSettings } from '@/lib/database-types';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  credited: { label: 'Credited', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

export default function AdminReferralsPage() {
  const { toast } = useToast();
  const [referrals, setReferrals] = React.useState<AdminReferralItem[]>([]);
  const [analytics, setAnalytics] = React.useState<AdminReferralAnalytics | null>(null);
  const [settings, setSettings] = React.useState<DbReferralSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingSettings, setSavingSettings] = React.useState(false);

  const loadData = React.useCallback(async () => {
    const [r, a, s] = await Promise.all([adminGetAllReferrals(), adminGetReferralAnalytics(), getReferralSettings()]);
    setReferrals(r); setAnalytics(a); setSettings(s); setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    const success = await adminUpdateReferralStatus(id, 'approved');
    if (success) { toast({ title: 'Referral approved' }); loadData(); }
    else toast({ title: 'Error', variant: 'destructive' });
  };

  const handleCredit = async (id: string) => {
    const success = await adminCreditReferralReward(id);
    if (success) { toast({ title: 'Reward credited to wallet' }); loadData(); }
    else toast({ title: 'Error', description: 'Failed to credit reward', variant: 'destructive' });
  };

  const handleReject = async (id: string) => {
    const success = await adminUpdateReferralStatus(id, 'rejected');
    if (success) { toast({ title: 'Referral rejected' }); loadData(); }
    else toast({ title: 'Error', variant: 'destructive' });
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const success = await adminUpdateReferralSettings(settings.reward_amount, settings.min_courses_for_reward, settings.is_active, settings.membership_fee, settings.membership_referral_reward, settings.course_referral_commission_percent, settings.membership_enabled);
    setSavingSettings(false);
    if (success) toast({ title: 'Referral settings saved' });
    else toast({ title: 'Error', variant: 'destructive' });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Referral Management</h1>
          <p className="mt-1 text-muted-foreground">Review referrals, approve rewards, and configure settings.</p>
        </div>

        {/* Analytics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Referrals', value: analytics?.totalReferrals ?? 0, icon: Users, color: 'from-blue-500 to-cyan-500' },
            { label: 'Credited', value: analytics?.totalRewardsCredited ?? 0, icon: CircleCheck, color: 'from-emerald-500 to-teal-500' },
            { label: 'Pending', value: analytics?.pendingRewards ?? 0, icon: Clock, color: 'from-amber-500 to-orange-500' },
            { label: 'Total Paid', value: `PKR ${(analytics?.totalRewardAmount ?? 0).toFixed(0)}`, icon: DollarSign, color: 'from-violet-500 to-purple-500' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 shadow-soft">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.color)}><stat.icon className="h-5 w-5" /></div>
                <p className="mt-3 font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Settings */}
        {settings && (
          <Card className="space-y-5 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Referral Settings</h2>
              <Button size="sm" onClick={handleSaveSettings} disabled={savingSettings}>
                {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Settings
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Membership Referral Reward (PKR)</Label>
                <Input type="number" step="1" value={settings.membership_referral_reward} onChange={(e) => setSettings({ ...settings, membership_referral_reward: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Course Referral Commission (%)</Label>
                <Input type="number" step="1" value={settings.course_referral_commission_percent} onChange={(e) => setSettings({ ...settings, course_referral_commission_percent: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Membership Fee (PKR)</Label>
                <Input type="number" step="1" value={settings.membership_fee} onChange={(e) => setSettings({ ...settings, membership_fee: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Default Reward Amount (PKR)</Label>
                <Input type="number" step="1" value={settings.reward_amount} onChange={(e) => setSettings({ ...settings, reward_amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Min Courses for Reward</Label>
                <Input type="number" value={settings.min_courses_for_reward} onChange={(e) => setSettings({ ...settings, min_courses_for_reward: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 rounded-xl border p-3 flex-1">
                  <Switch checked={settings.is_active} onCheckedChange={(v) => setSettings({ ...settings, is_active: v })} />
                  <span className="text-sm font-medium">Active</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border p-3 flex-1">
                  <Switch checked={settings.membership_enabled} onCheckedChange={(v) => setSettings({ ...settings, membership_enabled: v })} />
                  <span className="text-sm font-medium">Membership</span>
                </label>
              </div>
            </div>
          </Card>
        )}

        {/* Referral list */}
        <Card className="p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Referral History</h2>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : referrals.length > 0 ? (
            <div className="mt-4 space-y-3">
              {referrals.map((ref, i) => {
                const config = statusConfig[ref.status] ?? statusConfig.pending;
                return (
                  <motion.div key={ref.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Gift className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{ref.referrerName} → {ref.referredName}</p>
                      <p className="text-xs text-muted-foreground">{ref.referrerEmail} · {new Date(ref.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-emerald-600">+PKR {ref.rewardAmount.toFixed(0)}</span>
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', config.color)}>{config.label}</span>
                      {ref.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleApprove(ref.id)}><CircleCheck className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" onClick={() => handleCredit(ref.id)} className="border-emerald-200 text-emerald-600"><DollarSign className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" className="text-rose-600" onClick={() => handleReject(ref.id)}><XCircle className="h-3.5 w-3.5" /></Button>
                        </div>
                      )}
                      {ref.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => handleCredit(ref.id)} className="border-emerald-200 text-emerald-600">
                          <DollarSign className="mr-1 h-3.5 w-3.5" />Credit
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4"><EmptyState icon={<Gift className="h-7 w-7" />} title="No referrals yet" description="Referrals will appear here when users invite friends." /></div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
