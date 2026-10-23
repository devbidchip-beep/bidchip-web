'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getListingDetail, publishListing, getBidsForLine } from '@/lib/api';
import type { ListingDetail, ListingLine } from '@/types/api';
import { useCountdown } from '@/hooks/useCountdown';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import { BidForm } from '@/components/bidding/BidForm';
import { BidList } from '@/components/bidding/BidList';

// ─── Badges ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ListingDetail['status'] }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    published: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-200 text-gray-600',
    awarded: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        styles[status] ?? 'bg-gray-100 text-gray-700',
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function ComplianceBadge({ status }: { status: ListingLine['compliance_status'] }) {
  const styles: Record<ListingLine['compliance_status'], string> = {
    clear: 'bg-green-100 text-green-700',
    flagged: 'bg-yellow-100 text-yellow-800',
    officer_review: 'bg-orange-100 text-orange-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        styles[status],
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function FlagBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      {children}
    </span>
  );
}

function CountdownDisplay({ endsAt }: { endsAt: string | null }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(endsAt);
  if (!endsAt) return <span className="text-muted-foreground">—</span>;
  if (isExpired) return <span className="text-muted-foreground">Expired</span>;
  return (
    <span className="tabular-nums">
      {days > 0 ? `${days}d ` : ''}
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

// ─── Bids count badge ─────────────────────────────────────────────────────────

function BidsCountBadge({ lineId }: { lineId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    getBidsForLine(lineId)
      .then((res) => setCount(res.data.filter((b) => b.status === 'active').length))
      .catch(() => setCount(null));
  }, [lineId]);

  if (count === null) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
      {count} bid{count !== 1 ? 's' : ''}
    </span>
  );
}

// ─── Line row with expandable bids ───────────────────────────────────────────

interface LineRowProps {
  line: ListingLine;
  listing: ListingDetail;
  isOwner: boolean;
  isSupplier: boolean;
  currentCompanyId?: string;
}

function LineRow({ line, listing, isOwner, isSupplier, currentCompanyId }: LineRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);

  const canBid =
    isSupplier &&
    !isOwner &&
    line.status === 'open' &&
    listing.status === 'published';

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-muted/30">
        <td className="px-4 py-3 text-muted-foreground">{line.line_no}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {line.manufacturer?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={line.manufacturer.logo_url}
                alt={line.manufacturer.name}
                className="h-4 w-8 object-contain"
              />
            )}
            <span className="font-medium">{line.mpn_raw}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {line.manufacturer?.name ?? line.manufacturer_raw ?? '—'}
        </td>
        <td className="px-4 py-3 tabular-nums">{line.quantity.toLocaleString()}</td>
        <td className="px-4 py-3 tabular-nums">{line.target_unit_price ?? '—'}</td>
        <td className="px-4 py-3 capitalize">{line.packaging?.replace('_', ' ') ?? 'Any'}</td>
        <td className="px-4 py-3">
          <ComplianceBadge status={line.compliance_status} />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {line.ncnr && <FlagBadge>NCNR</FlagBadge>}
            {line.part?.is_itar && <FlagBadge>ITAR</FlagBadge>}
            {line.require_as6081 && <FlagBadge>AS6081</FlagBadge>}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <BidsCountBadge lineId={line.id} />
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-primary hover:underline"
            >
              {expanded ? 'Hide Bids' : 'View Bids'}
            </button>
            {canBid && (
              <button
                onClick={() => setShowBidForm((v) => !v)}
                className="text-xs text-muted-foreground hover:underline"
              >
                {showBidForm ? 'Cancel' : 'Bid'}
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded bids panel */}
      {expanded && (
        <tr>
          <td colSpan={9} className="px-4 pb-4 pt-2 bg-muted/10">
            <BidList
              lineId={line.id}
              listingKind={listing.kind as 'reverse' | 'bom' | 'rfq'}
              isOwner={isOwner}
              lineStatus={line.status}
              listingStatus={listing.status}
              currentCompanyId={currentCompanyId}
            />
          </td>
        </tr>
      )}

      {/* Bid form panel */}
      {showBidForm && (
        <tr>
          <td colSpan={9} className="px-4 pb-4 pt-2 bg-muted/10">
            <BidForm
              line={line}
              onSuccess={() => {
                setShowBidForm(false);
                setExpanded(true);
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useCurrentUser();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    getListingDetail(id)
      .then((res) => setListing(res.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load listing'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handlePublish = async () => {
    if (!listing) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await publishListing(listing.id);
      setListing(res.data);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  // NOTE: In a real app, isOwner and isSupplier would come from session/company context.
  // Here we derive them from what's available. The session user email can be used
  // to match against company membership in a future hook.
  // For now, we pass flags as false/true and let BidForm/BidList render appropriately.
  // TODO: wire up real company membership check once useCompany hook is available.
  const isOwner = false; // placeholder — replace with real check
  const isSupplier = true; // placeholder — replace with real check
  const currentCompanyId = undefined; // placeholder

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-4 w-1/4 rounded bg-muted" />
        <div className="h-48 rounded-lg bg-muted" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="rounded-md bg-destructive/10 p-6 text-destructive">
        {error ?? 'Listing not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{listing.title}</h1>
            <StatusBadge status={listing.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            #{listing.number} &middot; {listing.kind.toUpperCase()} &middot; {listing.currency}
          </p>
          {listing.anonymous && listing.status === 'published' && (
            <p className="text-xs text-muted-foreground italic">
              Suppliers see this listing anonymously
            </p>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          {listing.status === 'draft' && (
            <>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {publishing ? 'Publishing…' : 'Publish Listing'}
              </button>
              {publishError && (
                <p className="text-xs text-destructive">{publishError}</p>
              )}
            </>
          )}
          {listing.status === 'published' && (
            <button
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => {
                /* placeholder */
              }}
            >
              Close Listing
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="text-xs text-muted-foreground hover:underline"
          >
            Back
          </button>
        </div>
      </div>

      {/* Meta card */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border bg-card p-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Ends</p>
          <p className="font-medium">
            <CountdownDisplay endsAt={listing.ends_at} />
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="font-medium">{listing.duration_minutes / 60}h</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ship To</p>
          <p className="font-medium">{listing.ship_to ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Lines</p>
          <p className="font-medium">{listing.lines.length}</p>
        </div>
      </div>

      {/* Lines table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Parts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">MPN</th>
                <th className="px-4 py-2">Manufacturer</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Target $</th>
                <th className="px-4 py-2">Packaging</th>
                <th className="px-4 py-2">Compliance</th>
                <th className="px-4 py-2">Flags</th>
                <th className="px-4 py-2">Bids</th>
              </tr>
            </thead>
            <tbody>
              {listing.lines.map((line) => (
                <LineRow
                  key={line.id}
                  line={line}
                  listing={listing}
                  isOwner={isOwner}
                  isSupplier={isSupplier}
                  currentCompanyId={currentCompanyId}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
