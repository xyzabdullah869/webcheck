'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  RotateCcw,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ArrowRight,
  LogIn,
  Shield,
  Search,
  Download,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/page-transition';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  WalletInfo,
  WalletTransactionItem,
  getWallet,
  getWalletTransactions,
} from '@/lib/services/wallet-service';
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
  credit: 'Credit',
  debit: 'Debit',
  refund: 'Refund',
  payout: 'Payout',
  referral_bonus: 'Referral Reward',
  course_purchase: 'Course Purchase',
};

const features = [
  { icon: DollarSign, title: 'Wallet Balance', desc: 'Track your available funds at a glance' },
  { icon: Gift, title: 'Referral Rewards', desc: 'Earn cash for every friend you invite' },
  { icon: RotateCcw, title: 'Cashback', desc: 'Get cashback on eligible course purchases' },
  { icon: TrendingUp, title: 'Transaction History', desc: 'Full transparency on every transaction' },
];

export default function PublicWalletPage() {
  const { user, isAuthenticated } = useAuth();
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

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all' || filter === 'credit') {
      if (!['credit', 'refund', 'referral_bonus'].includes(t.type)) return false;
    }
    if (filter === 'debit' && !['debit', 'payout', 'course_purchase'].includes(t.type)) return false;
    if (filter === 'all') {
      // pass
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        txnTypeLabel[t.type]?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalEarned = transactions
    .filter((t) => ['credit', 'refund', 'referral_bonus'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions
    .filter((t) => ['debit', 'payout', 'course_purchase'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  const referralCount = transactions.filter((t) => t.type === 'referral_bonus').length;

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-glow"
            >
              <WalletIcon className="h-8 w-8" />
            </motion.div>
            <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">Digital Wallet</h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Manage your earnings from referrals, cashback, and rewards all in one place. Track every transaction with full transparency.
            </p>
          </div>

          {/* Features */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="group flex flex-col items-center gap-3 p-5 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white transition-transform group-hover:scale-110">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {isAuthenticated && user ? (
            <>
              {loading ? (
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="h-32 animate-pulse bg-muted/40" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Balance card */}
                  <Card className="mt-10 overflow-hidden p-0 shadow-card">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
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
                        <p className="mt-2 font-display text-xl font-bold text-violet-600 dark:text-violet-400">
                          {referralCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Referral Rewards</p>
                      </div>
                    </div>
                  </Card>

                  {/* Filter + Search */}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2">
                      {(['all', 'credit', 'debit'] as const).map((f) => (
                        <Button
                          key={f}
                          variant={filter === f ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilter(f)}
                        >
                          {f === 'all' ? 'All' : f === 'credit' ? 'Money In' : 'Money Out'}
                        </Button>
                      ))}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full pl-9 sm:w-64"
                      />
                    </div>
                  </div>

                  {/* Transactions */}
                  <Card className="mt-4 p-6 shadow-soft">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-semibold">Transaction History</h2>
                      <Badge variant="secondary">{filteredTransactions.length}</Badge>
                    </div>
                    {filteredTransactions.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {filteredTransactions.map((txn, i) => {
                          const config = txnTypeConfig[txn.type] ?? txnTypeConfig.credit;
                          const Icon = config.icon;
                          return (
                            <motion.div
                              key={txn.id}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40"
                            >
                              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', config.bg, config.color)}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-semibold">{txn.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {txnTypeLabel[txn.type] ?? txn.type} · {new Date(txn.date).toLocaleDateString()}
                                </p>
                              </div>
                              <p className={cn('font-display text-sm font-bold', config.color)}>
                                {config.sign}${txn.amount.toFixed(2)}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30">
                          <WalletIcon className="h-6 w-6" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? 'No transactions match your search.' : 'No transactions yet. Earn rewards through referrals and cashback!'}
                        </p>
                      </div>
                    )}
                  </Card>

                  <div className="mt-8 flex justify-center">
                    <Button asChild variant="outline">
                      <Link href="/dashboard/wallet">
                        Go to Wallet Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Guest CTA */
            <Card className="mt-12 overflow-hidden p-0">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-center text-white">
                <Shield className="mx-auto h-12 w-12" />
                <h2 className="mt-4 font-display text-xl font-bold">Access your wallet</h2>
                <p className="mt-2 text-sm text-white/80">
                  Sign in or create an account to view your balance, transaction history, and referral rewards.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/login?redirect=/wallet">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild size="lg" className="border border-white/30 bg-white/10 text-white hover:bg-white/20">
                    <Link href="/register?redirect=/wallet">
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
