'use client';

import { useState } from 'react';
import type { InventoryItem } from '@/types/api';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete: (id: string) => void;
}

const SOURCE_CONFIG: Record<InventoryItem['source'], { label: string; className: string }> = {
  csv: {
    label: 'CSV',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  email: {
    label: 'Email',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  api: {
    label: 'API',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  manual: {
    label: 'Manual',
    className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
};

function SourceBadge({ source }: { source: InventoryItem['source'] }) {
  const config = SOURCE_CONFIG[source];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

export function InventoryTable({ items, onDelete }: InventoryTableProps) {
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paged = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteClick = (id: string) => setConfirmId(id);

  const handleConfirmDelete = () => {
    if (confirmId) {
      onDelete(confirmId);
      setConfirmId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-muted-foreground">
          No inventory items. Upload a CSV or add items manually.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Confirm dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-xl">
            <h3 className="text-base font-semibold">Remove inventory item?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Remove this item from your inventory? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-md bg-destructive px-4 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">MPN</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Manufacturer</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Qty</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Date Code</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Packaging</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Unit Price</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Ship From</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Source</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {paged.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="px-3 py-2.5 font-mono font-semibold">{item.mpn_raw}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{item.manufacturer_raw || '—'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{item.quantity.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center text-muted-foreground">
                  {item.date_code_year ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-center text-muted-foreground">
                  {item.packaging ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                  {item.unit_price != null
                    ? `${item.currency} ${item.unit_price}`
                    : '—'}
                </td>
                <td className="px-3 py-2.5 text-center text-muted-foreground">
                  {item.ship_from_country || '—'}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <SourceBadge source={item.source} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    onClick={() => handleDeleteClick(item.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
