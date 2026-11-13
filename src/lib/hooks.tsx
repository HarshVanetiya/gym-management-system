import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { store } from './store';
import type { AppSession, SiteSettings } from './types';

interface AuthState {
  session: AppSession | null;
  loading: boolean;
  refresh: () => Promise<void>;
}
const AuthCtx = createContext<AuthState>({ session: null, loading: true, refresh: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      setSession(await store.auth.getSession());
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    return store.auth.onChange(() => {
      refresh();
    });
  }, [refresh]);
  return <AuthCtx.Provider value={{ session, loading, refresh }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fn()
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { data, error, loading, reload: () => setN((x) => x + 1) };
}

let siteCache: Promise<SiteSettings | null> | null = null;
export function useSite() {
  if (!siteCache) siteCache = store.get('site_settings', 1);
  return useAsync(() => siteCache!, []);
}
export function invalidateSite() {
  siteCache = null;
}
