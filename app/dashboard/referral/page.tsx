'use client';

import * as React from 'react';
import Link from 'next/link';
import { Gift, Users, CircleCheck as CheckCircle2, DollarSign, Copy, Check, Share2, UserPlus, ArrowRight, Clock, TrendingUp, Loader as Loader2, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { getReferralStats, getReferralHistory, getReferralSettings, type ReferralStats, type ReferralHistoryItem } from '@/lib/services/referral-service';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  credited: { label: 'Credited', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

export default function DashboardReferralPage() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<ReferralStats | null>(null);
  const [history, setHistory] = React.useState<ReferralHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState<'code' | 'link' | null>(null);
  const [settings, setSettings] = React.useState<{ membership_fee: number; membership_referral_reward: number; course_referral_commission_percent: number; membership_enabled: boolean } | null>(null);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [s, h, rs] = await Promise.all([getReferralStats(user.id), getReferralHistory(user.id), getReferralSettings()]);
      setStats(s);
      setHistory(h);
      setSettings(rs as typeof settings);
      setLoading(false);
    })();
  }, [user]);

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareLink = async () => {
    if (stats?.link && navigator.share) {
      try {
        await navigator.share({ title: 'Join Bioinformatics Hub', text: 'Learn bioinformatics with me!', url: stats.link });
      } catch {}
    } else if (stats?.link) {
      copyToClipboard(stats.link, 'link');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Referral Program</h1>
          <p className="mt-1 text-muted-foreground">Invite friends and earn cash rewards for every successful referral.</p>
        </div>

        {/* Earning methods info */}
        <Card className="p-5 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Membership Referral</p>
                <p className="text-xs text-muted-foreground">Earn PKR {settings?.membership_referral_reward ?? 100} when your referral buys membership (PKR {settings?.membership_fee ?? 300}).</p>
                {settings?.membership_enabled && (
                  <Button asChild size="sm" variant="outline" className="mt-2"><Link href="/dashboard/referral/membership">Buy Membership</Link></Button>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Course Referral</p>
                <p className="text-xs text-muted-foreground">Earn {settings?.course_referral_commission_percent ?? 10}% commission when your referral purchases a course using your code.</p>
              </div>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Referral code card */}
            <Card className="overflow-hidden p-0 shadow-card">
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                    <Gift className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold">Your Referral Code</h2>
                    <p className="text-sm text-white/80">Share with friends to earn rewards</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Referral Code</p>
                    <p className="font-display text-xl font-bold tracking-wider">{stats?.code ?? '—'}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => stats?.code && copyToClipboard(stats.code, 'code')}>
                    {copied === 'code' ? <><Check className="mr-1.5 h-4 w-4 text-emerald-500" />Copied!</> : <><Copy className="mr-1.5 h-4 w-4" />Copy Code</>}
                  </Button>
                </div>
                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Referral Link</p>
                    <p className="truncate text-sm font-medium">{stats?.link ?? '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => stats?.link && copyToClipboard(stats.link, 'link')} className="shrink-0">
                      {copied === 'link' ? <><Check className="mr-1.5 h-4 w-4 text-emerald-500" />Copied!</> : <><Copy className="mr-1.5 h-4 w-4" />Copy Link</>}
                    </Button>
                    <Button size="sm" onClick={shareLink} className="shrink-0">
                      <Share2 className="mr-1.5 h-4 w-4" />Share
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Referrals', value: stats?.totalReferrals ?? 0, icon: Users, color: 'from-blue-500 to-cyan-500' },
                { label: 'Successful', value: stats?.successfulReferrals ?? 0, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
                { label: 'Pending', value: stats?.pendingReferrals ?? 0, icon: Clock, color: 'from-amber-500 to-orange-500' },
                { label: 'Total Rewards', value: `PKR ${(stats?.totalRewards ?? 0).toFixed(0)}`, icon: DollarSign, color: 'from-violet-500 to-purple-500' },
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

            {/* History */}
            <Card className="p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Referral History</h2>
                <Badge variant="secondary">{history.length} total</Badge>
              </div>
              {history.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {history.map((item, i) => {
                    const config = statusConfig[item.status] ?? statusConfig.pending;
                    return (
                      <motion.div key={item.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserPlus className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold">{item.referredName}</p>
                          <p className="truncate text-xs text-muted-foreground">{item.referredEmail}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">+PKR {item.rewardAmount.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                          </div>
                          <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', config.color)}>{config.label}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6">
                  <EmptyState icon={<Gift className="h-7 w-7" />} title="No referrals yet" description="Share your code to start earning rewards!" />
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </PageTransition>
  );
}
