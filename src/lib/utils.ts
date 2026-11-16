import type { Member, Payment, Subscription } from './types';

/** Local date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + days));
}

export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export function fmtDate(date: string | null | undefined): string {
  if (!date) return '—';
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "18 Nov" — for tight spaces on phones. */
export function fmtShort(date: string | null | undefined): string {
  if (!date) return '—';
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function money(n: number | null | undefined): string {
  return '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export type MemberStatus = 'active' | 'expiring' | 'expired' | 'none';
export const EXPIRING_WINDOW_DAYS = 7;

export interface MemberSummary {
  member: Member;
  latest: Subscription | null;
  status: MemberStatus;
  daysLeft: number | null;
  totalBilled: number;
  totalPaid: number;
  due: number;
}

export function summarize(member: Member, subs: Subscription[], payments: Payment[], today = isoDate()): MemberSummary {
  const mine = subs.filter((s) => s.member_id === member.id).sort((a, b) => (a.end_date < b.end_date ? 1 : -1));
  const latest = mine[0] ?? null;
  const totalBilled = mine.reduce((t, s) => t + Number(s.price), 0);
  const totalPaid = payments.filter((p) => p.member_id === member.id).reduce((t, p) => t + Number(p.amount), 0);
  let status: MemberStatus = 'none';
  let daysLeft: number | null = null;
  if (latest) {
    daysLeft = daysBetween(today, latest.end_date);
    status = daysLeft < 0 ? 'expired' : daysLeft <= EXPIRING_WINDOW_DAYS ? 'expiring' : 'active';
  }
  return { member, latest, status, daysLeft, totalBilled, totalPaid, due: Math.max(0, totalBilled - totalPaid) };
}

export const STATUS_LABEL: Record<MemberStatus, string> = {
  active: 'Active',
  expiring: 'Expiring',
  expired: 'Expired',
  none: 'No plan',
};

/** wa.me link — opens WhatsApp with a pre-filled message. Free, no API needed. */
export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = '91' + digits; // assume India if no country code
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function reminderText(s: MemberSummary, gymName: string, upiId?: string | null): string {
  const name = s.member.full_name.split(' ')[0];
  const dueLine = s.due > 0 ? ` Pending amount: ${money(s.due)}.` : '';
  const upiLine = upiId ? ` You can pay via UPI to ${upiId}.` : '';
  if (!s.latest) return `Hi ${name}, this is ${gymName}. Let us know when you'd like to start your membership!`;
  if (s.status === 'expired')
    return `Hi ${name}, your ${s.latest.plan_name} membership at ${gymName} expired on ${fmtDate(s.latest.end_date)}. Renew today to keep your progress going 💪.${dueLine}${upiLine}`;
  return `Hi ${name}, a reminder from ${gymName}: your ${s.latest.plan_name} membership ends on ${fmtDate(s.latest.end_date)} (${s.daysLeft} day${s.daysLeft === 1 ? '' : 's'} left).${dueLine}${upiLine}`;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export function downloadFile(name: string, content: string, type = 'text/csv') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export function todayWeekDay(): string {
  return WEEK_DAYS[(new Date().getDay() + 6) % 7];
}
