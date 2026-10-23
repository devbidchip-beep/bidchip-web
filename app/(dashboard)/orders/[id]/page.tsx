'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getOrderDetail } from '@/lib/api';
import type { Order, SupplierOrder, OrderLine } from '@/types/api';
import { PricingBreakdown } from '@/components/payments/PricingBreakdown';
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline';
import { cn } from '@/lib/utils';

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

const LINE_STATUS_STYLES: Record<OrderLine['status'], string> = {
  pending: 'bg-gray-100 text-gray-700',
  received: 'bg-blue-100 text-blue-700',
  passed: 'bg-green-100 text-green-700',
  failed_inspection: 'bg-red-100 text-red-700',
  shipped: 'bg-purple-100 text-purple-700',
  refunded: 'bg-red-100 text-red-800',
};

function buildPricingFromOrder(order: Order) {
  return {
    principal: order.principal_total,
    buyer_fee: order.buyer_fee_total,
    seller_fee: '0',
    inspection_fee: order.inspection_fee_total,
    compliance_fee: order.compliance_fee_total,
    shipping_estimate: order.shipping_estimate,
    oem_uplift: order.oem_uplift_total,
    tax_total: order.tax_total,
    card_surcharge: order.card_surcharge,
    card_surcharge_rate: '0',
    grand_total: order.grand_total,
    seller_payout: '0',
  };
}

function SupplierOrderSection({ supplierOrder }: { supplierOrder: SupplierOrder }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Supplier {supplierOrder.anonymous_supplier_id}</p>
          <p className="text-xs text-muted-foreground capitalize">{supplierOrder.status.replace(/_/g, ' ')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Payout</p>
          <p className="text-sm font-medium tabular-nums">{fmt(supplierOrder.payout_amount)}</p>
        </div>
      </div>

      <div className="px-4 py-4">
        <OrderStatusTimeline supplierOrder={supplierOrder} />
      </div>

      {/* Lines table */}
      {supplierOrder.lines.length > 0 && (
        <div className="border-t">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2">MPN / Line</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Unit Price</th>
                  <th className="px-4 py-2 text-right">Line Total</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {supplierOrder.lines.map((line) => (
                  <tr key={line.id} className="border-b last:border-0">
                    <td className="px-4 py-2 text-muted-foreground text-xs">{line.listing_line}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{line.quantity.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmt(line.unit_price)}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">{fmt(line.line_total)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                          LINE_STATUS_STYLES[line.status],
                        )}
                      >
                        {line.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkoutSuccess = searchParams.get('checkout') === 'success';
  const paymentSuccess = searchParams.get('payment') === 'success';

  useEffect(() => {
    getOrderDetail(id)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-4 w-1/4 rounded bg-muted" />
        <div className="h-48 rounded-lg bg-muted" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-md bg-destructive/10 p-6 text-destructive">
        {error ?? 'Order not found.'}
      </div>
    );
  }

  const pricing = buildPricingFromOrder(order);
  const placedDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Success banners */}
      {(checkoutSuccess || paymentSuccess) && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {paymentSuccess ? 'Payment received successfully. Your order is now being processed.' : 'Order placed successfully.'}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Order #{order.number}</h1>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                STATUS_STYLES[order.status],
              )}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Placed {placedDate}</p>
          {order.po_number && (
            <p className="text-sm text-muted-foreground">PO: {order.po_number}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xl font-bold tabular-nums">{fmt(order.grand_total)}</span>
          <button
            onClick={() => router.back()}
            className="text-xs text-muted-foreground hover:underline"
          >
            Back
          </button>
        </div>
      </div>

      {/* Action buttons */}
      {order.status === 'payment_pending' && (
        <div className="rounded-lg border bg-yellow-50 border-yellow-200 p-4 space-y-3">
          <p className="text-sm font-medium text-yellow-900">Payment Required</p>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/orders/${order.id}/pay`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Complete Payment
            </Link>
          </div>
          {/* Wire instructions placeholder */}
          <div className="rounded-md bg-white border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Wire Transfer Instructions</p>
            <p>Bank: BidChip Financial Services</p>
            <p>Reference: {order.number}</p>
            <p>Amount: {fmt(order.grand_total)}</p>
            <p className="mt-1 italic">Full wire details will be sent to your registered email.</p>
          </div>
        </div>
      )}

      {order.status === 'delivered' && (
        <div className="flex gap-3">
          <button className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            Confirm Receipt
          </button>
          <button className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
            Open Dispute
          </button>
        </div>
      )}

      {/* Pricing breakdown */}
      <PricingBreakdown pricing={pricing} />

      {/* Supplier orders */}
      {order.supplier_orders && order.supplier_orders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Supplier Orders</h2>
          {order.supplier_orders.map((so) => (
            <SupplierOrderSection key={so.id} supplierOrder={so} />
          ))}
        </div>
      )}
    </div>
  );
}
