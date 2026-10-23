'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const registerSchema = z.object({
  legal_name: z.string().min(2, 'Company legal name must be at least 2 characters'),
  company_type: z.enum(['buyer', 'supplier', 'both'], {
    errorMap: () => ({ message: 'Please select a company type' }),
  }),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  country: z.string().min(2, 'Please select a country'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'FR', name: 'France' },
  { code: 'IL', name: 'Israel' },
  { code: 'MX', name: 'Mexico' },
];

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormValues) {
    setError(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

    try {
      const res = await fetch(`${apiUrl}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_name: values.legal_name,
          is_buyer: values.company_type === 'buyer' || values.company_type === 'both',
          is_supplier: values.company_type === 'supplier' || values.company_type === 'both',
          full_name: values.full_name,
          email: values.email,
          password: values.password,
          country: values.country,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? 'Registration failed. Please try again.');
        return;
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        // Registration succeeded but auto-login failed — redirect to login
        router.push('/login');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Company section */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Company
        </h2>

        <div className="space-y-1">
          <label htmlFor="legal_name" className="block text-sm font-medium">
            Legal company name
          </label>
          <Input
            id="legal_name"
            placeholder="Acme Electronics Ltd."
            {...register('legal_name')}
          />
          {errors.legal_name && (
            <p className="text-xs text-destructive">{errors.legal_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="company_type" className="block text-sm font-medium">
            Company type
          </label>
          <select
            id="company_type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('company_type')}
          >
            <option value="">Select type…</option>
            <option value="buyer">Buyer</option>
            <option value="supplier">Supplier</option>
            <option value="both">Buyer &amp; Supplier</option>
          </select>
          {errors.company_type && (
            <p className="text-xs text-destructive">{errors.company_type.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="country" className="block text-sm font-medium">
            Country
          </label>
          <select
            id="country"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('country')}
          >
            <option value="">Select country…</option>
            {COUNTRIES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="text-xs text-destructive">{errors.country.message}</p>
          )}
        </div>
      </div>

      {/* User section */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your account
        </h2>

        <div className="space-y-1">
          <label htmlFor="full_name" className="block text-sm font-medium">
            Full name
          </label>
          <Input id="full_name" placeholder="Jane Smith" {...register('full_name')} />
          {errors.full_name && (
            <p className="text-xs text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            Work email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="jane@acme.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 chars, 1 uppercase, 1 number"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
