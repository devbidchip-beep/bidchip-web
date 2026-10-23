'use client';

import type { OrderPricing } from '@/types/api';
import { cn } from '@/lib/utils';

interface Props {
  pricing: OrderPricing;
}

function fmt(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function isPositive(value: string): boolean {
  return parseFloat(value) > 0;
}

interface RowProps {
  label: string;
  value: string | React.ReactNode;
  bold?: boolean;
  large?: boolean;
  className?: string;
}

function Row({ label, value, bold, large, className }: RowProps) {
  return (
    <tr className={cn('border-b last:border-0', className)}>
      <td
        className={cn(
          'py-2 pr-4 text-left text-sm',
          bold ? 'font-semibold' : 'text-muted-foreground',
          large && 'text-base',
        )}
      >
        {label}
      </td>
      <td
        className={cn(
          'py-2 text-right tabular-nums text-sm',
          bold ? 'font-semibold' : '',
          large && 'text-base',
        )}
      >
        {value}
      </td>
    </tr>
  );
}

export function PricingBreakdown({ pricing }: Props) {
  const taxIsZero = parseFloat(pricing.tax_total) === 0;

  return (
    <div className="rounded-lg border bg-card">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Price Breakdown</h3>
      </div>
      <div className="px-4 py-2">
        <table className="w-full">
          <tbody>
            <Row label="Parts total" value={fmt(pricing.principal)} />
            <Row label="Platform fee" value={fmt(pricing.buyer_fee)} />
            <Row label="Inspection fee" value={fmt(pricing.inspection_fee)} />
            {isPositive(pricing.compliance_fee) && (
              <Row label="Compliance fee" value={fmt(pricing.compliance_fee)} />
            )}
            <Row label="Shipping (estimate)" value={fmt(pricing.shipping_estimate)} />
            {isPositive(pricing.oem_uplift) && (
              <Row label="OEM uplift" value={fmt(pricing.oem_uplift)} />
            )}
            <Row
              label="Sales tax"
              value={taxIsZero ? 'TBD' : fmt(pricing.tax_total)}
            />
            {isPositive(pricing.card_surcharge) && (
              <Row
                label={`Credit card surcharge (${pricing.card_surcharge_rate}%)`}
                value={fmt(pricing.card_surcharge)}
              />
            )}
            <Row
              label="Grand Total"
              value={fmt(pricing.grand_total)}
              bold
              large
              className="bg-muted/20"
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
