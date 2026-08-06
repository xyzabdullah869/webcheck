'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/auth-types';

type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  location: string;
  role: UserRole;
};

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  isStudent: boolean;
  isOwner: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  role: null,
  isAuthenticated: false,
  isAdmin: false,
  isInstructor: false,
  isStudent: false,
  isOwner: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadProfile = React.useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, bio, location, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load profile:', error.message);
        return;
      }

      setProfile(data as Profile | null);
    },
    [supabase]
  );

  React.useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(currentUser);

      if (currentUser) {
        await loadProfile(currentUser.id);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user: User | null } | null) => {
      (async () => {
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
        router.refresh();
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadProfile, router]);

  const refreshProfile = React.useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/login');
    router.refresh();
  }, [supabase, router]);

  const role = profile?.role ?? null;

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    role,
    isAuthenticated: !!user,
    isAdmin: role === 'admin' || role === 'owner',
    isInstructor: role === 'instructor' || role === 'admin' || role === 'owner',
    isStudent: role === 'student',
    isOwner: role === 'owner',
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
