'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getIntakeDetail } from '@/lib/api';
import type { IntakeMessage } from '@/types/api';
import { IntakeStatusBadge } from '@/components/intake/IntakeStatusBadge';
import { ExtractionResultPreview } from '@/components/intake/ExtractionResultPreview';

const KIND_ICONS: Record<string, string> = {
  xlsx: '📊',
  csv: '📋',
  pdf: '📄',
  image: '🖼',
  body_text: '📝',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

export default function IntakeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState<IntakeMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getIntakeDetail(id)
      .then((res) => setMessage(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load intake'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error ?? 'Intake message not found.'}
      </div>
    );
  }

  const extraction = message.extractions[0] ?? null;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/intake" className="hover:text-foreground">
          Pending Imports
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{message.subject || 'Intake Detail'}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {message.subject || '(no subject)'}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <IntakeStatusBadge status={message.status} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {message.status === 'failed' && (
            <button
              onClick={() => {
                // Placeholder — retry extraction
                alert('Retry extraction coming soon.');
              }}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Retry Extraction
            </button>
          )}
          {message.status === 'draft_created' && extraction?.listing && (
            <Link
              href={`/dashboard/listings/${extraction.listing.id}`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              View Draft Listing #{extraction.listing.number}
            </Link>
          )}
        </div>
      </div>

      {/* Metadata */}
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Details
        </h2>
        <MetaRow label="Channel">
          <span className="capitalize">{message.channel}</span>
        </MetaRow>
        {message.from_email && (
          <MetaRow label="From">{message.from_email}</MetaRow>
        )}
        <MetaRow label="Received">{formatDate(message.received_at)}</MetaRow>
        <MetaRow label="Status">
          <IntakeStatusBadge status={message.status} />
        </MetaRow>
      </section>

      {/* Files */}
      {message.files.length > 0 && (
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Files ({message.files.length})
          </h2>
          <ul className="space-y-2">
            {message.files.map((file) => (
              <li key={file.id} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{KIND_ICONS[file.kind] ?? '📎'}</span>
                <span className="font-medium">{file.filename}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">
                  {file.kind}
                </span>
                {file.text_extracted && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                    Text extracted
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Extraction results */}
      {extraction ? (
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Extraction Results
          </h2>
          <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Model: <span className="font-mono font-medium text-foreground">{extraction.model}</span></span>
            <span>Prompt version: <span className="font-mono font-medium text-foreground">{extraction.prompt_version}</span></span>
          </div>
          <ExtractionResultPreview extraction={extraction} onPublish={() => load()} />
        </section>
      ) : (
        message.status === 'extracting' && (
          <section className="rounded-xl border bg-card p-5 text-center shadow-sm">
            <div className="flex flex-col items-center gap-3 py-6">
              <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm font-medium">AI is extracting parts from your file…</p>
              <p className="text-xs text-muted-foreground">
                Refresh the page in a few moments to see results.
              </p>
            </div>
          </section>
        )
      )}
    </div>
  );
}
