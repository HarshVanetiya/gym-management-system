'use client';

import { useRef, useState } from 'react';
import { store } from '../../lib/store';
import { useAsync, invalidateSite } from '../../lib/hooks';
import { BACKUP_TABLES, TABLE_LABEL, createBackup, formatBytes, readBackup, restoreBackup, type BackupFile } from '../../lib/backup';
import { useGymData } from '../../lib/gym';
import { fmtDate } from '../../lib/utils';
import { ErrorBox, Loading } from '../../components/ui';
import { Icon } from '../../components/icons';

/** Measured: ~10.6 MB of data per year for a gym with ~300 active members (see docs/SOLUTIONS.md). */
const BYTES_PER_ACTIVE_MEMBER_PER_YEAR = (10.6 * 1024 * 1024) / 300;

function saveBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function DataPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Backup & data</h1>
          <p className="muted">Download everything, move to a new database, and keep storage tidy.</p>
        </div>
      </div>
      <div className="grid-2">
        <BackupCard />
        <RestoreCard />
        <UsageCard />
        <CleanupCard />
      </div>
    </div>
  );
}

function ProgressBar({ label, done, total }: { label: string; done: number; total: number }) {
  return (
    <div className="progress" role="status">
      <div className="progress-track"><span style={{ width: `${Math.round((done / Math.max(total, 1)) * 100)}%` }} /></div>
      <span className="muted small">{label}</span>
    </div>
  );
}

