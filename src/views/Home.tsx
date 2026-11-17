'use client';

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import { store } from '../lib/store';
import { useAsync, useAuth } from '../lib/hooks';
import { loadPublicData, type PublicData } from '../lib/public-data';
import { money, whatsappLink } from '../lib/utils';
import { cld } from '../lib/media';
import { nowInIndia, openStatus, parseHours, todayText, type OpenStatus } from '../lib/hours';
import type { Plan } from '../lib/types';
import { DemoBanner } from '../components/DemoBanner';
import { Icon } from '../components/icons';
import { InstallApp } from '../components/Pwa';
import { ThemeToggle } from '../components/ThemeToggle';
import { Plate, Wordmark } from '../components/Brand';

const TRAINING = [
  { icon: Icon.Dumbbell, title: 'Strength training', text: 'Free weights and machines, with form checks so you lift safely and keep adding weight.' },
  { icon: Icon.Chart, title: 'Weight loss', text: 'Cardio and strength sessions plus a diet built on everyday Indian food.' },
  { icon: Icon.User, title: 'Personal training', text: 'One-on-one sessions with a plan written around your body, goals and schedule.' },
  { icon: Icon.Leaf, title: 'Diet plans', text: 'Veg and non-veg plans with meal times and portions, right in the member app.' },
];

interface PlanMath { months: number; perMonth: number; save: number }

/** Per-month price and savings against the 1-month plan, worked out from the trainer's own prices. */
function planMath(plans: Plan[]): { byId: Map<string, PlanMath | null>; fromPerMonth: number | null; bestId: string | null } {
  const oneMonth = plans.filter((p) => p.duration_days >= 28 && p.duration_days <= 31).sort((a, b) => a.price - b.price)[0];
  const byId = new Map<string, PlanMath | null>();
  let fromPerMonth: number | null = null;
  let bestId: string | null = null;
  let best = Infinity;
  for (const p of plans) {
    const months = Math.round(p.duration_days / 30);
    const perMonth = months >= 1 ? Math.round(Number(p.price) / months) : Number(p.price);
    if (fromPerMonth === null || perMonth < fromPerMonth) fromPerMonth = perMonth;
    if (months < 2) {
      byId.set(p.id, null);
      continue;
    }
    const save = oneMonth ? Number(oneMonth.price) * months - Number(p.price) : 0;
    byId.set(p.id, { months, perMonth, save: Math.max(0, save) });
    if (perMonth < best) {
      best = perMonth;
      bestId = p.id;
    }
  }
  return { byId, fromPerMonth, bestId };
}

function term(days: number) {
  const months = Math.round(days / 30);
  if (days % 30 <= 1 && months >= 1) return months === 1 ? '1 month' : months === 12 ? '1 year' : `${months} months`;
  return `${days} days`;
}

