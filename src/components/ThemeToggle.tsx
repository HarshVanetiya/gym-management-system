'use client';

import { useEffect, useState } from 'react';
import { Icon } from './icons';

const KEY = 'mfc-theme';
type Theme = 'light' | 'dark';

/** Runs in <head> before the page paints, so a saved choice never flashes the wrong theme. */
export const themeInitScript = `try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

function currentTheme(): Theme {
  const set = document.documentElement.getAttribute('data-theme');
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Switches between light and dark and remembers the choice on this device. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(currentTheme()), []);

  function toggle() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode: the switch still works for this visit */
    }
    setTheme(next);
  }

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button type="button" className={`theme-toggle ${className}`} onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? <Icon.Sun /> : <Icon.Moon />}
    </button>
  );
}
