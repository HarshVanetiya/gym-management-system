import { store } from './store';

export type UploadTarget = { kind: 'avatar'; memberId?: string } | { kind: 'hero' } | { kind: 'logo' } | { kind: 'gallery'; slot: number };

const MAX_SIDE: Record<UploadTarget['kind'], number> = { avatar: 640, hero: 2000, gallery: 1600, logo: 800 };
export const cloudinaryConfigured = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

/** Shrinks a photo in the browser before upload (saves data on phones and Cloudinary credits). */
export async function shrinkImage(file: File, maxSide: number, quality = 0.85, type = 'image/jpeg'): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo (JPG, PNG or WebP).');
  if (file.size > 25 * 1024 * 1024) throw new Error('That photo is too large (over 25 MB).');
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('This photo format is not supported. Try a JPG or PNG.');
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read the photo.'))), type, quality));
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the photo.'));
    r.readAsDataURL(b);
  });

/**
 * Uploads a photo and returns its URL.
 * - Live: signed upload straight to Cloudinary (the server checks who may upload what).
 * - Demo mode: a small copy is kept in the browser instead.
 */
export async function uploadImage(file: File, target: UploadTarget): Promise<string> {
  // Logos keep their transparency (PNG), and SVG logos are uploaded as they are.
  const isLogo = target.kind === 'logo';
  const isSvg = file.type === 'image/svg+xml';
  if (store.mode === 'demo') return isLogo && isSvg ? blobToDataUrl(file) : blobToDataUrl(await shrinkImage(file, isLogo ? 480 : 360, 0.78, isLogo ? 'image/png' : 'image/jpeg'));
  if (!cloudinaryConfigured) throw new Error('Photo uploads are not set up yet. Add the Cloudinary keys (see README).');

  const blob = isLogo && isSvg ? file : await shrinkImage(file, MAX_SIDE[target.kind], 0.85, isLogo ? 'image/png' : 'image/jpeg');
  const token = await store.auth.getAccessToken();
  const signRes = await fetch('/api/upload-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
    body: JSON.stringify(target),
  });
  const sig = await signRes.json().catch(() => ({}));
  if (!signRes.ok) throw new Error(sig.error ?? 'Could not start the upload.');

  const form = new FormData();
  form.append('file', blob, isLogo ? (isSvg ? 'logo.svg' : 'logo.png') : 'photo.jpg');
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('public_id', sig.public_id);
  form.append('overwrite', sig.overwrite);
  form.append('invalidate', sig.invalidate);
  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: form });
  const res = await up.json().catch(() => ({}));
  if (!up.ok || !res.secure_url) throw new Error(res.error?.message ?? 'Upload failed. Please try again.');
  return res.secure_url as string;
}

export { cld } from './cld';
