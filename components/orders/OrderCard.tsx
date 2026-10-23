'use client';

import Link from 'next/link';
import type { Order } from '@/types/api';
import { cn } from '@/lib/utils';

interface Props {
  order: Order;
}

const STATUS_STYLES: Record<Order['status'], string> = {
  payment_pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  in_fulfillment: 'bg-purple-100 text-purple-800',
  partially_shipped: 'bg-purple-100 text-purple-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-teal-100 text-teal-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-red-100 text-red-800',
};

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

export function OrderCard({ order }: Props) {
  const statusLabel = order.status.replace(/_/g, ' ');
  const placedDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      className="block rounded-lg border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">#{order.number}</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                STATUS_STYLES[order.status],
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Listing: {order.listing}</p>
          {order.po_number && (
            <p className="text-xs text-muted-foreground">PO: {order.po_number}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-base font-semibold tabular-nums">{fmt(order.grand_total)}</span>
          <span className="text-xs text-muted-foreground">{placedDate}</span>
        </div>
      </div>
    </Link>
  );
}
