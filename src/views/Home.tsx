'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { store } from '../lib/store';
import { useAsync, useAuth } from '../lib/hooks';
import { loadPublicData, type PublicData } from '../lib/public-data';
import { money, whatsappLink } from '../lib/utils';
import { DemoBanner } from '../components/DemoBanner';
import { Icon, PulseBarbell } from '../components/icons';
import { InstallApp } from '../components/Pwa';

const OFFER = [
  { title: 'Strength training', text: 'Free weights, machines and proper form coaching, so you get stronger week after week.', chips: ['Free weights', 'Machines', 'Form checks'] },
  { title: 'Fat loss', text: 'Structured workouts plus a diet built on everyday Rajasthani and Indian food.', chips: ['Cardio', 'Diet plan', 'Weekly check-ins'] },
  { title: 'Personal training', text: 'One-on-one sessions with a plan written for your body, schedule and goals.', chips: ['1-on-1', 'Custom plan', 'Progress tracking'] },
  { title: 'Member app', text: 'Today’s workout, your diet, membership days left and payments, on your phone.', chips: ['Workout', 'Diet', 'Progress'] },
];
const MARQUEE = ['Strength', 'Cardio', 'Personal training', 'Fat loss', 'Diet plans', 'Muscle gain', 'Mobility'];

