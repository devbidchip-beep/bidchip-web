'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDisputes } from '@/lib/api';
import type { Dispute } from '@/types/api';
import { DisputeCard } from '@/components/trust/DisputeCard';

type Tab = 'open' | 'under_review' | 'resolved';

const OPEN_STATUSES: Dispute['status'][] = ['open', 'awaiting_return'];
const REVIEW_STATUSES: Dispute['status'][] = ['under_review'];
const RESOLVED_STATUSES: Dispute['status'][] = [
  'resolved_buyer',
  'resolved_seller',
  'split',
  'withdrawn',
];

function filterByTab(disputes: Dispute[], tab: Tab): Dispute[] {
  if (tab === 'open') return disputes.filter((d) => OPEN_STATUSES.includes(d.status));
  if (tab === 'under_review') return disputes.filter((d) => REVIEW_STATUSES.includes(d.status));
  return disputes.filter((d) => RESOLVED_STATUSES.includes(d.status));
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('open');

  useEffect(() => {
    getDisputes()
      .then((res) => setDisputes(res.data.results))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load disputes'))
      .finally(() => setLoading(false));
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'open', label: 'Open' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'resolved', label: 'Resolved' },
  ];

  const visible = filterByTab(disputes, activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Disputes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage your open disputes with suppliers.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => {
          const count = filterByTab(disputes, tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-muted h-32" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          {activeTab === 'open' ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-medium">No open disputes</p>
              <p className="text-sm text-muted-foreground">All your orders are dispute-free.</p>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-muted-foreground">No disputes in this category.</p>
            </>
          )}
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((dispute) => (
            <Link key={dispute.id} href={`/dashboard/disputes/${dispute.id}`} className="block hover:no-underline">
              <DisputeCard dispute={dispute} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
