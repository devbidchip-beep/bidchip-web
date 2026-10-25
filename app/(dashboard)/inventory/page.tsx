'use client';

import { useState, useEffect, useCallback } from 'react';
import { getInventory, deleteInventoryItem } from '@/lib/api';
import type { InventoryItem, InventoryImport } from '@/types/api';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { AddInventoryForm } from '@/components/inventory/AddInventoryForm';
import { InventoryCSVUploader } from '@/components/inventory/InventoryCSVUploader';

type TabKey = 'items' | 'imports';

// Placeholder import history — the real data would come from a dedicated API
const MOCK_IMPORTS: InventoryImport[] = [];

function ImportStatusBadge({ status }: { status: InventoryImport['status'] }) {
  const styles: Record<InventoryImport['status'], string> = {
    queued: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('items');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);

  const loadItems = useCallback(() => {
    setLoading(true);
    setError(null);
    getInventory()
      .then((res) => {
        setItems(res.data.results);
        setTotalCount(res.data.count);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load inventory'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = search.trim()
    ? items.filter((item) =>
        item.mpn_raw.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  const handleDelete = async (id: string) => {
    try {
      await deleteInventoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotalCount((c) => c - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Inventory</h1>
          <p className="text-muted-foreground">
            {totalCount > 0 ? `${totalCount} item${totalCount !== 1 ? 's' : ''}` : 'Manage your component stock'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
        {([
          { key: 'items', label: 'Inventory Items' },
          { key: 'imports', label: 'Import History' },
        ] as { key: TabKey; label: string }[]).map((tab) => (
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

      {/* Inventory Items tab */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by MPN…"
                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Add Item
              </button>
              <button
                onClick={() => setShowCSVModal(true)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Upload CSV
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
                  <div className="h-4 w-full rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <InventoryTable items={filteredItems} onDelete={handleDelete} />
          )}
        </div>
      )}

      {/* Import History tab */}
      {activeTab === 'imports' && (
        <div>
          {MOCK_IMPORTS.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <p className="text-muted-foreground">
                No import history yet. Upload a CSV to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Total Rows</th>
                    <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">OK</th>
                    <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Failed</th>
                    <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {MOCK_IMPORTS.map((imp) => (
                    <tr key={imp.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(imp.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums">{imp.rows_total}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-green-700 dark:text-green-400">
                        {imp.rows_ok}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-destructive">
                        {imp.rows_failed}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ImportStatusBadge status={imp.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {imp.error_report_url ? (
                          <a
                            href={imp.error_report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <Modal title="Add Inventory Item" onClose={() => setShowAddModal(false)}>
          <AddInventoryForm
            onSuccess={(item) => {
              setItems((prev) => [item, ...prev]);
              setTotalCount((c) => c + 1);
              setShowAddModal(false);
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* CSV Upload Modal */}
      {showCSVModal && (
        <Modal title="Upload Inventory CSV" onClose={() => setShowCSVModal(false)}>
          <InventoryCSVUploader
            onSuccess={() => {
              setShowCSVModal(false);
              loadItems();
            }}
            onCancel={() => setShowCSVModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}
