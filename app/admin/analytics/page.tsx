'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, BookOpen, DollarSign, Activity, Loader as Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageTransition } from '@/components/page-transition';
import { getAdminStats, getRecentRegistrations, getCategoryDistribution, type AdminStats, type AdminRecentRegistration, type AdminCategoryDistribution } from '@/lib/services/admin-dashboard-service';
import { cn } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [registrations, setRegistrations] = React.useState<AdminRecentRegistration[]>([]);
  const [categories, setCategories] = React.useState<AdminCategoryDistribution[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const [s, r, c] = await Promise.all([getAdminStats(), getRecentRegistrations(10), getCategoryDistribution()]);
      setStats(s); setRegistrations(r); setCategories(c); setLoading(false);
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
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Platform-wide statistics and insights.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" /> : stat.value ?? '0'}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Recent Registrations</h2>
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
                    <span className="text-xs text-muted-foreground">{new Date(reg.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No registrations yet.</p>
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
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No category data yet.</p>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
