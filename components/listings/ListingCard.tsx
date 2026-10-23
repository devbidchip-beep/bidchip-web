'use client';

import { useRouter } from 'next/navigation';
import type { Listing } from '@/types/api';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: Listing;
}

function StatusBadge({ status }: { status: Listing['status'] }) {
  const styles: Record<Listing['status'], string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    published: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-200 text-gray-600',
    awarded: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-700',
  };
  const labels: Record<Listing['status'], string> = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    published: 'Published',
    closed: 'Closed',
    awarded: 'Awarded',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}

function KindBadge({ kind }: { kind: Listing['kind'] }) {
  const styles: Record<Listing['kind'], string> = {
    reverse: 'bg-purple-100 text-purple-800',
    bom: 'bg-orange-100 text-orange-800',
    rfq: 'bg-teal-100 text-teal-800',
    forward: 'bg-indigo-100 text-indigo-800',
  };
  const labels: Record<Listing['kind'], string> = {
    reverse: 'REVERSE',
    bom: 'BOM',
    rfq: 'RFQ',
    forward: 'FORWARD',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
        styles[kind],
      )}
    >
      {labels[kind]}
    </span>
  );
}

function CountdownChip({ endsAt }: { endsAt: string }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(endsAt);
  if (isExpired) return <span className="text-xs text-muted-foreground">Expired</span>;
  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      {days > 0 ? `${days}d ` : ''}
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

export function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/dashboard/listings/${listing.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/dashboard/listings/${listing.id}`)}
      className="cursor-pointer rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{listing.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">#{listing.number}</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <KindBadge kind={listing.kind} />
          <StatusBadge status={listing.status} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium uppercase tracking-wide">{listing.currency}</span>
        {listing.status === 'published' && listing.ends_at && (
          <CountdownChip endsAt={listing.ends_at} />
        )}
      </div>
    </div>
  );
}
