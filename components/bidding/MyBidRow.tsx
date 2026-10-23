'use client';

import Link from 'next/link';
import type { Bid } from '@/types/api';
import { cn } from '@/lib/utils';

type BidWithContext = Bid & {
  listing_number: string;
  listing_title: string;
  line_mpn: string;
};

interface Props {
  bid: BidWithContext;
  onWithdraw?: (bidId: string) => void;
  withdrawing?: boolean;
}

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

export function MyBidRow({ bid, onWithdraw, withdrawing }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card px-4 py-3 text-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/dashboard/listings/${bid.line}`}
            className="font-semibold text-primary hover:underline truncate"
          >
            #{bid.listing_number}
          </Link>
          <span className="text-muted-foreground truncate">{bid.listing_title}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">MPN: {bid.line_mpn}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="tabular-nums font-medium">${bid.unit_price}</span>
        <span className="text-muted-foreground">×</span>
        <span className="tabular-nums">{bid.quantity_offered.toLocaleString()}</span>
        <MatchBadge isExact={bid.is_exact_match} />
        <StatusBadge status={bid.status} />
      </div>

      {bid.status === 'active' && onWithdraw && (
        <button
          onClick={() => onWithdraw(bid.id)}
          disabled={withdrawing}
          className="rounded px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 flex-shrink-0"
        >
          {withdrawing ? 'Withdrawing…' : 'Withdraw'}
        </button>
      )}
    </div>
  );
}
