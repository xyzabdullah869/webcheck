'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';
import { AuthLayout, SocialAuthButtons } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, getAuthErrorMessage, type LoginInput } from '@/lib/validations/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState('');

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const remember = watch('remember');

  const onSubmit = handleSubmit(async (data) => {
    setAuthError('');
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setAuthError(getAuthErrorMessage(error));
      return;
    }

    router.push(redirect);
    router.refresh();
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your learning journey"
      footerText="Don't have an account?"
      footerLinkText="Get started"
      footerHref="/register"
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="pl-10 pr-10"
              onChange={(e) => setValue('password', e.target.value, { shouldValidate: true })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={remember ?? false}
            onCheckedChange={(v) => setValue('remember', v === true)}
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground">Remember me</label>
        </div>
        {authError && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {authError}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
          ) : (
            <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </form>
      <SocialAuthButtons />
    </AuthLayout>
  );
}
