'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGymData } from '../../lib/gym';
import { ErrorBox, Loading, StatusBadge, Empty } from '../../components/ui';
import { Avatar } from '../../components/Media';
import { Icon } from '../../components/icons';
import { downloadFile, fmtDate, fmtShort, isoDate, money, toCsv, type MemberStatus } from '../../lib/utils';
import { MemberForm } from './MemberForm';

type Filter = MemberStatus | 'current' | 'all' | 'due' | 'former';
const FILTERS: Filter[] = ['current', 'active', 'expiring', 'expired', 'due', 'none', 'former', 'all'];
const FILTER_LABEL: Record<Filter, string> = { current: 'Current', active: 'Active', expiring: 'Expiring', expired: 'Expired', due: 'Dues', none: 'No plan', former: 'Former', all: 'All' };
/** Members whose plan ended more than 90 days ago drop out of the default "Current" view (nothing is deleted). */
const FORMER_AFTER_DAYS = 90;
const isFormer = (s: { status: MemberStatus; daysLeft: number | null; due: number }) => s.status === 'expired' && (s.daysLeft ?? 0) < -FORMER_AFTER_DAYS && s.due <= 0;
function matches(f: Filter, s: { status: MemberStatus; daysLeft: number | null; due: number }) {
  if (f === 'all') return true;
  if (f === 'current') return !isFormer(s);
  if (f === 'former') return isFormer(s);
  if (f === 'due') return s.due > 0;
  if (f === 'expired') return s.status === 'expired' && !isFormer(s);
  return s.status === f;
}

export default function Members() {
  const { data, error, loading } = useGymData();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('current');
  const router = useRouter();
  const nav = (path: string) => router.push(path);
  const setParams = (p: { new?: string }) => router.replace(p.new ? '/admin/members?new=1' : '/admin/members');
  const showNew = params.get('new') === '1';

  const rows = useMemo(() => {
    if (!data) return [];
    const term = q.toLowerCase().trim();
    return data.summaries.filter((s) => {
      // a search looks through everyone, including former members
      if (!term) return matches(filter, s);
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
          <p className="muted">{rows.length} shown · {data.members.length} in total</p>
        </div>
        <div className="row-actions">
          <button className="btn btn-ghost" onClick={exportCsv}><Icon.Download width={17} height={17} /> <span className="hide-xs">Export CSV</span></button>
          <button className="btn" onClick={() => setParams({ new: '1' })}><Icon.Plus width={17} height={17} /> Add member</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-field search"><Icon.Search /><input placeholder="Search name, phone, email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members" /></div>
        <div className="chips" role="tablist" aria-label="Filter members">
          {FILTERS.map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {FILTER_LABEL[f]} <span className="chip-count">{data.summaries.filter((s) => matches(f, s)).length}</span>
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty icon={<Icon.Search />}>No members match.</Empty>
      ) : (
        <>
        <ul className="member-list card phone-only">
          {rows.map((s) => (
            <li key={s.member.id}>
              <Link href={`/admin/members/${s.member.id}`}>
                <Avatar name={s.member.full_name} url={s.member.photo_url} size={42} />
                <span className="ml-main">
                  <span className="strong">{s.member.full_name}</span>
                  <span className="muted small">{s.latest ? `${s.latest.plan_name} · ${s.daysLeft! < 0 ? 'ended' : 'ends'} ${fmtShort(s.latest.end_date)}` : 'No plan yet'}</span>
                </span>
                <span className="ml-side">
                  <StatusBadge status={s.status} />
                  {s.due > 0 && <span className="text-danger small strong num">Due {money(s.due)}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="card table-card desk-only-block">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Plan</th><th>Ends</th><th>Status</th><th className="num">Due</th></tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.member.id} onClick={() => nav(`/admin/members/${s.member.id}`)} className="clickable">
                  <td data-label="Name"><span className="person"><Avatar name={s.member.full_name} url={s.member.photo_url} size={32} /><Link href={`/admin/members/${s.member.id}`} className="strong">{s.member.full_name}</Link>{s.member.user_id && <span className="tag" title="Uses the member app">app</span>}</span></td>
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
        </>
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
