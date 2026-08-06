'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, ArrowLeft, CircleCheck as CheckCircle2, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { forgotPasswordSchema, getAuthErrorMessage, type ForgotPasswordInput } from '@/lib/validations/auth';

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);

  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error(getAuthErrorMessage(error));
    }

    setSent(true);
  });

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We sent you a password reset link"
        footerText="Remember your password?"
        footerLinkText="Sign in"
        footerHref="/login"
      >
        <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          <div>
            <p className="font-display font-semibold">Reset link sent</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check your inbox for a link to reset your password. It expires in 30 minutes.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email to receive a reset link"
      footerText="Remember your password?"
      footerLinkText="Sign in"
      footerHref="/login"
    >
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              onChange={(e) => setValue('email', e.target.value, { shouldValidate: true })}
            />
          </div>
          {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending link...</>
          ) : (
            <>Send reset link <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </form>
      <Link href="/login" className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </AuthLayout>
  );
}
