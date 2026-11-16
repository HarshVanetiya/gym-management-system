'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '../../lib/store';
import { useAsync, useAuth, useSite } from '../../lib/hooks';
import type { Member } from '../../lib/types';
import { addDays, daysBetween, fmtDate, isoDate, money, summarize, whatsappLink } from '../../lib/utils';
import { Empty, ErrorBox, Loading, StatusBadge } from '../../components/ui';
import { DietView, WorkoutView } from '../../components/ProgramViews';
import { ProgressPanel } from '../../components/ProgressPanel';
import { AttendanceStrip } from '../admin/MemberDetail';
import { DemoBanner } from '../../components/DemoBanner';
import { Icon } from '../../components/icons';
import { InstallApp } from '../../components/Pwa';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Avatar, PhotoButton } from '../../components/Media';

type Tab = 'workout' | 'diet' | 'progress' | 'payments' | 'profile';
const TABS: { id: Tab; label: string; icon: typeof Icon.Dumbbell }[] = [
  { id: 'workout', label: 'Workout', icon: Icon.Dumbbell },
  { id: 'diet', label: 'Diet', icon: Icon.Leaf },
  { id: 'progress', label: 'Progress', icon: Icon.Chart },
  { id: 'payments', label: 'Payments', icon: Icon.Receipt },
  { id: 'profile', label: 'Profile', icon: Icon.User },
];

export default function MemberPortal() {
  const { session, refresh } = useAuth();
  const { data: site } = useSite();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('workout');

  const { data, error, loading, reload } = useAsync(async () => {
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
    router.push('/login');
  }

  const header = (
    <header className="portal-head">
      <div className="brand"><span className="brand-mark">MFC</span><span>Medilife<small>Member</small></span></div>
      <div className="row-actions">
        <ThemeToggle />
        {data?.member ? (
          <button className="avatar-btn" onClick={() => setTab('profile')} aria-label="My profile">
            <Avatar name={data.member.full_name} url={data.member.photo_url} size={36} />
          </button>
        ) : (
          <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out"><Icon.Logout /></button>
        )}
      </div>
    </header>
  );

  if (loading && !data) return <div className="portal"><DemoBanner />{header}<Loading /></div>;
  if (error) return <div className="portal"><DemoBanner />{header}<div className="portal-body"><ErrorBox error={error} /></div></div>;
  if (!data) {
    const wa = whatsappLink(site?.whatsapp, `Hi, I signed up on the app with ${session?.email} but can't see my plan.`);
    return (
      <div className="portal">
        <DemoBanner />
        {header}
        <div className="card portal-card">
          <span className="empty-icon"><Icon.User /></span>
          <h2>Almost there</h2>
          <p>Your account <strong>{session?.email}</strong> isn’t linked to a gym membership yet.</p>
          <p className="muted">Ask your trainer to add this exact email to your member profile. Your plan will appear here automatically.</p>
          {wa && <a className="btn btn-wa" href={wa} target="_blank" rel="noreferrer"><Icon.Chat width={18} height={18} /> Message trainer on WhatsApp</a>}
        </div>
      </div>
    );
  }

  const s = summarize(data.member, data.subs, data.payments);
  const latest = s.latest;
  const total = latest ? daysBetween(latest.start_date, latest.end_date) + 1 : 0;
  const used = latest ? Math.min(total, Math.max(0, daysBetween(latest.start_date, isoDate()) + 1)) : 0;
  const visits30 = data.attendance.filter((a) => a.check_in >= addDays(isoDate(), -30)).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="portal">
      <DemoBanner />
      {header}
      <div className="portal-body">
        <div className="portal-hello">
          <span className="muted">{greeting},</span>
          <h1>{data.member.full_name.split(' ')[0]}</h1>
        </div>

        <section className={`card membership-card st-${s.status}`}>
          <div className="card-head">
            <div>
              <div className="eyebrow">Membership</div>
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
              <Icon.Wallet width={18} height={18} />
              <div>
                Pending payment <strong>{money(s.due)}</strong>
                {site?.upi_id && <div className="small">Pay by UPI to <strong>{site.upi_id}</strong> or cash at the desk.</div>}
              </div>
            </div>
          )}
          <div className="mini-stats">
            <div><strong>{visits30}</strong><span>Visits · 30 days</span></div>
            <div><strong>{fmtDate(data.member.joined_on)}</strong><span>Member since</span></div>
          </div>
        </section>

        <nav className="portal-tabs" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              <t.icon />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <section className="card">
          {tab === 'workout' && (data.workout ? (
            <>
              <h3>{data.workout.name}</h3>
              <WorkoutView plan={data.workout} />
            </>
          ) : <Empty icon={<Icon.Dumbbell />}>Your trainer hasn’t assigned a workout plan yet.</Empty>)}
          {tab === 'diet' && (data.diet ? (
            <>
              <h3>{data.diet.name}</h3>
              <DietView plan={data.diet} />
            </>
          ) : <Empty icon={<Icon.Leaf />}>Your trainer hasn’t assigned a diet plan yet.</Empty>)}
          {tab === 'progress' && (
            <>
              <ProgressPanel memberId={data.member.id} canEdit />
              <h3 className="mt">Attendance · last 5 weeks</h3>
              <AttendanceStrip dates={data.attendance.map((a) => a.check_in)} />
            </>
          )}
          {tab === 'payments' && (
            <>
              <h3>Payment history</h3>
              {data.payments.length === 0 ? <Empty icon={<Icon.Receipt />}>No payments recorded yet.</Empty> : (
                <ul className="list compact">
                  {data.payments.map((p) => (
                    <li key={p.id}><span>{fmtDate(p.paid_on)} <span className="tag">{p.method}</span></span><strong className="num">{money(p.amount)}</strong></li>
                  ))}
                </ul>
              )}
              <h3 className="mt">Plan history</h3>
              <ul className="list compact">
                {data.subs.map((x) => <li key={x.id}><span>{x.plan_name}</span><span className="muted small">{fmtDate(x.start_date)} – {fmtDate(x.end_date)}</span></li>)}
              </ul>
            </>
          )}
          {tab === 'profile' && <ProfilePanel member={data.member} onSaved={reload} onLogout={logout} />}
        </section>
        <InstallApp compact />
      </div>
    </div>
  );
}

