import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import { RegisterServiceWorker } from '../components/Pwa';
import { themeInitScript } from '../components/ThemeToggle';
// Fonts are bundled with the app (no Google Fonts request), so they also work offline.
// Archivo with its width axis: condensed headlines and expanded labels from one family (website).
import '@fontsource-variable/archivo/wdth.css';
// Inter for the trainer dashboard and member app.
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
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
    { media: '(prefers-color-scheme: light)', color: '#071a44' },
    { media: '(prefers-color-scheme: dark)', color: '#040c22' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
