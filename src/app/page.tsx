import type { Metadata } from 'next';
import Home from '../views/Home';
import { store } from '../lib/store';
import { loadPublicData, type PublicData } from '../lib/public-data';

// Re-build the public page at most every 5 minutes, so edits in the dashboard show up quickly
// while visitors get fast, fully rendered HTML that search engines can read.
export const revalidate = 300;

async function getData(): Promise<PublicData | null> {
  if (store.mode !== 'supabase') return null; // demo mode: data lives in the visitor's browser
  try {
    return await loadPublicData(store);
  } catch {
    return null; // fall back to loading in the browser
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();
  const s = data?.site;
  if (!s) return {};
  const title = `${s.gym_name} · ${s.trainer_name}`;
  const description = s.tagline ?? s.bio ?? undefined;
  return { title: { absolute: title }, description, openGraph: { title, description, type: 'website' } };
}

export default async function Page() {
  const data = await getData();
  const s = data?.site;
  // Structured data so Google can show the gym as a local business (hours, phone, address).
  const jsonLd = s && {
    '@context': 'https://schema.org',
    '@type': 'HealthClub',
    name: s.gym_name,
    description: s.tagline ?? undefined,
    telephone: s.phone ?? undefined,
    email: s.email ?? undefined,
    address: s.address ?? undefined,
    openingHours: s.hours ?? undefined,
    sameAs: [s.instagram, s.youtube].filter(Boolean),
  };
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />}
      <Home initial={data} />
    </>
  );
}