function ProfilePanel({ member, onSaved, onLogout }: { member: Member; onSaved: () => void; onLogout: () => void }) {
  const [phone, setPhone] = useState(member.phone ?? '');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(patch: { phone: string | null; photo_url: string | null }, okText: string) {
    setBusy(true);
    setMsg(null);
    try {
      await store.updateMyProfile(patch);
      setMsg({ kind: 'ok', text: okText });
      onSaved();
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    save({ phone: phone.trim() || null, photo_url: member.photo_url ?? null }, 'Mobile number saved.');
  }

  return (
    <div className="profile">
      <div className="profile-top">
        <Avatar name={member.full_name} url={member.photo_url} size={88} />
        <div>
          <h3>{member.full_name}</h3>
          <p className="muted small">{member.email}</p>
          <div className="row-actions wrap">
            <PhotoButton
              target={{ kind: 'avatar' }}
              label={member.photo_url ? 'Change photo' : 'Add photo'}
              onUploaded={(url) => save({ phone: member.phone ?? null, photo_url: url }, 'Photo updated.')}
            />
            {member.photo_url && (
              <button className="btn btn-sm btn-ghost danger" disabled={busy} onClick={() => save({ phone: member.phone ?? null, photo_url: null }, 'Photo removed.')}>
                <Icon.Trash width={16} height={16} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <form className="stack" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Mobile number</span>
          <input type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <span className="field-hint">Your trainer uses this for WhatsApp reminders.</span>
        </label>
        {msg && <div className={msg.kind === 'ok' ? 'info-box' : 'error-box'}>{msg.text}</div>}
        <button className="btn" disabled={busy || phone === (member.phone ?? '')}>{busy ? 'Saving…' : 'Save'}</button>
      </form>

      <p className="muted small">To change your name or email, ask your trainer.</p>
      <button className="btn btn-ghost btn-block" onClick={onLogout}><Icon.Logout width={18} height={18} /> Log out</button>
    </div>
  );
}
