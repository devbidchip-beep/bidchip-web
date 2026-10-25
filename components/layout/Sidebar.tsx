'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, ShoppingCart, User, Cpu, Store, Gavel, Package, Building2, AlertTriangle, MessageSquare, Inbox, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/marketplace', label: 'Marketplace', icon: Store },
  { href: '/dashboard/listings', label: 'My Listings', icon: List },
  { href: '/dashboard/bids', label: 'My Bids', icon: Gavel },
  { href: '/dashboard/orders', label: 'My Orders', icon: ShoppingCart },
  { href: '/dashboard/seller', label: 'Seller Dashboard', icon: Package },
  { href: '/dashboard/disputes', label: 'Disputes', icon: AlertTriangle },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/account', label: 'Account', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const staffRole = (user as { staff_role?: string | null } | null)?.staff_role;
  const isSupplier = (user as { company?: { is_supplier?: boolean } } | null)?.company?.is_supplier ?? false;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r bg-card md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Cpu className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">BidChip</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <Link
            href="/dashboard/intake"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === '/dashboard/intake' || pathname.startsWith('/dashboard/intake/')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Inbox className="h-4 w-4" />
            Pending Imports
          </Link>
          {isSupplier && (
            <Link
              href="/dashboard/inventory"
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/dashboard/inventory' || pathname.startsWith('/dashboard/inventory/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Archive className="h-4 w-4" />
              My Inventory
            </Link>
          )}
          {staffRole === 'warehouse' && (
            <Link
              href="/dashboard/warehouse"
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/dashboard/warehouse' || pathname.startsWith('/dashboard/warehouse/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Building2 className="h-4 w-4" />
              Warehouse
            </Link>
          )}
        </nav>

        {/* User info footer */}
        <div className="border-t px-4 py-4">
          <div className="flex flex-col gap-0.5">
            <p className="truncate text-sm font-medium">{user?.name ?? user?.email ?? '—'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card md:hidden">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
          <Link
            href="/dashboard/intake"
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              pathname === '/dashboard/intake' || pathname.startsWith('/dashboard/intake/')
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          >
            <Inbox className="h-5 w-5" />
            Imports
          </Link>
          {isSupplier && (
            <Link
              href="/dashboard/inventory"
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                pathname === '/dashboard/inventory' || pathname.startsWith('/dashboard/inventory/')
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            >
              <Archive className="h-5 w-5" />
              Inventory
            </Link>
          )}
          {staffRole === 'warehouse' && (
            <Link
              href="/dashboard/warehouse"
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                pathname === '/dashboard/warehouse' || pathname.startsWith('/dashboard/warehouse/')
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            >
              <Building2 className="h-5 w-5" />
              Warehouse
            </Link>
          )}
      </nav>
    </>
  );
}
