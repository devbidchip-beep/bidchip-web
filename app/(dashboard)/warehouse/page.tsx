'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { SupplierOrder, Shipment, RateQuote } from '@/types/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { RateQuoteSelector } from '@/components/logistics/RateQuoteSelector';
import { ShipmentTracker } from '@/components/logistics/ShipmentTracker';
import { cn } from '@/lib/utils';

const RISK_BADGE: Record<SupplierOrder['risk_tier'], string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
};

const INSPECTION_LEVEL_LABEL: Record<string, string> = {
  standard: 'Standard',
  extended: 'Extended',
  full_lab: 'Full Lab',
};

type SOWithExtra = SupplierOrder & {
  inbound_shipment?: Shipment;
  outbound_shipment?: Shipment;
  inspection_level?: 'standard' | 'extended' | 'full_lab';
};

function fmt(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

// ---------- Card: Incoming ----------
function IncomingCard({ order, onRefresh }: { order: SOWithExtra; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarkReceived = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/orders/supplier-orders/${order.id}/mark-received/`);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark received');
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Supplier {order.anonymous_supplier_id}</p>
          <p className="text-xs text-muted-foreground">
            {order.lines.length} line{order.lines.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize', RISK_BADGE[order.risk_tier])}>
          {order.risk_tier}
        </span>
      </div>

      {order.inbound_shipment && (
        <ShipmentTracker shipment={order.inbound_shipment} />
      )}

      {!order.inbound_shipment && (
        <div className="text-xs text-muted-foreground">Tracking not yet available</div>
      )}

      <div className="space-y-1">
        {order.lines.map((line) => (
          <div key={line.id} className="flex justify-between text-xs text-muted-foreground">
            <span>{line.listing_line}</span>
            <span>{line.quantity.toLocaleString()} units</span>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button
        onClick={handleMarkReceived}
        disabled={loading}
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Mark Received'}
      </button>
    </div>
  );
}

// ---------- Card: Awaiting Inspection ----------
function AwaitingInspectionCard({ order }: { order: SOWithExtra }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Supplier {order.anonymous_supplier_id}</p>
          <p className="text-xs text-muted-foreground">
            {order.lines.length} line{order.lines.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize', RISK_BADGE[order.risk_tier])}>
            {order.risk_tier} risk
          </span>
          {order.inspection_level && (
            <span className="inline-flex rounded-full bg-purple-100 text-purple-800 px-2 py-0.5 text-xs font-medium">
              {INSPECTION_LEVEL_LABEL[order.inspection_level] ?? order.inspection_level}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {order.lines.map((line) => (
          <div key={line.id} className="flex justify-between text-xs text-muted-foreground">
            <span>{line.listing_line}</span>
            <span>{line.quantity.toLocaleString()} × {fmt(line.unit_price)}</span>
          </div>
        ))}
      </div>

      <button
        disabled
        className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground cursor-not-allowed"
        title="Navigate to inspection flow"
      >
        Start Inspection
      </button>
    </div>
  );
}

// ---------- Card: Ready to Ship ----------
function ReadyToShipCard({ order, onRateChosen }: { order: SOWithExtra; onRateChosen: (q: RateQuote) => void }) {
  const shipmentId = order.outbound_shipment?.id;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Supplier {order.anonymous_supplier_id}</p>
          <p className="text-xs text-muted-foreground">
            {order.lines.length} line{order.lines.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="inline-flex rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-medium">
          Inspected
        </span>
      </div>

      {shipmentId ? (
        <RateQuoteSelector shipmentId={shipmentId} onChosen={onRateChosen} />
      ) : (
        <p className="text-xs text-muted-foreground">No outbound shipment record yet.</p>
      )}
    </div>
  );
}

// ---------- Card: Recently Shipped ----------
function RecentShipmentCard({ shipment }: { shipment: Shipment & { supplier_id?: string } }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <ShipmentTracker shipment={shipment} />
    </div>
  );
}

// ---------- Main Page ----------
export default function WarehouseDashboard() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();

  const [incoming, setIncoming] = useState<SOWithExtra[]>([]);
  const [awaitingInspection, setAwaitingInspection] = useState<SOWithExtra[]>([]);
  const [readyToShip, setReadyToShip] = useState<SOWithExtra[]>([]);
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-warehouse staff
  useEffect(() => {
    if (!userLoading && user) {
      const staffRole = (user as { staff_role?: string | null }).staff_role;
      if (staffRole !== 'warehouse') {
        router.replace('/dashboard');
      }
    }
  }, [user, userLoading, router]);

  const fetchData = () => {
    setDataLoading(true);
    setError(null);

    Promise.all([
      api.get<{ results: SOWithExtra[] }>('/orders/supplier-orders/', { params: { status: 'shipped_to_warehouse' } }),
      api.get<{ results: SOWithExtra[] }>('/orders/supplier-orders/', { params: { status: 'at_warehouse' } }),
      api.get<{ results: SOWithExtra[] }>('/orders/supplier-orders/', { params: { status: 'inspected' } }),
      api.get<{ results: Shipment[] }>('/logistics/shipments/', { params: { leg: 'outbound', ordering: '-shipped_at', limit: 10 } }),
    ])
      .then(([inRes, awRes, rtRes, shipRes]) => {
        setIncoming(inRes.data.results);
        setAwaitingInspection(awRes.data.results);
        setReadyToShip(rtRes.data.results);
        setRecentShipments(shipRes.data.results);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load warehouse data'))
      .finally(() => setDataLoading(false));
  };

  useEffect(() => {
    if (!userLoading) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading]);

  if (userLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-32 rounded-lg bg-muted" />
      </div>
    );
  }

  const staffRole = (user as { staff_role?: string | null } | null)?.staff_role;
  if (staffRole !== 'warehouse') return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Warehouse Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage inbound, inspection, and outbound logistics.</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {/* Incoming */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Incoming ({incoming.length})</h2>
        </div>
        {dataLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : incoming.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            No shipments awaiting receipt.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {incoming.map((so) => (
              <IncomingCard key={so.id} order={so} onRefresh={fetchData} />
            ))}
          </div>
        )}
      </section>

      {/* Awaiting Inspection */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Awaiting Inspection ({awaitingInspection.length})</h2>
        {dataLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : awaitingInspection.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            No orders awaiting inspection.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {awaitingInspection.map((so) => (
              <AwaitingInspectionCard key={so.id} order={so} />
            ))}
          </div>
        )}
      </section>

      {/* Ready to Ship */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Ready to Ship ({readyToShip.length})</h2>
        {dataLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : readyToShip.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            No orders ready to ship.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {readyToShip.map((so) => (
              <ReadyToShipCard key={so.id} order={so} onRateChosen={() => fetchData()} />
            ))}
          </div>
        )}
      </section>

      {/* Recently Shipped */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Recently Shipped</h2>
        {dataLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : recentShipments.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            No recent outbound shipments.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recentShipments.map((shipment) => (
              <RecentShipmentCard key={shipment.id} shipment={shipment} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
