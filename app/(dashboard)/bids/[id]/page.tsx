'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { withdrawBid } from '@/lib/api';
import type { Bid } from '@/types/api';
import { cn } from '@/lib/utils';

// NOTE: A dedicated GET /bidding/bids/:id endpoint is assumed.
// Until that endpoint ships, this page shows a not-found state gracefully.

function MatchBadge({ isExact, reasons }: { isExact: boolean; reasons: string[] }) {
  if (isExact) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
        EXACT MATCH
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 cursor-help"
      title={reasons.join(', ')}
    >
      EXCEPTION BID
    </span>
  );
}

function StatusBadge({ status }: { status: Bid['status'] }) {
  const styles: Record<Bid['status'], string> = {
    active: 'bg-blue-100 text-blue-800',
    withdrawn: 'bg-gray-100 text-gray-500',
    won: 'bg-green-100 text-green-800',
    partially_won: 'bg-green-50 text-green-700',
    lost: 'bg-gray-100 text-gray-500',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        styles[status],
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default function BidDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bidId = params.id as string;

  // In a real implementation, fetch from /bidding/bids/:id
  const [bid] = useState<Bid | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    if (!bid) return;
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      await withdrawBid(bid.id);
      router.push('/dashboard/bids');
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : 'Failed to withdraw');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-48 rounded-lg bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-6 text-destructive">{error}</div>
    );
  }

  if (!bid) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="text-xs text-muted-foreground hover:underline"
        >
          &larr; Back
        </button>
        <div className="rounded-lg border p-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Bid not found or the detail endpoint is not yet available.
          </p>
          <Link href="/dashboard/bids" className="text-sm text-primary hover:underline">
            Back to My Bids
          </Link>
        </div>
      </div>
    );
  }

  const total = parseFloat(bid.unit_price) * bid.quantity_offered;
  const fee = total * 0.07;
  const net = total - fee;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Bid Detail</h1>
            <StatusBadge status={bid.status} />
          </div>
          <p className="text-sm text-muted-foreground">ID: {bid.id}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-xs text-muted-foreground hover:underline flex-shrink-0"
        >
          Back
        </button>
      </div>

      {/* Core details */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">Bid Details</h2>
        <DetailRow label="Match Type" value={<MatchBadge isExact={bid.is_exact_match} reasons={bid.exception_reasons} />} />
        <DetailRow label="Unit Price" value={`$${bid.unit_price}`} />
        <DetailRow label="Quantity Offered" value={bid.quantity_offered.toLocaleString()} />
        <DetailRow label="Date Code Year" value={bid.date_code_year ?? '—'} />
        <DetailRow label="Packaging" value={bid.packaging?.replace('_', ' ') ?? '—'} />
        <DetailRow label="Lead Time" value={bid.lead_time_days ? `${bid.lead_time_days} days` : '—'} />
        <DetailRow label="Placed" value={new Date(bid.created_at).toLocaleString()} />
      </div>

      {/* Financials */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">Financials</h2>
        <DetailRow label="Total Value" value={`$${total.toFixed(2)}`} />
        <DetailRow label="Seller Fee (7%)" value={`$${fee.toFixed(2)}`} />
        <DetailRow
          label="You Will Receive"
          value={<span className="text-green-700">${net.toFixed(2)}</span>}
        />
        <p className="text-xs text-muted-foreground mt-2 italic">
          Final fee calculated at order time
        </p>
      </div>

      {/* Exception reasons */}
      {!bid.is_exact_match && bid.exception_reasons.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h2 className="text-sm font-semibold text-yellow-900 mb-2">Exception Reasons</h2>
          <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
            {bid.exception_reasons.map((r) => (
              <li key={r}>{r.replace('_', ' ')}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {bid.status === 'active' && (
        <div className="space-y-2">
          {withdrawError && (
            <p className="text-xs text-destructive">{withdrawError}</p>
          )}
          <button
            onClick={handleWithdraw}
            disabled={withdrawing}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {withdrawing ? 'Withdrawing…' : 'Withdraw Bid'}
          </button>
        </div>
      )}
    </div>
  );
}
