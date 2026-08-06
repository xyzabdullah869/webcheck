'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, BookOpen, CirclePlay as PlayCircle, Award, Bookmark, Bell, Settings, User, Menu, X, Dna, Sparkles, Gift, Wallet, ShoppingBag, GraduationCap, ClipboardList, FileText, Users, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type SidebarItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const studentNav: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
  { name: 'My Batch', href: '/dashboard/batch', icon: Users },
  { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
  { name: 'Continue Learning', href: '/dashboard/learning', icon: PlayCircle },
  { name: 'Quizzes', href: '/dashboard/quizzes', icon: ClipboardList },
  { name: 'Assignments', href: '/dashboard/assignments', icon: FileText },
  { name: 'Certificates', href: '/dashboard/certificates', icon: Award },
  { name: 'Bookmarks', href: '/dashboard/bookmarks', icon: Bookmark },
  { name: 'AI Tutor', href: '/dashboard/ai-tutor', icon: GraduationCap },
  { name: 'AI Assistant', href: '/dashboard/ai-assistant', icon: Sparkles },
  { name: 'My Orders', href: '/dashboard/orders', icon: ShoppingBag },
  { name: 'Referral Program', href: '/dashboard/referral', icon: Gift },
  { name: 'My Wallet', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
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
          'fixed left-0 top-0 z-50 h-full w-72 border-r bg-card p-5 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-72 lg:shrink-0 lg:translate-x-0 lg:bg-transparent lg:flex lg:flex-col',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <Dna className="h-5 w-5" />
            </div>
            <span className="font-display font-bold">BioHub</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="hidden items-center gap-3 lg:flex lg:mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <Dna className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold">Student Panel</p>
            <p className="text-xs text-muted-foreground">Learning Dashboard</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1 overflow-y-auto lg:mt-0 lg:flex-1 lg:pr-1" style={{ scrollbarWidth: 'thin', maxHeight: 'calc(100vh - 180px)' }}>
          {studentNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 hidden shrink-0 rounded-xl border bg-muted/40 p-4 lg:block">
          <p className="text-sm font-semibold">Upgrade to Premium</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Get mentorship and verified certificates.
          </p>
          <Button asChild size="sm" className="mt-3 w-full">
            <Link href="/pricing">Upgrade</Link>
          </Button>
        </div>
      </motion.aside>
    </div>
  );
}
