'use client';

import type { Shipment, RateQuote } from '@/types/api';
import { cn } from '@/lib/utils';

const CARRIER_TRACKING_URLS: Record<string, (tn: string) => string> = {
  ups: (tn) => `https://www.ups.com/track?tracknum=${tn}`,
  fedex: (tn) => `https://www.fedex.com/apps/fedextrack/?tracknumbers=${tn}`,
  dhl: (tn) => `https://www.dhl.com/en/express/tracking.html?AWB=${tn}`,
  other: () => '#',
};

const CARRIER_LABEL: Record<string, string> = {
  ups: 'UPS',
  fedex: 'FedEx',
  dhl: 'DHL',
  other: 'Other',
};

const STATUS_STEPS = ['Label Created', 'In Transit', 'Out for Delivery', 'Delivered'] as const;

type ShipmentStatus = Shipment['status'];

function getStepIndex(status: ShipmentStatus): number {
  switch (status) {
    case 'label_created':
      return 0;
    case 'in_transit':
      return 1;
    case 'delivered':
      return 3;
    default:
      return -1;
  }
}

const STATUS_BADGE: Record<ShipmentStatus, { label: string; className: string; pulse?: boolean }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  label_created: { label: 'Label Created', className: 'bg-blue-100 text-blue-800' },
  in_transit: { label: 'In Transit', className: 'bg-yellow-100 text-yellow-800', pulse: true },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
  exception: { label: 'Exception', className: 'bg-red-100 text-red-800' },
  returned: { label: 'Returned', className: 'bg-gray-100 text-gray-700' },
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface ShipmentTrackerProps {
  shipment: Shipment;
}

export function ShipmentTracker({ shipment }: ShipmentTrackerProps) {
  const chosenRate: RateQuote | undefined = shipment.rate_quotes.find((r) => r.chosen);
  const trackingUrl = CARRIER_TRACKING_URLS[shipment.carrier]?.(shipment.tracking_number) ?? '#';
  const badge = STATUS_BADGE[shipment.status];
  const stepIndex = getStepIndex(shipment.status);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{CARRIER_LABEL[shipment.carrier]}</span>
            {chosenRate && (
              <span className="text-xs text-muted-foreground">— {chosenRate.service_name}</span>
            )}
          </div>
          {shipment.tracking_number ? (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-mono"
            >
              {shipment.tracking_number} ↗
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">No tracking number yet</span>
          )}
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            badge.className,
            badge.pulse && 'animate-pulse',
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* Progress bar */}
      {shipment.status !== 'draft' && shipment.status !== 'exception' && shipment.status !== 'returned' && (
        <div className="space-y-1">
          <div className="flex">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'h-2 w-full',
                    i === 0 ? 'rounded-l-full' : '',
                    i === STATUS_STEPS.length - 1 ? 'rounded-r-full' : '',
                    i <= stepIndex ? 'bg-primary' : 'bg-muted',
                  )}
                />
                <span className="text-[10px] text-muted-foreground text-center leading-tight hidden sm:block">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps + info */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Shipped</p>
          <p className="font-medium">{fmtDate(shipment.shipped_at)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Delivered</p>
          <p className="font-medium">{fmtDate(shipment.delivered_at)}</p>
        </div>
        {chosenRate?.transit_days != null && (
          <div>
            <p className="text-muted-foreground">Est. Transit</p>
            <p className="font-medium">{chosenRate.transit_days} business day{chosenRate.transit_days !== 1 ? 's' : ''}</p>
          </div>
        )}
        {shipment.is_partial && (
          <div className="col-span-2">
            <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-800 px-2 py-0.5 text-xs font-medium">
              Partial shipment
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
