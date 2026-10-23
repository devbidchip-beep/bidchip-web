'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getBidsForLine, withdrawBid } from '@/lib/api';
import type { Bid } from '@/types/api';
import { cn } from '@/lib/utils';

// NOTE: The real implementation would call a /bidding/bids/?placed_by=me endpoint.
// Until that endpoint is available, this page renders the UI shell with empty state
// and is ready to be wired to the real API call.

function MatchBadge({ isExact }: { isExact: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        isExact ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800',
      )}
    >
      {isExact ? 'EXACT' : 'EXCEPTION'}
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
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
        styles[status],
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

type BidWithContext = Bid & {
  listing_number: string;
  listing_title: string;
  line_mpn: string;
  listing_id: string;
};

function BidCard({
  bid,
  onWithdraw,
  withdrawingId,
}: {
  bid: BidWithContext;
  onWithdraw: (id: string) => void;
  withdrawingId: string | null;
}) {
  const placed = new Date(bid.created_at);
  const now = new Date();
  const diffMs = now.getTime() - placed.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const timeAgo =
    diffDays > 0
      ? `${diffDays}d ago`
      : diffHours > 0
      ? `${diffHours}h ago`
      : `${diffMins}m ago`;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/dashboard/listings/${bid.listing_id}`}
              className="font-semibold text-primary hover:underline text-sm"
            >
              #{bid.listing_number}
            </Link>
            <span className="text-sm text-muted-foreground truncate">{bid.listing_title}</span>
          </div>
          <p className="text-xs text-muted-foreground">MPN: {bid.line_mpn}</p>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-sm">
        <span className="font-semibold tabular-nums">${bid.unit_price}</span>
        <span className="text-muted-foreground">×</span>
        <span className="tabular-nums">{bid.quantity_offered.toLocaleString()} units</span>
        <MatchBadge isExact={bid.is_exact_match} />
        <StatusBadge status={bid.status} />
      </div>

      {bid.status === 'active' && (
        <button
          onClick={() => onWithdraw(bid.id)}
          disabled={withdrawingId === bid.id}
          className="rounded px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          {withdrawingId === bid.id ? 'Withdrawing…' : 'Withdraw Bid'}
        </button>
      )}
    </div>
  );
}

export default function MyBidsPage() {
  // In a complete implementation, this would call an API endpoint like
  // GET /bidding/bids/?placed_by=me or similar.
  // The bids state would be populated from that response.
  const [bids] = useState<BidWithContext[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const activeBids = bids.filter((b) => b.status === 'active');
  const historyBids = bids.filter((b) => b.status !== 'active');

  const handleWithdraw = async (bidId: string) => {
    setWithdrawingId(bidId);
    setWithdrawError(null);
    try {
      await withdrawBid(bidId);
      // Refresh — in real implementation, refetch from API
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : 'Failed to withdraw bid');
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-6 text-destructive">{error}</div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Bids</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track all bids placed by your company
        </p>
      </div>

      {withdrawError && (
        <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
          {withdrawError}
        </div>
      )}

      {/* Active bids */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          Active Bids{' '}
          {activeBids.length > 0 && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              ({activeBids.length})
            </span>
          )}
        </h2>
        {activeBids.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t placed any bids yet. Browse the marketplace to find listings.
            </p>
            <Link
              href="/dashboard/marketplace"
              className="text-sm text-primary hover:underline"
            >
              Browse Marketplace &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBids.map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                onWithdraw={handleWithdraw}
                withdrawingId={withdrawingId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Bid history */}
      {historyBids.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">
            Bid History{' '}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              ({historyBids.length})
            </span>
          </h2>
          <div className="space-y-3">
            {historyBids.map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                onWithdraw={handleWithdraw}
                withdrawingId={withdrawingId}
              />
            ))}
          </div>
        </section>
      )}

      <div className="pt-2">
        <Link
          href="/dashboard/marketplace"
          className="text-sm text-primary hover:underline"
        >
          Browse the Marketplace &rarr;
        </Link>
      </div>
    </div>
  );
}
