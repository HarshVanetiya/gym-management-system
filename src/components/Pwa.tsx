'use client';

import { useEffect, useState } from 'react';
import { Icon } from './icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Registers the service worker (production only, so dev reloads stay simple). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* the site still works without it */
    });
  }, []);
  return null;
}

/**
 * "Install app" button. Android/desktop Chrome: shows the native install prompt.
 * iPhone/iPad (no prompt API): shows the Share → Add to Home Screen steps.
 * Hidden when already running as an installed app.
 */
export function InstallApp({ compact }: { compact?: boolean }) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    setInstalled(!!standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || (!evt && !ios)) return null;

  async function install() {
    if (evt) {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setEvt(null);
    } else {
      setShowIosHelp((v) => !v);
    }
  }

  return (
    <div className="install-card">
      <Icon.Download />
      <p>
        {showIosHelp ? (
          <>Tap <strong>Share</strong> in Safari, then <strong>Add to Home Screen</strong>.</>
        ) : compact ? 'Install the MFC app on your phone.' : 'Add the MFC app to your home screen. It opens like a normal app, even on a weak connection.'}
      </p>
      <button className="btn btn-sm" onClick={install}>{showIosHelp ? 'Got it' : 'Install'}</button>
    </div>
  );
}
