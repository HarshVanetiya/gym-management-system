'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { store } from '../../lib/store';
import { useAsync, useSite } from '../../lib/hooks';
import type { Member, Plan, PaymentMethod, Subscription } from '../../lib/types';
import { addDays, fmtDate, isoDate, money, reminderText, summarize, whatsappLink } from '../../lib/utils';
import { Empty, ErrorBox, Field, Loading, Modal, StatusBadge } from '../../components/ui';
import { Icon } from '../../components/icons';
import { MemberForm, METHODS } from './MemberForm';
import { ProgressPanel } from '../../components/ProgressPanel';
import { Avatar, PhotoButton } from '../../components/Media';

export default function MemberDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const router = useRouter();
  const nav = (path: string) => router.push(path);
  const { data: site } = useSite();
  const { data, error, loading, reload } = useAsync(async () => {
    const [member, subs, payments, attendance, plans, workouts, diets] = await Promise.all([
      store.get('members', id),
      store.list('subscriptions', { eq: { member_id: id }, order: ['end_date', 'desc'] }),
      store.list('payments', { eq: { member_id: id }, order: ['paid_on', 'desc'] }),
      store.list('attendance', { eq: { member_id: id }, order: ['check_in', 'desc'] }),
      store.list('plans', { order: ['sort_order', 'asc'] }),
      store.list('workout_plans', { order: ['name', 'asc'] }),
      store.list('diet_plans', { order: ['name', 'asc'] }),
    ]);
    return { member, subs, payments, attendance, plans, workouts, diets };
  }, [id]);
  const [modal, setModal] = useState<'edit' | 'renew' | 'pay' | null>(null);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!data?.member) return <Empty>Member not found. <Link href="/admin/members">Back</Link></Empty>;

  const m = data.member;
  const s = summarize(m, data.subs, data.payments);
  const wa = whatsappLink(m.phone, reminderText(s, site?.gym_name ?? '', site?.upi_id));
  const today = isoDate();
  const checkedToday = data.attendance.some((a) => a.check_in === today);
  const last30 = data.attendance.filter((a) => a.check_in >= addDays(today, -30)).length;

  async function assign(field: 'workout_plan_id' | 'diet_plan_id', value: string) {
    await store.update('members', m.id, { [field]: value || null } as Partial<Member>);
    reload();
  }
  async function checkIn() {
    await store.insert('attendance', { member_id: m.id, check_in: today });
    reload();
  }
  async function removeMember() {
    if (!confirm(`Delete ${m.full_name} and all their records? This cannot be undone.`)) return;
    await store.remove('members', m.id);
    nav('/admin/members');
  }
  async function deletePayment(pid: string) {
    if (!confirm('Delete this payment entry?')) return;
    await store.remove('payments', pid);
    reload();
  }

  return (
    <div>
      <Link href="/admin/members" className="back-link"><Icon.ArrowRight width={16} height={16} style={{ transform: 'rotate(180deg)' }} /> All members</Link>
      <div className="page-head member-head">
        <div className="person">
          <Avatar name={m.full_name} url={m.photo_url} size={72} />
          <div>
            <h1>{m.full_name} <StatusBadge status={s.status} /></h1>
            <p className="muted">
              {[m.phone, m.email, m.goal && `Goal: ${m.goal}`, `Joined ${fmtDate(m.joined_on)}`].filter(Boolean).join(' · ')}
            </p>
            <PhotoButton
              target={{ kind: 'avatar', memberId: m.id }}
              label={m.photo_url ? 'Change photo' : 'Add photo'}
              className="link-btn"
              onUploaded={async (url) => { await store.update('members', m.id, { photo_url: url }); reload(); }}
            />
          </div>
        </div>
        <div className="row-actions wrap">
          {wa && <a className="btn btn-wa" href={wa} target="_blank" rel="noreferrer"><Icon.Chat width={17} height={17} /> WhatsApp reminder</a>}
          <button className="btn btn-ghost" onClick={() => setModal('edit')}><Icon.Edit width={17} height={17} /> Edit</button>
          <button className="btn btn-ghost danger" onClick={removeMember} aria-label="Delete member"><Icon.Trash width={17} height={17} /> <span className="hide-xs">Delete</span></button>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h3><Icon.Calendar /> Membership</h3>
            <button className="btn btn-sm" onClick={() => setModal('renew')}><Icon.Refresh width={16} height={16} /> {s.latest ? 'Renew' : 'Start plan'}</button>
          </div>
          {s.latest ? (
            <div className="kv">
              <div><span>Current plan</span><strong>{s.latest.plan_name}</strong></div>
              <div><span>Valid</span><strong>{fmtDate(s.latest.start_date)} – {fmtDate(s.latest.end_date)}</strong></div>
              <div><span>Days left</span><strong className={s.daysLeft! < 0 ? 'text-danger' : ''}>{s.daysLeft! < 0 ? `Expired ${-s.daysLeft!} days ago` : s.daysLeft}</strong></div>
              <div><span>Billed / Paid</span><strong>{money(s.totalBilled)} / {money(s.totalPaid)}</strong></div>
              <div><span>Balance due</span><strong className={s.due > 0 ? 'text-danger' : 'text-good'}>{money(s.due)}</strong></div>
            </div>
          ) : <Empty>No membership yet.</Empty>}
          {data.subs.length > 1 && (
            <details className="history">
              <summary>Plan history ({data.subs.length})</summary>
              <ul className="list compact">
                {data.subs.map((x) => <li key={x.id}><span>{x.plan_name}</span><span className="muted small">{fmtDate(x.start_date)} – {fmtDate(x.end_date)} · {money(x.price)}</span></li>)}
              </ul>
            </details>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h3><Icon.Wallet /> Payments</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => setModal('pay')}><Icon.Plus width={16} height={16} /> Payment</button>
          </div>
          {data.payments.length === 0 ? <Empty>No payments recorded.</Empty> : (
            <ul className="list compact">
              {data.payments.map((p) => (
                <li key={p.id}>
                  <div><strong>{money(p.amount)}</strong> <span className="tag">{p.method}</span>{p.note && <div className="muted small">{p.note}</div>}</div>
                  <div className="row-actions"><span className="muted small">{fmtDate(p.paid_on)}</span><button className="icon-btn" title="Delete payment" aria-label="Delete payment" onClick={() => deletePayment(p.id)}><Icon.Trash width={18} height={18} /></button></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h3><Icon.Clipboard /> Programs</h3>
          <Field label="Workout plan">
            <select value={m.workout_plan_id ?? ''} onChange={(e) => assign('workout_plan_id', e.target.value)}>
              <option value="">— Not assigned —</option>
              {data.workouts.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>
          <Field label="Diet plan">
            <select value={m.diet_plan_id ?? ''} onChange={(e) => assign('diet_plan_id', e.target.value)}>
              <option value="">— Not assigned —</option>
              {data.diets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <p className="muted small">Members see the assigned plans in their app. Edit templates under <Link href="/admin/programs">Workouts & Diets</Link>.</p>
          <div className="login-status">
            {m.user_id ? <span className="badge badge-active">App login linked</span> : (
              <span className="muted small">
                No app login yet. Ask {m.full_name.split(' ')[0]} to sign up at <strong>{typeof window === 'undefined' ? '' : window.location.origin}/login</strong> using <strong>{m.email ?? '(add an email first)'}</strong>.
              </span>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h3><Icon.Check /> Attendance</h3>
            {checkedToday ? <span className="badge badge-active"><Icon.Check width={14} height={14} /> In today</span> : <button className="btn btn-sm btn-ghost" onClick={checkIn}>Check in</button>}
          </div>
          <p><strong>{last30}</strong> visits in the last 30 days</p>
          <AttendanceStrip dates={data.attendance.map((a) => a.check_in)} />
        </section>

        <section className="card span-2">
          <ProgressPanel memberId={m.id} canEdit />
        </section>
      </div>

      {modal === 'edit' && <MemberForm member={m} plans={data.plans} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {modal === 'renew' && <RenewModal member={m} plans={data.plans} latest={s.latest} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {modal === 'pay' && <PaymentModal member={m} subs={data.subs} due={s.due} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
    </div>
  );
}

export function AttendanceStrip({ dates }: { dates: string[] }) {
  const set = new Set(dates);
  const today = isoDate();
  const days = Array.from({ length: 35 }, (_, i) => addDays(today, i - 34));
  return (
    <div className="att-strip" aria-label="Attendance in the last 5 weeks">
      {days.map((d) => <span key={d} className={set.has(d) ? 'on' : ''} title={`${fmtDate(d)}${set.has(d) ? ' — present' : ''}`} />)}
    </div>
  );
}

function RenewModal({ member, plans, latest, onClose, onSaved }: { member: Member; plans: Plan[]; latest: Subscription | null; onClose: () => void; onSaved: () => void }) {
  const today = isoDate();
  const defaultStart = latest && latest.end_date >= today ? addDays(latest.end_date, 1) : today;
  const active = plans.filter((p) => p.is_active);
  const [planId, setPlanId] = useState(active.find((p) => p.id === latest?.plan_id)?.id ?? active[0]?.id ?? '');
  const plan = plans.find((p) => p.id === planId);
  const [start, setStart] = useState(defaultStart);
  const [price, setPrice] = useState(plan?.price.toString() ?? '0');
  const [paid, setPaid] = useState(plan?.price.toString() ?? '0');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!plan) return;
    setBusy(true);
    try {
      const sub = await store.insert('subscriptions', {
        member_id: member.id, plan_id: plan.id, plan_name: plan.name, start_date: start, end_date: addDays(start, plan.duration_days - 1), price: Number(price),
      });
      if (Number(paid) > 0) await store.insert('payments', { member_id: member.id, subscription_id: sub.id, amount: Number(paid), method, paid_on: today, note: null });
      onSaved();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={`Renew — ${member.full_name}`} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <Field label="Plan">
          <select value={planId} onChange={(e) => { setPlanId(e.target.value); const p = plans.find((x) => x.id === e.target.value); setPrice(String(p?.price ?? 0)); setPaid(String(p?.price ?? 0)); }}>
            {active.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.duration_days} days · ₹{p.price}</option>)}
          </select>
        </Field>
        <Field label="Start date" hint={plan ? `Ends on ${fmtDate(addDays(start, plan.duration_days - 1))}` : ''}><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Price charged (₹)" hint="Change it if you gave a discount."><input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Amount received now (₹)" hint="Enter 0 if they will pay later — it shows as due."><input type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} /></Field>
        <Field label="Method"><select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>{METHODS.map((x) => <option key={x} value={x}>{x.toUpperCase()}</option>)}</select></Field>
        <ErrorBox error={err} />
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={busy}>Save</button></div>
      </form>
    </Modal>
  );
}

function PaymentModal({ member, subs, due, onClose, onSaved }: { member: Member; subs: Subscription[]; due: number; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(due > 0 ? String(due) : '');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [paidOn, setPaidOn] = useState(isoDate());
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await store.insert('payments', { member_id: member.id, subscription_id: subs[0]?.id ?? null, amount: Number(amount), method, paid_on: paidOn, note: note.trim() || null });
      onSaved();
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }
  return (
    <Modal title={`Record payment — ${member.full_name}`} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        {due > 0 && <div className="info-box">Outstanding balance: {money(due)}</div>}
        <Field label="Amount (₹)"><input type="number" min="1" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Method"><select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>{METHODS.map((x) => <option key={x} value={x}>{x.toUpperCase()}</option>)}</select></Field>
        <Field label="Date"><input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} /></Field>
        <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="UPI ref no., receipt no.…" /></Field>
        <ErrorBox error={err} />
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn">Save</button></div>
      </form>
    </Modal>
  );
}
