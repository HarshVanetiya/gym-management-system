'use client';

import { useState } from 'react';
import type { DietPlan, WorkoutPlan } from '../lib/types';
import { todayWeekDay, WEEK_DAYS } from '../lib/utils';
import { Empty } from './ui';

export function WorkoutView({ plan }: { plan: WorkoutPlan }) {
  const [day, setDay] = useState(todayWeekDay());
  const current = plan.schedule.find((d) => d.day === day);
  return (
    <div>
      <div className="day-tabs" role="tablist">
        {WEEK_DAYS.map((d) => {
          const has = plan.schedule.find((x) => x.day === d);
          return (
            <button key={d} role="tab" aria-selected={d === day} className={`day-tab ${d === day ? 'active' : ''} ${d === todayWeekDay() ? 'today' : ''}`} onClick={() => setDay(d)}>
              {d}
              {has && has.exercises.length > 0 && <span className="dot-mini" />}
            </button>
          );
        })}
      </div>
      {!current || current.exercises.length === 0 ? (
        <Empty>{current?.focus ? `${current.focus} 😌` : 'Rest day 😌'}</Empty>
      ) : (
        <>
          <h4 className="focus">{current.focus}</h4>
          <ol className="exercise-list">
            {current.exercises.map((e, i) => (
              <li key={i}>
                <span className="ex-name">{e.name}</span>
                <span className="ex-sets">{e.sets} × {e.reps}</span>
                {e.notes && <span className="muted small ex-note">{e.notes}</span>}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

export function DietView({ plan }: { plan: DietPlan }) {
  return (
    <div>
      {plan.calories && <p className="muted">Target: <strong>{plan.calories} kcal/day</strong>{plan.description ? ` · ${plan.description}` : ''}</p>}
      <ul className="meal-list">
        {plan.meals.map((m, i) => (
          <li key={i}>
            <span className="meal-time">{m.time}</span>
            <div>
              <strong>{m.name}</strong>
              <div>{m.items}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
