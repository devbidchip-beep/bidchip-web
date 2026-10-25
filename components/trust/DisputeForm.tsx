'use client';

import { useState, useRef } from 'react';
import type { Dispute } from '@/types/api';
import { openDispute } from '@/lib/api';

interface DisputeFormProps {
  supplierOrderId: string;
  onSuccess: (dispute: Dispute) => void;
}

const REASON_OPTIONS: { value: Dispute['reason']; label: string }[] = [
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'quantity', label: 'Wrong quantity' },
  { value: 'counterfeit_suspected', label: 'Counterfeit suspected' },
  { value: 'damaged', label: 'Damaged in transit' },
  { value: 'not_received', label: 'Not received' },
  { value: 'other', label: 'Other' },
];

export function DisputeForm({ supplierOrderId, onSuccess }: DisputeFormProps) {
  const [reason, setReason] = useState<Dispute['reason'] | ''>('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const descriptionValid = description.trim().length >= 20;
  const canSubmit = reason !== '' && descriptionValid && !loading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await openDispute({
        supplier_order: supplierOrderId,
        reason,
        description: description.trim(),
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Warning banner */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">Important</p>
        <p className="mt-0.5">
          Opening a dispute will pause the seller&apos;s payout until resolved. A BidChip trusty will review within 2 business days.
        </p>
      </div>

      {/* Reason */}
      <div className="space-y-1">
        <label htmlFor="dispute-reason" className="block text-sm font-medium">
          Reason <span className="text-destructive">*</span>
        </label>
        <select
          id="dispute-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as Dispute['reason'])}
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select a reason…</option>
          {REASON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="dispute-description" className="block text-sm font-medium">
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          id="dispute-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={20}
          rows={4}
          placeholder="Describe the issue in detail (minimum 20 characters)…"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className={`text-xs ${descriptionValid || description.length === 0 ? 'text-muted-foreground' : 'text-destructive'}`}>
          {description.trim().length}/20 minimum characters
        </p>
      </div>

      {/* File upload */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Upload evidence (photos, documents)</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors w-full text-center"
        >
          Click to select files (multiple allowed)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx"
        />
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((file, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {file.name}
                <span className="text-muted-foreground/60">
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Opening dispute…' : 'Open Dispute'}
      </button>
    </form>
  );
}
