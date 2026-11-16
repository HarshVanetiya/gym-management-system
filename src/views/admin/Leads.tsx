'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '../../lib/store';
import { useAsync, useSite } from '../../lib/hooks';
import type { Lead, LeadStatus } from '../../lib/types';
import { fmtDate, whatsappLink } from '../../lib/utils';
import { Empty, ErrorBox, Loading } from '../../components/ui';

const STATUSES: LeadStatus[] = ['new', 'contacted', 'joined', 'lost'];

export default function Leads() {
  const { data, error, loading, reload } = useAsync(() => store.list('leads', { order: ['created_at', 'desc'] }));
  const { data: site } = useSite();
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');
  const router = useRouter();
  const nav = (path: string) => router.push(path);

  async function setStatus(l: Lead, status: LeadStatus) {
    await store.update('leads', l.id, { status });
    reload();
  }
  async function convert(l: Lead) {
    const m = await store.insert('members', {
      full_name: l.name, phone: l.phone, email: l.email?.toLowerCase() ?? null, goal: l.message, joined_on: new Date().toISOString().slice(0, 10),
      user_id: null, workout_plan_id: null, diet_plan_id: null, gender: null, dob: null, notes: null, height_cm: null,
    });
    await store.update('leads', l.id, { status: 'joined' });
    nav(`/admin/members/${m.id}`);
  }
  async function del(l: Lead) {
    if (!confirm(`Delete enquiry from ${l.name}?`)) return;
    await store.remove('leads', l.id);
    reload();
  }

  if (loading && !data) return <Loading />;
  const rows = (data ?? []).filter((l) => filter === 'all' || l.status === filter);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Enquiries</h1>
          <p className="muted">People who filled the form on your website.</p>
        </div>
      </div>
      <div className="chips">
        {(['all', ...STATUSES] as const).map((s) => (
          <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s[0].toUpperCase() + s.slice(1)} {s !== 'all' && `(${data?.filter((l) => l.status === s).length ?? 0})`}
          </button>
        ))}
      </div>
      <ErrorBox error={error} />
      {rows.length === 0 ? <Empty>No enquiries here.</Empty> : (
        <div className="grid-2 mt">
          {rows.map((l) => {
            const wa = whatsappLink(l.phone, `Hi ${l.name.split(' ')[0]}, thanks for contacting ${site?.gym_name ?? 'us'}! When would you like to come for your free trial session?`);
            return (
              <div className="card" key={l.id}>
                <div className="card-head">
                  <h3>{l.name}</h3>
                  <select className={`status-select st-${l.status}`} value={l.status} onChange={(e) => setStatus(l, e.target.value as LeadStatus)} aria-label="Status">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <p className="small"><a href={`tel:${l.phone}`}>{l.phone}</a>{l.email && <> · {l.email}</>}</p>
                {l.interested_plan && <p className="small">Interested in: <strong>{l.interested_plan}</strong></p>}
                {l.message && <p className="quote">“{l.message}”</p>}
                <p className="muted small">Received {fmtDate(l.created_at)}</p>
                <div className="row-actions wrap">
                  {wa && <a className="btn btn-sm btn-wa" href={wa} target="_blank" rel="noreferrer" onClick={() => l.status === 'new' && setStatus(l, 'contacted')}>WhatsApp</a>}
                  {l.status !== 'joined' && <button className="btn btn-sm" onClick={() => convert(l)}>Convert to member</button>}
                  <button className="btn btn-sm btn-ghost danger" onClick={() => del(l)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
