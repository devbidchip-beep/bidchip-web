'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error monitoring (e.g. Sentry) here
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <p className="text-6xl font-extrabold" style={{ color: '#1e2a4a' }}>
        Oops
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-gray-500">
        An unexpected error occurred. Our team has been notified.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-gray-400">Error ID: {error.digest}</p>
      )}
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md px-5 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: '#1e2a4a' }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
