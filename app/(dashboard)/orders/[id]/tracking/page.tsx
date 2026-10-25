'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrderDetail } from '@/lib/api';
import type { Order, SupplierOrder, Shipment } from '@/types/api';
import { ShipmentTracker } from '@/components/logistics/ShipmentTracker';

type SupplierOrderWithShipment = SupplierOrder & {
  inbound_shipment?: Shipment;
};

type OrderWithLogistics = Omit<Order, 'supplier_orders'> & {
  outbound_shipment?: Shipment;
  supplier_orders?: SupplierOrderWithShipment[];
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderTrackingPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderWithLogistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrderDetail(id)
      .then((res) => setOrder(res.data as OrderWithLogistics))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-32 rounded-lg bg-muted" />
        <div className="h-32 rounded-lg bg-muted" />
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

  // Build a timeline of all shipment events
  const timelineEvents: { date: string; label: string; shipmentId: string }[] = [];
  if (order.supplier_orders) {
    for (const so of order.supplier_orders) {
      if (so.inbound_shipment?.shipped_at) {
        timelineEvents.push({
          date: so.inbound_shipment.shipped_at,
          label: `Supplier ${so.anonymous_supplier_id} shipped inbound`,
          shipmentId: so.inbound_shipment.id,
        });
      }
      if (so.inbound_shipment?.delivered_at) {
        timelineEvents.push({
          date: so.inbound_shipment.delivered_at,
          label: `Supplier ${so.anonymous_supplier_id} inbound delivered to warehouse`,
          shipmentId: so.inbound_shipment.id,
        });
      }
    }
  }
  if (order.outbound_shipment?.shipped_at) {
    timelineEvents.push({
      date: order.outbound_shipment.shipped_at,
      label: 'Outbound shipment dispatched to buyer',
      shipmentId: order.outbound_shipment.id,
    });
  }
  if (order.outbound_shipment?.delivered_at) {
    timelineEvents.push({
      date: order.outbound_shipment.delivered_at,
      label: 'Outbound shipment delivered',
      shipmentId: order.outbound_shipment.id,
    });
  }
  timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/dashboard/orders/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        ← Back to Order #{order.number}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tracking — Order #{order.number}</h1>
        <p className="text-sm text-muted-foreground mt-1">Full shipment tracking for all legs of this order.</p>
      </div>

      {/* Inbound shipments (per supplier order) */}
      {order.supplier_orders && order.supplier_orders.some((so) => so.inbound_shipment) && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Inbound Shipments</h2>
          {order.supplier_orders.map((so) =>
            so.inbound_shipment ? (
              <div key={so.id}>
                <p className="text-xs text-muted-foreground mb-1">Supplier {so.anonymous_supplier_id}</p>
                <ShipmentTracker shipment={so.inbound_shipment} />
              </div>
            ) : null,
          )}
        </div>
      )}

      {/* Outbound shipment */}
      {order.outbound_shipment && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Outbound Shipment (to you)</h2>
          <ShipmentTracker shipment={order.outbound_shipment} />
        </div>
      )}

      {/* Timeline */}
      {timelineEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Shipment Timeline</h2>
          <div className="relative border-l-2 border-muted ml-3 space-y-4">
            {timelineEvents.map((event, i) => (
              <div key={i} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-primary bg-card" />
                <p className="text-sm font-medium">{event.label}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(event.date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!order.outbound_shipment && (!order.supplier_orders || order.supplier_orders.every((so) => !so.inbound_shipment)) && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No shipment information available yet.
        </div>
      )}
    </div>
  );
}
