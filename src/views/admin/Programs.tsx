'use client';

import { useState, type FormEvent } from 'react';
import { store } from '../../lib/store';
import { useAsync } from '../../lib/hooks';
import type { DietPlan, Meal, WorkoutDay, WorkoutPlan } from '../../lib/types';
import { WEEK_DAYS } from '../../lib/utils';
import { Empty, ErrorBox, Field, Loading, Modal } from '../../components/ui';
import { Icon } from '../../components/icons';
import { DietView, WorkoutView } from '../../components/ProgramViews';

export default function Programs() {
  const [tab, setTab] = useState<'workouts' | 'diets'>('workouts');
  const { data, error, loading, reload } = useAsync(async () => {
    const [workouts, diets, members] = await Promise.all([store.list('workout_plans', { order: ['name', 'asc'] }), store.list('diet_plans', { order: ['name', 'asc'] }), store.list('members')]);
    return { workouts, diets, members };
  });
  const [editW, setEditW] = useState<WorkoutPlan | 'new' | null>(null);
  const [editD, setEditD] = useState<DietPlan | 'new' | null>(null);
  const [preview, setPreview] = useState<{ w?: WorkoutPlan; d?: DietPlan } | null>(null);

  if (loading && !data) return <Loading />;
  const count = (field: 'workout_plan_id' | 'diet_plan_id', id: string) => data?.members.filter((m) => m[field] === id).length ?? 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Workouts & Diets</h1>
          <p className="muted">Create templates once, assign them to many members from their profile.</p>
        </div>
        <button className="btn" onClick={() => (tab === 'workouts' ? setEditW('new') : setEditD('new'))}><Icon.Plus width={17} height={17} /> New {tab === 'workouts' ? 'workout' : 'diet'}</button>
      </div>
      <div className="chips">
        <button className={`chip ${tab === 'workouts' ? 'active' : ''}`} onClick={() => setTab('workouts')}><Icon.Dumbbell width={17} height={17} /> Workout plans</button>
        <button className={`chip ${tab === 'diets' ? 'active' : ''}`} onClick={() => setTab('diets')}><Icon.Leaf width={17} height={17} /> Diet plans</button>
      </div>
      <ErrorBox error={error} />

      <div className="grid-2 mt">
        {tab === 'workouts' && (data?.workouts.length ? data.workouts.map((w) => (
          <div className="card" key={w.id}>
            <h3>{w.name}</h3>
            <p className="muted">{w.description}</p>
            <p className="small">{w.schedule.filter((d) => d.exercises.length).length} training days · assigned to {count('workout_plan_id', w.id)} members</p>
            <div className="row-actions"><button className="btn btn-sm btn-ghost" onClick={() => setPreview({ w })}>Preview</button><button className="btn btn-sm" onClick={() => setEditW(w)}>Edit</button></div>
          </div>
        )) : <Empty>No workout plans yet.</Empty>)}
        {tab === 'diets' && (data?.diets.length ? data.diets.map((d) => (
          <div className="card" key={d.id}>
            <h3>{d.name}</h3>
            <p className="muted">{d.description}</p>
            <p className="small">{d.meals.length} meals{d.calories ? ` · ${d.calories} kcal` : ''} · assigned to {count('diet_plan_id', d.id)} members</p>
            <div className="row-actions"><button className="btn btn-sm btn-ghost" onClick={() => setPreview({ d })}>Preview</button><button className="btn btn-sm" onClick={() => setEditD(d)}>Edit</button></div>
          </div>
        )) : <Empty>No diet plans yet.</Empty>)}
      </div>

      {editW && <WorkoutForm plan={editW === 'new' ? undefined : editW} onClose={() => setEditW(null)} onSaved={() => { setEditW(null); reload(); }} />}
      {editD && <DietForm plan={editD === 'new' ? undefined : editD} onClose={() => setEditD(null)} onSaved={() => { setEditD(null); reload(); }} />}
      {preview && (
        <Modal title={preview.w?.name ?? preview.d?.name ?? ''} onClose={() => setPreview(null)} wide>
          {preview.w && <WorkoutView plan={preview.w} />}
          {preview.d && <DietView plan={preview.d} />}
        </Modal>
      )}
    </div>
  );
}

