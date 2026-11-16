'use client';

import { useRef, useState } from 'react';
import { cld, uploadImage, type UploadTarget } from '../lib/media';
import { Icon } from './icons';

export function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  const src = cld(url, { w: size * 2, h: size * 2, face: true });
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }} aria-hidden={!src}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} loading="lazy" />
      ) : (
        initials || <Icon.User />
      )}
    </span>
  );
}

/** "Upload photo" button: picks a photo (camera or gallery on phones), uploads it, returns the new URL. */
export function PhotoButton({
  target, onUploaded, label = 'Upload photo', className = 'btn btn-sm btn-ghost',
}: { target: UploadTarget; onUploaded: (url: string) => void | Promise<void>; label?: string; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      await onUploaded(await uploadImage(file, target));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <span className="photo-button">
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files?.[0])} />
      <button type="button" className={className} onClick={() => input.current?.click()} disabled={busy}>
        <Icon.Camera width={17} height={17} /> {busy ? 'Uploading…' : label}
      </button>
      {err && <span className="field-error">{err}</span>}
    </span>
  );
}
