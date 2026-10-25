'use client';

import { useState } from 'react';
import { markShipped } from '@/lib/api';

const CARRIERS = [
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'dhl', label: 'DHL' },
  { value: 'other', label: 'Other' },
] as const;

interface MarkShippedFormProps {
  supplierOrderId: string;
  onSuccess: () => void;
}

export function MarkShippedForm({ supplierOrderId, onSuccess }: MarkShippedFormProps) {
  const [carrier, setCarrier] = useState<string>('ups');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedTracking, setConfirmedTracking] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await markShipped(supplierOrderId, {
        carrier,
        tracking_number: trackingNumber.trim(),
      });
      setConfirmedTracking(trackingNumber.trim());
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as shipped');
      setLoading(false);
    }
  };

  if (confirmedTracking) {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
        Marked as shipped. Tracking number: <span className="font-mono font-semibold">{confirmedTracking}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Carrier</label>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CARRIERS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tracking Number</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. 1Z999AA10123456784"
            required
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !trackingNumber.trim()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Mark as Shipped'}
      </button>
    </form>
  );
}
