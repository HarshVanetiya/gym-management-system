import type { Store } from './store';
import type { Plan, SiteSettings, Testimonial } from './types';

/** Everything the public website needs. Used on the server (for SEO) and in the browser (demo mode). */
export interface PublicData {
  site: SiteSettings | null;
  plans: Plan[];
  testimonials: Testimonial[];
}

export async function loadPublicData(store: Store): Promise<PublicData> {
  const [site, plans, testimonials] = await Promise.all([
    store.get('site_settings', 1),
    store.list('plans', { eq: { is_active: true }, order: ['sort_order', 'asc'] }),
    store.list('testimonials', { eq: { is_published: true } }),
  ]);
  return { site, plans, testimonials };
}