/** `initial` is rendered on the server when Supabase is configured; in demo mode data loads in the browser. */
export default function Home({ initial }: { initial: PublicData | null }) {
  const { session } = useAuth();
  const loaded = useAsync(async () => initial ?? loadPublicData(store), []);
  const pub = loaded.data ?? initial;
  const site = pub?.site;
  const plans = useMemo(() => pub?.plans ?? [], [pub]);
  const testimonials = pub?.testimonials ?? [];

  const name = site?.gym_name ?? 'Medilife Fitness Club';
  const wa = whatsappLink(site?.whatsapp, `Hi ${name}, I found your website and want to know more about joining.`);
  const portalLink = session ? (session.role === 'admin' ? '/admin' : '/me') : '/login';
  const area = site?.address?.split(',')[0]?.trim() || 'Udaipur';
  const city = site?.address?.split(',').slice(1).map((s) => s.trim()).filter(Boolean)[0] ?? 'Udaipur';
  // Words for the bottom of the plate's rim, e.g. "Udaipur · Rajasthan".
  const place = site?.address?.split(',').slice(1).map((s) => s.trim()).filter(Boolean).slice(0, 2).join(' · ') || city;
  const igHandle = site?.instagram?.replace(/\/+$/, '').split('/').pop()?.replace(/^@/, '') || null;
  const tel = site?.phone?.replace(/[^\d+]/g, '') || null;
  const math = useMemo(() => planMath(plans), [plans]);

  // Opening status uses the time in India, refreshed every minute (client-only, so the server HTML stays stable).
  const groups = useMemo(() => parseHours(site?.hours), [site?.hours]);
  const [live, setLive] = useState<{ status: OpenStatus | null; today: string | null; day: number } | null>(null);
  useEffect(() => {
    const tick = () => setLive({ status: openStatus(groups), today: todayText(groups), day: nowInIndia().day });
    tick();
    const t = window.setInterval(tick, 60_000);
    return () => window.clearInterval(t);
  }, [groups]);

  const [overHero, setOverHero] = useState(true);
  useEffect(() => {
    const onScroll = () => setOverHero(window.scrollY < 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const pickPlan = (planName: string) => window.dispatchEvent(new CustomEvent('pick-plan', { detail: planName }));

  const heroPhoto = cld(site?.hero_image_url, { w: 1400, h: 1600 });

  return (
    <div className="site" id="top">
      <DemoBanner />
      <header className={`topbar ${overHero ? 'over' : ''}`}>
        <div className="wrap topbar-inner">
          <a href="#top" className="brand-link" aria-label={`${name} home`}>
            {site?.logo_url ? <Wordmark name={name} logoUrl={site.logo_url} /> : <><Plate className="mini-plate" rim={name} place={place} /><Wordmark name={name} /></>}
          </a>
          <nav aria-label="Sections">
            <a href="#training">Training</a>
            <a href="#plans">Plans</a>
            <a href="#app">Member app</a>
            <a href="#visit">Visit</a>
          </nav>
          <div className="right">
            <ThemeToggle />
            <Link href={portalLink} className="btn btn-sm btn-quiet">{session ? 'My plan' : 'Log in'}</Link>
            <a href="#join" className="btn btn-sm btn-brand desk-inline">Free trial</a>
          </div>
        </div>
      </header>

      <main>
        {/* ---------------- hero ---------------- */}
        <section className={`hero ${heroPhoto ? 'has-photo' : ''}`}>
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="status-pill" aria-live="polite">
                {live?.status ? (
                  <><span className={`status-dot ${live.status.open ? 'open' : 'closed'}`} aria-hidden="true" />{live.status.text}</>
                ) : (
                  <><Icon.Pin width={15} height={15} />{area}, {city}</>
                )}
              </p>
              <h1 className="hero-title">
                <span className="sr-only">{name}, gym in {area}, {city}</span>
                <Wordmark name={name} className="hero-wm" />
              </h1>
              {site?.bio && <p className="hero-lead">{site.bio}</p>}
              <div className="hero-cta">
                <a href="#join" className="btn btn-lg btn-light">Book a free trial <Icon.ArrowRight width={18} height={18} /></a>
                {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn btn-lg btn-outline-light"><Icon.Chat width={18} height={18} /> WhatsApp</a>}
              </div>
            </div>

            <div className="hero-media">
              {heroPhoto ? (
                <div className="hero-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroPhoto} alt={`Inside ${name}`} />
                  <Plate className="plate badge-plate" rim={name} place={place} />
                </div>
              ) : (
                <Plate className="plate hero-plate" rim={name} place={place} />
              )}
            </div>
          </div>

          <div className="facts-band">
          <div className="wrap">
            <dl className="hero-facts">
              {live?.today !== undefined && groups && (
                <div><dt>Today</dt><dd>{live?.today ?? 'Closed'}</dd></div>
              )}
              {math.fromPerMonth !== null && (
                <div><dt>Plans from</dt><dd>{money(math.fromPerMonth)}<small> a month</small></dd></div>
              )}
              <div><dt>Find us</dt><dd>{area}</dd></div>
            </dl>
          </div>
          </div>
        </section>

        {/* ---------------- training ---------------- */}
        <section className="section" id="training">
          <div className="wrap">
            <div className="sec-head">
              <p className="kicker">Training</p>
              <h2>Come in for one goal.<br />Leave with a plan.</h2>
              <p>Every member gets a workout and a diet written by the coaches, and checked as you go.</p>
            </div>
            <ul className="train">
              {TRAINING.map((t) => (
                <li key={t.title}>
                  <span className="train-icon"><t.icon /></span>
                  <div>
                    <h3>{t.title}</h3>
                    <p>{t.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------- plans ---------------- */}
        {plans.length > 0 && (
          <section className="section tint" id="plans">
            <div className="wrap">
              <div className="sec-head">
                <p className="kicker">Membership</p>
                <h2>Plans &amp; prices</h2>
                <p>Pay at the desk by cash or UPI. Longer plans cost less per month.</p>
              </div>
              <div className="plans" role="list">
                {plans.map((p) => {
                  const m = math.byId.get(p.id);
                  const best = p.id === math.bestId;
                  return (
                    <article className={`plan ${best ? 'featured' : ''}`} key={p.id} role="listitem">
                      <div className="plan-top">
                        <h3 className="plan-name">{p.name}</h3>
                        {best && <span className="plan-tag">Best value</span>}
                      </div>
                      <div className="plan-price"><span className="rupee">₹</span>{Number(p.price).toLocaleString('en-IN')}</div>
                      <p className="plan-term">for {term(p.duration_days)}</p>
                      {m && (
                        <p className="plan-math">
                          <strong>{money(m.perMonth)}</strong> a month{m.save > 0 && <> · <strong>save {money(m.save)}</strong></>}
                        </p>
                      )}
                      {!!p.features?.length && (
                        <ul>{p.features.map((f) => <li key={f}><Icon.Check width={16} height={16} />{f}</li>)}</ul>
                      )}
                      <a href="#join" className={`btn btn-block ${best ? 'btn-light' : ''}`} onClick={() => pickPlan(p.name)}>Choose {p.name}</a>
                    </article>
                  );
                })}
              </div>
              {plans.length > 1 && <p className="swipe-hint" aria-hidden="true">Swipe to see all {plans.length} plans</p>}
            </div>
          </section>
        )}

        {/* ---------------- member app ---------------- */}
        <section className="section" id="app">
          <div className="wrap app-promo">
            <div>
              <div className="sec-head">
                <p className="kicker">Member app</p>
                <h2>Your plan lives<br />on your phone.</h2>
              </div>
              <ul className="feature-list">
                <li><span><Icon.Dumbbell /></span><div><strong>Today’s workout</strong><span>Exercises, sets and reps for each day of the week.</span></div></li>
                <li><span><Icon.Leaf /></span><div><strong>Your diet</strong><span>Meal times and portions from your coach.</span></div></li>
                <li><span><Icon.Chart /></span><div><strong>Progress</strong><span>Log your weight and watch the trend.</span></div></li>
                <li><span><Icon.Receipt /></span><div><strong>Membership</strong><span>Days left, dues and every receipt.</span></div></li>
              </ul>
              <div className="row-actions wrap-row">
                <Link href="/login" className="btn btn-lg">Member login <Icon.ArrowRight width={18} height={18} /></Link>
              </div>
              <InstallApp />
            </div>
            <div className="phone-stage" aria-hidden="true">
              <Plate className="stage-plate" rim={name} place={place} />
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
          <section className="section navy" id="results">
            <div className="wrap">
              <div className="sec-head">
                <p className="kicker">Members</p>
                <h2>In their words</h2>
              </div>
              <div className="quotes">
                {testimonials.map((t) => (
                  <figure className="quote" key={t.id}>
                    {t.result && <p className="quote-result">{t.result}</p>}
                    <blockquote>“{t.text}”</blockquote>
                    <figcaption>{t.name}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- gallery ---------------- */}
        {!!site?.gallery_urls?.length && (
          <section className="section" style={{ paddingBottom: 0 }}>
            <div className="wrap">
              <p className="kicker">Inside the gym</p>
              <div className="gallery">
                {site.gallery_urls.slice(0, 5).map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={u} src={cld(u, i === 0 ? { w: 1200, h: 800 } : { w: 600, h: 600 })} alt={`${name} photo ${i + 1}`} loading="lazy" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- instagram ---------------- */}
        {igHandle && site?.instagram && (
          <section className="ig-band">
            <div className="wrap ig-inner">
              <div>
                <p className="kicker">Instagram</p>
                <a className="ig-handle" href={site.instagram} target="_blank" rel="noreferrer" style={{ '--len': igHandle.length + 1 } as CSSProperties}>@{igHandle}</a>
                <p>Workouts, member progress and gym updates, posted from the floor.</p>
              </div>
              <a className="btn btn-lg btn-light" href={site.instagram} target="_blank" rel="noreferrer"><Icon.Camera width={18} height={18} /> Follow on Instagram</a>
            </div>
          </section>
        )}

        {/* ---------------- visit + trial ---------------- */}
        <section className="section" id="visit">
          <div className="wrap visit">
            <div>
              <div className="sec-head">
                <p className="kicker">Visit</p>
                <h2>Find us in<br />{area}</h2>
              </div>
              {site?.address && <p className="address"><Icon.Pin width={18} height={18} />{site.address}</p>}
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
                  <p className="hours-text"><Icon.Clock width={18} height={18} />{site.hours}</p>
                )
              )}
              <div className="visit-actions">
                {site?.map_url && <a className="btn" href={site.map_url} target="_blank" rel="noreferrer"><Icon.Pin width={18} height={18} /> Directions</a>}
                {tel && <a className="btn btn-ghost" href={`tel:${tel}`}><Icon.Phone width={18} height={18} /> Call</a>}
                {wa && <a className="btn btn-ghost" href={wa} target="_blank" rel="noreferrer"><Icon.Chat width={18} height={18} /> WhatsApp</a>}
              </div>
              {site?.phone && <p className="muted small phone-line">{site.phone}</p>}
            </div>
            <div id="join">
              <LeadForm planNames={plans.map((p) => p.name)} />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              {site?.logo_url ? <Wordmark name={name} logoUrl={site.logo_url} /> : <Wordmark name={name} />}
              {site?.address && <p>{site.address}</p>}
              {site?.hours && <p>{site.hours}</p>}
            </div>
            <div>
              <h4>On this page</h4>
              <ul><li><a href="#training">Training</a></li><li><a href="#plans">Plans</a></li><li><a href="#app">Member app</a></li><li><a href="#visit">Visit</a></li></ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                {tel && <li><a href={`tel:${tel}`}>{site?.phone}</a></li>}
                {wa && <li><a href={wa} target="_blank" rel="noreferrer">WhatsApp</a></li>}
                {site?.instagram && <li><a href={site.instagram} target="_blank" rel="noreferrer">Instagram</a></li>}
                {site?.map_url && <li><a href={site.map_url} target="_blank" rel="noreferrer">Google Maps</a></li>}
              </ul>
            </div>
            <div>
              <h4>Members</h4>
              <ul><li><Link href={portalLink}>Member login</Link></li><li><a href="#join">Free trial</a></li></ul>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© {new Date().getFullYear()} {name}</span>
            <span>Website by <a href="https://www.hvanetia.me/" target="_blank" rel="noreferrer">Harsh Vanetia</a></span>
          </div>
        </div>
      </footer>

      <nav className="tabbar" aria-label="Quick links">
        <a href="#top"><Icon.Home /><span>Home</span></a>
        <a href="#plans"><Icon.Tag /><span>Plans</span></a>
        <a href="#join" className="join"><span><Icon.Bolt /></span><span>Free trial</span></a>
        <a href="#visit"><Icon.Pin /><span>Visit</span></a>
        <Link href={portalLink}><Icon.User /><span>{session ? 'My plan' : 'Log in'}</span></Link>
      </nav>
    </div>
  );
}

function LeadForm({ planNames }: { planNames: string[] }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '', interested_plan: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');
  useEffect(() => {
    const onPick = (e: Event) => setForm((f) => ({ ...f, interested_plan: (e as CustomEvent<string>).detail }));
    window.addEventListener('pick-plan', onPick);
    return () => window.removeEventListener('pick-plan', onPick);
  }, []);
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
      <p className="kicker" style={{ margin: 0 }}>Free trial</p>
      <h3>Book your first session</h3>
      <p className="muted small" style={{ margin: 0 }}>Leave your number and we’ll call you back.</p>
      <label className="sr-only" htmlFor="lead-name">Your name</label>
      <input id="lead-name" required placeholder="Your name" autoComplete="name" value={form.name} onChange={set('name')} />
      <label className="sr-only" htmlFor="lead-phone">Mobile number</label>
      <input id="lead-phone" required placeholder="Mobile number" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
      <select id="lead-plan" value={form.interested_plan} onChange={set('interested_plan')} aria-label="Interested in">
        <option value="">Interested in…</option>
        {planNames.map((n) => <option key={n}>{n}</option>)}
      </select>
      <label className="sr-only" htmlFor="lead-msg">Your goal or preferred time</label>
      <textarea id="lead-msg" rows={3} placeholder="Your goal or preferred time (optional)" value={form.message} onChange={set('message')} />
      {state === 'error' && <div className="error-box">{err}</div>}
      <button className="btn btn-lg btn-block btn-brand" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Request a call back'}
      </button>
    </form>
  );
}
