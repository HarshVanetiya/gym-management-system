import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import { RegisterServiceWorker } from '../components/Pwa';
// Fonts are bundled with the app (no Google Fonts request), so they also work offline.
import '@fontsource-variable/manrope';
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/tiro-devanagari-hindi/devanagari-400.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Medilife Fitness Club · Kashipuri Colony, Udaipur', template: '%s · Medilife Fitness Club' },
  description: 'Medilife Fitness Club (MFC) in Kashipuri Colony, Udaipur. Strength training, cardio, personal coaching and diet plans, with a member app for your workouts.',
  applicationName: 'Medilife Fitness Club',
  icons: { icon: '/favicon.svg', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'MFC', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f2e8' },
    { media: '(prefers-color-scheme: dark)', color: '#12100f' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <Providers>{children}</Providers>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
