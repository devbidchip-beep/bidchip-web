'use client';

import { useState } from 'react';
import { submitRating } from '@/lib/api';

interface RatingFormProps {
  supplierOrderId: string;
  direction: 'buyer_to_supplier' | 'supplier_to_buyer';
  onSuccess: () => void;
}

const CRITERIA: { key: 'quality' | 'communication' | 'shipping' | 'documentation'; label: string }[] = [
  { key: 'quality', label: 'Quality' },
  { key: 'communication', label: 'Communication' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'documentation', label: 'Documentation' },
];

function StarInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium w-32 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => {
          const active = hovered > 0 ? i <= hovered : i <= value;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              className="focus:outline-none"
              aria-label={`${i} star${i !== 1 ? 's' : ''}`}
            >
              <svg
                className={`h-6 w-6 transition-colors ${active ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
        {value > 0 && (
          <span className="ml-1 text-xs text-muted-foreground tabular-nums">{value}/5</span>
        )}
      </div>
    </div>
  );
}

export function RatingForm({ supplierOrderId, direction, onSuccess }: RatingFormProps) {
  const [scores, setScores] = useState({
    quality: 0,
    communication: 0,
    shipping: 0,
    documentation: 0,
  });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const allScored = Object.values(scores).every((v) => v > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allScored || loading) return;
    setLoading(true);
    setError(null);
    try {
      await submitRating({
        supplier_order: supplierOrderId,
        direction,
        ...scores,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base font-semibold text-green-700">Rating submitted</p>
        <p className="text-sm text-muted-foreground">Thank you for your feedback.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        {CRITERIA.map(({ key, label }) => (
          <StarInput
            key={key}
            label={label}
            value={scores[key]}
            onChange={(v) => setScores((prev) => ({ ...prev, [key]: v }))}
          />
        ))}
      </div>

      <div className="space-y-1">
        <label htmlFor="rating-comment" className="block text-sm font-medium">
          Comment <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="rating-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience…"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={!allScored || loading}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting…' : 'Submit Rating'}
      </button>
      {!allScored && (
        <p className="text-xs text-muted-foreground text-center">Please rate all four criteria to submit.</p>
      )}
    </form>
  );
}
