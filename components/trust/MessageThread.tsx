'use client';

import { useState, useEffect, useRef } from 'react';
import type { MessageThread as MessageThreadType } from '@/types/api';

interface MessageThreadProps {
  thread: MessageThreadType;
  onSend: (body: string) => Promise<void>;
}

export function MessageThread({ thread, onSend }: MessageThreadProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await onSend(body);
      setDraft('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const counterpartyLabel = thread.supplier_order ? 'Supplier' : 'Buyer';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {thread.messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation.</p>
        )}
        {thread.messages.map((msg) => {
          const isBlocked = msg.moderation_status === 'blocked';
          const isPending = msg.moderation_status === 'pending';

          if (isBlocked) {
            return (
              <div key={msg.id} className={`flex ${msg.is_own ? 'justify-end' : 'justify-start'}`}>
                <span className="text-xs text-muted-foreground italic px-3 py-1.5 rounded-full bg-muted">
                  Message removed by moderator
                </span>
              </div>
            );
          }

          const sentAt = new Date(msg.sent_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });

          return (
            <div key={msg.id} className={`flex flex-col gap-1 ${msg.is_own ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-muted-foreground px-1">
                {msg.is_own ? 'You' : counterpartyLabel} · {sentAt}
              </span>
              <div
                className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm lg:max-w-md ${
                  msg.is_own
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm'
                }`}
              >
                {msg.body}
              </div>
              {isPending && (
                <span className="text-xs text-muted-foreground italic px-1">Awaiting moderation</span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {thread.status === 'open' && (
        <div className="border-t p-3 space-y-2 bg-card">
          {sendError && (
            <p className="text-xs text-destructive">{sendError}</p>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              disabled={sending}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed self-stretch"
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}
      {thread.status === 'closed' && (
        <div className="border-t p-3 text-center text-sm text-muted-foreground bg-muted/30">
          This thread is closed.
        </div>
      )}
    </div>
  );
}
