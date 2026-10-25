'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';

// ─── Schemas ────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Required'),
    new_password: z.string().min(12, 'At least 12 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

const companySchema = z.object({
  legal_name: z.string().min(1, 'Required'),
  country: z.string().optional(),
  website: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  is_buyer: z.boolean(),
  is_supplier: z.boolean(),
});
type CompanyValues = z.infer<typeof companySchema>;

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS = ['Profile', 'Security', 'Company', 'Stripe Connect', 'Notifications'] as const;
type Tab = (typeof TABS)[number];

// ─── Helper: field wrapper ────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:bg-gray-100',
        props.className,
      )}
    />
  );
}

function SaveButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
      style={{ backgroundColor: '#f97316' }}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Save changes
    </button>
  );
}

// ─── Profile tab ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user } = useCurrentUser();
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: (user as { full_name?: string } | null)?.full_name ?? user?.name ?? '',
      phone: (user as { phone?: string } | null)?.phone ?? '',
    },
  });

  const onSubmit = async (data: ProfileValues) => {
    setServerError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/me/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setServerError('Failed to save. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">
      <Field label="Full name" error={errors.full_name?.message}>
        <Input {...register('full_name')} />
      </Field>
      <Field label="Email address">
        <Input value={user?.email ?? ''} disabled readOnly />
        <p className="mt-1 text-xs text-gray-400">Email cannot be changed here.</p>
      </Field>
      <Field label="Phone" error={errors.phone?.message}>
        <Input type="tel" {...register('phone')} />
      </Field>
      {serverError && <p className="text-sm text-red-500">{serverError}</p>}
      <div className="flex items-center gap-3">
        <SaveButton loading={isSubmitting} />
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </form>
  );
}

// ─── Security tab ────────────────────────────────────────────────────────────

function SecurityTab() {
  const { user } = useCurrentUser();
  const twoFaEnabled = (user as { totp_enabled?: boolean } | null)?.totp_enabled ?? false;
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: PasswordValues) => {
    setServerError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/change-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.new_password,
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setServerError(json?.detail ?? 'Failed to update password.');
        return;
      }
      setSaved(true);
      reset();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setServerError('Failed to save. Please try again.');
    }
  };

  return (
    <div className="max-w-lg space-y-8">
      {/* Change password */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-gray-900">Change password</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Current password" error={errors.current_password?.message}>
            <Input type="password" autoComplete="current-password" {...register('current_password')} />
          </Field>
          <Field label="New password" error={errors.new_password?.message}>
            <Input type="password" autoComplete="new-password" {...register('new_password')} />
          </Field>
          <Field label="Confirm new password" error={errors.confirm_password?.message}>
            <Input type="password" autoComplete="new-password" {...register('confirm_password')} />
          </Field>
          {serverError && <p className="text-sm text-red-500">{serverError}</p>}
          <div className="flex items-center gap-3">
            <SaveButton loading={isSubmitting} />
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Updated
              </span>
            )}
          </div>
        </form>
      </section>

      {/* 2FA */}
      <section className="rounded-lg border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Two-factor authentication</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add an extra layer of security to your account with an authenticator app.
            </p>
          </div>
          {twoFaEnabled ? (
            <div className="flex flex-col items-end gap-2">
              <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                <ShieldCheck className="h-4 w-4" /> 2FA enabled
              </span>
              <button className="text-xs text-red-500 underline hover:text-red-700">
                Remove 2FA
              </button>
            </div>
          ) : (
            <button
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Set up authenticator
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Company tab ─────────────────────────────────────────────────────────────

function CompanyTab() {
  const { user } = useCurrentUser();
  const company = (user as { company?: Record<string, unknown> } | null)?.company ?? {};
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      legal_name: (company.legal_name as string) ?? '',
      country: (company.country as string) ?? '',
      website: (company.website as string) ?? '',
      is_buyer: (company.is_buyer as boolean) ?? false,
      is_supplier: (company.is_supplier as boolean) ?? false,
    },
  });

  const onSubmit = async (data: CompanyValues) => {
    setServerError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/company/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setServerError('Failed to save. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">
      <Field label="Company legal name" error={errors.legal_name?.message}>
        <Input {...register('legal_name')} />
      </Field>
      <Field label="Country" error={errors.country?.message}>
        <Input placeholder="e.g. US" {...register('country')} />
      </Field>
      <Field label="Website" error={errors.website?.message}>
        <Input type="url" placeholder="https://example.com" {...register('website')} />
      </Field>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Account type</label>
        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input type="checkbox" {...register('is_buyer')} className="h-4 w-4 rounded border-gray-300" />
          Buyer — I want to source components
        </label>
        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input type="checkbox" {...register('is_supplier')} className="h-4 w-4 rounded border-gray-300" />
          Supplier — I want to sell components
        </label>
      </div>
      {serverError && <p className="text-sm text-red-500">{serverError}</p>}
      <div className="flex items-center gap-3">
        <SaveButton loading={isSubmitting} />
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </form>
  );
}

