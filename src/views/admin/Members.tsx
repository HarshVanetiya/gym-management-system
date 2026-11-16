'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGymData } from '../../lib/gym';
import { ErrorBox, Loading, StatusBadge, Empty } from '../../components/ui';
import { downloadFile, fmtDate, isoDate, money, toCsv, type MemberStatus } from '../../lib/utils';
import { MemberForm } from './MemberForm';

const FILTERS: (MemberStatus | 'all' | 'due')[] = ['all', 'active', 'expiring', 'expired', 'due', 'none'];
const FILTER_LABEL: Record<string, string> = { all: 'All', active: 'Active', expiring: 'Expiring', expired: 'Expired', due: 'Dues', none: 'No plan' };

export default function Members() {
  const { data, error, loading } = useGymData();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const router = useRouter();
  const nav = (path: string) => router.push(path);
  const setParams = (p: { new?: string }) => router.replace(p.new ? '/admin/members?new=1' : '/admin/members');
  const showNew = params.get('new') === '1';

  const rows = useMemo(() => {
    if (!data) return [];
    const term = q.toLowerCase().trim();
    return data.summaries.filter((s) => {
      if (filter === 'due' ? s.due <= 0 : filter !== 'all' && s.status !== filter) return false;
      if (!term) return true;
      return [s.member.full_name, s.member.phone, s.member.email].some((v) => v?.toLowerCase().includes(term));
    });
  }, [data, q, filter]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  function exportCsv() {
    const csv = toCsv(rows.map((s) => ({
      name: s.member.full_name, phone: s.member.phone, email: s.member.email, plan: s.latest?.plan_name ?? '',
      start: s.latest?.start_date ?? '', end: s.latest?.end_date ?? '', status: s.status, billed: s.totalBilled, paid: s.totalPaid, due: s.due,
    })));
    downloadFile(`members-${isoDate()}.csv`, csv);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Members</h1>
          <p className="muted">{data.members.length} members</p>
        </div>
        <div className="row-actions">
          <button className="btn btn-ghost" onClick={exportCsv}>Export CSV</button>
          <button className="btn" onClick={() => setParams({ new: '1' })}>+ Add member</button>
        </div>
      </div>

      <div className="toolbar">
        <input className="search" placeholder="Search name, phone, email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          {FILTERS.map((f) => (
            <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{FILTER_LABEL[f]}</button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty>No members match.</Empty>
      ) : (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Plan</th><th>Ends</th><th>Status</th><th className="num">Due</th></tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.member.id} onClick={() => nav(`/admin/members/${s.member.id}`)} className="clickable">
                  <td data-label="Name"><Link href={`/admin/members/${s.member.id}`} className="strong">{s.member.full_name}</Link>{s.member.user_id && <span className="tag" title="Has app login">app</span>}</td>
                  <td data-label="Phone">{s.member.phone ?? '—'}</td>
                  <td data-label="Plan">{s.latest?.plan_name ?? '—'}</td>
                  <td data-label="Ends">{fmtDate(s.latest?.end_date)}</td>
                  <td data-label="Status"><StatusBadge status={s.status} /></td>
                  <td data-label="Due" className={`num ${s.due > 0 ? 'text-danger' : ''}`}>{s.due > 0 ? money(s.due) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <MemberForm
          plans={data.plans}
          onClose={() => setParams({})}
          onSaved={(id) => nav(`/admin/members/${id}`)}
        />
      )}
    </div>
  );
}
