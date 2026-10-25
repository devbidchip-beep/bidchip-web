'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getThread, sendMessage } from '@/lib/api';
import type { MessageThread as MessageThreadType } from '@/types/api';
import { MessageThread } from '@/components/trust/MessageThread';

const POLL_INTERVAL_MS = 10_000;

export default function MessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [thread, setThread] = useState<MessageThreadType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = useCallback(() => {
    return getThread(id)
      .then((res) => setThread(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load thread'));
  }, [id]);

  // Initial load
  useEffect(() => {
    fetchThread().finally(() => setLoading(false));
  }, [fetchThread]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchThread();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchThread]);

  const handleSend = async (body: string) => {
    await sendMessage(id, body);
    // Refresh after send
    await fetchThread();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-96 rounded-lg bg-muted" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="rounded-md bg-destructive/10 p-6 text-destructive">
        {error ?? 'Thread not found.'}
      </div>
    );
  }

  const counterparty = thread.supplier_order ? 'Supplier' : 'Buyer';
  const refLabel = thread.supplier_order
    ? `Order ${thread.supplier_order.slice(0, 8)}…`
    : thread.listing
    ? `Listing ${thread.listing.slice(0, 8)}…`
    : 'General';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <button
          onClick={() => router.back()}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold">{counterparty}</p>
          <p className="text-xs text-muted-foreground">{refLabel}</p>
        </div>
        {thread.status === 'closed' && (
          <span className="text-xs text-muted-foreground italic bg-muted px-2 py-1 rounded-md">
            Closed
          </span>
        )}
      </div>

      {/* Thread */}
      <div className="flex-1 min-h-0 rounded-lg border bg-card mt-4 flex flex-col overflow-hidden">
        <MessageThread thread={thread} onSend={handleSend} />
      </div>
    </div>
  );
}
