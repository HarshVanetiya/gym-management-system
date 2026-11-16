import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Medilife Fitness Club',
    short_name: 'MFC',
    description: 'Your membership, workout and diet plan at Medilife Fitness Club, Udaipur.',
    start_url: '/me',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f2e8',
    theme_color: '#2b0b12',
    categories: ['health', 'fitness', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'My plan', url: '/me', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Trainer dashboard', url: '/admin', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Gym website', url: '/', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
