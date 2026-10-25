'use client';

import type { Dispute } from '@/types/api';
import { cn } from '@/lib/utils';

interface DisputeCardProps {
  dispute: Dispute;
}

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
  { classes: string; label: string; pulse?: boolean }
> = {
  open: { classes: 'bg-red-100 text-red-800', label: 'Open', pulse: true },
  awaiting_return: { classes: 'bg-orange-100 text-orange-800', label: 'Awaiting Return' },
  under_review: { classes: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
  resolved_buyer: { classes: 'bg-green-100 text-green-800', label: 'Resolved — Buyer' },
  resolved_seller: { classes: 'bg-blue-100 text-blue-800', label: 'Resolved — Seller' },
  split: { classes: 'bg-teal-100 text-teal-800', label: 'Split Decision' },
  withdrawn: { classes: 'bg-gray-100 text-gray-600', label: 'Withdrawn' },
};

export function DisputeCard({ dispute }: DisputeCardProps) {
  const statusConfig = STATUS_CONFIG[dispute.status];
  const openedDate = new Date(dispute.opened_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const truncated =
    dispute.description.length > 120
      ? dispute.description.slice(0, 120) + '…'
      : dispute.description;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">{REASON_LABELS[dispute.reason]}</p>
          <p className="text-xs text-muted-foreground">Opened {openedDate}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
            statusConfig.classes,
          )}
        >
          {statusConfig.pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
          )}
          {statusConfig.label}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{truncated}</p>

      {dispute.resolution_note && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Resolution: </span>
          {dispute.resolution_note}
        </div>
      )}
    </div>
  );
}
