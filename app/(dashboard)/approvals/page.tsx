'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ApprovalRequest } from '@/types/api';
import { getApprovals } from '@/lib/api';
import { ApprovalCard } from '@/components/corporate/ApprovalCard';

export default function MyApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApprovals();
      setApprovals(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = approvals.filter((a) => a.status === 'pending');
  const decided = approvals.filter((a) => a.status !== 'pending');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">Track the status of your approval requests.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <>
          {/* Pending */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Pending ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="rounded-lg border bg-card px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">No pending approvals.</p>
              </div>
            ) : (
              pending.map((a) => (
                <ApprovalCard
                  key={a.id}
                  approval={a}
                  canDecide={false}
                  onDecide={() => {}}
                />
              ))
            )}
          </section>

          {/* Decided */}
          {decided.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Decided ({decided.length})
              </h2>
              {decided.map((a) => (
                <ApprovalCard
                  key={a.id}
                  approval={a}
                  canDecide={false}
                  onDecide={() => {}}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