function WorkoutForm({ plan, onClose, onSaved }: { plan?: WorkoutPlan; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [schedule, setSchedule] = useState<WorkoutDay[]>(
    WEEK_DAYS.map((day) => plan?.schedule.find((d) => d.day === day) ?? { day, focus: '', exercises: [] }),
  );
  const [day, setDay] = useState('Mon');
  const [err, setErr] = useState<string | null>(null);
  const idx = schedule.findIndex((d) => d.day === day);
  const cur = schedule[idx];
  const patchDay = (p: Partial<WorkoutDay>) => setSchedule(schedule.map((d, i) => (i === idx ? { ...d, ...p } : d)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const clean = schedule.map((d) => ({ ...d, exercises: d.exercises.filter((x) => x.name.trim()) }));
    try {
      if (plan) await store.update('workout_plans', plan.id, { name, description: description || null, schedule: clean });
      else await store.insert('workout_plans', { name, description: description || null, schedule: clean });
      onSaved();
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }
  async function del() {
    if (!plan || !confirm('Delete this workout plan? Members using it will have no workout assigned.')) return;
    await store.remove('workout_plans', plan.id);
    onSaved();
  }

  return (
    <Modal title={plan ? 'Edit workout plan' : 'New workout plan'} onClose={onClose} wide>
      <form className="stack" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Name"><input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Description"><input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        </div>
        <div className="day-tabs">
          {WEEK_DAYS.map((d) => (
            <button type="button" key={d} className={`day-tab ${d === day ? 'active' : ''}`} onClick={() => setDay(d)}>
              {d}{schedule.find((x) => x.day === d)!.exercises.length > 0 && <span className="dot-mini" />}
            </button>
          ))}
        </div>
        <Field label={`${day} — focus`}><input value={cur.focus} onChange={(e) => patchDay({ focus: e.target.value })} placeholder="e.g. Chest & Triceps, or Rest" /></Field>
        <div className="ex-editor">
          <div className="ex-row ex-head"><span>Exercise</span><span>Sets</span><span>Reps</span><span>Notes</span><span /></div>
          {cur.exercises.map((x, i) => (
            <div className="ex-row" key={i}>
              <input value={x.name} placeholder="Exercise" onChange={(e) => patchDay({ exercises: cur.exercises.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)) })} />
              <input value={x.sets} placeholder="3" onChange={(e) => patchDay({ exercises: cur.exercises.map((y, j) => (j === i ? { ...y, sets: e.target.value } : y)) })} />
              <input value={x.reps} placeholder="10-12" onChange={(e) => patchDay({ exercises: cur.exercises.map((y, j) => (j === i ? { ...y, reps: e.target.value } : y)) })} />
              <input value={x.notes ?? ''} placeholder="Optional" onChange={(e) => patchDay({ exercises: cur.exercises.map((y, j) => (j === i ? { ...y, notes: e.target.value } : y)) })} />
              <button type="button" className="icon-btn" onClick={() => patchDay({ exercises: cur.exercises.filter((_, j) => j !== i) })} aria-label="Remove"><Icon.Close width={18} height={18} /></button>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => patchDay({ exercises: [...cur.exercises, { name: '', sets: '3', reps: '10' }] })}><Icon.Plus width={16} height={16} /> Add exercise</button>
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

function DietForm({ plan, onClose, onSaved }: { plan?: DietPlan; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [calories, setCalories] = useState(plan?.calories?.toString() ?? '');
  const [meals, setMeals] = useState<Meal[]>(plan?.meals ?? [{ time: '8:00 AM', name: 'Breakfast', items: '' }]);
  const [err, setErr] = useState<string | null>(null);
  const patch = (i: number, p: Partial<Meal>) => setMeals(meals.map((m, j) => (j === i ? { ...m, ...p } : m)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const row = { name, description: description || null, calories: calories ? Number(calories) : null, meals: meals.filter((m) => m.name.trim() || m.items.trim()) };
    try {
      if (plan) await store.update('diet_plans', plan.id, row);
      else await store.insert('diet_plans', row);
      onSaved();
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }
  async function del() {
    if (!plan || !confirm('Delete this diet plan?')) return;
    await store.remove('diet_plans', plan.id);
    onSaved();
  }
  return (
    <Modal title={plan ? 'Edit diet plan' : 'New diet plan'} onClose={onClose} wide>
      <form className="stack" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Name"><input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Calories / day"><input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} /></Field>
        </div>
        <Field label="Description"><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Veg, high protein…" /></Field>
        <div className="meal-editor">
          {meals.map((m, i) => (
            <div className="meal-row" key={i}>
              <input value={m.time} placeholder="Time" onChange={(e) => patch(i, { time: e.target.value })} />
              <input value={m.name} placeholder="Meal" onChange={(e) => patch(i, { name: e.target.value })} />
              <textarea rows={2} value={m.items} placeholder="What to eat" onChange={(e) => patch(i, { items: e.target.value })} />
              <button type="button" className="icon-btn" onClick={() => setMeals(meals.filter((_, j) => j !== i))} aria-label="Remove"><Icon.Close width={18} height={18} /></button>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMeals([...meals, { time: '', name: '', items: '' }])}><Icon.Plus width={16} height={16} /> Add meal</button>
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