function BackupCard() {
  const [state, setState] = useState<{ label: string; done: number; total: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function run() {
    setErr(null);
    setResult(null);
    try {
      const { blob, filename, counts } = await createBackup((label, done, total) => setState({ label, done, total }));
      saveBlob(blob, filename);
      const rows = Object.values(counts).reduce((t, n) => t + (n ?? 0), 0);
      setResult(`Saved ${filename} · ${rows.toLocaleString('en-IN')} records · ${formatBytes(blob.size)}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setState(null);
    }
  }
  return (
    <section className="card">
      <div className="card-head"><h3><Icon.Download /> Download backup</h3></div>
      <p className="muted">One file with all members, memberships, payments, attendance, progress, plans, programs, enquiries and website settings.</p>
      <ul className="checklist">
        <li><Icon.Check /> Keep it somewhere safe, like Google Drive</li>
        <li><Icon.Check /> Use it to move to a new Supabase account</li>
        <li><Icon.Check /> Photos stay on Cloudinary; their links are in the file</li>
      </ul>
      {state && <ProgressBar {...state} />}
      {result && <div className="info-box"><Icon.Check width={18} height={18} /> <span>{result}</span></div>}
      <ErrorBox error={err} />
      <button className="btn" onClick={run} disabled={!!state}><Icon.Download width={17} height={17} /> {state ? 'Preparing…' : 'Download backup'}</button>
    </section>
  );
}

function RestoreCard() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<BackupFile | null>(null);
  const [fileName, setFileName] = useState('');
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<{ label: string; done: number; total: number } | null>(null);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(f: File | undefined) {
    setErr(null);
    setDone(false);
    setFile(null);
    setAgree(false);
    if (!f) return;
    try {
      setFile(await readBackup(f));
      setFileName(f.name);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      if (input.current) input.current.value = '';
    }
  }
  async function run() {
    if (!file) return;
    setErr(null);
    try {
      await restoreBackup(file, (label, d, total) => setState({ label, done: d, total }));
      invalidateSite();
      setDone(true);
      setFile(null);
    } catch (e) {
      setErr(`${(e as Error).message}. Nothing is lost: run the restore again with the same file to finish it.`);
    } finally {
      setState(null);
    }
  }

  return (
    <section className="card">
      <div className="card-head"><h3><Icon.Upload /> Restore from backup</h3></div>
      <p className="muted">After connecting a new Supabase account, upload a backup file to bring all the data across.</p>
      <input ref={input} type="file" accept=".gz,.json,application/json,application/gzip" hidden onChange={(e) => pick(e.target.files?.[0])} />

      {!file && !state && (
        <button className="btn btn-ghost" onClick={() => input.current?.click()}><Icon.Upload width={17} height={17} /> Choose backup file</button>
      )}

      {file && !state && (
        <div className="restore-summary">
          <div className="kv">
            <div><span>File</span><strong className="truncate">{fileName}</strong></div>
            <div><span>Made on</span><strong>{fmtDate(file.exported_at)} {new Date(file.exported_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></div>
            {BACKUP_TABLES.filter((t) => t !== 'site_settings').map((t) => (
              <div key={t}><span>{TABLE_LABEL[t]}</span><strong className="num">{(file.tables[t]?.length ?? 0).toLocaleString('en-IN')}</strong></div>
            ))}
          </div>
          <div className="warn-box">
            <Icon.Alert width={18} height={18} />
            <span><strong>This replaces all current data</strong> in this database with the backup. Download a backup of the current data first if you might need it.</span>
          </div>
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I understand the current data will be replaced
          </label>
          <div className="row-actions wrap">
            <button className="btn btn-danger" disabled={!agree} onClick={run}><Icon.Refresh width={17} height={17} /> Restore now</button>
            <button className="btn btn-ghost" onClick={() => setFile(null)}>Cancel</button>
          </div>
        </div>
      )}

      {state && <ProgressBar {...state} />}
      {done && (
        <div className="info-box">
          <Icon.Check width={18} height={18} />
          <span>Restore complete. Members get their app access back when they sign up again with the same email. Reload the page to see everything.</span>
        </div>
      )}
      <ErrorBox error={err} />
    </section>
  );
}

function UsageCard() {
  const usage = useAsync(() => store.usage());
  const gym = useGymData();
  if (usage.loading && !usage.data) return <section className="card"><Loading /></section>;
  if (usage.error) return <section className="card"><ErrorBox error={usage.error} /></section>;
  const u = usage.data!;
  const active = gym.data?.summaries.filter((s) => s.status === 'active' || s.status === 'expiring').length ?? 0;
  const perYear = Math.max(active, 50) * BYTES_PER_ACTIVE_MEMBER_PER_YEAR;
  const pct = u.limitBytes ? Math.min(100, (u.totalBytes / u.limitBytes) * 100) : null;
  const yearsLeft = u.limitBytes ? Math.max(0, (u.limitBytes * 0.9 - u.totalBytes) / perYear) : null;
  const rows = u.tables.filter((t) => t.name !== 'profiles');

  return (
    <section className="card">
      <div className="card-head"><h3><Icon.Database /> Storage</h3><button className="icon-btn" onClick={usage.reload} aria-label="Refresh"><Icon.Refresh /></button></div>
      {pct !== null ? (
        <>
          <div className="usage-figure"><strong>{formatBytes(u.totalBytes)}</strong><span className="muted"> of {formatBytes(u.limitBytes!)} free plan</span></div>
          <div className="progress-track big"><span style={{ width: `${Math.max(pct, 1)}%` }} /></div>
          <p className="muted small">
            With {active} active members the gym adds about <strong>{formatBytes(perYear)}</strong> a year, so there’s room for roughly <strong>{yearsLeft! > 50 ? '50+' : Math.floor(yearsLeft!)} years</strong> before needing a paid plan or a clean-up.
          </p>
        </>
      ) : (
        <p className="muted small">Demo mode: sizes below are the sample data stored in this browser.</p>
      )}
      <table className="table compact-table">
        <thead><tr><th>Records</th><th className="num">Rows</th><th className="num">Size</th></tr></thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.name}>
              <td data-label="Records">{TABLE_LABEL[t.name as keyof typeof TABLE_LABEL] ?? t.name}</td>
              <td data-label="Rows" className="num">{Number(t.rows).toLocaleString('en-IN')}</td>
              <td data-label="Size" className="num">{formatBytes(Number(t.bytes))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CleanupCard() {
  const [months, setMonths] = useState(24);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const r = await store.purgeOld(months);
      setMsg(`Removed ${r.attendance.toLocaleString('en-IN')} old check-ins and ${r.leads.toLocaleString('en-IN')} closed enquiries.`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }
  return (
    <section className="card">
      <div className="card-head"><h3><Icon.Trash /> Clean up old records</h3></div>
      <p className="muted">
        Daily check-ins are most of the data. Removing very old ones frees space. Members, payments, memberships and progress are always kept.
      </p>
      <label className="field">
        <span className="field-label">Remove check-ins and closed enquiries older than</span>
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          <option value={12}>1 year</option>
          <option value={24}>2 years</option>
          <option value={36}>3 years</option>
          <option value={60}>5 years</option>
        </select>
      </label>
      {msg && <div className="info-box"><Icon.Check width={18} height={18} /> <span>{msg}</span></div>}
      <ErrorBox error={err} />
      {!confirming ? (
        <button className="btn btn-ghost" onClick={() => { setMsg(null); setConfirming(true); }}>Clean up…</button>
      ) : (
        <div className="row-actions wrap">
          <button className="btn btn-danger" onClick={run} disabled={busy}>{busy ? 'Cleaning…' : `Yes, remove records older than ${months / 12} year${months > 12 ? 's' : ''}`}</button>
          <button className="btn btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
        </div>
      )}
      <p className="muted small">Tip: download a backup first. It keeps a full copy you can restore later.</p>
    </section>
  );
}
