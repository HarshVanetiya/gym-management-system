'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { store } from '../../lib/store';
import { useAuth, useSite } from '../../lib/hooks';
import { DemoBanner } from '../../components/DemoBanner';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/members', label: 'Members', icon: '👥' },
  { to: '/admin/payments', label: 'Payments', icon: '💰' },
  { to: '/admin/plans', label: 'Plans', icon: '🏷️' },
  { to: '/admin/programs', label: 'Workouts & Diets', icon: '📋' },
  { to: '/admin/leads', label: 'Enquiries', icon: '📥' },
  { to: '/admin/site', label: 'Website', icon: '🌐' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { session, refresh } = useAuth();
  const { data: site } = useSite();
  const router = useRouter();
  const pathname = usePathname();
  async function logout() {
    await store.auth.signOut();
    await refresh();
    router.push('/login');
  }
  const isActive = (to: string, end?: boolean) => (end ? pathname === to : pathname === to || pathname.startsWith(to + '/'));
  return (
    <div className="app">
      <DemoBanner />
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand sidebar-brand"><span className="brand-mark">IF</span><span>{site?.gym_name ?? 'Gym'}</span></div>
          <nav>
            {LINKS.map((l) => (
              <Link key={l.to} href={l.to} className={isActive(l.to, l.end) ? 'active' : ''}>
                <span aria-hidden="true">{l.icon}</span> {l.label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-foot">
            <a href="/" target="_blank" rel="noreferrer">View website ↗</a>
            <span className="muted small">{session?.email}</span>
            <button className="link-btn" onClick={logout}>Log out</button>
          </div>
        </aside>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
