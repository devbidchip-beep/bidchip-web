'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPublishedListings } from '@/lib/api';
import type { Listing } from '@/types/api';
import { ListingCard } from '@/components/listings/ListingCard';

const PAGE_SIZE = 12;

type KindFilter = 'all' | 'reverse' | 'bom' | 'rfq';
type SortOption = 'newest' | 'ending_soon';

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = {
      limit: String(PAGE_SIZE),
      offset: String((page - 1) * PAGE_SIZE),
    };
    if (search) params.search = search;
    if (kind !== 'all') params.kind = kind;
    if (sort === 'ending_soon') params.ordering = 'ends_at';
    else params.ordering = '-created_at';

    try {
      const res = await getPublishedListings(params);
      setListings(res.data.results);
      setCount(res.data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  }, [search, kind, sort, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, kind, sort]);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground">Browse open listings from buyers</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings…"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
        </div>

        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as KindFilter)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Types</option>
          <option value="reverse">Reverse Auction</option>
          <option value="bom">BOM</option>
          <option value="rfq">RFQ</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="newest">Newest</option>
          <option value="ending_soon">Ending Soon</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {/* Results count */}
      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          {count === 0 ? 'No listings found.' : `${count} listing${count !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-card p-4 shadow-sm">
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/4 rounded bg-muted" />
              </div>
              <div className="mt-4 h-3 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No listings match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
