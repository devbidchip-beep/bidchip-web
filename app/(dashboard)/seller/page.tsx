'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { SupplierOrder, Shipment } from '@/types/api';
import { StripeConnectBanner } from '@/components/payments/StripeConnectBanner';
import { MarkShippedForm } from '@/components/logistics/MarkShippedForm';
import { ShipmentTracker } from '@/components/logistics/ShipmentTracker';
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

const ACTIVE_STATUSES = ['paid', 'shipped_to_warehouse', 'at_warehouse', 'inspected'];
const COMPLETED_STATUSES = ['payout_released'];

const STATUS_LABEL: Partial<Record<SupplierOrder['status'], string>> = {
  awarded: 'Awarded',
  paid: 'Ready to Ship',
  shipped_to_warehouse: 'Shipped to Warehouse',
  at_warehouse: 'At Warehouse',
  inspected: 'Inspected',
  failed_inspection: 'Failed Inspection',
  shipped_to_buyer: 'Shipped to Buyer',
  delivered: 'Delivered',
  payout_released: 'Payout Released',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

interface SupplierOrderCardProps {
  order: SupplierOrder & { order_number?: string; inbound_shipment?: Shipment };
  onRefresh: () => void;
}

function SupplierOrderCard({ order, onRefresh }: SupplierOrderCardProps) {
  const [showShipForm, setShowShipForm] = useState(false);
  const isReadyToShip = order.status === 'paid';
  const inboundShipment = order.inbound_shipment ?? null;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Order {order.anonymous_supplier_id}</p>
          <p className="text-xs text-muted-foreground">
            {order.lines.length} line{order.lines.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
              order.status === 'paid'
                ? 'bg-blue-100 text-blue-800'
                : order.status === 'inspected'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-700',
            )}
          >
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
          <span className="text-sm font-semibold tabular-nums">{fmt(order.payout_amount)}</span>
        </div>
      </div>

      {/* Lines summary */}
      <div className="space-y-1">
        {order.lines.map((line) => (
          <div key={line.id} className="flex justify-between text-xs text-muted-foreground">
            <span>{line.listing_line}</span>
            <span>
              {line.quantity.toLocaleString()} × {fmt(line.unit_price)}
            </span>
          </div>
        ))}
      </div>

      {/* Inbound shipment tracker */}
      {inboundShipment && inboundShipment.leg === 'inbound' && (
        <ShipmentTracker shipment={inboundShipment} />
      )}

      {/* Actions */}
      {isReadyToShip && (
        <div className="space-y-2">
          {!showShipForm ? (
            <button
              onClick={() => setShowShipForm(true)}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Mark Shipped
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setShowShipForm(false)}
                className="text-xs text-muted-foreground hover:underline"
              >
                Cancel
              </button>
              <MarkShippedForm
                supplierOrderId={order.id}
                onSuccess={() => {
                  setShowShipForm(false);
                  onRefresh();
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SellerDashboardPage() {
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeConnected, setStripeConnected] = useState(true); // assume connected; real check comes from user context

  const fetchOrders = () => {
    setLoading(true);
    setError(null);
    api
      .get<{ results: SupplierOrder[] }>('/orders/supplier-orders/')
      .then((res) => setSupplierOrders(res.data.results))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    // Check Stripe connected status
    api
      .get<{ connected: boolean }>('/payments/stripe/status/')
      .then((res) => setStripeConnected(res.data.connected))
      .catch(() => setStripeConnected(false));
  }, []);

  const activeOrders = supplierOrders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const payoutHistory = supplierOrders.filter((o) => COMPLETED_STATUSES.includes(o.status));

  const totalPaidOut = payoutHistory
    .reduce((sum, o) => sum + parseFloat(o.payout_amount || '0'), 0)
    .toString();

  const pendingPayout = activeOrders
    .reduce((sum, o) => sum + parseFloat(o.payout_amount || '0'), 0)
    .toString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seller Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your supplier orders and payouts.
        </p>
      </div>

      {/* Stripe Connect Banner */}
      {!stripeConnected && <StripeConnectBanner />}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Paid Out</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{fmt(totalPaidOut)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pending Payout</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{fmt(pendingPayout)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active Orders</p>
          <p className="mt-1 text-xl font-bold">{activeOrders.length}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {/* Active Orders */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Active Orders</h2>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No active supplier orders.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeOrders.map((order) => (
              <SupplierOrderCard key={order.id} order={order} onRefresh={fetchOrders} />
            ))}
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Payout History</h2>
        {payoutHistory.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No completed payouts yet.
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Risk Tier</th>
                  <th className="px-4 py-2 text-right">Payout</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payoutHistory.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-4 py-2 text-muted-foreground">{order.anonymous_supplier_id}</td>
                    <td className="px-4 py-2 capitalize">{order.risk_tier}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">{fmt(order.payout_amount)}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
