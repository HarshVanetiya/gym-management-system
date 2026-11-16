'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useGymData } from '../../lib/gym';
import { Empty, ErrorBox, Loading, StatCard } from '../../components/ui';
import { Icon } from '../../components/icons';
import { downloadFile, fmtDate, isoDate, money, toCsv } from '../../lib/utils';

export default function Payments() {
  const { data, error, loading } = useGymData();
  const [month, setMonth] = useState(isoDate().slice(0, 7));

  const view = useMemo(() => {
    if (!data) return null;
    const names = new Map(data.members.map((m) => [m.id, m.full_name]));
    const rows = data.payments.filter((p) => p.paid_on.startsWith(month)).map((p) => ({ ...p, name: names.get(p.member_id) ?? '—' }));
    const byMethod = rows.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.method]: (acc[p.method] ?? 0) + Number(p.amount) }), {});
    // last 6 months totals
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      return isoDate(d).slice(0, 7);
    });
    const trend = months.map((mo) => ({ mo, total: data.payments.filter((p) => p.paid_on.startsWith(mo)).reduce((t, p) => t + Number(p.amount), 0) }));
    return { rows, byMethod, total: rows.reduce((t, p) => t + Number(p.amount), 0), trend };
  }, [data, month]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!view) return null;
  const maxTrend = Math.max(1, ...view.trend.map((t) => t.total));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Payments</h1>
          <p className="muted">All offline payments you’ve recorded (cash, UPI, card…)</p>
        </div>
        <div className="row-actions">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month" />
          <button className="btn btn-ghost" onClick={() => downloadFile(`payments-${month}.csv`, toCsv(view.rows.map((r) => ({ date: r.paid_on, member: r.name, amount: r.amount, method: r.method, note: r.note ?? '' }))))}><Icon.Download width={17} height={17} /> <span className="hide-xs">Export CSV</span></button>
        </div>
      </div>

      <div className="stats">
        <StatCard label="Collected" value={money(view.total)} tone="good" sub={`${view.rows.length} payments`} />
        {Object.entries(view.byMethod).map(([m, v]) => <StatCard key={m} label={m.toUpperCase()} value={money(v)} />)}
      </div>

      <section className="card">
        <h3>Last 6 months</h3>
        <div className="bars">
          {view.trend.map((t) => (
            <button key={t.mo} className={`bar ${t.mo === month ? 'active' : ''}`} onClick={() => setMonth(t.mo)} title={money(t.total)}>
              <span className="bar-val">{t.total ? money(t.total) : ''}</span>
              <span className="bar-fill" style={{ height: `${(t.total / maxTrend) * 100}%` }} />
              <span className="bar-label">{new Date(t.mo + '-01').toLocaleString('en-IN', { month: 'short' })}</span>
            </button>
          ))}
        </div>
      </section>

      {view.rows.length === 0 ? <Empty>No payments in this month.</Empty> : (
        <div className="card table-card">
          <table className="table">
            <thead><tr><th>Date</th><th>Member</th><th>Method</th><th>Note</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {view.rows.map((p) => (
                <tr key={p.id}>
                  <td data-label="Date">{fmtDate(p.paid_on)}</td>
                  <td data-label="Member"><Link href={`/admin/members/${p.member_id}`}>{p.name}</Link></td>
                  <td data-label="Method"><span className="tag">{p.method}</span></td>
                  <td data-label="Note">{p.note ?? ''}</td>
                  <td data-label="Amount" className="num strong">{money(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
