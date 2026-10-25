'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { resolveDispute } from '@/lib/api';
import type { Dispute } from '@/types/api';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const REASON_LABELS: Record<Dispute['reason'], string> = {
  not_as_described: 'Not as described',
  quantity: 'Wrong quantity',
  counterfeit_suspected: 'Counterfeit suspected',
  damaged: 'Damaged in transit',
  not_received: 'Not received',
  other: 'Other',
};

const STATUS_CONFIG: Record<
  Dispute['status'],
  { classes: string; label: string }
> = {
  open: { classes: 'bg-red-100 text-red-800', label: 'Open' },
  awaiting_return: { classes: 'bg-orange-100 text-orange-800', label: 'Awaiting Return' },
  under_review: { classes: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
  resolved_buyer: { classes: 'bg-green-100 text-green-800', label: 'Resolved — Buyer' },
  resolved_seller: { classes: 'bg-blue-100 text-blue-800', label: 'Resolved — Seller' },
  split: { classes: 'bg-teal-100 text-teal-800', label: 'Split Decision' },
  withdrawn: { classes: 'bg-gray-100 text-gray-600', label: 'Withdrawn' },
};

const STATUS_TIMELINE: Dispute['status'][] = [
  'open',
  'awaiting_return',
  'under_review',
  'resolved_buyer',
];

const RESOLVE_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'resolved_buyer', label: 'Resolved — Buyer' },
  { value: 'resolved_seller', label: 'Resolved — Seller' },
  { value: 'split', label: 'Split Decision' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useCurrentUser();
  const isTrusty = (user as { staff_role?: string | null } | null)?.staff_role === 'trusty';

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve form state
  const [resolveStatus, setResolveStatus] = useState('resolved_buyer');
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch dispute — in a real app this would call getDispute(id)
    // For now we re-use getDisputes and filter, or assume the dispute detail endpoint
    import('@/lib/api').then(({ getDisputes }) => {
      getDisputes()
        .then((res) => {
          const found = res.data.results.find((d) => d.id === id);
          if (found) {
            setDispute(found);
          } else {
            setError('Dispute not found.');
          }
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dispute'))
        .finally(() => setLoading(false));
    });
  }, [id]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNote.trim() || resolveLoading) return;
    setResolveLoading(true);
    setResolveError(null);
    try {
      const res = await resolveDispute(id, {
        status: resolveStatus,
        resolution_note: resolutionNote.trim(),
      });
      setDispute(res.data);
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setResolveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-4 w-1/4 rounded bg-muted" />
        <div className="h-48 rounded-lg bg-muted" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="rounded-md bg-destructive/10 p-6 text-destructive">
        {error ?? 'Dispute not found.'}
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[dispute.status];
  const openedDate = new Date(dispute.opened_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const isResolved = ['resolved_buyer', 'resolved_seller', 'split', 'withdrawn'].includes(dispute.status);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold tracking-tight flex-1">
          Dispute: {REASON_LABELS[dispute.reason]}
        </h1>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            statusConfig.classes,
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Details card */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Reason</p>
            <p className="font-medium">{REASON_LABELS[dispute.reason]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Opened</p>
            <p className="font-medium">{openedDate}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm leading-relaxed">{dispute.description}</p>
          </div>
        </div>
      </div>

      {/* Evidence files placeholder */}
      <div className="rounded-lg border bg-card p-5 space-y-2">
        <h2 className="text-sm font-semibold">Evidence Files</h2>
        <p className="text-sm text-muted-foreground italic">
          File attachments will appear here once the evidence upload integration is complete.
        </p>
      </div>

      {/* Status timeline */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Status History</h2>
        <ol className="relative border-l border-muted-foreground/20 ml-3 space-y-4">
          <li className="pl-5 relative">
            <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary" />
            <p className="text-sm font-medium">Opened</p>
            <p className="text-xs text-muted-foreground">{openedDate}</p>
          </li>
          {dispute.status !== 'open' && (
            <li className="pl-5 relative">
              <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-muted-foreground/40" />
              <p className="text-sm font-medium">{statusConfig.label}</p>
              {dispute.resolved_at && (
                <p className="text-xs text-muted-foreground">
                  {new Date(dispute.resolved_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </li>
          )}
        </ol>
      </div>

      {/* Resolution note */}
      {isResolved && dispute.resolution_note && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-green-900">Resolution Note</h2>
          <p className="text-sm text-green-800">{dispute.resolution_note}</p>
        </div>
      )}

      {/* Trusty resolve form */}
      {isTrusty && !isResolved && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Resolve Dispute</h2>
          <form onSubmit={handleResolve} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Outcome</label>
              <select
                value={resolveStatus}
                onChange={(e) => setResolveStatus(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {RESOLVE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Resolution Note <span className="text-destructive">*</span>
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                required
                rows={4}
                placeholder="Explain the resolution decision…"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {resolveError && (
              <p className="text-sm text-destructive">{resolveError}</p>
            )}
            <button
              type="submit"
              disabled={!resolutionNote.trim() || resolveLoading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {resolveLoading ? 'Saving…' : 'Save Resolution'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
