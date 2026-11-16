import { store } from './store';
import type { TableName, Tables } from './types';

/**
 * Backup file format (version 1)
 * {
 *   format: "mfc-backup", version: 1, exported_at, source, counts: { table: rows },
 *   tables: { site_settings: [...], plans: [...], ... }
 * }
 * Saved as gzip-compressed JSON (.json.gz) when the browser supports it, otherwise plain .json.
 * Logins (emails/passwords) live in Supabase Auth and are NOT in the file: members sign up again on the
 * new project with the same email and are re-linked to their records automatically.
 * Photos stay on Cloudinary, so their links keep working after a move.
 */
export const BACKUP_FORMAT = 'mfc-backup';
export const BACKUP_VERSION = 1;

/** Parents before children, so restores never break a link between tables. */
const INSERT_ORDER: TableName[] = ['plans', 'workout_plans', 'diet_plans', 'testimonials', 'members', 'subscriptions', 'payments', 'attendance', 'progress_logs', 'leads'];
const DELETE_ORDER: TableName[] = ['progress_logs', 'attendance', 'payments', 'subscriptions', 'members', 'leads', 'testimonials', 'plans', 'workout_plans', 'diet_plans'];
export const BACKUP_TABLES: TableName[] = ['site_settings', ...INSERT_ORDER];

export const TABLE_LABEL: Record<TableName, string> = {
  site_settings: 'Website settings', plans: 'Membership plans', workout_plans: 'Workout plans', diet_plans: 'Diet plans',
  testimonials: 'Testimonials', members: 'Members', subscriptions: 'Memberships (renewals)', payments: 'Payments',
  attendance: 'Attendance check-ins', progress_logs: 'Progress entries', leads: 'Website enquiries',
};

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exported_at: string;
  source: 'supabase' | 'demo';
  counts: Partial<Record<TableName, number>>;
  tables: Partial<{ [K in TableName]: Tables[K][] }>;
}

export type Progress = (label: string, done: number, total: number) => void;

async function gzip(text: string): Promise<Blob | null> {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Response(stream).blob();
}

/** Reads every table and returns a downloadable file. */
export async function createBackup(onProgress?: Progress): Promise<{ blob: Blob; filename: string; counts: BackupFile['counts'] }> {
  const tables: BackupFile['tables'] = {};
  const counts: BackupFile['counts'] = {};
  for (const [i, t] of BACKUP_TABLES.entries()) {
    onProgress?.(TABLE_LABEL[t], i, BACKUP_TABLES.length);
    const rows = await store.listAll(t);
    (tables as Record<string, unknown[]>)[t] = rows;
    counts[t] = rows.length;
  }
  onProgress?.('Packing file', BACKUP_TABLES.length, BACKUP_TABLES.length);
  const file: BackupFile = { format: BACKUP_FORMAT, version: BACKUP_VERSION, exported_at: new Date().toISOString(), source: store.mode, counts, tables };
  const json = JSON.stringify(file);
  const stamp = file.exported_at.slice(0, 16).replace(/[:T]/g, '-');
  const gz = await gzip(json);
  return gz
    ? { blob: gz, filename: `mfc-backup-${stamp}.json.gz`, counts }
    : { blob: new Blob([json], { type: 'application/json' }), filename: `mfc-backup-${stamp}.json`, counts };
}

/** Opens a .json or .json.gz backup and checks it before anything is changed. */
export async function readBackup(file: File): Promise<BackupFile> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  const isGzip = head[0] === 0x1f && head[1] === 0x8b;
  let text: string;
  if (isGzip) {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot open compressed backups. Try Chrome, Edge or a recent Safari.');
    text = await new Response(file.stream().pipeThrough(new DecompressionStream('gzip'))).text();
  } else {
    text = await file.text();
  }
  let data: BackupFile;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not a Medilife backup (it could not be read).');
  }
  if (data?.format !== BACKUP_FORMAT || typeof data.tables !== 'object') throw new Error('This file is not a Medilife backup.');
  if (data.version > BACKUP_VERSION) throw new Error('This backup was made by a newer version of the app. Update the app first.');
  for (const t of INSERT_ORDER) {
    const rows = data.tables[t];
    if (rows === undefined) continue;
    if (!Array.isArray(rows)) throw new Error(`The backup is damaged (${TABLE_LABEL[t]}).`);
    if (rows.some((r) => !r || typeof r !== 'object' || !(r as { id?: unknown }).id)) throw new Error(`The backup is damaged (${TABLE_LABEL[t]} has rows without an id).`);
  }
  return data;
}

/**
 * Replaces ALL current data with the backup.
 * Safe to run again if it stops halfway (e.g. lost connection): rows keep their ids, so a re-run ends in the same state.
 */
export async function restoreBackup(data: BackupFile, onProgress?: Progress): Promise<void> {
  const steps = DELETE_ORDER.length + INSERT_ORDER.length + 1;
  let step = 0;
  for (const t of DELETE_ORDER) {
    onProgress?.(`Clearing ${TABLE_LABEL[t].toLowerCase()}`, step++, steps);
    await store.removeAll(t);
  }
  const site = data.tables.site_settings?.[0];
  if (site) {
    onProgress?.('Website settings', step, steps);
    const { id: _id, ...rest } = site as Tables['site_settings'] & { updated_at?: string };
    void _id;
    delete (rest as { updated_at?: string }).updated_at;
    await store.update('site_settings', 1, rest);
  }
  step++;
  for (const t of INSERT_ORDER) {
    let rows = (data.tables[t] ?? []) as unknown as Record<string, unknown>[];
    // Logins belong to the old project. The database re-links each member when they sign up with the same email.
    if (t === 'members') rows = rows.map((r) => ({ ...r, user_id: null }));
    onProgress?.(`${TABLE_LABEL[t]} (0 / ${rows.length})`, step, steps);
    await store.insertMany(t, rows as never[], (done) => onProgress?.(`${TABLE_LABEL[t]} (${done} / ${rows.length})`, step, steps));
    step++;
  }
  onProgress?.('Done', steps, steps);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
