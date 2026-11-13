import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DEMO_ADMIN_EMAIL, store } from '../lib/store';
import { useAuth, useSite } from '../lib/hooks';
import { DemoBanner } from '../components/DemoBanner';

export default function Login() {
  const { session, refresh } = useAuth();
  const { data: site } = useSite();
  const nav = useNavigate();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (session) nav(session.role === 'admin' ? '/admin' : '/me', { replace: true });
  }, [session, nav]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'in') {
        await store.auth.signIn(email, password);
      } else {
        if (store.mode === 'supabase' && password.length < 8) throw new Error('Use at least 8 characters for the password');
        const { needsEmailConfirm } = await store.auth.signUp(email, password);
        if (needsEmailConfirm) {
          setMsg({ kind: 'info', text: 'Check your email and click the confirmation link, then log in here.' });
          setMode('in');
        }
      }
      await refresh();
    } catch (ex) {
      const text = (ex as Error).message;
      setMsg({
        kind: 'error',
        text: /fetch|network/i.test(text)
          ? 'Could not reach the server. If you are on Jio/Airtel, your network may be blocking the database — try mobile data from another network or change DNS to 1.1.1.1.'
          : text,
      });
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin(e: string) {
    await store.auth.signIn(e, 'demo');
    await refresh();
  }

  return (
    <div className="auth-page">
      <DemoBanner />
      <div className="auth-wrap">
        <Link to="/" className="brand auth-brand"><span className="brand-mark">IF</span>{site?.gym_name ?? 'Gym'}</Link>
        <form className="card auth-card" onSubmit={submit}>
          <h2>{mode === 'in' ? 'Log in' : 'Create your account'}</h2>
          <p className="muted small">
            {mode === 'in'
              ? 'Trainer and members log in here.'
              : 'Members: use the same email you gave at the gym, so your plan shows up automatically.'}
          </p>
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <input type="password" required={store.mode === 'supabase'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
          {msg && <div className={msg.kind === 'error' ? 'error-box' : 'info-box'}>{msg.text}</div>}
          <button className="btn btn-block" disabled={busy}>{busy ? 'Please wait…' : mode === 'in' ? 'Log in' : 'Sign up'}</button>
          <button type="button" className="link-btn" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
            {mode === 'in' ? 'First time? Create an account' : 'Already have an account? Log in'}
          </button>
        </form>

        {store.mode === 'demo' && (
          <div className="card demo-logins">
            <strong>Try the demo</strong>
            <p className="muted small">No password needed in demo mode.</p>
            <button className="btn btn-block" onClick={() => demoLogin(DEMO_ADMIN_EMAIL)}>Log in as Trainer (admin)</button>
            <button className="btn btn-block btn-ghost" onClick={() => demoLogin('rahul@demo.in')}>Log in as Member — Rahul</button>
            <button className="btn btn-block btn-ghost" onClick={() => demoLogin('neha@demo.in')}>Log in as Member — Neha (payment due)</button>
          </div>
        )}
      </div>
    </div>
  );
}
