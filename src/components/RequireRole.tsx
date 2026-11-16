'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/hooks';
import type { Role } from '../lib/types';
import { Loading } from './ui';

/** Client-side guard. Real protection is the database's row-level security. */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const target = !session ? '/login' : session.role !== role ? (session.role === 'admin' ? '/admin' : '/me') : null;
  useEffect(() => {
    if (!loading && target) router.replace(target);
  }, [loading, target, router]);
  if (loading || target) return <Loading />;
  return <>{children}</>;
}
