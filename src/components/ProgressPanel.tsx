'use client';

import { useState, type FormEvent } from 'react';
import { store } from '../lib/store';
import { useAsync } from '../lib/hooks';
import { fmtDate, isoDate } from '../lib/utils';
import type { ProgressLog } from '../lib/types';
import { Empty, ErrorBox } from './ui';
import { Icon } from './icons';

export function ProgressPanel({ memberId, canEdit }: { memberId: string; canEdit?: boolean }) {
  const { data, error, reload } = useAsync(() => store.list('progress_logs', { eq: { member_id: memberId }, order: ['logged_on', 'asc'] }), [memberId]);
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [date, setDate] = useState(isoDate());
  const [err, setErr] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await store.insert('progress_logs', {
        member_id: memberId, logged_on: date, weight_kg: weight ? Number(weight) : null, waist_cm: waist ? Number(waist) : null, body_fat: null, notes: null,
      });
      setWeight('');
      setWaist('');
      reload();
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }
  async function del(id: string) {
    await store.remove('progress_logs', id);
    reload();
  }

  const logs = data ?? [];
  const withWeight = logs.filter((l) => l.weight_kg != null);
  const change = withWeight.length > 1 ? Number(withWeight[withWeight.length - 1].weight_kg) - Number(withWeight[0].weight_kg) : null;

  return (
    <div>
      <div className="card-head">
        <h3>Progress</h3>
        {change != null && (
          <span className={`badge ${change <= 0 ? 'badge-active' : 'badge-expiring'}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)} kg since {fmtDate(withWeight[0].logged_on)}
          </span>
        )}
      </div>
      <ErrorBox error={error} />
      {withWeight.length > 1 && <WeightChart logs={withWeight} />}
      {canEdit && (
        <form className="inline-form" onSubmit={add}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
          <input type="number" step="0.1" placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <input type="number" step="0.1" placeholder="Waist (cm)" value={waist} onChange={(e) => setWaist(e.target.value)} />
          <button className="btn btn-sm" disabled={!weight && !waist}>Add entry</button>
        </form>
      )}
      <ErrorBox error={err} />
      {logs.length === 0 ? <Empty>No entries yet.</Empty> : (
        <ul className="list compact">
          {[...logs].reverse().slice(0, 8).map((l) => (
            <li key={l.id}>
              <span>{fmtDate(l.logged_on)}</span>
              <span className="row-actions">
                {l.weight_kg != null && <strong>{l.weight_kg} kg</strong>}
                {l.waist_cm != null && <span className="muted">waist {l.waist_cm} cm</span>}
                {canEdit && <button className="icon-btn" title="Delete entry" aria-label="Delete entry" onClick={() => del(l.id)}><Icon.Trash width={18} height={18} /></button>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WeightChart({ logs }: { logs: ProgressLog[] }) {
  const W = 600, H = 160, P = 28;
  const ws = logs.map((l) => Number(l.weight_kg));
  const min = Math.floor(Math.min(...ws) - 1), max = Math.ceil(Math.max(...ws) + 1);
  const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, logs.length - 1);
  const y = (w: number) => H - P - ((w - min) / (max - min)) * (H - 2 * P);
  const path = logs.map((l, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(Number(l.weight_kg)).toFixed(1)}`).join(' ');
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weight trend">
      <line x1={P} x2={W - P} y1={y(max)} y2={y(max)} className="grid" />
      <line x1={P} x2={W - P} y1={y(min)} y2={y(min)} className="grid" />
      <text x={4} y={y(max) + 4} className="axis">{max}</text>
      <text x={4} y={y(min) + 4} className="axis">{min}</text>
      <path d={path} className="line" />
      {logs.map((l, i) => (
        <g key={l.id}>
          <circle cx={x(i)} cy={y(Number(l.weight_kg))} r={4} className="dot"><title>{`${fmtDate(l.logged_on)}: ${l.weight_kg} kg`}</title></circle>
        </g>
      ))}
      <text x={x(logs.length - 1)} y={y(Number(logs[logs.length - 1].weight_kg)) - 10} textAnchor="end" className="label">{logs[logs.length - 1].weight_kg} kg</text>
    </svg>
  );
}
