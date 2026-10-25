'use client';

import { useRouter } from 'next/navigation';
import type { IntakeExtraction, IntakeExtractionLine } from '@/types/api';
import { cn } from '@/lib/utils';

interface ExtractionResultPreviewProps {
  extraction: IntakeExtraction;
  onPublish: () => void;
}

function CatalogMatchBadge({ match }: { match: IntakeExtractionLine['catalog_match'] }) {
  if (match === 'exact') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
        ✓ Exact
      </span>
    );
  }
  if (match === 'fuzzy') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        ~ Fuzzy
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      Not in catalog
    </span>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.85
      ? 'text-green-700 dark:text-green-300'
      : value >= 0.7
      ? 'text-yellow-700 dark:text-yellow-300'
      : 'text-red-700 dark:text-red-300';
  return <span className={cn('text-xs font-semibold', color)}>{pct}%</span>;
}

export function ExtractionResultPreview({ extraction, onPublish }: ExtractionResultPreviewProps) {
  const router = useRouter();
  const lines = extraction.result.lines ?? [];
  const overallConfidence = extraction.result.overall_confidence ?? 0;
  const matchedCount = lines.filter((l) => l.catalog_match !== 'none').length;

  const handlePublish = () => {
    if (extraction.listing) {
      router.push(`/dashboard/listings/${extraction.listing.id}`);
    } else {
      onPublish();
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground">{lines.length}</strong> lines extracted
        </span>
        <span>
          <strong className="text-foreground">{matchedCount}</strong> matched to catalog
        </span>
        {extraction.result.title && (
          <span>
            Title: <strong className="text-foreground">{extraction.result.title}</strong>
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">MPN</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Manufacturer</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Qty</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Target Price</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Date Code</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Packaging</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Confidence</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Catalog</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {lines.map((line, idx) => {
              const lowConf = line.confidence < 0.7;
              return (
                <tr
                  key={idx}
                  className={cn(
                    lowConf
                      ? 'bg-yellow-50 dark:bg-yellow-950/30'
                      : 'hover:bg-muted/30',
                  )}
                >
                  <td className="px-3 py-2.5 font-mono font-semibold">
                    {line.mpn}
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {line.ncnr && (
                        <span className="rounded bg-orange-100 px-1 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          NCNR
                        </span>
                      )}
                      {line.require_as6081 && (
                        <span className="rounded bg-purple-100 px-1 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          AS6081
                        </span>
                      )}
                    </div>
                    {lowConf && (
                      <div className="mt-0.5 text-xs text-yellow-700 dark:text-yellow-400">
                        ⚠ Low confidence — please verify
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {line.manufacturer_logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={line.manufacturer_logo}
                          alt=""
                          className="h-4 w-auto object-contain opacity-80"
                        />
                      )}
                      <span className="text-muted-foreground">{line.manufacturer ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{line.quantity.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {line.target_price != null ? `$${line.target_price.toFixed(4)}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center text-muted-foreground">
                    {line.date_code_year ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center text-muted-foreground">
                    {line.packaging ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <ConfidencePill value={line.confidence} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <CatalogMatchBadge match={line.catalog_match} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Overall confidence bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Overall Confidence</span>
          <span className="font-semibold">{Math.round(overallConfidence * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              overallConfidence >= 0.85
                ? 'bg-green-500'
                : overallConfidence >= 0.7
                ? 'bg-yellow-500'
                : 'bg-red-500',
            )}
            style={{ width: `${Math.round(overallConfidence * 100)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePublish}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Review & Publish Draft
        </button>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Something wrong? Try again
        </button>
      </div>
    </div>
  );
}
