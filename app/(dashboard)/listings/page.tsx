'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getListings } from '@/lib/api';
import type { Listing } from '@/types/api';
import { ListingCard } from '@/components/listings/ListingCard';

type TabKey = 'all' | 'draft' | 'published' | 'closed';

const TABS: { key: TabKey; label: string; status?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft', status: 'draft' },
  { key: 'published', label: 'Published', status: 'published' },
  { key: 'closed', label: 'Closed / Awarded' },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/4 rounded bg-muted" />
        </div>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="mt-4 h-3 w-1/3 rounded bg-muted" />
    </div>
  );
}

export default function ListingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const tab = TABS.find((t) => t.key === activeTab);
    const params: { status?: string } = {};
    if (tab?.status) params.status = tab.status;
    if (activeTab === 'closed') params.status = 'closed,awarded,cancelled,expired';

    getListings(params)
      .then((res) => setListings(res.data.results))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load listings'))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
          <p className="text-muted-foreground">Manage your component listings</p>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Listing
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? 'rounded-md bg-background px-4 py-1.5 text-sm font-medium shadow-sm'
                : 'rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No listings yet. Create your first listing.</p>
          <Link
            href="/dashboard/listings/new"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