// ─── Stripe Connect tab ───────────────────────────────────────────────────────

function StripeConnectTab() {
  const { user } = useCurrentUser();
  const company = (user as { company?: Record<string, unknown> } | null)?.company ?? {};
  const isConnected = Boolean(company.stripe_account_id);
  const bankLast4 = (company.bank_last4 as string | undefined) ?? null;

  return (
    <div className="max-w-lg">
      <h3 className="mb-2 text-base font-semibold text-gray-900">Stripe Connect</h3>
      <p className="mb-6 text-sm text-gray-500">
        Connect your bank account to receive payouts for your sales.
      </p>
      {isConnected ? (
        <div className="rounded-lg border border-green-100 bg-green-50 p-5">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Connected</span>
          </div>
          {bankLast4 && (
            <p className="mt-1 text-sm text-green-600">Bank account ending in {bankLast4}</p>
          )}
          <button className="mt-4 text-sm text-gray-500 underline hover:text-gray-700">
            Update payout account
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="mb-4 text-sm text-gray-600">
            You haven't connected a bank account yet. Set up Stripe Connect to start receiving payouts.
          </p>
          <button
            className="rounded-md px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: '#635bff' }}
          >
            Connect with Stripe
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Notifications tab ────────────────────────────────────────────────────────

const NOTIFICATION_TYPES = [
  { key: 'bid_placed', label: 'Bid placed on your listing' },
  { key: 'outbid', label: 'You have been outbid' },
  { key: 'listing_awarded', label: 'Listing awarded' },
  { key: 'order_shipped', label: 'Order shipped' },
  { key: 'order_delivered', label: 'Order delivered' },
  { key: 'payment_received', label: 'Payment received' },
  { key: 'dispute_opened', label: 'Dispute opened' },
  { key: 'message_received', label: 'New message received' },
] as const;

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_TYPES.map(({ key }) => [key, true])),
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/notification-preferences/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
        credentials: 'include',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-5">
      <p className="text-sm text-gray-500">Choose which events send you an email notification.</p>
      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {NOTIFICATION_TYPES.map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50">
            <span className="text-sm text-gray-700">{label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => toggle(key)}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                prefs[key] ? 'bg-orange-500' : 'bg-gray-300',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  prefs[key] ? 'translate-x-4' : 'translate-x-1',
                )}
              />
            </button>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#f97316' }}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save preferences
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { user } = useCurrentUser();
  const isSupplier =
    (user as { company?: { is_supplier?: boolean } } | null)?.company?.is_supplier ?? false;

  const visibleTabs = TABS.filter(
    (t) => t !== 'Stripe Connect' || isSupplier,
  );

  const [activeTab, setActiveTab] = useState<Tab>('Profile');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ color: '#1e2a4a' }}>
        Account settings
      </h1>

      {/* Tab bar */}
      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-gray-200">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-900',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Profile' && <ProfileTab />}
      {activeTab === 'Security' && <SecurityTab />}
      {activeTab === 'Company' && <CompanyTab />}
      {activeTab === 'Stripe Connect' && <StripeConnectTab />}
      {activeTab === 'Notifications' && <NotificationsTab />}
    </div>
  );
}
