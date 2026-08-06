'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Dna, LogIn, ArrowRight, LogOut, User, Sparkles, Gift, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { CartButton } from '@/components/cart-button';
import { NotificationBell } from '@/components/notification-bell';
import { navLinks, featureLinks } from '@/lib/site';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/auth-context';
import { useSiteSettings } from '@/lib/contexts/site-settings-context';
import { Dna as DnaIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, isAuthenticated, isAdmin, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const LogoIcon = settings.websiteLogo ? null : DnaIcon;
  const siteName = settings.websiteName || 'Bioinformatics Hub';
  const siteShort = settings.shortName || 'BioHub';

  const initials = (profile?.full_name ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'py-2' : 'py-4'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'flex items-center justify-between rounded-2xl px-4 transition-all duration-300',
            scrolled
              ? 'glass h-14 shadow-soft'
              : 'h-16 border border-transparent'
          )}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-glow transition-transform group-hover:scale-105">
              {settings.websiteLogo ? (
                <img src={settings.websiteLogo} alt={siteName} className="h-5 w-5 object-contain" />
              ) : (
                <Dna className="h-5 w-5" />
              )}
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              {siteName.split(' ')[0]}{' '}
              <span className="text-gradient">{siteName.split(' ').slice(1).join(' ') || 'Hub'}</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.name}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            <div className="mx-1 h-5 w-px bg-border" />
            {featureLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:flex" />
            <NotificationBell />
            <CartButton />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden rounded-full md:block" aria-label="User menu">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? 'User'} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <p className="text-sm font-semibold">{profile?.full_name ?? 'User'}</p>
                    <p className="text-xs font-normal text-muted-foreground">{profile?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard"><User className="mr-2 h-4 w-4" />Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/ai-assistant"><Sparkles className="mr-2 h-4 w-4" />AI Assistant</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/referrals"><Gift className="mr-2 h-4 w-4" />Refer & Earn</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet"><Wallet className="mr-2 h-4 w-4" />My Wallet</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-rose-600 dark:text-rose-400">
                    <LogOut className="mr-2 h-4 w-4" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex"
                >
                  <Link href="/login">
                    <LogIn className="mr-1.5 h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button asChild size="sm" className="hidden md:inline-flex">
                  <Link href="/register">
                    Get Started
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw] glass p-6 lg:hidden"
            >
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    {settings.websiteLogo ? (
                      <img src={settings.websiteLogo} alt={siteName} className="h-5 w-5 object-contain" />
                    ) : (
                      <Dna className="h-5 w-5" />
                    )}
                  </div>
                  <span className="font-display text-lg font-bold">{siteShort}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="mt-8 flex flex-col gap-1">
                {navLinks.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== '/' && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={cn(
                        'rounded-lg px-4 py-3 text-base font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-4 border-t pt-4">
                <p className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Features</p>
                <nav className="mt-1 flex flex-col gap-1">
                  {featureLinks.map((link) => {
                    const active =
                      pathname === link.href ||
                      (link.href !== '/' && pathname.startsWith(link.href));
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={cn(
                          'rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">Theme</span>
                  <div className="flex items-center gap-2">
                    <CartButton />
                    <ThemeToggle />
                  </div>
                </div>
                {isAuthenticated ? (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    {isAdmin && (
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/admin">Admin Panel</Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="w-full text-rose-600 dark:text-rose-400" onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/register">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
