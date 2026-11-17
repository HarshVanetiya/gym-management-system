import type { Store } from './store';
import type { SiteSettings, Testimonial } from './types';

/**
 * Everything the public website needs. Used on the server (for SEO) and in the browser (demo mode).
 * Membership plans and prices are not part of it: the website doesn't show pricing.
 */
export interface PublicData {
  site: SiteSettings | null;
  testimonials: Testimonial[];
}

export async function loadPublicData(store: Store): Promise<PublicData> {
  const [site, testimonials] = await Promise.all([
    store.get('site_settings', 1),
    store.list('testimonials', { eq: { is_published: true } }),
  ]);
  return { site, testimonials };
}
