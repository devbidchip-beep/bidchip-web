'use client';

import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { LogOut, ChevronDown, Cpu } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

function pageTitleFromPath(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Header() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-6">
      {/* Logo (mobile) + page title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 md:hidden">
          <Cpu className="h-5 w-5 text-primary" />
          <span className="font-bold">BidChip</span>
        </div>
        <h1 className="hidden text-lg font-semibold md:block">{pageTitleFromPath(pathname)}</h1>
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          <span className="hidden sm:block">{user?.name ?? user?.email ?? 'Account'}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {menuOpen && (
          <div
            className={cn(
              'absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-popover shadow-lg',
            )}
          >
            <div className="px-3 py-2">
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="border-t" />
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
