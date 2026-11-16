'use client';

import { useState, type FormEvent } from 'react';
import { store } from '../../lib/store';
import type { Member, PaymentMethod, Plan } from '../../lib/types';
import { addDays, isoDate } from '../../lib/utils';
import { ErrorBox, Field, Modal } from '../../components/ui';

export const METHODS: PaymentMethod[] = ['cash', 'upi', 'card', 'bank', 'other'];

export function MemberForm({ member, plans, onClose, onSaved }: { member?: Member; plans: Plan[]; onClose: () => void; onSaved: (id: string) => void }) {
  const isNew = !member;
  const [f, setF] = useState({
    full_name: member?.full_name ?? '',
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    gender: member?.gender ?? '',
    dob: member?.dob ?? '',
    joined_on: member?.joined_on ?? isoDate(),
    goal: member?.goal ?? '',
    height_cm: member?.height_cm?.toString() ?? '',
    notes: member?.notes ?? '',
  });
  const activePlans = plans.filter((p) => p.is_active);
  const [planId, setPlanId] = useState(activePlans[0]?.id ?? '');
  const [start, setStart] = useState(isoDate());
  const [paid, setPaid] = useState(activePlans[0]?.price.toString() ?? '');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const row: Partial<Member> = {
        full_name: f.full_name.trim(),
        phone: f.phone.trim() || null,
        email: f.email.trim().toLowerCase() || null,
        gender: f.gender || null,
        dob: f.dob || null,
        joined_on: f.joined_on,
        goal: f.goal.trim() || null,
        height_cm: f.height_cm ? Number(f.height_cm) : null,
        notes: f.notes.trim() || null,
      };
      const saved = member ? await store.update('members', member.id, row) : await store.insert('members', { ...row, user_id: null, workout_plan_id: null, diet_plan_id: null });
      if (isNew && planId) {
        const plan = plans.find((p) => p.id === planId)!;
        const sub = await store.insert('subscriptions', {
          member_id: saved.id, plan_id: plan.id, plan_name: plan.name, start_date: start, end_date: addDays(start, plan.duration_days - 1), price: plan.price,
        });
        if (Number(paid) > 0) {
          await store.insert('payments', { member_id: saved.id, subscription_id: sub.id, amount: Number(paid), method, paid_on: isoDate(), note: null });
        }
      }
      onSaved(saved.id);
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={isNew ? 'Add member' : 'Edit member'} onClose={onClose} wide>
      <form onSubmit={submit} className="form-grid">
        <Field label="Full name *"><input required value={f.full_name} onChange={set('full_name')} /></Field>
        <Field label="Phone"><input inputMode="tel" value={f.phone} onChange={set('phone')} placeholder="10-digit mobile" /></Field>
        <Field label="Email" hint="Member signs up with this email to see their plan in the app."><input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Gender">
          <select value={f.gender} onChange={set('gender')}><option value="">—</option><option>Male</option><option>Female</option><option>Other</option></select>
        </Field>
        <Field label="Date of birth"><input type="date" value={f.dob} onChange={set('dob')} /></Field>
        <Field label="Joined on"><input type="date" value={f.joined_on} onChange={set('joined_on')} /></Field>
        <Field label="Goal"><input value={f.goal} onChange={set('goal')} placeholder="Fat loss, muscle gain…" /></Field>
        <Field label="Height (cm)"><input type="number" step="0.1" value={f.height_cm} onChange={set('height_cm')} /></Field>
        <Field label="Notes (injuries, medical, preferences)"><textarea rows={2} value={f.notes} onChange={set('notes')} /></Field>

        {isNew && (
          <fieldset className="span-2 fieldset">
            <legend>Start membership (optional)</legend>
            <div className="form-grid">
              <Field label="Plan">
                <select value={planId} onChange={(e) => { setPlanId(e.target.value); setPaid(plans.find((p) => p.id === e.target.value)?.price.toString() ?? ''); }}>
                  <option value="">— No plan yet —</option>
                  {activePlans.map((p) => <option key={p.id} value={p.id}>{p.name} · ₹{p.price}</option>)}
                </select>
              </Field>
              <Field label="Start date"><input type="date" value={start} onChange={(e) => setStart(e.target.value)} disabled={!planId} /></Field>
              <Field label="Amount received now (₹)"><input type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} disabled={!planId} /></Field>
              <Field label="Payment method">
                <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} disabled={!planId}>
                  {METHODS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                </select>
              </Field>
            </div>
          </fieldset>
        )}

        <div className="span-2"><ErrorBox error={err} /></div>
        <div className="span-2 form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
