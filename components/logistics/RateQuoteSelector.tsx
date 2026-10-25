'use client';

import { useState, useEffect } from 'react';
import { getShipmentRates, chooseRate, createLabel } from '@/lib/api';
import type { RateQuote } from '@/types/api';
import { cn } from '@/lib/utils';

const CARRIER_LABEL: Record<string, string> = {
  ups: 'UPS',
  fedex: 'FedEx',
  dhl: 'DHL',
};

function fmtPrice(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

interface RateQuoteSelectorProps {
  shipmentId: string;
  onChosen: (quote: RateQuote) => void;
}

export function RateQuoteSelector({ shipmentId, onChosen }: RateQuoteSelectorProps) {
  const [quotes, setQuotes] = useState<RateQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<{ tracking_number: string; label_url: string } | null>(null);

  useEffect(() => {
    getShipmentRates(shipmentId)
      .then((res) => {
        setQuotes(res.data);
        const preChosen = res.data.find((q) => q.chosen);
        if (preChosen) setSelectedId(preChosen.id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch rates'))
      .finally(() => setLoading(false));
  }, [shipmentId]);

  const handleSelect = async (quoteId: string) => {
    setChoosing(true);
    setError(null);
    try {
      await chooseRate(shipmentId, quoteId);
      setSelectedId(quoteId);
      const chosen = quotes.find((q) => q.id === quoteId);
      if (chosen) onChosen(chosen);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select rate');
    } finally {
      setChoosing(false);
    }
  };

  const handleGenerateLabel = async () => {
    if (!selectedId) return;
    setLabelLoading(true);
    setError(null);
    try {
      const res = await createLabel(shipmentId);
      setTrackingResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate label');
    } finally {
      setLabelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (error && quotes.length === 0) {
    return (
      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rate quotes available.</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2">Carrier / Service</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Transit</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => {
                const isSelected = quote.id === selectedId;
                return (
                  <tr
                    key={quote.id}
                    className={cn(
                      'border-b last:border-0 transition-colors',
                      isSelected ? 'bg-primary/5' : 'hover:bg-muted/30',
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium">{CARRIER_LABEL[quote.carrier] ?? quote.carrier}</span>
                      <span className="text-muted-foreground"> — {quote.service_name}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {fmtPrice(quote.amount, quote.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {quote.is_next_day ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs font-medium">
                          Next Day
                        </span>
                      ) : quote.transit_days != null ? (
                        <span className="text-muted-foreground text-xs">{quote.transit_days}d</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSelected ? (
                        <span className="text-xs font-medium text-primary">Selected</span>
                      ) : (
                        <button
                          onClick={() => handleSelect(quote.id)}
                          disabled={choosing}
                          className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {selectedId && !trackingResult && (
        <button
          onClick={handleGenerateLabel}
          disabled={labelLoading}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {labelLoading ? 'Generating…' : 'Generate Label'}
        </button>
      )}

      {trackingResult && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800 space-y-1">
          <p className="font-medium">Label generated</p>
          <p>
            Tracking:{' '}
            <span className="font-mono font-semibold">{trackingResult.tracking_number}</span>
          </p>
          <a
            href={trackingResult.label_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 underline text-xs"
          >
            Download Label ↗
          </a>
        </div>
      )}
    </div>
  );
}
