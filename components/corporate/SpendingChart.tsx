'use client';

import { useState, useEffect } from 'react';
import type { SpendingReportRow, CompanyMember } from '@/types/api';
import { getSpendingReport } from '@/lib/api';

interface Props {
  rows: SpendingReportRow[];
}

const ROLE_COLORS: Record<CompanyMember['role'], string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  finance: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  manager: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  buyer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  seller: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  read_only: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const ROLE_LABELS: Record<CompanyMember['role'], string> = {
  owner: 'Owner',
  finance: 'Finance',
  manager: 'Manager',
  buyer: 'Buyer',
  seller: 'Seller',
  read_only: 'Read Only',
};

type RangeKey = 'this_month' | 'last_month' | 'this_quarter' | 'custom';

function getDateRange(key: RangeKey): { from: string; to: string } {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = now.getMonth(); // 0-indexed

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (key === 'this_month') {
    const from = new Date(yyyy, mm, 1);
    const to = new Date(yyyy, mm + 1, 0);
    return { from: fmt(from), to: fmt(to) };
  }
  if (key === 'last_month') {
    const from = new Date(yyyy, mm - 1, 1);
    const to = new Date(yyyy, mm, 0);
    return { from: fmt(from), to: fmt(to) };
  }
  if (key === 'this_quarter') {
    const q = Math.floor(mm / 3);
    const from = new Date(yyyy, q * 3, 1);
    const to = new Date(yyyy, q * 3 + 3, 0);
    return { from: fmt(from), to: fmt(to) };
  }
  // custom — caller handles
  return { from: fmt(new Date(yyyy, mm, 1)), to: fmt(new Date(yyyy, mm + 1, 0)) };
}

export function SpendingChart({ rows: initialRows }: Props) {
  const [rangeKey, setRangeKey] = useState<RangeKey>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [rows, setRows] = useState<SpendingReportRow[]>(initialRows);
  const [loading, setLoading] = useState(false);

  const fetchRows = async (from: string, to: string) => {
    setLoading(true);
    try {
      const res = await getSpendingReport(from, to);
      setRows(res.data);
    } catch {
      // keep existing rows on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rangeKey === 'custom') return;
    const { from, to } = getDateRange(rangeKey);
    fetchRows(from, to);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      fetchRows(customFrom, customTo);
    }
  };

  const sorted = [...rows].sort((a, b) => parseFloat(b.total_spent) - parseFloat(a.total_spent));
  const maxSpent = sorted.length > 0 ? parseFloat(sorted[0].total_spent) : 1;
  const grandTotal = rows.reduce((s, r) => s + parseFloat(r.total_spent), 0);
  const currency = rows[0]?.currency ?? 'USD';

  return (
    <div className="space-y-4">
      {/* Date range selector */}
      <div className="flex flex-wrap items-center gap-2">
        {(['this_month', 'last_month', 'this_quarter', 'custom'] as RangeKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setRangeKey(key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${rangeKey === key ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}
          >
            {key === 'this_month' ? 'This month' : key === 'last_month' ? 'Last month' : key === 'this_quarter' ? 'This quarter' : 'Custom'}
          </button>
        ))}
        {rangeKey === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleCustomApply}
              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No spending data for this period.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((row) => {
            const spent = parseFloat(row.total_spent);
            const pct = maxSpent > 0 ? (spent / maxSpent) * 100 : 0;
            return (
              <div key={row.member_name} className="flex items-center gap-3">
                <div className="w-32 shrink-0 truncate">
                  <p className="text-sm font-medium truncate">{row.member_name}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${ROLE_COLORS[row.role]}`}>
                    {ROLE_LABELS[row.role]}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="w-36 shrink-0 text-right">
                  <span className="text-sm font-medium">${spent.toFixed(2)}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{row.order_count} order{row.order_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            );
          })}

          <div className="border-t pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-sm font-semibold">${grandTotal.toFixed(2)} {currency}</span>
          </div>
        </div>
      )}

      {/* Exportable table */}
      {sorted.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Member</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium text-right">Orders</th>
                <th className="pb-2 font-medium text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((row) => (
                <tr key={row.member_name}>
                  <td className="py-2">{row.member_name}</td>
                  <td className="py-2 capitalize">{ROLE_LABELS[row.role]}</td>
                  <td className="py-2 text-right">{row.order_count}</td>
                  <td className="py-2 text-right">${parseFloat(row.total_spent).toFixed(2)} {row.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
