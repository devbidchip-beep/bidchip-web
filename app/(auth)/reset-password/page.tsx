'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Loader2 } from 'lucide-react';

// ─── Step 1: request reset link ────────────────────────────────────────────

const requestSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type RequestValues = z.infer<typeof requestSchema>;

function RequestResetForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestValues>({ resolver: zodResolver(requestSchema) });

  const onSubmit = async (data: RequestValues) => {
    setServerError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/accounts/password-reset/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setServerError(json?.detail ?? 'Something went wrong. Please try again.');
        return;
      }
      setSent(true);
    } catch {
      setServerError('Network error. Please try again.');
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-gray-500">
          If that email is registered, we've sent a password reset link.
        </p>
        <a
          href="/login"
          className="mt-6 inline-block text-sm font-medium underline"
          style={{ color: '#1e2a4a' }}
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold" style={{ color: '#1e2a4a' }}>
        Forgot your password?
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
        {serverError && <p className="text-sm text-red-500">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-md py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#f97316' }}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        <a href="/login" className="font-medium underline" style={{ color: '#1e2a4a' }}>
          Back to sign in
        </a>
      </p>
    </>
  );
}

// ─── Step 2: set new password ───────────────────────────────────────────────

const resetSchema = z
  .object({
    password: z.string().min(12, 'Password must be at least 12 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type ResetValues = z.infer<typeof resetSchema>;

function SetNewPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (data: ResetValues) => {
    setServerError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/accounts/password-reset/confirm/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: data.password }),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setServerError(json?.detail ?? 'This link may be expired. Please request a new one.');
        return;
      }
      setDone(true);
    } catch {
      setServerError('Network error. Please try again.');
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Password updated!</h1>
        <p className="mt-2 text-sm text-gray-500">You can now sign in with your new password.</p>
        <a
          href="/login"
          className="mt-6 inline-block rounded-md px-6 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: '#1e2a4a' }}
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold" style={{ color: '#1e2a4a' }}>
        Set a new password
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="confirm">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            {...register('confirm')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          {errors.confirm && (
            <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>
          )}
        </div>
        {serverError && <p className="text-sm text-red-500">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-md py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#f97316' }}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set new password'}
        </button>
      </form>
    </>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-10 shadow-sm">
        {token ? <SetNewPasswordForm token={token} /> : <RequestResetForm />}
      </div>
    </div>
  );
}
