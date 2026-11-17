import { createClient } from '@supabase/supabase-js';
import { signCloudinaryParams } from '../../../lib/cloudinary-sign';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Target = { kind: 'avatar'; memberId?: string } | { kind: 'hero' } | { kind: 'logo' } | { kind: 'gallery'; slot: number };

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns a one-time Cloudinary upload signature for the logged-in user.
 * Members may only upload their own profile photo; the trainer may upload member photos and website images.
 * Each target has a fixed public_id, so a new upload replaces the old file instead of piling up copies.
 */
export async function POST(req: Request) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!cloudName || !apiKey || !apiSecret) return json({ error: 'Photo uploads are not set up yet (Cloudinary keys are missing on the server).' }, 503);
  if (!sbUrl || !sbKey) return json({ error: 'The database is not connected.' }, 503);

  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Please log in again.' }, 401);

  // Acts as the user, so the database's own security rules decide what they can see.
  const sb = createClient(sbUrl, sbKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: userData } = await sb.auth.getUser(token);
  const user = userData.user;
  if (!user) return json({ error: 'Please log in again.' }, 401);
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const isAdmin = profile?.role === 'admin';

  const target = (await req.json().catch(() => null)) as Target | null;
  let publicId: string | null = null;
  if (target?.kind === 'avatar') {
    if (target.memberId) {
      if (!isAdmin || !UUID.test(target.memberId)) return json({ error: 'Only the trainer can change another member’s photo.' }, 403);
      publicId = `mfc/members/${target.memberId}`;
    } else {
      const { data: me } = await sb.from('members').select('id').eq('user_id', user.id).maybeSingle();
      if (!me) return json({ error: 'No member profile is linked to this login.' }, 403);
      publicId = `mfc/members/${me.id}`;
    }
  } else if (target?.kind === 'hero' && isAdmin) {
    publicId = 'mfc/site/hero';
  } else if (target?.kind === 'logo' && isAdmin) {
    publicId = 'mfc/site/logo';
  } else if (target?.kind === 'gallery' && isAdmin && Number.isInteger(target.slot) && target.slot >= 1 && target.slot <= 5) {
    publicId = `mfc/site/gallery-${target.slot}`;
  }
  if (!publicId) return json({ error: 'You are not allowed to upload this image.' }, 403);

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { invalidate: 'true', overwrite: 'true', public_id: publicId, timestamp };
  return json({ cloudName, apiKey, ...params, signature: signCloudinaryParams(params, apiSecret) });
}
