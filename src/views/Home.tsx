'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { store } from '../lib/store';
import { useAsync, useAuth } from '../lib/hooks';
import { loadPublicData, type PublicData } from '../lib/public-data';
import { whatsappLink } from '../lib/utils';
import { cld } from '../lib/media';
import { nowInIndia, openStatus, parseHours, todayText, type OpenStatus } from '../lib/hours';
import { DemoBanner } from '../components/DemoBanner';
import { Icon } from '../components/icons';
import { InstallApp } from '../components/Pwa';
import { ThemeToggle } from '../components/ThemeToggle';
import { Lockup } from '../components/Brand';

const TRAINING = [
  { title: 'Strength training', text: 'Free weights and machines, with form checks so you lift safely and keep progressing.' },
  { title: 'Weight loss', text: 'Cardio and strength sessions, with a diet built on everyday Indian food.' },
  { title: 'Personal training', text: 'One-on-one sessions, planned around your body, your goals and your schedule.' },
  { title: 'Diet plans', text: 'Veg and non-veg plans with meal times and portions, kept in the member app.' },
];
const GOALS = ['Strength training', 'Weight loss', 'Personal training', 'Diet plan', 'Not sure yet'];

/** `initial` is rendered on the server when Supabase is configured; in demo mode data loads in the browser. */
export default function Home({ initial }: { initial: PublicData | null }) {
  const { session } = useAuth();
  const loaded = useAsync(async () => initial ?? loadPublicData(store), []);
  const pub = loaded.data ?? initial;
  const site = pub?.site;
  const testimonials = pub?.testimonials ?? [];

  const name = site?.gym_name ?? 'Medilife Fitness Club';
  const wa = whatsappLink(site?.whatsapp, `Hi ${name}, I found your website and want to know more about joining.`);
  const portalLink = session ? (session.role === 'admin' ? '/admin' : '/me') : '/login';
  const portalLabel = session ? 'My plan' : 'Log in';
  const area = site?.address?.split(',')[0]?.trim() || 'Udaipur';
  const city = site?.address?.split(',').slice(1).map((s) => s.trim()).filter(Boolean)[0] ?? 'Udaipur';
  const igHandle = site?.instagram?.replace(/\/+$/, '').split('/').pop()?.replace(/^@/, '') || null;
  const tel = site?.phone?.replace(/[^\d+]/g, '') || null;
  const heroPhoto = cld(site?.hero_image_url, { w: 2000 });

  // Opening status uses the time in India, refreshed every minute (client-only, so the server HTML stays stable).
  const groups = useMemo(() => parseHours(site?.hours), [site?.hours]);
  const [live, setLive] = useState<{ status: OpenStatus | null; today: string | null; day: number } | null>(null);
  useEffect(() => {
    const tick = () => setLive({ status: openStatus(groups), today: todayText(groups), day: nowInIndia().day });
    tick();
    const t = window.setInterval(tick, 60_000);
    return () => window.clearInterval(t);
  }, [groups]);

  // The header is see-through while it sits over the navy hero.
  const [overHero, setOverHero] = useState(true);
  useEffect(() => {
    const onScroll = () => setOverHero(window.scrollY < 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Phone menu: locks page scrolling while open, closes on Escape.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('menu-lock', menuOpen);
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('menu-lock');
    };
  }, [menuOpen]);
  const close = () => setMenuOpen(false);

  const stats = [
    site?.years_experience ? { value: `${site.years_experience}+`, label: site.years_experience === 1 ? 'year in Udaipur' : 'years in Udaipur' } : null,
    site?.clients_trained ? { value: `${site.clients_trained.toLocaleString('en-IN')}+`, label: 'members trained' } : null,
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <div className="site" id="top">
      <DemoBanner />
      <header className={`topbar ${overHero && !menuOpen ? 'over' : ''} ${menuOpen ? 'menu-open' : ''}`}>
        <div className="wrap topbar-inner">
          <a href="#top" className="brand-link" aria-label={`${name} home`} onClick={close}>
            <Lockup name={name} logoUrl={site?.logo_url} />
          </a>
          <nav className="desk-nav" aria-label="Sections">
            <a href="#training">Training</a>
            <a href="#app">Member app</a>
            <a href="#visit">Visit</a>
          </nav>
          <div className="top-actions">
            <ThemeToggle className="desk-only" />
            <Link href={portalLink} className="top-link desk-only">{portalLabel}</Link>
            <a href="#join" className="btn btn-sm btn-top" onClick={close}>Free trial</a>
            <button type="button" className="menu-btn" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen((o) => !o)}>
              <span className="menu-lines" aria-hidden="true" />
              <span className="menu-word">{menuOpen ? 'Close' : 'Menu'}</span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="menu-panel" id="site-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <nav className="menu-links" aria-label="Sections">
            <a href="#training" onClick={close}>Training</a>
            <a href="#app" onClick={close}>Member app</a>
            {testimonials.length > 0 && <a href="#results" onClick={close}>Members</a>}
            <a href="#visit" onClick={close}>Visit</a>
            <a href="#join" onClick={close}>Book a free trial</a>
            <a href="#install-app" onClick={close}>Install the app</a>
          </nav>
          <div className="menu-foot">
            <Link href={portalLink} onClick={close}>{portalLabel}</Link>
            {wa && <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
            {site?.instagram && <a href={site.instagram} target="_blank" rel="noreferrer">Instagram</a>}
            <ThemeToggle />
          </div>
        </div>
      )}

      <main>
        {/* ---------------- hero ---------------- */}
        <section className={`hero ${heroPhoto ? 'has-photo' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {heroPhoto && <img className="hero-bg" src={heroPhoto} alt="" />}
          {!heroPhoto && <div className="hero-rings" aria-hidden="true" />}
          <div className="wrap hero-inner">
            <p className="hero-kicker">{area} · {city}</p>
            <h1 className="hero-title">
              <span className="sr-only">{name}. </span>
              {site?.tagline || 'Train smart. Live strong.'}
            </h1>
            {site?.bio && <p className="hero-lead">{site.bio}</p>}
            <div className="hero-cta">
              <a href="#join" className="btn btn-light">Book a free trial</a>
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn btn-line-light"><Icon.Chat width={17} height={17} /> WhatsApp</a>}
            </div>
          </div>
          <div className="wrap">
            <div className="hero-foot">
              <p className="hero-status" aria-live="polite">
                {live?.status ? (
                  <><span className={`dot ${live.status.open ? 'open' : ''}`} aria-hidden="true" />{live.status.text}</>
                ) : (
                  <>{name}</>
                )}
              </p>
              {site?.address && <p className="hero-address">{site.address}</p>}
            </div>
          </div>
        </section>

        {/* ---------------- training ---------------- */}
        <section className="section" id="training">
          <div className="wrap split">
            <div className="sec-head">
              <p className="eyebrow">Training</p>
              <h2>Come in for one goal. Leave with a plan.</h2>
              <p>Every member gets a workout and a diet written by the coach, and checked as you go.</p>
              {stats.length > 0 && (
                <dl className="stats">
                  {stats.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
                </dl>
              )}
            </div>
            <ul className="offer-list">
              {TRAINING.map((t) => (
                <li key={t.title}>
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------- member app ---------------- */}
        <section className="section soft" id="app">
          <div className="wrap split app-split">
            <div>
              <div className="sec-head">
                <p className="eyebrow">Member app</p>
                <h2>Your plan, in your pocket.</h2>
                <p>Members log in to see the day’s workout, their diet, their progress and their membership. It installs like an app and opens on a weak connection.</p>
              </div>
              <ul className="app-list">
                <li><strong>Today’s workout</strong><span>Exercises, sets and reps for each day of the week.</span></li>
                <li><strong>Your diet</strong><span>Meal times and portions from your coach.</span></li>
                <li><strong>Progress</strong><span>Log your weight and watch the trend.</span></li>
                <li><strong>Membership</strong><span>Days left, dues and every receipt.</span></li>
              </ul>
              <div className="cta-row">
                <Link href="/login" className="btn btn-solid">Member login</Link>
              </div>
              <InstallApp />
            </div>
            <div className="phone-stage" aria-hidden="true">
              <div className="phone-mock">
                <div className="phone-screen">
                  <div className="ps-head"><span>Good morning,<b>Neha</b></span><span className="ps-avatar">NG</span></div>
                  <div className="ps-card">
                    <span className="ps-label">Quarterly membership</span>
                    <b>62 days left</b>
                    <div className="ps-meter"><span /></div>
                  </div>
                  <div className="ps-list">
                    <div className="ps-day">Monday · Push</div>
                    <div><span>Bench press</span><i>4 × 10</i></div>
                    <div><span>Shoulder press</span><i>3 × 10</i></div>
                    <div><span>Lateral raises</span><i>3 × 15</i></div>
                    <div><span>Rope pushdown</span><i>3 × 12</i></div>
                  </div>
                  <div className="ps-list ps-diet">
                    <div className="ps-day">Today’s diet</div>
                    <div><span>Breakfast</span><i>Poha, 2 eggs</i></div>
                    <div><span>Lunch</span><i>Dal, 2 roti, salad</i></div>
                    <div><span>Dinner</span><i>Paneer, sabzi</i></div>
                  </div>
                  <div className="ps-tabs"><span className="on">Home</span><span>Workout</span><span>Diet</span><span>Profile</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- reviews ---------------- */}
        {testimonials.length > 0 && (
          <section className="section dark" id="results">
            <div className="wrap">
              <div className="sec-head">
                <p className="eyebrow">Members</p>
                <h2>In their words</h2>
              </div>
              <div className="quotes">
                {testimonials.map((t) => (
                  <figure className="quote" key={t.id}>
                    <blockquote>“{t.text}”</blockquote>
                    <figcaption>
                      <span>{t.name}</span>
                      {t.result && <span className="quote-result">{t.result}</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- gallery ---------------- */}
        {!!site?.gallery_urls?.length && (
          <section className="section gallery-section" aria-label="Inside the gym">
            <div className="wrap">
              <p className="eyebrow">Inside the gym</p>
              <div className="gallery">
                {site.gallery_urls.slice(0, 5).map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={u} src={cld(u, i === 0 ? { w: 1200, h: 800 } : { w: 600, h: 600 })} alt={`${name} photo ${i + 1}`} loading="lazy" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- visit + trial ---------------- */}
        <section className="section" id="visit">
          <div className="wrap split visit">
            <div>
              <div className="sec-head">
                <p className="eyebrow">Visit</p>
                <h2>Find us in {area}</h2>
                {site?.address && <p>{site.address}</p>}
              </div>
              {site?.hours && (
                groups ? (
                  <div className="hours" role="table" aria-label="Opening hours">
                    {groups.map((g) => {
                      const isToday = live ? g.days.includes(live.day) : false;
                      return (
                        <div className={`hours-row ${isToday ? 'today' : ''}`} role="row" key={g.label}>
                          <span role="cell">{g.label}{isToday && <em>Today</em>}</span>
                          <span role="cell">{g.ranges.length ? g.ranges.map((r) => r.text).join(', ') : 'Closed'}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="hours-text">{site.hours}</p>
                )
              )}
              <div className="row-links">
                {site?.map_url && <a href={site.map_url} target="_blank" rel="noreferrer"><span>Get directions</span><Icon.ArrowUpRight width={18} height={18} /></a>}
                {tel && <a href={`tel:${tel}`}><span>Call <em>{site?.phone}</em></span><Icon.ArrowRight width={18} height={18} /></a>}
                {wa && <a href={wa} target="_blank" rel="noreferrer"><span>WhatsApp</span><Icon.ArrowUpRight width={18} height={18} /></a>}
                {igHandle && site?.instagram && <a href={site.instagram} target="_blank" rel="noreferrer"><span>Instagram <em>@{igHandle}</em></span><Icon.ArrowUpRight width={18} height={18} /></a>}
              </div>
            </div>
            <div id="join">
              <LeadForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap foot-grid">
          <div className="foot-brand">
            <Lockup name={name} logoUrl={site?.logo_url} />
            {site?.address && <p>{site.address}</p>}
            {site?.hours && <p>{site.hours}</p>}
          </div>
          <nav className="foot-links" aria-label="Footer">
            <a href="#training">Training</a>
            <a href="#app">Member app</a>
            <a href="#visit">Visit</a>
            <a href="#join">Free trial</a>
            <Link href={portalLink}>{session ? 'My plan' : 'Member login'}</Link>
            <a href="#install-app">Install the app</a>
          </nav>
          <nav className="foot-links" aria-label="Contact">
            {tel && <a href={`tel:${tel}`}>{site?.phone}</a>}
            {wa && <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
            {site?.instagram && <a href={site.instagram} target="_blank" rel="noreferrer">Instagram</a>}
            {site?.map_url && <a href={site.map_url} target="_blank" rel="noreferrer">Google Maps</a>}
          </nav>
        </div>
        <div className="wrap">
          <div className="foot-bottom">
            <span>© {new Date().getFullYear()} {name}</span>
            <span>Website by <a href="https://www.hvanetia.me/" target="_blank" rel="noreferrer">Harsh Vanetia</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LeadForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '', interested_plan: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
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
      <div className="lead-form done">
        <span className="done-icon"><Icon.Check /></span>
        <h3>Thanks, we’ve got it</h3>
        <p className="muted">We’ll call you within a day to fix a time for your free trial.</p>
      </div>
    );

  return (
    <form className="lead-form" onSubmit={submit}>
      <p className="eyebrow">Free trial</p>
      <h3>Book your first session</h3>
      <p className="muted">Leave your number and we’ll call you back.</p>
      <label htmlFor="lead-name">Name</label>
      <input id="lead-name" required autoComplete="name" value={form.name} onChange={set('name')} />
      <label htmlFor="lead-phone">Mobile number</label>
      <input id="lead-phone" required inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
      <label htmlFor="lead-goal">Your goal</label>
      <select id="lead-goal" value={form.interested_plan} onChange={set('interested_plan')}>
        <option value="">Choose one (optional)</option>
        {GOALS.map((g) => <option key={g}>{g}</option>)}
      </select>
      <label htmlFor="lead-msg">Preferred time or a note <span className="muted">(optional)</span></label>
      <textarea id="lead-msg" rows={3} value={form.message} onChange={set('message')} />
      {state === 'error' && <div className="error-box">{err}</div>}
      <button className="btn btn-block btn-solid" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Request a call back'}
      </button>
    </form>
  );
}
