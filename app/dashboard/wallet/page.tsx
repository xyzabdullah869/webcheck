'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Gift, RotateCcw, ShoppingBag, TrendingUp, Loader as Loader2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/page-transition';
import { useAuth } from '@/lib/contexts/auth-context';
import { getWallet, getWalletTransactions, type WalletInfo, type WalletTransactionItem } from '@/lib/services/wallet-service';
import { cn } from '@/lib/utils';

const txnTypeConfig: Record<string, { icon: typeof ArrowDownLeft; color: string; bg: string; sign: string }> = {
  credit: { icon: ArrowDownLeft, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', sign: '+' },
  debit: { icon: ArrowUpRight, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30', sign: '-' },
  refund: { icon: RotateCcw, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', sign: '+' },
  payout: { icon: ArrowUpRight, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', sign: '-' },
  referral_bonus: { icon: Gift, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30', sign: '+' },
  course_purchase: { icon: ShoppingBag, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30', sign: '-' },
};

const txnTypeLabel: Record<string, string> = {
  credit: 'Credit', debit: 'Debit', refund: 'Refund', payout: 'Payout', referral_bonus: 'Referral Reward', course_purchase: 'Course Purchase',
};

export default function DashboardWalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = React.useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = React.useState<WalletTransactionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'credit' | 'debit'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [w, t] = await Promise.all([getWallet(user.id), getWalletTransactions(user.id)]);
      setWallet(w);
      setTransactions(t);
      setLoading(false);
    })();
  }, [user]);

  const filtered = transactions.filter((t) => {
    if (filter === 'credit' && !['credit', 'refund', 'referral_bonus'].includes(t.type)) return false;
    if (filter === 'debit' && !['debit', 'payout', 'course_purchase'].includes(t.type)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.description.toLowerCase().includes(q) || (txnTypeLabel[t.type] ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalEarned = transactions.filter((t) => ['credit', 'refund', 'referral_bonus'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions.filter((t) => ['debit', 'payout', 'course_purchase'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
  const referralCount = transactions.filter((t) => t.type === 'referral_bonus').length;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Wallet</h1>
          <p className="mt-1 text-muted-foreground">Manage your balance, referral earnings, and transactions.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Balance card */}
            <Card className="overflow-hidden p-0 shadow-card">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                    <WalletIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Current Balance</p>
                    <p className="font-display text-3xl font-bold">
                      ${(wallet?.balance ?? 0).toFixed(2)}
                      <span className="ml-1 text-sm font-normal text-white/70">{wallet?.currency ?? 'USD'}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-0 sm:grid-cols-3">
                <div className="border-b p-5 text-center sm:border-b-0 sm:border-r">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <p className="mt-2 font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">+${totalEarned.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                </div>
                <div className="border-b p-5 text-center sm:border-b-0 sm:border-r">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <p className="mt-2 font-display text-xl font-bold text-rose-600 dark:text-rose-400">-${totalSpent.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
                <div className="p-5 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                    <Gift className="h-5 w-5" />
                  </div>
                  <p className="mt-2 font-display text-xl font-bold text-violet-600 dark:text-violet-400">{referralCount}</p>
                  <p className="text-xs text-muted-foreground">Referral Rewards</p>
                </div>
              </div>
            </Card>

            {/* Filter + Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                {(['all', 'credit', 'debit'] as const).map((f) => (
                  <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                    {f === 'all' ? 'All' : f === 'credit' ? 'Money In' : 'Money Out'}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search transactions..." className="w-full pl-9 sm:w-64" />
              </div>
            </div>

            {/* Transactions */}
            <Card className="p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Transaction History</h2>
                <Badge variant="secondary">{filtered.length}</Badge>
              </div>
              {filtered.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {filtered.map((txn, i) => {
                    const config = txnTypeConfig[txn.type] ?? txnTypeConfig.credit;
                    const Icon = config.icon;
                    return (
                      <motion.div key={txn.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', config.bg, config.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">{txnTypeLabel[txn.type] ?? txn.type} · {new Date(txn.date).toLocaleDateString()}</p>
                        </div>
                        <p className={cn('font-display text-sm font-bold', config.color)}>{config.sign}${txn.amount.toFixed(2)}</p>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30">
                    <WalletIcon className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-muted-foreground">{searchQuery ? 'No transactions match your search.' : 'No transactions yet. Earn rewards through referrals!'}</p>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </PageTransition>
  );
}
