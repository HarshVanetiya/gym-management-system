'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { store } from '../../lib/store';
import { useAsync } from '../../lib/hooks';
import { useGymData } from '../../lib/gym';
import { ErrorBox, Loading, StatCard, StatusBadge, Empty } from '../../components/ui';
import { Icon } from '../../components/icons';
import { Avatar } from '../../components/Media';
import { fmtDate, isoDate, money, reminderText, whatsappLink, type MemberSummary } from '../../lib/utils';

export default function Dashboard() {
  const { data, error, loading, site, reload } = useGymData();
  const today = isoDate();
  const extra = useAsync(async () => {
    const [att, leads] = await Promise.all([
      store.list('attendance', { eq: { check_in: today } }),
      store.list('leads', { eq: { status: 'new' } }),
    ]);
    return { att, leads };
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const s = data.summaries;
    const month = today.slice(0, 7);
    return {
      active: s.filter((x) => x.status === 'active' || x.status === 'expiring').length,
      expiring: s.filter((x) => x.status === 'expiring').sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0)),
      expired: s.filter((x) => x.status === 'expired' && (x.daysLeft ?? 0) >= -30).sort((a, b) => (b.daysLeft ?? 0) - (a.daysLeft ?? 0)),
      dues: s.filter((x) => x.due > 0).sort((a, b) => b.due - a.due),
      collected: data.payments.filter((p) => p.paid_on.startsWith(month)).reduce((t, p) => t + Number(p.amount), 0),
    };
  }, [data, today]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!data || !stats) return null;

  const checkedIn = new Set(extra.data?.att.map((a) => a.member_id));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}</h1>
          <p className="muted">{fmtDate(today)} · here’s what needs your attention</p>
        </div>
        <Link href="/admin/members?new=1" className="btn desk-only"><Icon.Plus width={18} height={18} /> Add member</Link>
      </div>

      <div className="stats">
        <StatCard label="Active members" icon={<Icon.Users />} value={stats.active} sub={`of ${data.members.length} total`} />
        <StatCard label="Expiring · 7 days" icon={<Icon.Clock />} value={stats.expiring.length} tone="warn" sub="need a reminder" />
        <StatCard label="Pending dues" icon={<Icon.Alert />} value={money(stats.dues.reduce((t, x) => t + x.due, 0))} tone="danger" sub={`${stats.dues.length} members`} />
        <StatCard label="Collected · this month" icon={<Icon.Wallet />} value={money(stats.collected)} tone="good" />
        <StatCard label="Checked in today" icon={<Icon.Check />} value={checkedIn.size} />
        <StatCard label="New enquiries" icon={<Icon.Inbox />} value={<Link href="/admin/leads">{extra.data?.leads.length ?? 0}</Link>} sub="from the website" />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head"><h3><Icon.Clock /> Expiring soon</h3><span className="count">{stats.expiring.length}</span></div>
          <ReminderList rows={stats.expiring} gym={site?.gym_name ?? ''} upi={site?.upi_id} empty="No memberships expiring this week." />
        </section>
        <section className="card">
          <div className="card-head"><h3><Icon.Calendar /> Expired · last 30 days</h3><span className="count">{stats.expired.length}</span></div>
          <ReminderList rows={stats.expired} gym={site?.gym_name ?? ''} upi={site?.upi_id} empty="Nobody has lapsed recently." />
        </section>
        <section className="card">
          <div className="card-head"><h3><Icon.Wallet /> Payment dues</h3><span className="count">{stats.dues.length}</span></div>
          <ReminderList rows={stats.dues} gym={site?.gym_name ?? ''} upi={site?.upi_id} showDue empty="All payments are clear." />
        </section>
        <QuickCheckIn summaries={data.summaries} checkedIn={checkedIn} onDone={() => { extra.reload(); reload(); }} />
      </div>
    </div>
  );
}

function ReminderList({ rows, gym, upi, empty, showDue }: { rows: MemberSummary[]; gym: string; upi?: string | null; empty: string; showDue?: boolean }) {
  if (!rows.length) return <Empty icon={<Icon.Check />}>{empty}</Empty>;
  return (
    <ul className="list">
      {rows.slice(0, 8).map((s) => {
        const wa = whatsappLink(s.member.phone, reminderText(s, gym, upi));
        return (
          <li key={s.member.id}>
            <div className="person">
              <Avatar name={s.member.full_name} url={s.member.photo_url} size={36} />
              <div>
              <Link href={`/admin/members/${s.member.id}`} className="strong">{s.member.full_name}</Link>
              <div className="muted small">
                {showDue ? `Due ${money(s.due)}` : s.latest ? `${s.latest.plan_name} · ends ${fmtDate(s.latest.end_date)}` : ''}
              </div>
              </div>
            </div>
            <div className="row-actions">
              {!showDue && <StatusBadge status={s.status} />}
              {wa && <a className="btn btn-sm btn-wa" href={wa} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${s.member.full_name}`}><Icon.Chat width={16} height={16} /> <span className="hide-xs">Remind</span></a>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function QuickCheckIn({ summaries, checkedIn, onDone }: { summaries: MemberSummary[]; checkedIn: Set<string>; onDone: () => void }) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const matches = q.trim()
    ? summaries.filter((s) => s.member.full_name.toLowerCase().includes(q.toLowerCase()) || s.member.phone?.includes(q)).slice(0, 6)
    : [];
  async function checkIn(id: string) {
    setBusy(id);
    try {
      await store.insert('attendance', { member_id: id, check_in: isoDate() });
      onDone();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="card">
      <div className="card-head"><h3><Icon.Check /> Quick check-in</h3></div>
      <div className="search-field"><Icon.Search /><input placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members to check in" /></div>
      <ul className="list">
        {matches.map((s) => (
          <li key={s.member.id}>
            <div className="person">
              <Avatar name={s.member.full_name} url={s.member.photo_url} size={36} />
              <div>
                <span className="strong">{s.member.full_name}</span>
                <div className="muted small">{s.member.phone}</div>
              </div>
            </div>
            <div className="row-actions">
              {s.status === 'expired' && <StatusBadge status="expired" />}
              {checkedIn.has(s.member.id) ? (
                <span className="badge badge-active"><Icon.Check width={14} height={14} /> In</span>
              ) : (
                <button className="btn btn-sm" disabled={busy === s.member.id} onClick={() => checkIn(s.member.id)}>Check in</button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!q && <p className="muted small" style={{ marginTop: 10 }}>Type a name or phone number to mark today’s attendance.</p>}
    </section>
  );
}
