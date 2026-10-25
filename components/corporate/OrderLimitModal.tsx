'use client';

import { useState } from 'react';
import type { CompanyMember, OrderLimit } from '@/types/api';
import { setOrderLimit } from '@/lib/api';

interface Props {
  member: CompanyMember;
  existing?: OrderLimit;
  onSave: () => void;
  onClose: () => void;
}

export function OrderLimitModal({ member, existing, onSave, onClose }: Props) {
  const [maxAmount, setMaxAmount] = useState(existing?.max_order_amount ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewAmount = maxAmount && parseFloat(maxAmount) > 0
    ? parseFloat(maxAmount).toFixed(2)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!maxAmount || parseFloat(maxAmount) <= 0) {
      setError('Please enter a valid order limit amount.');
      return;
    }

    setLoading(true);
    try {
      await setOrderLimit(member.id, maxAmount);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order limit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">
            Set Order Limit — {member.user.full_name}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Max order amount ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {previewAmount && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              This member cannot place orders above{' '}
              <strong className="text-foreground">${previewAmount}</strong>.
            </p>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save Limit'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
