'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Gift,
  Users,
  CircleCheck as CheckCircle2,
  DollarSign,
  Copy,
  Check,
  Share2,
  UserPlus,
  ArrowRight,
  LogIn,
  TrendingUp,
  Clock,
  Award,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  ReferralStats,
  ReferralHistoryItem,
  getReferralStats,
  getReferralHistory,
} from '@/lib/services/referral-service';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  credited: { label: 'Credited', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const howItWorks = [
  { icon: UserPlus, title: 'Share Your Code', desc: 'Send your unique referral link to friends and colleagues via social media or direct message.' },
  { icon: Users, title: 'They Sign Up', desc: 'Your friend registers using your referral code and starts learning on the platform.' },
  { icon: DollarSign, title: 'You Both Earn', desc: 'Get cash rewards credited directly to your digital wallet for every successful referral.' },
];

export default function PublicReferralsPage() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = React.useState<ReferralStats | null>(null);
  const [history, setHistory] = React.useState<ReferralHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState<'code' | 'link' | null>(null);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [s, h] = await Promise.all([getReferralStats(user.id), getReferralHistory(user.id)]);
      setStats(s);
      setHistory(h);
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
        await navigator.share({
          title: 'Join Bioinformatics Hub',
          text: 'Learn bioinformatics, data science, and AI with me!',
          url: stats.link,
        });
      } catch {}
    } else if (stats?.link) {
      copyToClipboard(stats.link, 'link');
    }
  };

  const shareSocial = (platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'email') => {
    if (!stats?.link) return;
    const text = encodeURIComponent('Join me on Bioinformatics Hub to learn bioinformatics, data science, and AI!');
    const url = encodeURIComponent(stats.link);
    const links: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      email: `mailto:?subject=Join%20Bioinformatics%20Hub&body=${text}%20${url}`,
    };
    window.open(links[platform], '_blank', 'width=600,height=400');
  };

  const socialShareButtons = [
    { icon: Facebook, platform: 'facebook' as const, label: 'Facebook', color: 'hover:bg-blue-600 hover:text-white' },
    { icon: Twitter, platform: 'twitter' as const, label: 'Twitter', color: 'hover:bg-sky-500 hover:text-white' },
    { icon: Linkedin, platform: 'linkedin' as const, label: 'LinkedIn', color: 'hover:bg-blue-700 hover:text-white' },
    { icon: MessageCircle, platform: 'whatsapp' as const, label: 'WhatsApp', color: 'hover:bg-green-500 hover:text-white' },
    { icon: Mail, platform: 'email' as const, label: 'Email', color: 'hover:bg-rose-500 hover:text-white' },
  ];

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
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-glow"
            >
              <Gift className="h-8 w-8" />
            </motion.div>
            <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">
              Refer & Earn Program
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Invite friends to join and earn cash rewards for every successful referral. Rewards are credited directly to your digital wallet.
            </p>
          </div>

          {/* How it works */}
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {howItWorks.map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="group relative flex flex-col items-center gap-3 p-6 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white transition-transform group-hover:scale-110">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <p className="font-display text-sm font-bold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white">
                    {i + 1}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {isAuthenticated && user ? (
            <>
              {loading ? (
                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="h-32 animate-pulse bg-muted/40" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Referral code & link */}
                  <Card className="mt-12 overflow-hidden p-0 shadow-card">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-6 text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                          <Gift className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="font-display text-lg font-bold">Your Referral Code</h2>
                          <p className="text-sm text-white/80">Share this code with friends to earn rewards</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Referral Code</p>
                          <p className="font-display text-xl font-bold tracking-wider">{stats?.code ?? '—'}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stats?.code && copyToClipboard(stats.code, 'code')}
                        >
                          {copied === 'code' ? (
                            <><Check className="mr-1.5 h-4 w-4 text-emerald-500" />Copied!</>
                          ) : (
                            <><Copy className="mr-1.5 h-4 w-4" />Copy Code</>
                          )}
                        </Button>
                      </div>

                      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Referral Link</p>
                          <p className="truncate text-sm font-medium">{stats?.link ?? '—'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => stats?.link && copyToClipboard(stats.link, 'link')}
                            className="shrink-0"
                          >
                            {copied === 'link' ? (
                              <><Check className="mr-1.5 h-4 w-4 text-emerald-500" />Copied!</>
                            ) : (
                              <><Copy className="mr-1.5 h-4 w-4" />Copy Link</>
                            )}
                          </Button>
                          <Button size="sm" onClick={shareLink} className="shrink-0">
                            <Share2 className="mr-1.5 h-4 w-4" />
                            Share
                          </Button>
                        </div>
                      </div>

                      {/* Social sharing */}
                      <div className="flex flex-col gap-3 border-t pt-4">
                        <p className="text-xs font-medium text-muted-foreground">Share on social media</p>
                        <div className="flex flex-wrap gap-2">
                          {socialShareButtons.map(({ icon: Icon, platform, label, color }) => (
                            <button
                              key={label}
                              onClick={() => shareSocial(platform)}
                              aria-label={`Share on ${label}`}
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-all',
                                color
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Stats */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'Total Referrals', value: stats?.totalReferrals ?? 0, icon: Users, color: 'from-blue-500 to-cyan-500' },
                      { label: 'Successful', value: stats?.successfulReferrals ?? 0, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
                      { label: 'Pending', value: stats?.pendingReferrals ?? 0, icon: Clock, color: 'from-amber-500 to-orange-500' },
                      { label: 'Total Rewards', value: `$${(stats?.totalRewards ?? 0).toFixed(2)}`, icon: DollarSign, color: 'from-violet-500 to-purple-500' },
                    ].map((stat, i) => (
                      <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                        <Card className="group p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white transition-transform group-hover:scale-110', stat.color)}>
                            <stat.icon className="h-5 w-5" />
                          </div>
                          <p className="mt-3 font-display text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Referral history */}
                  <Card className="mt-6 p-6 shadow-soft">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-semibold">Referral History</h2>
                      <Badge variant="secondary">{history.length} total</Badge>
                    </div>
                    {history.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {history.map((item, i) => {
                          const config = statusConfig[item.status] ?? statusConfig.pending;
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <UserPlus className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-semibold">{item.referredName}</p>
                                <p className="truncate text-xs text-muted-foreground">{item.referredEmail}</p>
                              </div>
                              <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                    +${item.rewardAmount.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(item.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', config.color)}>
                                  {config.label}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-500 dark:bg-violet-900/30">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          No referrals yet. Share your code to start earning rewards!
                        </p>
                      </div>
                    )}
                  </Card>
                </>
              )}

              <div className="mt-8 flex justify-center">
                <Button asChild variant="outline">
                  <Link href="/dashboard/referral">
                    Go to Referral Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            /* Guest CTA */
            <Card className="mt-12 overflow-hidden p-0">
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-8 text-center text-white">
                <Gift className="mx-auto h-12 w-12" />
                <h2 className="mt-4 font-display text-xl font-bold">Start earning rewards today</h2>
                <p className="mt-2 text-sm text-white/80">
                  Sign up or log in to generate your referral code, share your link, and track your rewards.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/login?redirect=/referrals">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild size="lg" className="border border-white/30 bg-white/10 text-white hover:bg-white/20">
                    <Link href="/register?redirect=/referrals">
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
