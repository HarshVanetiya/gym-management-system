import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppSession, TableName, Tables } from './types';
import { buildSeed } from './seed';

export interface ListOpts {
  eq?: Record<string, unknown>;
  gte?: [string, string];
  order?: [string, 'asc' | 'desc'];
}

export interface AuthAdapter {
  getSession(): Promise<AppSession | null>;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<{ needsEmailConfirm: boolean }>;
  signOut(): Promise<void>;
  onChange(cb: () => void): () => void;
}

export interface Store {
  mode: 'supabase' | 'demo';
  list<K extends TableName>(table: K, opts?: ListOpts): Promise<Tables[K][]>;
  get<K extends TableName>(table: K, id: string | number): Promise<Tables[K] | null>;
  insert<K extends TableName>(table: K, row: Partial<Tables[K]>): Promise<Tables[K]>;
  /** Insert without reading the row back (for anonymous website forms). */
  insertQuiet<K extends TableName>(table: K, row: Partial<Tables[K]>): Promise<void>;
  update<K extends TableName>(table: K, id: string | number, patch: Partial<Tables[K]>): Promise<Tables[K]>;
  remove(table: TableName, id: string | number): Promise<void>;
  auth: AuthAdapter;
  /** Demo only: wipe local data and reload sample data. */
  resetDemo?(): void;
}

// ---------------------------------------------------------------------------
// Supabase implementation
// ---------------------------------------------------------------------------
function supabaseStore(sb: SupabaseClient): Store {
  const fail = (e: { message: string } | null) => {
    if (e) throw new Error(e.message);
  };
  return {
    mode: 'supabase',
    async list(table, opts = {}) {
      let q = sb.from(table).select('*');
      for (const [k, v] of Object.entries(opts.eq ?? {})) q = q.eq(k, v as string);
      if (opts.gte) q = q.gte(opts.gte[0], opts.gte[1]);
      if (opts.order) q = q.order(opts.order[0], { ascending: opts.order[1] === 'asc' });
      const { data, error } = await q;
      fail(error);
      return (data ?? []) as never;
    },
    async get(table, id) {
      const { data, error } = await sb.from(table).select('*').eq('id', id).maybeSingle();
      fail(error);
      return data as never;
    },
    async insert(table, row) {
      const { data, error } = await sb.from(table).insert(row).select().single();
      fail(error);
      return data as never;
    },
    async insertQuiet(table, row) {
      const { error } = await sb.from(table).insert(row);
      fail(error);
    },
    async update(table, id, patch) {
      const { data, error } = await sb.from(table).update(patch).eq('id', id).select().single();
      fail(error);
      return data as never;
    },
    async remove(table, id) {
      const { error } = await sb.from(table).delete().eq('id', id);
      fail(error);
    },
    auth: {
      async getSession() {
        const { data } = await sb.auth.getSession();
        const user = data.session?.user;
        if (!user) return null;
        const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
        return { userId: user.id, email: user.email ?? '', role: profile?.role === 'admin' ? 'admin' : 'member' };
      },
      async signIn(email, password) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        fail(error);
      },
      async signUp(email, password) {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/login` },
        });
        fail(error);
        return { needsEmailConfirm: !data.session };
      },
      async signOut() {
        await sb.auth.signOut();
      },
      onChange(cb) {
        const { data } = sb.auth.onAuthStateChange(() => cb());
        return () => data.subscription.unsubscribe();
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Demo implementation — everything lives in localStorage of this browser.
// ---------------------------------------------------------------------------
const DEMO_KEY = 'gym-demo-db-v1';
const DEMO_SESSION_KEY = 'gym-demo-session';
export const DEMO_ADMIN_EMAIL = 'trainer@demo.in';

type DemoDb = { [K in TableName]: Tables[K][] };

function demoStore(): Store {
  let db: DemoDb;
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    db = raw ? JSON.parse(raw) : buildSeed();
  } catch {
    db = buildSeed();
  }
  const listeners = new Set<() => void>();
  const save = () => {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(db));
    } catch {
      /* storage may be unavailable (private mode); demo still works in memory */
    }
  };
  save();
  const rows = <K extends TableName>(t: K) => db[t] as unknown as Record<string, unknown>[];
  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
  const tick = () => new Promise((r) => setTimeout(r, 60));

  const readSession = (): AppSession | null => {
    try {
      const raw = localStorage.getItem(DEMO_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const writeSession = (s: AppSession | null) => {
    try {
      if (s) localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(DEMO_SESSION_KEY);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  };
  const loginAs = (email: string) => {
    const e = email.trim().toLowerCase();
    if (e === DEMO_ADMIN_EMAIL) return writeSession({ userId: 'demo-admin', email: e, role: 'admin' });
    const m = db.members.find((x) => x.email?.toLowerCase() === e);
    const userId = m?.user_id ?? `demo-user-${e}`;
    if (m && !m.user_id) {
      m.user_id = userId;
      save();
    }
    writeSession({ userId, email: e, role: 'member' });
  };

  return {
    mode: 'demo',
    async list(table, opts = {}) {
      await tick();
      let out = rows(table).filter((r) => Object.entries(opts.eq ?? {}).every(([k, v]) => r[k] === v));
      if (opts.gte) {
        const [col, val] = opts.gte;
        out = out.filter((r) => String(r[col]) >= val);
      }
      if (opts.order) {
        const [col, dir] = opts.order;
        out = [...out].sort((a, b) => {
          const x = a[col] as string | number;
          const y = b[col] as string | number;
          return (x > y ? 1 : x < y ? -1 : 0) * (dir === 'asc' ? 1 : -1);
        });
      }
      return clone(out) as never;
    },
    async get(table, id) {
      await tick();
      const r = rows(table).find((x) => x.id === id);
      return (r ? clone(r) : null) as never;
    },
    async insert(table, row) {
      await tick();
      const full = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row } as Record<string, unknown>;
      if (table === 'members' && full.email) {
        const sess = readSession();
        if (sess && sess.email === String(full.email).toLowerCase()) full.user_id = sess.userId;
      }
      rows(table).push(full);
      save();
      return clone(full) as never;
    },
    async insertQuiet(table, row) {
      await this.insert(table, row);
    },
    async update(table, id, patch) {
      await tick();
      const r = rows(table).find((x) => x.id === id);
      if (!r) throw new Error('Not found');
      Object.assign(r, patch);
      save();
      return clone(r) as never;
    },
    async remove(table, id) {
      await tick();
      const list = rows(table);
      const i = list.findIndex((x) => x.id === id);
      if (i >= 0) list.splice(i, 1);
      if (table === 'members') {
        (['subscriptions', 'payments', 'attendance', 'progress_logs'] as const).forEach((t) => {
          db[t] = (db[t] as { member_id: string }[]).filter((x) => x.member_id !== id) as never;
        });
      }
      save();
    },
    auth: {
      async getSession() {
        return readSession();
      },
      async signIn(email) {
        await tick();
        if (!email.includes('@')) throw new Error('Enter a valid email');
        loginAs(email);
      },
      async signUp(email) {
        await tick();
        loginAs(email);
        return { needsEmailConfirm: false };
      },
      async signOut() {
        writeSession(null);
      },
      onChange(cb) {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
    },
    resetDemo() {
      try {
        localStorage.removeItem(DEMO_KEY);
        localStorage.removeItem(DEMO_SESSION_KEY);
      } catch {
        /* ignore */
      }
      window.location.href = '/';
    },
  };
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const store: Store = url && key ? supabaseStore(createClient(url, key)) : demoStore();
