'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import type { UserRole } from '@/lib/auth-types';
import { hasMinRole } from '@/lib/auth-types';
import { FullPageLoader } from '@/components/loading-states';

type RouteGuardProps = {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
};

export function RouteGuard({ children, requiredRole, fallback }: RouteGuardProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      setRedirecting(true);
      router.push('/login');
    } else if (requiredRole && !hasMinRole(role, requiredRole)) {
      setRedirecting(true);
      router.push('/403');
    }
  }, [user, role, loading, requiredRole, router]);

  if (loading || redirecting) {
    return <FullPageLoader message={redirecting ? 'Redirecting...' : 'Loading your dashboard...'} />;
  }

  if (!user) {
    return fallback ?? <FullPageLoader message="Please sign in to continue" />;
  }

  if (requiredRole && !hasMinRole(role, requiredRole)) {
    return fallback ?? <FullPageLoader message="Access denied" />;
  }

  return <>{children}</>;
}
