import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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

export default function AdminLayout() {
  const { session, refresh } = useAuth();
  const { data: site } = useSite();
  const nav = useNavigate();
  async function logout() {
    await store.auth.signOut();
    await refresh();
    nav('/login');
  }
  return (
    <div className="app">
      <DemoBanner />
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand sidebar-brand"><span className="brand-mark">IF</span><span>{site?.gym_name ?? 'Gym'}</span></div>
          <nav>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <span aria-hidden="true">{l.icon}</span> {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-foot">
            <a href="/" target="_blank" rel="noreferrer">View website ↗</a>
            <span className="muted small">{session?.email}</span>
            <button className="link-btn" onClick={logout}>Log out</button>
          </div>
        </aside>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
