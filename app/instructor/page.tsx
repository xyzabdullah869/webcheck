'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DollarSign, Clock, Wallet, TrendingUp, BookOpen, Users, ArrowRight, Gift, Loader as Loader2, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  getInstructorEarningsSummary,
  type InstructorEarningsSummary,
} from '@/lib/services/instructor-earnings-service';
import { getInstructorWithdrawals, type WithdrawalRequest } from '@/lib/services/withdrawal-service';
import { getPaymentSettings, type PaymentSettings } from '@/lib/services/payment-service';
import { cn } from '@/lib/utils';

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = React.useState<InstructorEarningsSummary | null>(null);
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalRequest[]>([]);
  const [settings, setSettings] = React.useState<PaymentSettings | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [s, w, p] = await Promise.all([
        getInstructorEarningsSummary(user.id),
        getInstructorWithdrawals(user.id),
        getPaymentSettings(),
      ]);
      setSummary(s);
      setWithdrawals(w.slice(0, 5));
      setSettings(p);
      setLoading(false);
    })();
  }, [user]);

  const maxRevenue = summary ? Math.max(...summary.monthlyRevenue.map((m) => m.amount), 1) : 1;

  const statCards = [
    { label: 'Total Earnings', value: summary ? `$${summary.totalEarnings.toFixed(2)}` : null, icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
    { label: 'Pending Earnings', value: summary ? `$${summary.pendingEarnings.toFixed(2)}` : null, icon: Clock, color: 'from-amber-500 to-orange-500' },
    { label: 'Withdrawable', value: summary ? `$${summary.availableEarnings.toFixed(2)}` : null, icon: Wallet, color: 'from-blue-500 to-cyan-500' },
    { label: 'Course Sales', value: summary?.courseSales ?? null, icon: TrendingUp, color: 'from-violet-500 to-purple-500' },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Instructor Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Track your earnings, course sales, and student engagement.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/instructor/courses">My Courses</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/instructor/withdrawals">
                <Wallet className="mr-1.5 h-4 w-4" />
                Withdraw
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" /> : stat.value ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Revenue chart + Top courses */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue chart */}
          <Card className="p-6 shadow-soft lg:col-span-2">
            <h2 className="font-display text-lg font-semibold">Monthly Revenue</h2>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
            <div className="mt-6 flex items-end justify-between gap-3" style={{ height: 200 }}>
              {summary?.monthlyRevenue.map((rev, i) => (
                <div key={rev.month} className="flex flex-1 flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(rev.amount / maxRevenue) * 160}px` }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-cyan-400"
                    style={{ minHeight: '4px' }}
                  />
                  <span className="text-xs font-medium text-muted-foreground">{rev.month}</span>
                  <span className="text-xs font-bold">${rev.amount.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Top courses */}
          <Card className="p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Top Courses</h2>
            <div className="mt-4 space-y-3">
              {summary && summary.topCourses.length > 0 ? (
                summary.topCourses.map((course) => (
                  <div key={course.courseId} className="rounded-xl border p-3">
                    <p className="truncate text-sm font-semibold">{course.title}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{course.sales} sales</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ${course.earnings.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No sales yet" description="Your top courses will appear here." />
              )}
            </div>
          </Card>
        </div>

        {/* Recent withdrawals */}
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent Withdrawals</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/instructor/withdrawals">View all</Link>
            </Button>
          </div>
          {withdrawals.length > 0 ? (
            <div className="mt-4 space-y-2">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center gap-4 rounded-xl border p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">${w.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{w.method.replace('_', ' ')}</p>
                  </div>
                  <Badge variant={
                    w.status === 'paid' ? 'default' :
                    w.status === 'approved' ? 'secondary' :
                    w.status === 'rejected' ? 'destructive' : 'outline'
                  } className="capitalize">
                    {w.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={<Wallet className="h-7 w-7" />}
                title="No withdrawals yet"
                description={`Minimum withdrawal amount is $${settings?.minWithdrawalAmount.toFixed(2) ?? '50.00'}`}
                action={{ label: 'Request Withdrawal', href: '/instructor/withdrawals' }}
              />
            </div>
          )}
        </Card>

        {/* Quick links */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="group p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
            <Link href="/instructor/courses" className="block">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold">My Courses</h3>
              <p className="text-xs text-muted-foreground">Manage your course catalog.</p>
            </Link>
          </Card>
          <Card className="group p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
            <Link href="/instructor/withdrawals" className="block">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold">Withdrawals</h3>
              <p className="text-xs text-muted-foreground">Request and track withdrawals.</p>
            </Link>
          </Card>
          <Card className="group p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
            <Link href="/instructor/students" className="block">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold">Students</h3>
              <p className="text-xs text-muted-foreground">View student statistics.</p>
            </Link>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
