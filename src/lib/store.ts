import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppSession, Member, TableName, Tables } from './types';
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
  /** Token of the logged-in user, sent to our server routes (e.g. to sign Cloudinary uploads). */
  getAccessToken(): Promise<string | null>;
}

export interface UsageReport {
  tables: { name: string; rows: number; bytes: number }[];
  totalBytes: number;
  /** Database size allowed on the current plan (Supabase Free = 500 MB); null in demo mode. */
  limitBytes: number | null;
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
  /** Every row of a table, paging past Supabase's 1,000-row response cap (for backups). */
  listAll<K extends TableName>(table: K): Promise<Tables[K][]>;
  /** Insert many rows in batches, keeping their ids (for restores). */
  insertMany<K extends TableName>(table: K, rows: Partial<Tables[K]>[], onBatch?: (done: number) => void): Promise<void>;
  /** Delete every row of a table (for restores). */
  removeAll(table: TableName): Promise<void>;
  /** A member updates their own phone number and photo. */
  updateMyProfile(patch: { phone: string | null; photo_url: string | null }): Promise<Member>;
  usage(): Promise<UsageReport>;
  /** Delete attendance and closed enquiries older than N months. */
  purgeOld(months: number): Promise<{ attendance: number; leads: number }>;
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
    async listAll(table) {
      const page = 1000;
      const out: unknown[] = [];
      for (let from = 0; ; from += page) {
        const { data, error } = await sb.from(table).select('*').order('id').range(from, from + page - 1);
        fail(error);
        out.push(...(data ?? []));
        if (!data || data.length < page) break;
      }
      return out as never;
    },
    async insertMany(table, rows, onBatch) {
      const batch = 500;
      for (let i = 0; i < rows.length; i += batch) {
        const { error } = await sb.from(table).upsert(rows.slice(i, i + batch) as never[]);
        fail(error);
        onBatch?.(Math.min(i + batch, rows.length));
      }
    },
    async removeAll(table) {
      const { error } = await sb.from(table).delete().not('id', 'is', null);
      fail(error);
    },
    async updateMyProfile(patch) {
      const { data, error } = await sb.rpc('update_my_profile', { p_phone: patch.phone, p_photo_url: patch.photo_url });
      fail(error);
      return data as Member;
    },
    async usage() {
      const { data, error } = await sb.rpc('db_usage');
      fail(error);
      const d = data as { database_bytes: number; tables: { name: string; rows: number; bytes: number }[] | null };
      return { tables: d.tables ?? [], totalBytes: Number(d.database_bytes), limitBytes: 500 * 1024 * 1024 };
    },
    async purgeOld(months) {
      const { data, error } = await sb.rpc('purge_old_records', { p_months: months });
      fail(error);
      const r = (Array.isArray(data) ? data[0] : data) as { attendance_deleted: number; leads_deleted: number };
      return { attendance: Number(r.attendance_deleted), leads: Number(r.leads_deleted) };
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
      async getAccessToken() {
        const { data } = await sb.auth.getSession();
        return data.session?.access_token ?? null;
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Demo implementation — everything lives in localStorage of this browser.
// ---------------------------------------------------------------------------
const DEMO_KEY = 'mfc-demo-db-v2';
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
    async listAll(table) {
      return this.list(table);
    },
    async insertMany(table, newRows, onBatch) {
      await tick();
      rows(table).push(...(clone(newRows) as Record<string, unknown>[]));
      save();
      onBatch?.(newRows.length);
    },
    async removeAll(table) {
      await tick();
      db[table] = [] as never;
      save();
    },
    async updateMyProfile(patch) {
      await tick();
      const sess = readSession();
      const m = db.members.find((x) => x.user_id && x.user_id === sess?.userId);
      if (!m) throw new Error('No member profile is linked to this login.');
      if (patch.phone && !/^[0-9+\s-]{10,15}$/.test(patch.phone)) throw new Error('Enter a valid mobile number.');
      m.phone = patch.phone;
      m.photo_url = patch.photo_url;
      save();
      return clone(m);
    },
    async usage() {
      await tick();
      const tables = (Object.keys(db) as TableName[]).map((name) => ({ name, rows: db[name].length, bytes: new Blob([JSON.stringify(db[name])]).size }));
      return { tables: tables.sort((a, b) => b.bytes - a.bytes), totalBytes: tables.reduce((t, x) => t + x.bytes, 0), limitBytes: null };
    },
    async purgeOld(months) {
      await tick();
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      const cutoff = d.toISOString().slice(0, 10);
      const a = db.attendance.length;
      db.attendance = db.attendance.filter((x) => x.check_in >= cutoff);
      const l = db.leads.length;
      db.leads = db.leads.filter((x) => x.status === 'new' || x.status === 'contacted' || x.created_at.slice(0, 10) >= cutoff);
      save();
      return { attendance: a - db.attendance.length, leads: l - db.leads.length };
    },
    auth: {
      async getSession() {
        return readSession();
      },
      async getAccessToken() {
        return null;
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
