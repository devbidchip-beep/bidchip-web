'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOrders } from '@/lib/api';
import type { Order, PaginatedResponse } from '@/types/api';
import { OrderCard } from '@/components/orders/OrderCard';

type TabKey = 'all' | 'payment_pending' | 'active' | 'completed';

const TABS: { key: TabKey; label: string; statusParam?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'payment_pending', label: 'Pending Payment', statusParam: 'payment_pending' },
  { key: 'active', label: 'Active', statusParam: 'active' },
  { key: 'completed', label: 'Completed', statusParam: 'completed' },
];

function OrderSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-5 w-20 rounded-full bg-muted" />
      </div>
      <div className="h-3 w-48 rounded bg-muted" />
      <div className="flex justify-between items-center">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-5 w-16 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback((tab: TabKey) => {
    setLoading(true);
    setError(null);
    const statusParam = TABS.find((t) => t.key === tab)?.statusParam;
    getOrders(statusParam ? { status: statusParam } : undefined)
      .then((res) => setOrders(res.data.results))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab, fetchOrders]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  const emptyMessages: Record<TabKey, string> = {
    all: 'You have no orders yet.',
    payment_pending: 'No orders awaiting payment.',
    active: 'No active orders.',
    completed: 'No completed orders.',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage your purchase orders.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-md bg-destructive/10 p-6 text-destructive text-sm">{error}</div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">{emptyMessages[activeTab]}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
