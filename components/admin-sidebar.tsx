'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, FolderTree, Users, GraduationCap, ChartBar as BarChart3,
  Star, Megaphone, Settings, Menu, X, Dna, Sparkles, Gift, Wallet, ShoppingBag,
  CreditCard, Tag, ClipboardList, FileText, Quote, CircleHelp as HelpCircle,
  Image as ImageIcon, LayoutGrid as Layout, DollarSign, UserCog, Receipt, Crown,
  Brain, Key, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

type SidebarItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const adminNav: SidebarItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Courses', href: '/admin/courses', icon: BookOpen },
  { name: 'Quizzes', href: '/admin/quizzes', icon: ClipboardList },
  { name: 'Assignments', href: '/admin/assignments', icon: FileText },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Students', href: '/admin/students', icon: Users },
  { name: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
  { name: 'User Roles', href: '/admin/users', icon: UserCog },
  { name: 'Instructor Apps', href: '/admin/instructor-applications', icon: GraduationCap },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  { name: 'Testimonials', href: '/admin/testimonials', icon: Quote },
  { name: 'FAQs', href: '/admin/faqs', icon: HelpCircle },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { name: 'Notifications', href: '/admin/notifications', icon: Megaphone },
  { name: 'Banners', href: '/admin/banners', icon: ImageIcon },
  { name: 'Hero Section', href: '/admin/hero', icon: Layout },
  { name: 'Pricing', href: '/admin/pricing', icon: DollarSign },
  { name: 'AI Settings', href: '/admin/ai-settings', icon: Sparkles },
  { name: 'AI Teacher', href: '/admin/ai-teacher', icon: Brain },
  { name: 'VC Teachers', href: '/admin/vc-teachers', icon: Users },
  { name: 'VC Providers', href: '/admin/vc-providers', icon: Key },
  { name: 'VC Batches', href: '/admin/vc-batches', icon: Layers },
  { name: 'Website', href: '/admin/website-settings', icon: Settings },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Payment', href: '/admin/payment-settings', icon: CreditCard },
  { name: 'Gateways', href: '/admin/payment-gateways', icon: CreditCard },
  { name: 'Payment Proofs', href: '/admin/payment-submissions', icon: Receipt },
  { name: 'Memberships', href: '/admin/memberships', icon: Crown },
  { name: 'Coupons', href: '/admin/coupons', icon: Tag },
  { name: 'Withdrawals', href: '/admin/withdrawals', icon: Wallet },
  { name: 'Referrals', href: '/admin/referrals', icon: Gift },
  { name: 'Wallet', href: '/admin/wallet', icon: Wallet },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-20 z-40 lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-72 border-r bg-card p-5 transition-transform duration-300 ease-in-out',
          'lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-72 lg:shrink-0 lg:translate-x-0 lg:bg-transparent lg:flex lg:flex-col',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-blue-600 text-white">
              <Dna className="h-5 w-5" />
            </div>
            <span className="font-display font-bold">Admin</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Desktop header */}
        <div className="hidden items-center gap-3 lg:flex lg:mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-blue-600 text-white">
            <Dna className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold">Admin Panel</p>
            <p className="text-xs text-muted-foreground">Bioinformatics Hub</p>
          </div>
        </div>

        {/* Navigation with smooth scroll */}
        <nav
          className="mt-6 flex flex-col gap-1 overflow-y-auto lg:mt-0 lg:flex-1 lg:pr-1"
          style={{ scrollbarWidth: 'thin', scrollBehavior: 'smooth', maxHeight: 'calc(100vh - 180px)' }}
        >
          {adminNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  active ? 'scale-110' : 'group-hover:scale-105'
                )} />
                <span>{item.name}</span>
                {active && (
                  <motion.div
                    layoutId="admin-active-indicator"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-4 hidden shrink-0 rounded-xl border bg-muted/40 p-4 lg:block">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-semibold">System Operational</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">All services running smoothly.</p>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href="/">View Site</Link>
          </Button>
        </div>
      </motion.aside>
    </div>
  );
}
