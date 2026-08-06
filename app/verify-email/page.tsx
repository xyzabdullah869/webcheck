'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MailCheck, ArrowRight, Loader as Loader2, RefreshCw, LogOut } from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [resending, setResending] = React.useState(false);
  const [resent, setResent] = React.useState(false);

  const resend = async () => {
    if (!user) return;
    setResending(true);
    const supabase = createClient();
    await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    });
    setResending(false);
    setResent(true);
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="One last step to activate your account"
      footerText="Need a different account?"
      footerLinkText="Register again"
      footerHref="/register"
    >
      <div className="mt-6 flex flex-col items-center gap-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="h-8 w-8" />
          </div>
        </motion.div>
        <p className="text-sm text-muted-foreground">
          {user
            ? `We sent a verification link to ${user.email}. Click the link in the email to activate your account.`
            : 'We sent a verification link to your email address. Click the link in the email to activate your account and start learning.'}
        </p>

        <div className="flex w-full items-center gap-3 rounded-xl border bg-muted/30 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
            <RefreshCw className="h-4 w-4" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Did not receive the email?</p>
            <p className="text-xs text-muted-foreground">Check your spam folder or resend the link.</p>
          </div>
        </div>

        {resent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-600 dark:text-emerald-400"
          >
            Verification email resent! Check your inbox.
          </motion.div>
        )}

        <Button onClick={resend} variant="outline" className="w-full" disabled={resending || !user}>
          {resending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resending...</>
          ) : (
            <>Resend verification email</>
          )}
        </Button>

        <Button asChild className="w-full">
          <Link href="/dashboard">
            Continue to dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </AuthLayout>
  );
}
