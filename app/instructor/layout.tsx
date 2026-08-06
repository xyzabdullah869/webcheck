'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, BookOpen, Users, Wallet, Menu, X, Dna, ArrowLeft, ChartBar as BarChart3, ClipboardList, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBell } from '@/components/notification-bell';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/lib/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

type SidebarItem = { name: string; href: string; icon: LucideIcon };

const instructorNav: SidebarItem[] = [
  { name: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
  { name: 'My Courses', href: '/instructor/courses', icon: BookOpen },
  { name: 'Quizzes', href: '/instructor/quizzes', icon: ClipboardList },
  { name: 'Assignments', href: '/instructor/assignments', icon: FileText },
  { name: 'Students', href: '/instructor/students', icon: Users },
  { name: 'Analytics', href: '/instructor/analytics', icon: BarChart3 },
  { name: 'Withdrawals', href: '/instructor/withdrawals', icon: Wallet },
];

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string) => pathname === href || (href !== '/instructor' && pathname.startsWith(href));

  const initials = (profile?.full_name ?? 'I').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <RouteGuard requiredRole="instructor">
      <div className="min-h-screen bg-muted/20">
        <div className="flex">
          {/* Mobile menu button */}
          <Button variant="outline" size="icon" className="fixed left-4 top-20 z-40 lg:hidden" onClick={() => setOpen(true)} aria-label="Open sidebar">
            <Menu className="h-5 w-5" />
          </Button>

          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <motion.aside
            initial={false}
            className={cn(
              'fixed left-0 top-0 z-50 h-full w-72 border-r bg-card p-5 transition-transform lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-72 lg:shrink-0 lg:translate-x-0 lg:bg-transparent lg:flex lg:flex-col',
              open ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <div className="flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><Dna className="h-5 w-5" /></div>
                <span className="font-display font-bold">Instructor</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></Button>
            </div>

            <div className="hidden items-center gap-3 lg:flex lg:mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><Dna className="h-5 w-5" /></div>
              <div>
                <p className="font-display text-sm font-bold">Instructor Panel</p>
                <p className="text-xs text-muted-foreground">Bioinformatics Hub</p>
              </div>
            </div>

            <nav className="mt-6 flex flex-col gap-1 overflow-y-auto lg:mt-0 lg:flex-1 lg:pr-1" style={{ scrollbarWidth: 'thin', maxHeight: 'calc(100vh - 180px)' }}>
              {instructorNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.name} href={item.href} onClick={() => setOpen(false)} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors', active ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 hidden shrink-0 rounded-xl border bg-muted/40 p-4 lg:block">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Student View</Link>
              </Button>
            </div>
          </motion.aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/80 px-4 pl-20 backdrop-blur lg:px-8">
              <div className="flex-1" />
              <div className="ml-auto flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full" aria-label="User menu">
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? 'Instructor'} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel>
                      <p className="text-sm font-semibold">{profile?.full_name ?? 'Instructor'}</p>
                      <p className="text-xs font-normal text-muted-foreground">{profile?.email}</p>
                      <p className="mt-0.5 text-xs font-medium text-primary">Instructor</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/dashboard">Student Dashboard</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="text-rose-600 dark:text-rose-400">
                      <LogOut className="mr-2 h-4 w-4" />Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <main className="p-4 pl-20 lg:p-8">{children}</main>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
