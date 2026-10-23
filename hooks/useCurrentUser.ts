'use client';

import { useSession } from 'next-auth/react';

export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
