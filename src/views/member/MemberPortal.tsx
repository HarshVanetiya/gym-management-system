'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '../../lib/store';
import { useAsync, useAuth, useSite } from '../../lib/hooks';
import { addDays, daysBetween, fmtDate, isoDate, money, summarize, whatsappLink } from '../../lib/utils';
import { Empty, ErrorBox, Loading, StatusBadge } from '../../components/ui';
import { DietView, WorkoutView } from '../../components/ProgramViews';
import { ProgressPanel } from '../../components/ProgressPanel';
import { AttendanceStrip } from '../admin/MemberDetail';
import { DemoBanner } from '../../components/DemoBanner';
import { Icon } from '../../components/icons';
import { InstallApp } from '../../components/Pwa';
import { ThemeToggle } from '../../components/ThemeToggle';

type Tab = 'workout' | 'diet' | 'progress' | 'payments';
const TAB_ICON: Record<Tab, typeof Icon.Dumbbell> = { workout: Icon.Dumbbell, diet: Icon.Leaf, progress: Icon.Chart, payments: Icon.Receipt };
const TAB_LABEL: Record<Tab, string> = { workout: 'Workout', diet: 'Diet', progress: 'Progress', payments: 'Payments' };

export default function MemberPortal() {
  const { session, refresh } = useAuth();
  const { data: site } = useSite();
  const router = useRouter();
  const nav = (path: string) => router.push(path);
  const [tab, setTab] = useState<Tab>('workout');

  const { data, error, loading } = useAsync(async () => {
    const [member] = await store.list('members', { eq: { user_id: session!.userId } });
    if (!member) return null;
    const [subs, payments, attendance, workout, diet] = await Promise.all([
      store.list('subscriptions', { eq: { member_id: member.id }, order: ['end_date', 'desc'] }),
      store.list('payments', { eq: { member_id: member.id }, order: ['paid_on', 'desc'] }),
      store.list('attendance', { eq: { member_id: member.id }, order: ['check_in', 'desc'] }),
      member.workout_plan_id ? store.get('workout_plans', member.workout_plan_id) : Promise.resolve(null),
      member.diet_plan_id ? store.get('diet_plans', member.diet_plan_id) : Promise.resolve(null),
    ]);
    return { member, subs, payments, attendance, workout, diet };
  }, [session?.userId]);

  async function logout() {
    await store.auth.signOut();
    await refresh();
    nav('/login');
  }

  const header = (
    <header className="portal-head">
      <div className="brand"><span className="brand-mark">MFC</span><span>Medilife<small>Member</small></span></div>
      <div className="row-actions">
        <ThemeToggle />
        <button className="link-btn" onClick={logout}>Log out</button>
      </div>
    </header>
  );

  if (loading && !data) return <div className="portal"><DemoBanner />{header}<Loading /></div>;
  if (error) return <div className="portal"><DemoBanner />{header}<ErrorBox error={error} /></div>;
  if (!data) {
    const wa = whatsappLink(site?.whatsapp, `Hi, I signed up on the app with ${session?.email} but can't see my plan.`);
    return (
      <div className="portal">
        <DemoBanner />
        {header}
        <div className="card portal-card center">
          <h2>Almost there!</h2>
          <p>Your account <strong>{session?.email}</strong> isn’t linked to a gym membership yet.</p>
          <p className="muted">Ask your trainer to add this exact email to your member profile — your plan will appear here automatically.</p>
          {wa && <a className="btn btn-wa" href={wa} target="_blank" rel="noreferrer">Message trainer on WhatsApp</a>}
        </div>
      </div>
    );
  }

  const s = summarize(data.member, data.subs, data.payments);
  const latest = s.latest;
  const total = latest ? daysBetween(latest.start_date, latest.end_date) + 1 : 0;
  const used = latest ? Math.min(total, Math.max(0, daysBetween(latest.start_date, isoDate()) + 1)) : 0;
  const visits30 = data.attendance.filter((a) => a.check_in >= addDays(isoDate(), -30)).length;

  return (
    <div className="portal">
      <DemoBanner />
      {header}
      <div className="portal-body">
        <h1 className="portal-hello">Hi {data.member.full_name.split(' ')[0]} 👋</h1>

        <section className={`card membership-card st-${s.status}`}>
          <div className="card-head">
            <div>
              <div className="muted small">Membership</div>
              <h2>{latest?.plan_name ?? 'No active plan'}</h2>
            </div>
            <StatusBadge status={s.status} />
          </div>
          {latest && (
            <>
              <div className="meter" aria-label={`${used} of ${total} days used`}><span style={{ width: `${(used / total) * 100}%` }} /></div>
              <div className="meter-legend">
                <span>{fmtDate(latest.start_date)}</span>
                <strong>{s.daysLeft! >= 0 ? `${s.daysLeft} days left` : `Expired ${-s.daysLeft!} days ago`}</strong>
                <span>{fmtDate(latest.end_date)}</span>
              </div>
            </>
          )}
          {s.due > 0 && (
            <div className="due-box">
              Pending payment: <strong>{money(s.due)}</strong>
              {site?.upi_id && <div className="small">Pay by UPI to <strong>{site.upi_id}</strong> or cash at the desk.</div>}
            </div>
          )}
          <div className="mini-stats">
            <div><strong>{visits30}</strong><span>visits (30 days)</span></div>
            <div><strong>{fmtDate(data.member.joined_on)}</strong><span>member since</span></div>
          </div>
        </section>

        <nav className="portal-tabs" role="tablist">
          {(['workout', 'diet', 'progress', 'payments'] as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {(() => { const I = TAB_ICON[t]; return <I />; })()}
              <span>{TAB_LABEL[t]}</span>
            </button>
          ))}
        </nav>

        <section className="card">
          {tab === 'workout' && (data.workout ? (
            <>
              <h3>{data.workout.name}</h3>
              <WorkoutView plan={data.workout} />
            </>
          ) : <Empty>Your trainer hasn’t assigned a workout plan yet.</Empty>)}
          {tab === 'diet' && (data.diet ? (
            <>
              <h3>{data.diet.name}</h3>
              <DietView plan={data.diet} />
            </>
          ) : <Empty>Your trainer hasn’t assigned a diet plan yet.</Empty>)}
          {tab === 'progress' && (
            <>
              <ProgressPanel memberId={data.member.id} canEdit />
              <h3 className="mt">Attendance (last 5 weeks)</h3>
              <AttendanceStrip dates={data.attendance.map((a) => a.check_in)} />
            </>
          )}
          {tab === 'payments' && (
            <>
              <h3>Payment history</h3>
              {data.payments.length === 0 ? <Empty>No payments recorded.</Empty> : (
                <ul className="list compact">
                  {data.payments.map((p) => (
                    <li key={p.id}><span>{fmtDate(p.paid_on)} <span className="tag">{p.method}</span></span><strong>{money(p.amount)}</strong></li>
                  ))}
                </ul>
              )}
              <h3 className="mt">Plan history</h3>
              <ul className="list compact">
                {data.subs.map((x) => <li key={x.id}><span>{x.plan_name}</span><span className="muted small">{fmtDate(x.start_date)} → {fmtDate(x.end_date)}</span></li>)}
              </ul>
            </>
          )}
        </section>
        <InstallApp compact />
      </div>
    </div>
  );
}
