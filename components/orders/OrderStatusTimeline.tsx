'use client';

import type { SupplierOrder } from '@/types/api';
import { cn } from '@/lib/utils';

interface Props {
  supplierOrder: SupplierOrder;
}

const STEPS: { key: SupplierOrder['status'] | '__placed' | '__payment'; label: string }[] = [
  { key: '__placed', label: 'Order Placed' },
  { key: '__payment', label: 'Payment Received' },
  { key: 'shipped_to_warehouse', label: 'Shipped to Warehouse' },
  { key: 'at_warehouse', label: 'At Warehouse' },
  { key: 'inspected', label: 'Inspected' },
  { key: 'shipped_to_buyer', label: 'Shipped to Buyer' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'payout_released', label: 'Payout Released' },
];

const STATUS_ORDER: SupplierOrder['status'][] = [
  'awarded',
  'paid',
  'shipped_to_warehouse',
  'at_warehouse',
  'inspected',
  'failed_inspection',
  'shipped_to_buyer',
  'delivered',
  'payout_released',
  'disputed',
  'cancelled',
  'refunded',
];

function getStepIndex(status: SupplierOrder['status']): number {
  // Map real statuses to step positions (0-based, mirroring STEPS array)
  const map: Partial<Record<SupplierOrder['status'], number>> = {
    awarded: 0,
    paid: 1,
    shipped_to_warehouse: 2,
    at_warehouse: 3,
    inspected: 4,
    failed_inspection: 4,
    shipped_to_buyer: 5,
    delivered: 6,
    payout_released: 7,
    disputed: 6,
    cancelled: -1,
    refunded: -1,
  };
  return map[status] ?? 0;
}

const RISK_TIER_STYLES: Record<SupplierOrder['risk_tier'], string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
};

export function OrderStatusTimeline({ supplierOrder }: Props) {
  const currentStepIndex = getStepIndex(supplierOrder.status);
  const isCancelled = supplierOrder.status === 'cancelled' || supplierOrder.status === 'refunded';

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="flex items-start gap-0">
        {STEPS.map((step, idx) => {
          const isCompleted = !isCancelled && idx < currentStepIndex;
          const isCurrent = !isCancelled && idx === currentStepIndex;
          const isPending = isCancelled || idx > currentStepIndex;

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              {/* Connector + Circle row */}
              <div className="flex w-full items-center">
                {/* Left connector */}
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    idx === 0 ? 'invisible' : isCompleted || isCurrent ? 'bg-primary' : 'bg-muted',
                  )}
                />
                {/* Circle */}
                <div
                  className={cn(
                    'relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                    isCompleted
                      ? 'border-primary bg-primary'
                      : isCurrent
                      ? 'border-primary bg-background'
                      : 'border-muted bg-background',
                  )}
                >
                  {isCompleted && (
                    <svg
                      className="h-3 w-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isCurrent && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
                  )}
                  {isCurrent && (
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </div>
                {/* Right connector */}
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    idx === STEPS.length - 1 ? 'invisible' : isCompleted ? 'bg-primary' : 'bg-muted',
                  )}
                />
              </div>

              {/* Label */}
              <div className="mt-1.5 flex flex-col items-center gap-0.5 px-1 text-center">
                <span
                  className={cn(
                    'text-xs leading-tight',
                    isCompleted || isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
                {/* Risk tier badge on last step */}
                {step.key === 'payout_released' && (
                  <span
                    className={cn(
                      'mt-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium capitalize',
                      RISK_TIER_STYLES[supplierOrder.risk_tier],
                    )}
                  >
                    {supplierOrder.risk_tier}
                    {supplierOrder.hold_days ? ` · ${supplierOrder.hold_days}d hold` : ''}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancelled / refunded state */}
      {isCancelled && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          This supplier order was <span className="font-medium">{supplierOrder.status}</span>.
        </div>
      )}

      {/* Failed inspection warning */}
      {supplierOrder.status === 'failed_inspection' && (
        <div className="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-700">
          This order failed inspection and is under review.
        </div>
      )}
    </div>
  );
}
