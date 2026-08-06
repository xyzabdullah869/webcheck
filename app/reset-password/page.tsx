'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff, ArrowRight, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Loader as Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { resetPasswordSchema, getAuthErrorMessage, type ResetPasswordInput } from '@/lib/validations/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      console.error(getAuthErrorMessage(error));
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push('/login');
    }, 2500);
  });

  if (done) {
    return (
      <AuthLayout
        title="Password updated!"
        subtitle="Your password has been reset successfully"
        footerText="Need help?"
        footerLinkText="Contact support"
        footerHref="/contact"
      >
        <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          <p className="text-sm text-muted-foreground">
            You can now sign in with your new password. Redirecting to login...
          </p>
          <Button asChild className="w-full">
            <Link href="/login">
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Enter your new password below"
      footerText="Remember your password?"
      footerLinkText="Sign in"
      footerHref="/login"
    >
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              className="pl-10 pr-10"
              onChange={(e) => setValue('password', e.target.value, { shouldValidate: true })}
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter password"
              className="pl-10 pr-10"
              onChange={(e) => setValue('confirm', e.target.value, { shouldValidate: true })}
            />
            <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm && <p className="text-xs text-rose-500">{errors.confirm.message}</p>}
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            <li>At least 8 characters</li>
            <li>Include a mix of letters and numbers</li>
            <li>Avoid common passwords</li>
          </ul>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
          ) : (
            <>Reset password <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
