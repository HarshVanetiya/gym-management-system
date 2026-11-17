/**
 * Asks Cloudinary for a right-sized, auto-format (WebP/AVIF) copy of an image.
 * Non-Cloudinary URLs (demo photos, pasted links) are returned unchanged.
 */
export function cld(url: string | null | undefined, opts: { w: number; h?: number; face?: boolean }): string | undefined {
  if (!url) return undefined;
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url;
  const t = ['f_auto', 'q_auto', `w_${opts.w}`];
  if (opts.h) t.push(`h_${opts.h}`, 'c_fill', opts.face ? 'g_face' : 'g_auto');
  else t.push('c_limit');
  return url.replace('/image/upload/', `/image/upload/${t.join(',')}/`);
}
