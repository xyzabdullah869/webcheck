'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Loader as Loader2, Gift } from 'lucide-react';
import { AuthLayout, SocialAuthButtons } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';
import { registerSchema, getAuthErrorMessage, type RegisterInput } from '@/lib/validations/auth';
import { trackReferralSignup } from '@/lib/services/referral-service';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') ?? '';
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [authError, setAuthError] = React.useState('');

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '', confirm: '', agree: false },
  });

  const agree = watch('agree');

  const onSubmit = handleSubmit(async (data) => {
    setAuthError('');
    const supabase = createClient();

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
        },
      },
    });

    if (error) {
      setAuthError(getAuthErrorMessage(error));
      return;
    }

    if (refCode && signUpData.user) {
      await trackReferralSignup(refCode, signUpData.user.id);
    }

    setSuccess(true);
    setTimeout(() => {
      router.push(redirect);
    }, 3000);
  });

  if (success) {
    return (
      <AuthLayout
        title="Account created!"
        subtitle="Check your email to verify your account"
        footerText="Already verified?"
        footerLinkText="Sign in"
        footerHref="/login"
      >
        <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          <div>
            <p className="font-display font-semibold">Verify your email</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a verification link to your inbox. Click it to activate your account.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/verify-email">
              Open verification page
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start learning bioinformatics today"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerHref="/login"
    >
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        {refCode && (
          <div className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 text-sm">
            <Gift className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
            <span className="text-muted-foreground">
              You were referred by <strong className="text-foreground">{refCode}</strong>. Sign up to earn rewards!
            </span>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              placeholder="Jane Doe"
              className="pl-10"
              onChange={(e) => setValue('full_name', e.target.value, { shouldValidate: true })}
            />
          </div>
          {errors.full_name && <p className="text-xs text-rose-500">{errors.full_name.message}</p>}
        </div>
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
          <Label htmlFor="confirm">Confirm password</Label>
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
        <div className="flex items-start gap-2">
          <Checkbox id="terms" checked={agree} onCheckedChange={(v) => setValue('agree', v === true, { shouldValidate: true })} />
          <label htmlFor="terms" className="text-sm text-muted-foreground">
            I agree to the{' '}
            <Link href="/terms" className="font-medium text-primary hover:underline">Terms</Link> and{' '}
            <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>
          </label>
        </div>
        {errors.agree && <p className="text-xs text-rose-500">{errors.agree.message}</p>}
        {authError && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {authError}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
          ) : (
            <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </form>
      <SocialAuthButtons />
    </AuthLayout>
  );
}
