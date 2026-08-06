'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, Users, DollarSign, Activity, ArrowUpRight, LayoutDashboard, BookOpenCheck, Star, Megaphone, Plus, Gift, Sparkles, Wallet, Settings, Loader as Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { cn } from '@/lib/utils';
import {
  getAdminStats,
  getRecentRegistrations,
  getCategoryDistribution,
  type AdminStats,
  type AdminRecentRegistration,
  type AdminCategoryDistribution,
} from '@/lib/services/admin-dashboard-service';

const quickActions = [
  { label: 'Create Course', href: '/admin/courses/new', icon: Plus, desc: 'Add a new course' },
  { label: 'Manage Courses', href: '/admin/courses', icon: BookOpenCheck, desc: 'Edit & publish courses' },
  { label: 'AI Settings', href: '/admin/ai-settings', icon: Sparkles, desc: 'Configure AI assistant' },
  { label: 'Website', href: '/admin/website-settings', icon: Settings, desc: 'Manage website info' },
  { label: 'Referrals', href: '/admin/referrals', icon: Gift, desc: 'Manage referral rewards' },
  { label: 'Wallet', href: '/admin/wallet', icon: Wallet, desc: 'Manage user wallets' },
  { label: 'Reviews', href: '/admin/reviews', icon: Star, desc: 'Moderate reviews' },
  { label: 'Analytics', href: '/admin/analytics', icon: LayoutDashboard, desc: 'Platform statistics' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [registrations, setRegistrations] = React.useState<AdminRecentRegistration[]>([]);
  const [categories, setCategories] = React.useState<AdminCategoryDistribution[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const [s, r, c] = await Promise.all([
        getAdminStats(),
        getRecentRegistrations(5),
        getCategoryDistribution(),
      ]);
      setStats(s);
      setRegistrations(r);
      setCategories(c);
      setLoading(false);
    })();
  }, []);

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents ?? null, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Courses', value: stats?.totalCourses ?? null, icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
    { label: 'Total Revenue', value: stats ? `$${stats.totalRevenue.toFixed(2)}` : null, icon: DollarSign, color: 'from-violet-500 to-purple-500' },
    { label: 'Active Users', value: stats?.activeUsers ?? null, icon: Activity, color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Admin Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Overview of platform performance and activity.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Export Report</Button>
            <Button asChild size="sm">
              <Link href="/admin/announcements">
                <Megaphone className="mr-1.5 h-4 w-4" />
                New Announcement
              </Link>
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                <div className="flex items-center justify-between">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground/50">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Live
                  </span>
                </div>
                <p className="mt-3 font-display text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                  ) : (
                    stat.value ?? '0'
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link href={action.href}>
                <Card className="group flex items-center gap-3 p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{action.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Secondary stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">{stats?.pendingReferrals ?? '—'}</p>
                <p className="text-xs text-muted-foreground">Pending Referrals</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">${(stats?.totalReferralRewards ?? 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Rewards Paid</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">${(stats?.totalWalletBalance ?? 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Wallet Balance</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent registrations + category distribution */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 shadow-soft lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Recent Registrations</h2>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
            {registrations.length > 0 ? (
              <div className="mt-4 space-y-2">
                {registrations.map((reg) => (
                  <div key={reg.id} className="flex items-center gap-4 rounded-xl border p-3 transition-colors hover:bg-muted/40">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {reg.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold">{reg.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{reg.email}</p>
                    </div>
                    <Badge variant={reg.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {reg.role}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  icon={<Users className="h-7 w-7" />}
                  title="No registrations yet"
                  description="New student registrations will appear here once they sign up."
                />
              </div>
            )}
          </Card>

          <Card className="p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Course Categories</h2>
            <p className="text-xs text-muted-foreground">Distribution by topic</p>
            {categories.length > 0 ? (
              <div className="mt-4 space-y-3">
                {categories.map((cat) => {
                  const maxCount = Math.max(...categories.map((c) => c.count));
                  const pct = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-muted-foreground">{cat.count}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState title="No data yet" description="Category distribution will appear once courses are added." />
              </div>
            )}
          </Card>
        </div>

        {/* Quick access cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="group cursor-pointer p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
            <Link href="/admin/referrals" className="block">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                <Gift className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold">Referral Analytics</h3>
              <p className="mt-1 text-xs text-muted-foreground">View referral stats, approve rewards, and credit wallets.</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                Manage referrals <ArrowUpRight className="h-3 w-3" />
              </div>
            </Link>
          </Card>
          <Card className="group cursor-pointer p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
            <Link href="/admin/wallet" className="block">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold">Wallet Management</h3>
              <p className="mt-1 text-xs text-muted-foreground">Credit or debit user wallets and view all transactions.</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                Manage wallets <ArrowUpRight className="h-3 w-3" />
              </div>
            </Link>
          </Card>
          <Card className="group cursor-pointer p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
            <Link href="/admin/ai-settings" className="block">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold">AI Assistant</h3>
              <p className="mt-1 text-xs text-muted-foreground">Configure the AI tutor, system prompt, and availability.</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                Configure AI <ArrowUpRight className="h-3 w-3" />
              </div>
            </Link>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
