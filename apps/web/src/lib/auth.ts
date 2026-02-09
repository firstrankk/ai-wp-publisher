'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  clearAuth: () => void;
}

export function useAuth(): AuthState {
  const { data: session, status } = useSession();

  const user: User | null = session?.user
    ? {
        id: (session.user as any).id,
        email: session.user.email!,
        name: session.user.name!,
        role: (session.user as any).role,
      }
    : null;

  const token: string | null = session?.user
    ? (session.user as any).apiToken
    : null;

  return {
    user,
    token,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isAdmin: user?.role === 'ADMIN',
    clearAuth: () => {
      nextAuthSignOut({ callbackUrl: '/login' });
    },
  };
}
