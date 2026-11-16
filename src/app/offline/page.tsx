import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Offline', robots: { index: false } };

export default function Offline() {
  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <span className="brand"><span className="brand-mark">MFC</span>Medilife Fitness Club</span>
        <div className="card auth-card">
          <p className="label">No connection</p>
          <h2>You’re offline</h2>
          <p className="muted">Check your internet and try again. Pages you opened before are still available.</p>
          <Link href="/me" className="btn btn-block">Open my plan <span className="arr">↗</span></Link>
        </div>
      </div>
    </div>
  );
}
