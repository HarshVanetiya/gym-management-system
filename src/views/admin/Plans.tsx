'use client';

import { useState, type FormEvent } from 'react';
import { store } from '../../lib/store';
import { useAsync } from '../../lib/hooks';
import type { Plan } from '../../lib/types';
import { money } from '../../lib/utils';
import { ErrorBox, Field, Loading, Modal } from '../../components/ui';
import { Icon } from '../../components/icons';

export default function Plans() {
  const { data, error, loading, reload } = useAsync(() => store.list('plans', { order: ['sort_order', 'asc'] }));
  const [editing, setEditing] = useState<Plan | 'new' | null>(null);

  if (loading && !data) return <Loading />;
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Membership plans</h1>
          <p className="muted">Shown on the website pricing section and used when renewing members.</p>
        </div>
        <button className="btn" onClick={() => setEditing('new')}><Icon.Plus width={17} height={17} /> New plan</button>
      </div>
      <ErrorBox error={error} />
      <div className="grid-3">
        {data?.map((p) => (
          <div className={`card ${p.is_active ? '' : 'inactive'}`} key={p.id}>
            <div className="card-head">
              <h3>{p.name}</h3>
              {!p.is_active && <span className="badge badge-none">Hidden</span>}
            </div>
            <div className="price small-price">{money(p.price)}<span> / {p.duration_days} days</span></div>
            <p className="muted">{p.description}</p>
            <ul className="ticks">{p.features?.map((f) => <li key={f}>{f}</li>)}</ul>
            <button className="btn btn-sm btn-ghost" onClick={() => setEditing(p)}><Icon.Edit width={16} height={16} /> Edit</button>
          </div>
        ))}
      </div>
      {editing && <PlanForm plan={editing === 'new' ? undefined : editing} nextOrder={(data?.length ?? 0) + 1} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function PlanForm({ plan, nextOrder, onClose, onSaved }: { plan?: Plan; nextOrder: number; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: plan?.name ?? '',
    duration_days: String(plan?.duration_days ?? 30),
    price: String(plan?.price ?? ''),
    description: plan?.description ?? '',
    features: (plan?.features ?? []).join('\n'),
    is_active: plan?.is_active ?? true,
    sort_order: String(plan?.sort_order ?? nextOrder),
  });
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const row = {
      name: f.name.trim(), duration_days: Number(f.duration_days), price: Number(f.price), description: f.description.trim() || null,
      features: f.features.split('\n').map((x) => x.trim()).filter(Boolean), is_active: f.is_active, sort_order: Number(f.sort_order),
    };
    try {
      if (plan) await store.update('plans', plan.id, row);
      else await store.insert('plans', row);
      onSaved();
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }
  async function del() {
    if (!plan || !confirm('Delete this plan? Existing member history keeps the plan name. Consider hiding it instead.')) return;
    try {
      await store.remove('plans', plan.id);
      onSaved();
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }
  return (
    <Modal title={plan ? 'Edit plan' : 'New plan'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Field label="Name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="form-grid">
          <Field label="Duration (days)"><input type="number" min="1" required value={f.duration_days} onChange={(e) => setF({ ...f, duration_days: e.target.value })} /></Field>
          <Field label="Price (₹)"><input type="number" min="0" required value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
        </div>
        <Field label="Short description"><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Features (one per line)"><textarea rows={4} value={f.features} onChange={(e) => setF({ ...f, features: e.target.value })} /></Field>
        <div className="form-grid">
          <Field label="Display order"><input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} /></Field>
          <label className="check"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Show on website</label>
        </div>
        <ErrorBox error={err} />
        <div className="form-actions">
          {plan && <button type="button" className="btn btn-ghost danger" onClick={del}>Delete</button>}
          <span className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn">Save</button>
        </div>
      </form>
    </Modal>
  );
}
