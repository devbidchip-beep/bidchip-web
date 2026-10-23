'use client';

import { useState } from 'react';
import { getStripeConnectLink } from '@/lib/api';

export function StripeConnectBanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStripeConnectLink();
      window.location.href = res.data.account_link_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get connect link');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-5 py-4">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-yellow-900">Connect your bank account to receive payouts</p>
        <p className="text-xs text-yellow-700">
          You need to connect a Stripe account before BidChip can release funds for completed orders.
        </p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="ml-4 flex-shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Connecting…' : 'Connect with Stripe'}
      </button>
    </div>
  );
}
