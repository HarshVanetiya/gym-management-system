'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { store } from '../../lib/store';
import { invalidateSite, useAsync } from '../../lib/hooks';
import type { SiteSettings, Testimonial } from '../../lib/types';
import { ErrorBox, Field, Loading } from '../../components/ui';

type TextKey = Exclude<keyof SiteSettings, 'id' | 'years_experience' | 'clients_trained' | 'certifications' | 'gallery_urls' | 'tagline_hi'>;
const TEXT_FIELDS: [TextKey, string, string?][] = [
  ['gym_name', 'Gym name'],
  ['trainer_name', 'Trainer name'],
  ['tagline', 'Short tagline'],
  ['hero_image_url', 'Main photo link', 'Paste a photo link (e.g. from Google Photos or the gym’s site). Leave empty to show the MFC artwork.'],
  ['phone', 'Phone'],
  ['whatsapp', 'WhatsApp number', 'With country code, digits only — e.g. 919876543210'],
  ['email', 'Email'],
  ['address', 'Address'],
  ['map_url', 'Google Maps link'],
  ['hours', 'Opening hours'],
  ['instagram', 'Instagram URL'],
  ['youtube', 'YouTube URL'],
  ['upi_id', 'UPI ID', 'Included in WhatsApp payment reminders'],
];

export default function SiteEditor() {
  const site = useAsync(() => store.get('site_settings', 1));
  const tst = useAsync(() => store.list('testimonials', { order: ['created_at', 'desc'] }));
  const [f, setF] = useState<SiteSettings | null>(null);
  const [certs, setCerts] = useState('');
  const [gallery, setGallery] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (site.data) {
      setF(site.data);
      setCerts((site.data.certifications ?? []).join('\n'));
      setGallery((site.data.gallery_urls ?? []).join('\n'));
    }
  }, [site.data]);

  if (!f) return site.error ? <ErrorBox error={site.error} /> : <Loading />;

  async function save(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const { id: _id, ...rest } = f!;
      void _id;
      await store.update('site_settings', 1, { ...rest, certifications: certs.split('\n').map((c) => c.trim()).filter(Boolean), gallery_urls: gallery.split('\n').map((c) => c.trim()).filter(Boolean) });
      invalidateSite();
      setMsg('Saved. Your website is updated.');
      setTimeout(() => setMsg(null), 3000);
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Website</h1>
          <p className="muted">Everything here shows on your public portfolio page.</p>
        </div>
        <a className="btn btn-ghost" href="/" target="_blank" rel="noreferrer">Open website ↗</a>
      </div>
      <form className="card form-grid" onSubmit={save}>
        {TEXT_FIELDS.map(([k, label, hint]) => (
          <Field key={k} label={label} hint={hint}>
            <input value={(f[k] as string) ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </Field>
        ))}
        <Field label="Years running" hint="0 hides it on the website"><input type="number" value={f.years_experience ?? 0} onChange={(e) => setF({ ...f, years_experience: Number(e.target.value) })} /></Field>
        <Field label="Members trained" hint="0 hides it on the website"><input type="number" value={f.clients_trained ?? 0} onChange={(e) => setF({ ...f, clients_trained: Number(e.target.value) })} /></Field>
        <div className="span-2"><Field label="About / bio"><textarea rows={4} value={f.bio ?? ''} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field></div>
        <div className="span-2"><Field label="Gallery photo links (one per line, up to 5)" hint="Shown in an “Inside the gym” section. Leave empty to hide it."><textarea rows={3} value={gallery} onChange={(e) => setGallery(e.target.value)} /></Field></div>
        <div className="span-2"><Field label="Coach certifications (one per line)"><textarea rows={3} value={certs} onChange={(e) => setCerts(e.target.value)} /></Field></div>
        <div className="span-2"><ErrorBox error={err} />{msg && <div className="info-box">{msg}</div>}</div>
        <div className="span-2 form-actions"><button className="btn">Save website</button></div>
      </form>

      <h2 className="mt">Testimonials</h2>
      <TestimonialEditor rows={tst.data ?? []} reload={tst.reload} />
    </div>
  );
}

function TestimonialEditor({ rows, reload }: { rows: Testimonial[]; reload: () => void }) {
  const [form, setForm] = useState({ name: '', text: '', result: '' });
  async function add(e: FormEvent) {
    e.preventDefault();
    await store.insert('testimonials', { name: form.name, text: form.text, result: form.result || null, is_published: true });
    setForm({ name: '', text: '', result: '' });
    reload();
  }
  return (
    <div className="grid-2">
      <form className="card stack" onSubmit={add}>
        <h3>Add testimonial</h3>
        <input required placeholder="Member name (e.g. Rohit K.)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Result (e.g. −10 kg in 3 months)" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} />
        <textarea required rows={3} placeholder="What they said" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        <button className="btn">Add</button>
      </form>
      <div className="stack">
        {rows.map((t) => (
          <div className={`card ${t.is_published ? '' : 'inactive'}`} key={t.id}>
            <strong>{t.name}</strong> {t.result && <span className="tag">{t.result}</span>}
            <p className="small">{t.text}</p>
            <div className="row-actions">
              <button className="btn btn-sm btn-ghost" onClick={async () => { await store.update('testimonials', t.id, { is_published: !t.is_published }); reload(); }}>{t.is_published ? 'Hide' : 'Publish'}</button>
              <button className="btn btn-sm btn-ghost danger" onClick={async () => { if (confirm('Delete?')) { await store.remove('testimonials', t.id); reload(); } }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
