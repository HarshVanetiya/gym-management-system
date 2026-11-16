'use client';

import { store } from '../lib/store';

export function DemoBanner() {
  if (store.mode !== 'demo') return null;
  return (
    <div className="demo-banner">
      <span>
        <strong>Demo mode</strong> — sample data stored only in this browser. Connect Supabase via <code>.env</code> for real use.
      </span>
      <button className="link-btn" onClick={() => store.resetDemo?.()}>Reset demo data</button>
    </div>
  );
}
