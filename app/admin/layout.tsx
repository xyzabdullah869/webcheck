'use client';

import * as React from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/lib/contexts/auth-context';
import { Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/notification-bell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();

  const initials = (profile?.full_name ?? 'A')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <RouteGuard requiredRole="admin">
      <div className="h-screen overflow-hidden bg-muted/20">
        <div className="flex h-full">
          <AdminSidebar />
          <div className="flex-1 min-w-0 overflow-y-auto">
            <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/80 px-4 pl-20 backdrop-blur lg:px-8">
              <div className="relative hidden flex-1 sm:block sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search students, courses..." className="h-9 pl-10" />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full" aria-label="Admin menu">
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? 'Admin'} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel>
                      <p className="text-sm font-semibold">{profile?.full_name ?? 'Admin'}</p>
                      <p className="text-xs font-normal text-muted-foreground">{profile?.email}</p>
                      <p className="mt-0.5 text-xs font-medium text-primary">Administrator</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/analytics">Analytics</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="text-rose-600 dark:text-rose-400">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
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
