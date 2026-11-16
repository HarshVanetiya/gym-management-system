'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { store } from '../lib/store';
import { useAsync, useAuth } from '../lib/hooks';
import { loadPublicData, type PublicData } from '../lib/public-data';
import { money, whatsappLink } from '../lib/utils';
import { DemoBanner } from '../components/DemoBanner';

const SERVICES = [
  { icon: '🏋️', title: 'Strength Training', text: 'Learn the big lifts with proper form. Progressive programs that keep you getting stronger.' },
  { icon: '🔥', title: 'Fat Loss Coaching', text: 'Sustainable fat loss with structured workouts and an Indian diet you can actually follow.' },
  { icon: '🥗', title: 'Diet Plans', text: 'Veg, non-veg and eggetarian plans built around your routine, budget and goals.' },
  { icon: '📱', title: 'Member App', text: 'Check today’s workout, your diet, membership expiry and progress from your phone.' },
];

/** `initial` is rendered on the server when Supabase is configured; in demo mode data loads in the browser. */
export default function Home({ initial }: { initial: PublicData | null }) {
  const { session } = useAuth();
  const loaded = useAsync(async () => initial ?? loadPublicData(store), []);
  const pub = loaded.data ?? initial;
  const site = pub?.site;
  const plans = { data: pub?.plans };
  const testimonials = { data: pub?.testimonials };
  const [menuOpen, setMenuOpen] = useState(false);

  const wa = whatsappLink(site?.whatsapp, `Hi ${site?.trainer_name ?? ''}, I found your website and want to know more about joining.`);
  const portalLink = session ? (session.role === 'admin' ? '/admin' : '/me') : '/login';

  return (
    <div className="site">
      <DemoBanner />
      <header className="site-nav">
        <a href="#top" className="brand"><span className="brand-mark">IF</span>{site?.gym_name ?? 'Gym'}</a>
        <button className="nav-toggle" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">☰</button>
        <nav className={menuOpen ? 'open' : ''} onClick={() => setMenuOpen(false)}>
          <a href="#about">About</a>
          <a href="#programs">Programs</a>
          <a href="#pricing">Pricing</a>
          <a href="#results">Results</a>
          <a href="#contact">Contact</a>
          <Link href={portalLink} className="btn btn-sm">{session ? 'My Dashboard' : 'Member Login'}</Link>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-inner">
          <p className="eyebrow">{site?.trainer_name} · Personal Trainer</p>
          <h1>{site?.tagline ?? 'Stronger every week.'}</h1>
          <p className="hero-sub">Personal training, structured workout plans and practical diet coaching — all tracked in one place.</p>
          <div className="hero-cta">
            <a href="#contact" className="btn btn-lg">Book a free trial</a>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn btn-lg btn-ghost">Chat on WhatsApp</a>}
          </div>
          <div className="hero-stats">
            <div><strong>{site?.years_experience ?? 0}+</strong><span>Years coaching</span></div>
            <div><strong>{site?.clients_trained ?? 0}+</strong><span>Clients trained</span></div>
            <div><strong>{plans.data?.length ?? 0}</strong><span>Membership plans</span></div>
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="container two-col">
          <div className="about-photo" aria-hidden="true">
            <span>{(site?.trainer_name ?? 'C').replace('Coach ', '').slice(0, 1)}</span>
          </div>
          <div>
            <p className="eyebrow">About the coach</p>
            <h2>Meet {site?.trainer_name}</h2>
            <p className="lead">{site?.bio}</p>
            {!!site?.certifications?.length && (
              <ul className="cert-list">
                {site.certifications.map((c) => <li key={c}>✔ {c}</li>)}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="programs">
        <div className="container">
          <p className="eyebrow center">What we offer</p>
          <h2 className="center">Programs built around you</h2>
          <div className="grid-4">
            {SERVICES.map((s) => (
              <div className="card service" key={s.title}>
                <div className="service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="container">
          <p className="eyebrow center">Membership</p>
          <h2 className="center">Simple, honest pricing</h2>
          <div className="pricing">
            {plans.data?.map((p, i) => (
              <div className={`card price-card ${i === 2 ? 'featured' : ''}`} key={p.id}>
                {i === 2 && <span className="ribbon">Popular</span>}
                <h3>{p.name}</h3>
                <div className="price">{money(p.price)}<span>/ {p.duration_days} days</span></div>
                {p.description && <p className="muted">{p.description}</p>}
                <ul>{p.features?.map((f) => <li key={f}>{f}</li>)}</ul>
                <a href="#contact" className="btn btn-block" onClick={() => window.dispatchEvent(new CustomEvent('pick-plan', { detail: p.name }))}>Enquire</a>
              </div>
            ))}
          </div>
          <p className="center muted small">Pay at the gym by cash or UPI. No hidden charges.</p>
        </div>
      </section>

      <section className="section section-alt" id="results">
        <div className="container">
          <p className="eyebrow center">Real members, real results</p>
          <h2 className="center">Transformations</h2>
          <div className="grid-3">
            {testimonials.data?.map((t) => (
              <figure className="card testimonial" key={t.id}>
                {t.result && <div className="result">{t.result}</div>}
                <blockquote>“{t.text}”</blockquote>
                <figcaption>— {t.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container two-col">
          <div>
            <p className="eyebrow">Get started</p>
            <h2>Book your free trial session</h2>
            <p className="lead">Leave your number and we’ll call you back within a day.</p>
            <ul className="contact-list">
              {site?.address && <li>📍 {site.address}</li>}
              {site?.phone && <li>📞 <a href={`tel:${site.phone}`}>{site.phone}</a></li>}
              {site?.email && <li>✉️ <a href={`mailto:${site.email}`}>{site.email}</a></li>}
              {site?.hours && <li>🕒 {site.hours}</li>}
            </ul>
            <div className="social">
              {site?.instagram && <a href={site.instagram} target="_blank" rel="noreferrer">Instagram</a>}
              {site?.youtube && <a href={site.youtube} target="_blank" rel="noreferrer">YouTube</a>}
              {site?.map_url && <a href={site.map_url} target="_blank" rel="noreferrer">Google Maps</a>}
            </div>
          </div>
          <LeadForm planNames={plans.data?.map((p) => p.name) ?? []} />
        </div>
      </section>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {site?.gym_name}</span>
        <Link href={portalLink}>Member login</Link>
      </footer>

      {wa && <a className="wa-float" href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp">💬</a>}
    </div>
  );
}

function LeadForm({ planNames }: { planNames: string[] }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '', interested_plan: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  useEffect(() => {
    const onPick = (e: Event) => setForm((f) => ({ ...f, interested_plan: (e as CustomEvent<string>).detail }));
    window.addEventListener('pick-plan', onPick);
    return () => window.removeEventListener('pick-plan', onPick);
  }, []);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[0-9+\s-]{10,15}$/.test(form.phone)) {
      setErr('Please enter a valid phone number');
      setState('error');
      return;
    }
    setState('sending');
    try {
      await store.insertQuiet('leads', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        message: form.message.trim() || null,
        interested_plan: form.interested_plan || null,
        status: 'new',
      });
      setState('done');
    } catch (ex) {
      setErr((ex as Error).message);
      setState('error');
    }
  }

  if (state === 'done')
    return (
      <div className="card lead-form done">
        <h3>Thank you! 🙌</h3>
        <p>We’ve received your details and will contact you shortly.</p>
      </div>
    );

  return (
    <form className="card lead-form" onSubmit={submit}>
      <input required placeholder="Your name" value={form.name} onChange={set('name')} />
      <input required placeholder="Phone number" inputMode="tel" value={form.phone} onChange={set('phone')} />
      <input type="email" placeholder="Email (optional)" value={form.email} onChange={set('email')} />
      <select value={form.interested_plan} onChange={set('interested_plan')}>
        <option value="">Interested in…</option>
        {planNames.map((n) => <option key={n}>{n}</option>)}
      </select>
      <textarea rows={3} placeholder="Your goal / preferred time (optional)" value={form.message} onChange={set('message')} />
      {state === 'error' && <div className="error-box">{err}</div>}
      <button className="btn btn-block" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Request a call back'}</button>
    </form>
  );
}
