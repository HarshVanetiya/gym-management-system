'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { store } from '../../lib/store';
import { invalidateSite, useAsync } from '../../lib/hooks';
import type { SiteSettings, Testimonial } from '../../lib/types';
import { ErrorBox, Field, Loading } from '../../components/ui';
import { Icon } from '../../components/icons';
import { PhotoButton } from '../../components/Media';
import { cld } from '../../lib/media';

type TextKey = Exclude<keyof SiteSettings, 'id' | 'years_experience' | 'clients_trained' | 'certifications' | 'gallery_urls' | 'tagline_hi' | 'hero_image_url' | 'logo_url'>;
const TEXT_FIELDS: [TextKey, string, string?][] = [
  ['gym_name', 'Gym name'],
  ['trainer_name', 'Trainer name'],
  ['tagline', 'Short tagline'],
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
  const [gallery, setGallery] = useState<(string | null)[]>([null, null, null, null, null]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (site.data) {
      setF(site.data);
      setCerts((site.data.certifications ?? []).join('\n'));
      const g = site.data.gallery_urls ?? [];
      setGallery([0, 1, 2, 3, 4].map((i) => g[i] ?? null));
    }
  }, [site.data]);

  if (!f) return site.error ? <ErrorBox error={site.error} /> : <Loading />;

  /** Photos save straight away, so an upload is never lost if the form isn't submitted. */
  async function savePhotos(patch: { hero_image_url?: string | null; logo_url?: string | null; gallery?: (string | null)[] }) {
    setErr(null);
    try {
      const nextGallery = patch.gallery ?? gallery;
      await store.update('site_settings', 1, {
        ...(patch.hero_image_url !== undefined ? { hero_image_url: patch.hero_image_url } : {}),
        ...(patch.logo_url !== undefined ? { logo_url: patch.logo_url } : {}),
        gallery_urls: nextGallery.filter((u): u is string => Boolean(u)),
      });
      if (patch.hero_image_url !== undefined) setF((cur) => (cur ? { ...cur, hero_image_url: patch.hero_image_url ?? null } : cur));
      if (patch.logo_url !== undefined) setF((cur) => (cur ? { ...cur, logo_url: patch.logo_url ?? null } : cur));
      setGallery(nextGallery);
      invalidateSite();
      setMsg('Photo saved. Your website is updated.');
      setTimeout(() => setMsg(null), 3000);
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const { id: _id, ...rest } = f!;
      void _id;
      await store.update('site_settings', 1, { ...rest, certifications: certs.split('\n').map((c) => c.trim()).filter(Boolean), gallery_urls: gallery.filter((u): u is string => Boolean(u)) });
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
        <a className="btn btn-ghost" href="/" target="_blank" rel="noreferrer"><Icon.ExternalLink width={17} height={17} /> Open website</a>
      </div>
      <section className="card photos-card">
        <div className="card-head"><h3><Icon.Camera /> Photos</h3><span className="muted small">Stored on Cloudinary and resized automatically</span></div>
        <div className="photo-slot logo-slot">
          <div className="thumb">
            {f.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cld(f.logo_url, { w: 480 })} alt="Logo" />
            ) : <span className="muted small">No logo yet. The website shows the blue MFC plate and the gym name.</span>}
          </div>
          <div>
            <strong>Logo</strong>
            <p className="muted small">Shown in the website header and footer. A PNG with a see-through background, or an SVG, looks sharpest.</p>
            <div className="row-actions wrap">
              <PhotoButton target={{ kind: 'logo' }} label={f.logo_url ? 'Replace' : 'Upload'} onUploaded={(url) => savePhotos({ logo_url: url })} />
              {f.logo_url && <button type="button" className="btn btn-sm btn-ghost danger" onClick={() => savePhotos({ logo_url: null })}><Icon.Trash width={16} height={16} /> Remove</button>}
            </div>
          </div>
        </div>
        <div className="photo-slot hero-slot">
          <div className="thumb">
            {f.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cld(f.hero_image_url, { w: 640 })} alt="Main photo" />
            ) : <span className="muted small">No main photo. The website shows the blue MFC plate.</span>}
          </div>
          <div>
            <strong>Main photo</strong>
            <p className="muted small">Shown next to the gym name at the top of the website. A clear photo of the gym floor or the trainer works best.</p>
            <div className="row-actions wrap">
              <PhotoButton target={{ kind: 'hero' }} label={f.hero_image_url ? 'Replace' : 'Upload'} onUploaded={(url) => savePhotos({ hero_image_url: url })} />
              {f.hero_image_url && <button type="button" className="btn btn-sm btn-ghost danger" onClick={() => savePhotos({ hero_image_url: null })}><Icon.Trash width={16} height={16} /> Remove</button>}
            </div>
          </div>
        </div>
        <strong className="gallery-title">Gallery</strong>
        <p className="muted small">Up to 5 photos for an “Inside the gym” section. Leave empty to hide it.</p>
        <div className="gallery-slots">
          {gallery.map((u, i) => (
            <div className="gallery-slot" key={i}>
              <div className="thumb">
                {u ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cld(u, { w: 320, h: 320 })} alt={`Gallery photo ${i + 1}`} />
                ) : <Icon.Camera />}
              </div>
              <div className="row-actions">
                <PhotoButton target={{ kind: 'gallery', slot: i + 1 }} label={u ? 'Replace' : 'Upload'} onUploaded={(url) => savePhotos({ gallery: gallery.map((g, j) => (j === i ? url : g)) })} />
                {u && <button type="button" className="icon-btn" aria-label={`Remove gallery photo ${i + 1}`} onClick={() => savePhotos({ gallery: gallery.map((g, j) => (j === i ? null : g)) })}><Icon.Trash width={17} height={17} /></button>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <form className="card form-grid mt" onSubmit={save}>
        <h3 className="span-2"><Icon.Globe /> Details</h3>
        {TEXT_FIELDS.map(([k, label, hint]) => (
          <Field key={k} label={label} hint={hint}>
            <input value={(f[k] as string) ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </Field>
        ))}
        <Field label="Years running" hint="0 hides it on the website"><input type="number" value={f.years_experience ?? 0} onChange={(e) => setF({ ...f, years_experience: Number(e.target.value) })} /></Field>
        <Field label="Members trained" hint="0 hides it on the website"><input type="number" value={f.clients_trained ?? 0} onChange={(e) => setF({ ...f, clients_trained: Number(e.target.value) })} /></Field>
        <div className="span-2"><Field label="About / bio"><textarea rows={4} value={f.bio ?? ''} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field></div>
        <div className="span-2"><Field label="Coach certifications (one per line)"><textarea rows={3} value={certs} onChange={(e) => setCerts(e.target.value)} /></Field></div>
        <div className="span-2"><ErrorBox error={err} />{msg && <div className="info-box">{msg}</div>}</div>
        <div className="span-2 form-actions"><button className="btn"><Icon.Check width={17} height={17} /> Save website</button></div>
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
              <button className="btn btn-sm btn-ghost danger" onClick={async () => { if (confirm('Delete this testimonial?')) { await store.remove('testimonials', t.id); reload(); } }} aria-label="Delete testimonial"><Icon.Trash width={16} height={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
