'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBidsForLine, withdrawBid, awardLine } from '@/lib/api';
import type { Bid } from '@/types/api';
import { cn } from '@/lib/utils';

interface Props {
  lineId: string;
  listingKind: 'reverse' | 'bom' | 'rfq';
  isOwner: boolean;
  lineStatus: 'open' | 'awarded' | 'partially_awarded' | 'no_award';
  listingStatus: string;
  currentCompanyId?: string;
}

function MatchBadge({ bid }: { bid: Bid }) {
  if (bid.is_exact_match) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
        EXACT
      </span>
    );
  }
  const reasons = bid.exception_reasons.join(', ');
  return (
    <span
      className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 cursor-help"
      title={reasons}
    >
      EXCEPTION
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

export function BidList({
  lineId,
  listingKind,
  isOwner,
  lineStatus,
  listingStatus,
  currentCompanyId,
}: Props) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [awarding, setAwarding] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchBids = useCallback(() => {
    getBidsForLine(lineId)
      .then((res) => {
        const sorted = [...res.data].sort((a, b) => {
          // Exact matches first
          if (a.is_exact_match !== b.is_exact_match) {
            return a.is_exact_match ? -1 : 1;
          }
          // Then by unit price ascending (lowest wins)
          return parseFloat(a.unit_price) - parseFloat(b.unit_price);
        });
        setBids(sorted);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load bids'))
      .finally(() => setLoading(false));
  }, [lineId]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  // Auto-refresh every 30s while listing is published
  useEffect(() => {
    if (listingStatus !== 'published') return;
    const interval = setInterval(fetchBids, 30_000);
    return () => clearInterval(interval);
  }, [listingStatus, fetchBids]);

  const handleWithdraw = async (bidId: string) => {
    setWithdrawing(bidId);
    setActionError(null);
    try {
      await withdrawBid(bidId);
      fetchBids();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to withdraw bid');
    } finally {
      setWithdrawing(null);
    }
  };

  const handleAward = async (bidId: string, quantity: number) => {
    setAwarding(bidId);
    setActionError(null);
    try {
      await awardLine(lineId, [{ bid: bidId, quantity }]);
      fetchBids();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to award bid');
    } finally {
      setAwarding(null);
    }
  };

  const exactCount = bids.filter((b) => b.is_exact_match && b.status === 'active').length;
  const canAward = isOwner && lineStatus === 'open' && listingStatus === 'closed';

  if (loading) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
        Loading bids…
      </div>
    );
  }

  if (error) {
    return <div className="py-4 text-xs text-destructive">{error}</div>;
  }

  if (bids.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">No bids yet</div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {bids.length} bid{bids.length !== 1 ? 's' : ''} — {exactCount} exact match
        {exactCount !== 1 ? 'es' : ''}
      </p>

      {actionError && (
        <p className="text-xs text-destructive">{actionError}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-muted-foreground">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Match</th>
              <th className="px-3 py-2">Unit Price</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Date Code</th>
              <th className="px-3 py-2">Packaging</th>
              <th className="px-3 py-2">Lead Time</th>
              <th className="px-3 py-2">Status</th>
              {(canAward || currentCompanyId) && <th className="px-3 py-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {bids.map((bid, idx) => {
              const isLowestPrice =
                listingKind === 'reverse' &&
                bid.status === 'active' &&
                parseFloat(bid.unit_price) ===
                  Math.min(
                    ...bids
                      .filter((b) => b.status === 'active')
                      .map((b) => parseFloat(b.unit_price)),
                  );
              const isMyBid = currentCompanyId && bid.supplier_company === currentCompanyId;

              return (
                <tr
                  key={bid.id}
                  className={cn(
                    'border-b last:border-0',
                    isMyBid ? 'bg-blue-50' : 'hover:bg-muted/20',
                  )}
                >
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <MatchBadge bid={bid} />
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 font-semibold tabular-nums',
                      isLowestPrice ? 'text-green-700' : '',
                    )}
                  >
                    ${bid.unit_price}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{bid.quantity_offered.toLocaleString()}</td>
                  <td className="px-3 py-2 tabular-nums">{bid.date_code_year ?? '—'}</td>
                  <td className="px-3 py-2 capitalize">
                    {bid.packaging?.replace('_', ' ') ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    {bid.lead_time_days ? `${bid.lead_time_days}d` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={bid.status} />
                      {isMyBid && (
                        <span className="text-xs text-blue-600 font-medium">Your bid</span>
                      )}
                    </div>
                  </td>
                  {(canAward || currentCompanyId) && (
                    <td className="px-3 py-2">
                      <div className="flex gap-1.5">
                        {isMyBid && bid.status === 'active' && (
                          <button
                            onClick={() => handleWithdraw(bid.id)}
                            disabled={withdrawing === bid.id}
                            className="rounded px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                          >
                            {withdrawing === bid.id ? 'Withdrawing…' : 'Withdraw'}
                          </button>
                        )}
                        {canAward && bid.status === 'active' && (
                          <button
                            onClick={() => handleAward(bid.id, bid.quantity_offered)}
                            disabled={awarding === bid.id}
                            className="rounded px-2 py-1 text-xs bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50"
                          >
                            {awarding === bid.id ? 'Awarding…' : 'Award'}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
