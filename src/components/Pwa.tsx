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

type Platform = 'ios' | 'ios-inapp' | 'android-inapp' | 'samsung' | 'firefox-android' | 'android' | 'mac-safari' | 'desktop-firefox' | 'desktop';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const inApp = /instagram|fban|fbav|fb_iab|line\/|wv\)|snapchat/i.test(ua);
  if (ios) return inApp ? 'ios-inapp' : 'ios';
  if (/android/i.test(ua)) {
    if (inApp) return 'android-inapp';
    if (/samsungbrowser/i.test(ua)) return 'samsung';
    if (/firefox/i.test(ua)) return 'firefox-android';
    return 'android';
  }
  if (/firefox/i.test(ua)) return 'desktop-firefox';
  if (/macintosh/i.test(ua) && /safari/i.test(ua) && !/chrome|chromium|edg/i.test(ua)) return 'mac-safari';
  return 'desktop';
}

/** Step-by-step help for browsers that don't show the automatic install pop-up. */
function InstallSteps({ platform }: { platform: Platform }) {
  const here = typeof window !== 'undefined' ? window.location : null;
  switch (platform) {
    case 'ios':
      return <ol><li>Tap the <strong>Share</strong> button (square with an arrow) at the bottom of Safari.</li><li>Scroll down and tap <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>. The MFC icon appears on your home screen.</li></ol>;
    case 'ios-inapp':
      return <ol><li>This page is open inside another app (like Instagram). Tap <strong>•••</strong> and choose <strong>Open in browser</strong>.</li><li>In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</li></ol>;
    case 'android-inapp':
      return (
        <>
          <ol><li>This page is open inside another app (like Instagram), which can’t install apps.</li><li>Open it in Chrome, then tap <strong>Install</strong> again.</li></ol>
          {here && <a className="btn btn-sm" href={`intent://${here.host}${here.pathname}#Intent;scheme=https;package=com.android.chrome;end`}>Open in Chrome</a>}
        </>
      );
    case 'samsung':
      return <ol><li>Tap the <strong>menu</strong> (☰) at the bottom right.</li><li>Tap <strong>Add page to</strong>, then <strong>Home screen</strong>.</li></ol>;
    case 'firefox-android':
      return <ol><li>Tap the <strong>⋮</strong> menu.</li><li>Tap <strong>Install</strong> or <strong>Add to Home screen</strong>.</li></ol>;
    case 'android':
      return <ol><li>Tap the <strong>⋮</strong> menu at the top right of Chrome.</li><li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>, then <strong>Install</strong>.</li></ol>;
    case 'mac-safari':
      return <ol><li>In the menu bar, click <strong>File</strong> → <strong>Add to Dock</strong>.</li></ol>;
    case 'desktop-firefox':
      return <ol><li>Firefox on computers can’t install apps. Open this page in <strong>Chrome</strong> or <strong>Edge</strong> and click Install.</li></ol>;
    default:
      return <ol><li>Click the <strong>install icon</strong> at the right end of the address bar,</li><li>or open the browser menu (⋮) → <strong>Install Medilife Fitness Club</strong> / <strong>Apps → Install this site as an app</strong>.</li></ol>;
  }
}

/**
 * "Install app" button, always shown (unless the app is already installed).
 * Where the browser offers it, the button opens the native install pop-up.
 * Everywhere else (iPhone, Samsung Internet, Firefox, Instagram's in-app browser, or after the pop-up was
 * dismissed once) it shows the steps for that browser. No Play Store or App Store needed.
 */
export function InstallApp({ compact }: { compact?: boolean }) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    setInstalled(!!standalone);
    setPlatform(detectPlatform());
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

  if (installed || !platform) return null;

  async function install() {
    if (evt) {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setEvt(null);
    } else {
      setShowHelp((v) => !v);
    }
  }

  return (
    <div className="install-card" id="install-app">
      <div className="install-row">
        <Icon.Download />
        <p>{compact ? 'Install the MFC app on this device.' : 'Install the MFC app on your phone or computer. No Play Store needed, and it opens like a normal app, even on a weak connection.'}</p>
        <button type="button" className="btn btn-sm" onClick={install} aria-expanded={evt ? undefined : showHelp}>
          {showHelp ? 'Close' : 'Install app'}
        </button>
      </div>
      {showHelp && <div className="install-steps"><InstallSteps platform={platform} /></div>}
    </div>
  );
}