/** `initial` is rendered on the server when Supabase is configured; in demo mode data loads in the browser. */
export default function Home({ initial }: { initial: PublicData | null }) {
  const { session } = useAuth();
  const loaded = useAsync(async () => initial ?? loadPublicData(store), []);
  const pub = loaded.data ?? initial;
  const site = pub?.site;
  const plans = pub?.plans ?? [];
  const testimonials = pub?.testimonials ?? [];

  const name = site?.gym_name ?? 'Medilife Fitness Club';
  const wa = whatsappLink(site?.whatsapp, `Hi ${name}, I found your website and want to know more about joining.`);
  const portalLink = session ? (session.role === 'admin' ? '/admin' : '/me') : '/login';
  const area = site?.address?.split(',').slice(0, 2).join(' · ') ?? 'Udaipur';
  const featured = plans.length > 2 ? 2 : plans.length - 1;

  const stats = [
    site?.years_experience ? { v: `${site.years_experience}+`, l: 'Years' } : null,
    site?.clients_trained ? { v: `${site.clients_trained}+`, l: 'Members trained' } : null,
    plans.length ? { v: String(plans.length), l: 'Membership plans' } : null,
    plans.length ? { v: money(Math.min(...plans.map((p) => Number(p.price)))), l: 'Plans from' } : null,
  ].filter(Boolean) as { v: string; l: string }[];

  return (
    <div className="site" id="top">
      <DemoBanner />
      <header className="topbar">
        <div className="wrap topbar-inner">
          <a href="#top" className="brand"><span className="brand-mark">MFC</span><span>Medilife<small>Fitness Club</small></span></a>
          <nav aria-label="Sections">
            <a href="#offer">Training</a>
            <a href="#plans">Plans</a>
            <a href="#app">App</a>
            <a href="#visit">Visit</a>
          </nav>
          <Link href={portalLink} className="btn">{session ? 'My plan' : 'Login'} <span className="arr" aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap">
            <p className="label">{area}</p>
            <div className="hero-grid">
              <div className="hero-copy">
                <h1 aria-label={name}>
                  <span>Medilife</span>
                  <span className="tone">Fitness</span>
                  <span className="tone">Club</span>
                </h1>
                <p className="hero-note">{site?.tagline ? `${site.tagline} ` : ''}{site?.bio}</p>
                <div className="hero-cta">
                  <a href="#join" className="btn btn-lg btn-pop">Book a free trial <span className="arr" aria-hidden="true">↗</span></a>
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn btn-lg btn-ghost">WhatsApp us <span className="arr" aria-hidden="true">→</span></a>}
                </div>
                {stats.length > 0 && (
                  <div className="hero-meta">
                    {stats.map((s) => <div key={s.l}><strong>{s.v}</strong><span>{s.l}</span></div>)}
                  </div>
                )}
              </div>
              <div className="hero-panel">
                {site?.hero_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={site.hero_image_url} alt={`Inside ${name}`} />
                ) : (
                  <>
                    <PulseBarbell className="mark" />
                    <span className="panel-cap">Health · Strength · Life</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              {[0, 1].map((k) => <span key={k}>{MARQUEE.map((m) => <span key={m + k}>{m}</span>)}</span>)}
            </div>
          </div>
        </section>

        <section className="section" id="offer">
          <div className="wrap">
            <div className="section-head reveal">
              <div>
                <p className="label">Training</p>
                <h2>What we train <span className="tone">you for.</span></h2>
              </div>
              <p>Whatever brings you in, you leave with a plan you can follow, and a coach who checks you actually do.</p>
            </div>
            <div className="rows">
              {OFFER.map((o) => (
                <a href="#join" className="row reveal" key={o.title}>
                  <h3>{o.title}</h3>
                  <span className="circle" aria-hidden="true"><Icon.ArrowUpRight width={18} height={18} /></span>
                  <p>{o.text}</p>
                  <div className="chip-row">{o.chips.map((c) => <span className="mono-chip" key={c}>{c}</span>)}</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {plans.length > 0 && (
          <section className="section" id="plans" style={{ paddingTop: 0 }}>
            <div className="wrap">
              <div className="section-head reveal">
                <div>
                  <p className="label">Membership</p>
                  <h2>Simple plans, <em>no</em> hidden fees.</h2>
                </div>
                <p>Pay at the desk by cash or UPI. Your plan, days left and receipts show up in the MFC app.</p>
              </div>
              <div className="plans" role="list">
                {plans.map((p, i) => (
                  <article className={`plan ${i === featured ? 'featured' : ''}`} key={p.id} role="listitem">
                    <div className="plan-top">
                      <span className="plan-name">{p.name}</span>
                      {i === featured && <span className="ribbon">Popular</span>}
                    </div>
                    <div className="price">{money(p.price)}<small>/ {p.duration_days} days</small></div>
                    {p.description && <p className="muted" style={{ margin: 0 }}>{p.description}</p>}
                    <ul>{p.features?.map((f) => <li key={f}>{f}</li>)}</ul>
                    <a href="#join" className="btn btn-block" onClick={() => window.dispatchEvent(new CustomEvent('pick-plan', { detail: p.name }))}>
                      Choose {p.name} <span className="arr" aria-hidden="true">↗</span>
                    </a>
                  </article>
                ))}
              </div>
              <p className="swipe-hint">← Swipe to compare plans →</p>
            </div>
          </section>
        )}

        <section className="section" id="app" style={{ paddingTop: 0 }}>
          <div className="wrap app-promo">
            <div className="reveal">
              <p className="label">Member app</p>
              <div className="section-head" style={{ display: 'block', marginBottom: 22 }}>
                <h2>Your coach, <em>in your</em> pocket.</h2>
              </div>
              <ul className="feature-list">
                <li><span><Icon.Dumbbell /></span><div><strong>Today’s workout</strong><span className="muted">Exercises, sets and reps for each day of the week.</span></div></li>
                <li><span><Icon.Leaf /></span><div><strong>Your diet plan</strong><span className="muted">Meal times and portions, veg or non-veg.</span></div></li>
                <li><span><Icon.Chart /></span><div><strong>Progress</strong><span className="muted">Log your weight and see the trend.</span></div></li>
                <li><span><Icon.Receipt /></span><div><strong>Membership & payments</strong><span className="muted">Days left, dues and every receipt.</span></div></li>
              </ul>
              <Link href="/login" className="btn btn-lg">Member login <span className="arr" aria-hidden="true">↗</span></Link>
              <InstallApp />
            </div>
            <div className="phone-mock reveal" aria-hidden="true">
              <div className="phone-screen">
                <div className="ps-head"><span>Hi Neha 👋</span><span className="brand-mark" style={{ width: 28, height: 28, fontSize: '0.55rem' }}>MFC</span></div>
                <div className="ps-card">
                  <div className="muted" style={{ fontSize: '0.68rem' }}>Quarterly membership</div>
                  <b>62 days left</b>
                  <div className="ps-meter"><span /></div>
                </div>
                <div className="ps-list">
                  <div className="muted" style={{ background: 'none', border: 'none', padding: '2px 2px 0' }}>Monday · Push</div>
                  <div><span>Bench press</span><i>4 × 10</i></div>
                  <div><span>Shoulder press</span><i>3 × 10</i></div>
                  <div><span>Lateral raises</span><i>3 × 15</i></div>
                  <div><span>Rope pushdown</span><i>3 × 12</i></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {testimonials.length > 0 && (
          <section className="section dark" id="results">
            <div className="wrap">
              <div className="section-head reveal">
                <div>
                  <p className="label">Results</p>
                  <h2>Real members, <em>real</em> <span className="tone">change.</span></h2>
                </div>
              </div>
              <div className="quotes">
                {testimonials.map((t) => (
                  <figure className="quote-row reveal" key={t.id} style={{ margin: 0 }}>
                    <blockquote>“{t.text}”</blockquote>
                    <figcaption className="who"><span>{t.name}</span>{t.result && <b>{t.result}</b>}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {!!site?.gallery_urls?.length && (
          <section className="section" style={{ paddingBottom: 0 }}>
            <div className="wrap">
              <p className="label">Inside the gym</p>
              <div className="gallery">
                {site.gallery_urls.slice(0, 5).map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={u} src={u} alt={`${name} photo ${i + 1}`} loading="lazy" />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="section" id="visit">
          <div className="wrap visit">
            <div className="reveal">
              <p className="label">Visit</p>
              <div className="section-head" style={{ display: 'block', marginBottom: 22 }}>
                <h2>Come train <em>with us.</em></h2>
              </div>
              <dl className="spec">
                {site?.address && <div><dt>Address</dt><dd>{site.address}</dd></div>}
                {site?.hours && <div><dt>Hours</dt><dd>{site.hours}</dd></div>}
                {site?.phone && <div><dt>Phone</dt><dd><a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a></dd></div>}
                {site?.instagram && <div><dt>Instagram</dt><dd><a href={site.instagram} target="_blank" rel="noreferrer">@{site.instagram.replace(/\/+$/, '').split('/').pop()}</a></dd></div>}
                {!!site?.certifications?.length && <div><dt>Coaches</dt><dd>{site.certifications.join(' · ')}</dd></div>}
              </dl>
              <div className="visit-actions">
                {site?.map_url && <a className="btn btn-ghost" href={site.map_url} target="_blank" rel="noreferrer"><Icon.Pin width={18} height={18} /> Directions</a>}
                {site?.phone && <a className="btn btn-ghost" href={`tel:${site.phone.replace(/\s/g, '')}`}><Icon.Phone width={18} height={18} /> Call</a>}
              </div>
            </div>
            <div id="join" style={{ scrollMarginTop: 80 }}>
              <LeadForm planNames={plans.map((p) => p.name)} />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <span className="brand" style={{ color: 'var(--on-deep)' }}><span className="brand-mark" style={{ background: 'var(--pop)', color: 'var(--pop-ink)' }}>MFC</span>{name}</span>
              <p style={{ marginTop: 12, opacity: 0.75, maxWidth: '36ch' }}>{site?.address}</p>
            </div>
            <div>
              <h4>Explore</h4>
              <ul><li><a href="#offer">Training</a></li><li><a href="#plans">Plans</a></li><li><a href="#app">Member app</a></li></ul>
            </div>
            <div>
              <h4>Connect</h4>
              <ul>
                {site?.instagram && <li><a href={site.instagram} target="_blank" rel="noreferrer">Instagram ↗</a></li>}
                {wa && <li><a href={wa} target="_blank" rel="noreferrer">WhatsApp ↗</a></li>}
                {site?.map_url && <li><a href={site.map_url} target="_blank" rel="noreferrer">Google Maps ↗</a></li>}
              </ul>
            </div>
            <div>
              <h4>Members</h4>
              <ul><li><Link href={portalLink}>Member login</Link></li><li><a href="#join">Free trial</a></li></ul>
            </div>
          </div>
          <div className="wordmark" aria-hidden="true">Medilife</div>
          <div className="foot-bottom">
            <span>© {new Date().getFullYear()} {name}</span>
            <span>Website by <a href="https://www.hvanetia.me/" target="_blank" rel="noreferrer">Harsh Vanetia ↗</a></span>
          </div>
        </div>
      </footer>

      <nav className="tabbar" aria-label="Quick links">
        <a href="#top"><Icon.Home /><span>Home</span></a>
        <a href="#plans"><Icon.Tag /><span>Plans</span></a>
        <a href="#join" className="join"><span><Icon.Bolt /></span><span>Join</span></a>
        <a href="#visit"><Icon.Pin /><span>Visit</span></a>
        <Link href={portalLink}><Icon.User /><span>{session ? 'My plan' : 'Login'}</span></Link>
      </nav>
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
      setErr('Please enter a 10-digit mobile number.');
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
        <p className="label" style={{ justifyContent: 'center' }}>Request sent</p>
        <h3>Thank you! 🙌</h3>
        <p className="muted">We’ll call you within a day to fix your free trial.</p>
      </div>
    );

  return (
    <form className="card lead-form" onSubmit={submit}>
      <p className="label" style={{ margin: 0 }}>Free trial</p>
      <h3>Book your first session</h3>
      <input id="lead-name" required placeholder="Your name" autoComplete="name" value={form.name} onChange={set('name')} />
      <input id="lead-phone" required placeholder="Mobile number" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
      <select id="lead-plan" value={form.interested_plan} onChange={set('interested_plan')} aria-label="Interested in">
        <option value="">Interested in…</option>
        {planNames.map((n) => <option key={n}>{n}</option>)}
      </select>
      <textarea id="lead-msg" rows={3} placeholder="Your goal or preferred time (optional)" value={form.message} onChange={set('message')} />
      {state === 'error' && <div className="error-box">{err}</div>}
      <button className="btn btn-lg btn-block" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Request a call back'} <span className="arr" aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
