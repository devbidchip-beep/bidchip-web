'use client';

import type { Rating } from '@/types/api';
import { StarRating } from './StarRating';

interface RatingDisplayProps {
  rating: Rating;
}

const CRITERIA: { key: keyof Pick<Rating, 'quality' | 'communication' | 'shipping' | 'documentation'>; label: string }[] = [
  { key: 'quality', label: 'Quality' },
  { key: 'communication', label: 'Communication' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'documentation', label: 'Documentation' },
];

export function RatingDisplay({ rating }: RatingDisplayProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CRITERIA.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <StarRating score={rating[key]} size="sm" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
        <span className="text-sm font-semibold">Average Score</span>
        <StarRating score={rating.average_score} size="md" />
      </div>
      {rating.comment && (
        <p className="text-sm text-muted-foreground italic">"{rating.comment}"</p>
      )}
    </div>
  );
}
