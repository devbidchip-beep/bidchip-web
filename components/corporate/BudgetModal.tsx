'use client';

import { useState } from 'react';
import type { CompanyMember, Budget } from '@/types/api';
import { setBudget } from '@/lib/api';

interface Props {
  member: CompanyMember;
  existing?: Budget;
  onSave: () => void;
  onClose: () => void;
}

function firstOfCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export function BudgetModal({ member, existing, onSave, onClose }: Props) {
  const [period, setPeriod] = useState<'month' | 'quarter'>(existing?.period ?? 'month');
  const [periodStart, setPeriodStart] = useState(existing?.period_start ?? firstOfCurrentMonth());
  const [amount, setAmount] = useState(existing?.amount ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spentNum = existing ? parseFloat(existing.spent_this_period) : 0;
  const budgetNum = existing ? parseFloat(existing.amount) : 0;
  const spentPct = budgetNum > 0 ? Math.min(100, (spentNum / budgetNum) * 100) : 0;
  const periodLabel = existing?.period === 'quarter' ? 'quarter' : 'month';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid budget amount.');
      return;
    }

    setLoading(true);
    try {
      await setBudget({ member: member.id, period, period_start: periodStart, amount });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">
            Set Budget — {member.user.full_name}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {existing && (
            <div className="rounded-md bg-muted p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                Spent ${spentNum.toFixed(2)} of ${budgetNum.toFixed(2)} this {periodLabel}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full transition-all ${spentPct >= 90 ? 'bg-red-500' : spentPct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${spentPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground text-right">{spentPct.toFixed(0)}% used</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'month' | 'quarter')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Period start</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Budget amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">USD $</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-input bg-background py-2 pl-16 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save Budget'}
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
