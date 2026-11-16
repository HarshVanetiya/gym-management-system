'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { store } from '../../lib/store';
import { useAuth, useSite } from '../../lib/hooks';
import { DemoBanner } from '../../components/DemoBanner';
import { Icon } from '../../components/icons';
import { InstallApp } from '../../components/Pwa';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Avatar } from '../../components/Media';

type NavLink = { to: string; label: string; short: string; icon: typeof Icon.Grid; end?: boolean; tab?: boolean };
const GROUPS: { label: string; links: NavLink[] }[] = [
  { label: 'Overview', links: [{ to: '/admin', label: 'Dashboard', short: 'Home', icon: Icon.Grid, end: true, tab: true }] },
  {
    label: 'Gym',
    links: [
      { to: '/admin/members', label: 'Members', short: 'Members', icon: Icon.Users, tab: true },
      { to: '/admin/payments', label: 'Payments', short: 'Payments', icon: Icon.Wallet, tab: true },
      { to: '/admin/leads', label: 'Enquiries', short: 'Leads', icon: Icon.Inbox, tab: true },
    ],
  },
  {
    label: 'Setup',
    links: [
      { to: '/admin/plans', label: 'Plans', short: 'Plans', icon: Icon.Tag },
      { to: '/admin/programs', label: 'Workouts & diets', short: 'Programs', icon: Icon.Clipboard },
      { to: '/admin/site', label: 'Website', short: 'Website', icon: Icon.Globe },
    ],
  },
  { label: 'System', links: [{ to: '/admin/data', label: 'Backup & data', short: 'Backup', icon: Icon.Database }] },
];
const LINKS = GROUPS.flatMap((g) => g.links);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { session, refresh } = useAuth();
  const { data: site } = useSite();
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
  const current = LINKS.find((l) => isActive(l.to, l.end));
  const isDetail = current && pathname !== current.to;

  return (
    <div className="app">
      <DemoBanner />
      <header className="app-top">
        <Link href="/admin" className="brand"><span className="brand-mark">MFC</span><span>Medilife<small>Trainer</small></span></Link>
        <div className="row-actions">
          <ThemeToggle />
          <Link href="/admin/members?new=1" className="btn btn-sm"><Icon.Plus width={15} height={15} /> Member</Link>
        </div>
      </header>
      <div className="app-shell">
        <aside className="sidebar">
          <Link href="/admin" className="brand sidebar-brand"><span className="brand-mark">MFC</span><span>Medilife<small>Trainer dashboard</small></span></Link>
          <nav aria-label="Dashboard sections">
            {GROUPS.map((g) => (
              <div className="nav-group" key={g.label}>
                <span className="nav-label">{g.label}</span>
                {g.links.map((l) => (
                  <Link key={l.to} href={l.to} className={isActive(l.to, l.end) ? 'active' : ''} aria-current={isActive(l.to, l.end) ? 'page' : undefined}>
                    <l.icon /> {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-foot">
            <a href="/" target="_blank" rel="noreferrer" className="foot-link"><Icon.ExternalLink width={16} height={16} /> View website</a>
            <div className="user-row">
              <Avatar name={session?.email ?? 'T'} size={26} />
              <span className="truncate" title={session?.email}>{session?.email}</span>
              <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out"><Icon.Logout /></button>
            </div>
          </div>
        </aside>
        <div>
          <header className="app-bar">
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href="/admin">{site?.gym_name ?? 'Medilife Fitness Club'}</Link>
              <span className="sep">/</span>
              {isDetail ? <Link href={current!.to}>{current!.label}</Link> : <span className="here">{current?.label ?? 'Dashboard'}</span>}
              {isDetail && <><span className="sep">/</span><span className="here">Details</span></>}
            </nav>
            <div className="row-actions">
              <Link href="/admin/members?new=1" className="btn btn-sm btn-ghost"><Icon.Plus width={14} height={14} /> Add member</Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="main">{children}</main>
        </div>
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
            <a href="/" target="_blank" rel="noreferrer"><Icon.ExternalLink /> View website</a>
            <button onClick={logout}><Icon.Logout /> Log out</button>
            <span className="who">{session?.email}</span>
            <InstallApp compact />
          </div>
        </div>
      )}
    </div>
  );
}
