'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { acceptInvitation } from '@/lib/api';

interface Props {
  params: Promise<{ token: string }>;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  finance: 'Finance',
  manager: 'Manager',
  buyer: 'Buyer',
  seller: 'Seller',
  read_only: 'Read Only',
};

export default function InviteAcceptPage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useCurrentUser();

  const [inviteInfo, setInviteInfo] = useState<{ company_name: string; role: string } | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  // Peek at the invitation on load (pre-accept, just to show context)
  useEffect(() => {
    let cancelled = false;
    const peek = async () => {
      setLoading(true);
      try {
        const res = await acceptInvitation(token);
        if (!cancelled) {
          setInviteInfo(res.data);
          // If peek already accepts we consider it done for logged-in users
          if (isAuthenticated) {
            setAccepted(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : '';
          if (msg.toLowerCase().includes('expir')) {
            setExpired(true);
          } else {
            setError(msg || 'Invalid or expired invitation.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (!authLoading) peek();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await acceptInvitation(token);
      setInviteInfo(res.data);
      setAccepted(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('expir')) {
        setExpired(true);
      } else {
        setError(msg || 'Failed to accept invitation.');
      }
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading invitation…</p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground mb-2">Invitation Expired</h1>
          <p className="text-sm text-muted-foreground">
            This invitation has expired. Please ask your admin to send a new one.
          </p>
        </div>
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground mb-2">Invalid Invitation</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (accepted && inviteInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <div className="mb-4 text-green-600 dark:text-green-400 text-4xl">✓</div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Welcome to {inviteInfo.company_name}!</h1>
          <p className="text-sm text-muted-foreground">
            You've joined as <strong>{ROLE_LABELS[inviteInfo.role] ?? inviteInfo.role}</strong>. Redirecting to your dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        {inviteInfo && (
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-foreground">You've been invited</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You've been invited to join{' '}
              <strong className="text-foreground">{inviteInfo.company_name}</strong>{' '}
              as{' '}
              <strong className="text-foreground">{ROLE_LABELS[inviteInfo.role] ?? inviteInfo.role}</strong>.
            </p>
          </div>
        )}

        {!isAuthenticated ? (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              You need to be logged in to accept this invitation. Please{' '}
              <a href="/auth/signin" className="text-primary underline underline-offset-2">sign in</a>{' '}
              or{' '}
              <a href="/auth/register" className="text-primary underline underline-offset-2">create an account</a>{' '}
              and then return to this link.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Signed in as <strong>{user?.email}</strong>.
            </p>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {accepting ? 'Accepting…' : 'Accept Invitation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
