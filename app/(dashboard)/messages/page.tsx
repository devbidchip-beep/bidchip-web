'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getThreads } from '@/lib/api';
import type { MessageThread } from '@/types/api';

function lastMessage(thread: MessageThread) {
  if (!thread.messages.length) return null;
  return thread.messages[thread.messages.length - 1];
}

function counterpartyLabel(thread: MessageThread) {
  return thread.supplier_order ? 'Supplier' : 'Buyer';
}

function referenceLabel(thread: MessageThread) {
  if (thread.supplier_order) return `Order ref: ${thread.supplier_order.slice(0, 8)}…`;
  if (thread.listing) return `Listing ref: ${thread.listing.slice(0, 8)}…`;
  return 'General';
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getThreads()
      .then((res) => setThreads(res.data.results))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load messages'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Anonymous messaging with your trading partners.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-muted h-20" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {!loading && !error && threads.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-base font-medium">No message threads yet</p>
          <p className="text-sm text-muted-foreground">
            Message threads are created from your order pages.
          </p>
        </div>
      )}

      {!loading && !error && threads.length > 0 && (
        <div className="space-y-2">
          {threads.map((thread) => {
            const last = lastMessage(thread);
            const counterparty = counterpartyLabel(thread);
            const ref = referenceLabel(thread);
            // Count unread: messages not own and pending or approved without a read marker
            // We approximate unread as pending messages from others
            const unread = thread.messages.filter(
              (m) => !m.is_own && m.moderation_status === 'approved',
            ).length;

            return (
              <Link
                key={thread.id}
                href={`/dashboard/messages/${thread.id}`}
                className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{counterparty}</p>
                      <span className="text-xs text-muted-foreground">{ref}</span>
                      {thread.status === 'closed' && (
                        <span className="text-xs text-muted-foreground italic">(closed)</span>
                      )}
                    </div>
                    {last ? (
                      <p className={`text-sm mt-0.5 truncate ${last.moderation_status === 'blocked' ? 'italic text-muted-foreground' : 'text-muted-foreground'}`}>
                        {last.moderation_status === 'blocked'
                          ? 'Message removed by moderator'
                          : last.moderation_status === 'pending'
                          ? 'Awaiting moderation…'
                          : `${last.is_own ? 'You: ' : ''}${last.body}`}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic mt-0.5">No messages yet</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {last && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(last.sent_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                    {unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
