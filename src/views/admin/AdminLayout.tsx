'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { store } from '../../lib/store';
import { useAuth } from '../../lib/hooks';
import { DemoBanner } from '../../components/DemoBanner';
import { Icon } from '../../components/icons';
import { InstallApp } from '../../components/Pwa';

const LINKS = [
  { to: '/admin', label: 'Dashboard', short: 'Home', icon: Icon.Grid, end: true, tab: true },
  { to: '/admin/members', label: 'Members', short: 'Members', icon: Icon.Users, tab: true },
  { to: '/admin/payments', label: 'Payments', short: 'Payments', icon: Icon.Wallet, tab: true },
  { to: '/admin/leads', label: 'Enquiries', short: 'Leads', icon: Icon.Inbox, tab: true },
  { to: '/admin/plans', label: 'Plans', short: 'Plans', icon: Icon.Tag },
  { to: '/admin/programs', label: 'Workouts & Diets', short: 'Programs', icon: Icon.Clipboard },
  { to: '/admin/site', label: 'Website', short: 'Website', icon: Icon.Globe },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { session, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [pathname]);

  async function logout() {
    await store.auth.signOut();
    await refresh();
    router.push('/login');
  }
  const isActive = (to: string, end?: boolean) => (end ? pathname === to : pathname === to || pathname.startsWith(to + '/'));
  const moreActive = LINKS.some((l) => !l.tab && isActive(l.to));

  return (
    <div className="app">
      <DemoBanner />
      <header className="app-top">
        <Link href="/admin" className="brand"><span className="brand-mark">MFC</span><span>Medilife<small>Trainer</small></span></Link>
        <Link href="/admin/members?new=1" className="btn btn-sm">+ Member</Link>
      </header>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand sidebar-brand"><span className="brand-mark">MFC</span><span>Medilife<small>Trainer dashboard</small></span></div>
          <nav>
            {LINKS.map((l) => (
              <Link key={l.to} href={l.to} className={isActive(l.to, l.end) ? 'active' : ''}>
                <l.icon /> {l.label}
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

      <nav className="app-tabbar" aria-label="Dashboard sections">
        {LINKS.filter((l) => l.tab).map((l) => (
          <Link key={l.to} href={l.to} className={isActive(l.to, l.end) ? 'active' : ''} aria-current={isActive(l.to, l.end) ? 'page' : undefined}>
            <l.icon /><span>{l.short}</span>
          </Link>
        ))}
        <button className={moreActive ? 'active' : ''} onClick={() => setMore(true)} aria-haspopup="dialog">
          <Icon.More /><span>More</span>
        </button>
      </nav>

      {more && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setMore(false)}>
          <div className="sheet" role="dialog" aria-label="More">
            {LINKS.filter((l) => !l.tab).map((l) => (
              <Link key={l.to} href={l.to}><l.icon /> {l.label}</Link>
            ))}
            <a href="/" target="_blank" rel="noreferrer"><Icon.Home /> View website ↗</a>
            <button onClick={logout}><Icon.Logout /> Log out</button>
            <span className="who">{session?.email}</span>
            <InstallApp compact />
          </div>
        </div>
      )}
    </div>
  );
}
