'use client';

import { useState } from 'react';
import type { ApprovalRequest } from '@/types/api';

interface Props {
  approval: ApprovalRequest;
  canDecide: boolean;
  onDecide: (approved: boolean, note: string) => void;
}

const STATUS_STYLES: Record<ApprovalRequest['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const SUBJECT_LABELS: Record<ApprovalRequest['subject_type'], string> = {
  listing_publish: 'Listing Publish',
  checkout: 'Checkout',
};

export function ApprovalCard({ approval, canDecide, onDecide }: Props) {
  const [deciding, setDeciding] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    if (!deciding) return;
    onDecide(deciding === 'approve', note);
    setDeciding(null);
    setNote('');
  };

  const handleCancel = () => {
    setDeciding(null);
    setNote('');
  };

  const formattedDate = new Date(approval.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-medium text-foreground">{approval.requested_by_name}</span>
            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
              {SUBJECT_LABELS[approval.subject_type]}
            </span>
            {approval.amount && (
              <span className="text-sm font-medium text-foreground">${parseFloat(approval.amount).toFixed(2)}</span>
            )}
          </div>
          {approval.note && (
            <p className="text-sm text-muted-foreground">{approval.note}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{formattedDate}</p>
          {approval.approver_name && approval.decided_at && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Decided by {approval.approver_name} on{' '}
              {new Date(approval.decided_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[approval.status]} ${approval.status === 'pending' ? 'animate-pulse' : ''}`}
        >
          {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
        </span>
      </div>

      {approval.status === 'pending' && canDecide && (
        <div className="mt-3">
          {deciding ? (
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={deciding === 'reject' ? 'Reason for rejection (optional)' : 'Note (optional)'}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${deciding === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {deciding === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                </button>
                <button
                  onClick={handleCancel}
                  className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setDeciding('approve')}
                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => setDeciding('reject')}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
