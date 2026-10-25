'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/accounts/verify-email/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          },
        );

        if (!res.ok) {
          setStatus('error');
          return;
        }

        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 2000);
      } catch {
        setStatus('error');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-gray-400" />
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Verifying your email…</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Email verified!</h1>
            <p className="mt-2 text-sm text-gray-500">Redirecting to your dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-500" />
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Verification failed</h1>
            <p className="mt-2 text-sm text-gray-500">
              This link is invalid or has expired. Please request a new verification email.
            </p>
            <a
              href="/login"
              className="mt-6 inline-block rounded-md px-6 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: '#1e2a4a' }}
            >
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
