'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getIntakeMessages } from '@/lib/api';
import type { IntakeMessage } from '@/types/api';
import { IntakeUploader } from '@/components/intake/IntakeUploader';
import { IntakeStatusBadge } from '@/components/intake/IntakeStatusBadge';

type TabKey = 'all' | 'processing' | 'needs_review' | 'draft_created' | 'failed';

const TABS: { key: TabKey; label: string; status?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'processing', label: 'Processing', status: 'extracting' },
  { key: 'needs_review', label: 'Needs Review', status: 'needs_review' },
  { key: 'draft_created', label: 'Draft Created', status: 'draft_created' },
  { key: 'failed', label: 'Failed', status: 'failed' },
];

const CHANNEL_LABELS: Record<IntakeMessage['channel'], string> = {
  email: 'EMAIL',
  upload: 'UPLOAD',
  api: 'API',
};

const CHANNEL_STYLES: Record<IntakeMessage['channel'], string> = {
  email: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  upload: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  api: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function IntakePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [messages, setMessages] = useState<IntakeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const tab = TABS.find((t) => t.key === activeTab);
    const params: { status?: string } = {};
    if (tab?.status) params.status = tab.status;

    getIntakeMessages(params)
      .then((res) => setMessages(res.data.results))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load imports'))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pending Imports</h1>
        <p className="text-muted-foreground">
          Upload a BOM or spreadsheet — AI will extract parts and create a draft listing.
        </p>
      </div>

      {/* Uploader section */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Upload BOM / Spreadsheet</h2>
        <IntakeUploader />
      </section>

      {/* Import history */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Import History</h2>

        {/* Filter tabs */}
        <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit flex-wrap">
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

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
                <div className="flex items-center gap-4">
                  <div className="h-5 w-16 rounded-full bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="ml-auto h-5 w-20 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-lg border bg-card p-10 text-center">
            <p className="text-muted-foreground">No import history yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Channel</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Subject / File</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Received</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Lines</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {messages.map((msg) => {
                  const lineCount = msg.extractions[0]?.line_count ?? null;
                  return (
                    <tr key={msg.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tracking-wide ${CHANNEL_STYLES[msg.channel]}`}
                        >
                          {CHANNEL_LABELS[msg.channel]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{msg.subject || '(no subject)'}</p>
                        {msg.from_email && (
                          <p className="text-xs text-muted-foreground">{msg.from_email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <IntakeStatusBadge status={msg.status} />
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {formatDate(msg.received_at)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {lineCount != null ? lineCount : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/dashboard/intake/${msg.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
