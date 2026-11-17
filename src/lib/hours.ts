/**
 * Reads opening hours typed by the trainer, e.g.
 *   "Mon–Sat 5:30 AM – 10 PM · Sun 7 AM – 12 PM"
 *   "Mon-Sat 5:30 AM - 11 AM & 4 PM - 10 PM; Sun closed"
 * Groups are separated by "·", ";", "|" or new lines. Anything it can't read returns null,
 * and the website then just shows the text as typed.
 */
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface HoursGroup {
  label: string; // "Mon–Sat"
  days: number[]; // 0 = Sunday
  ranges: { open: number; close: number; text: string }[]; // minutes from midnight; empty = closed
}

const TIME = String.raw`(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?`;
const RANGE = new RegExp(`${TIME}\\s*(?:[–—-]|to)\\s*${TIME}`, 'gi');

function toMinutes(h: string, m: string | undefined, ap: string | undefined, fallbackAp?: string): number | null {
  let hour = Number(h);
  const min = m ? Number(m) : 0;
  const mer = (ap ?? fallbackAp)?.toLowerCase();
  if (hour > 24 || min > 59) return null;
  if (mer === 'pm' && hour < 12) hour += 12;
  if (mer === 'am' && hour === 12) hour = 0;
  return hour * 60 + min;
}

export function fmtMinutes(total: number): string {
  const t = total % (24 * 60);
  const h = Math.floor(t / 60);
  const m = t % 60;
  const ap = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''} ${ap}`;
}

function dayIndex(word: string): number {
  return DAY_KEYS.indexOf(word.slice(0, 3).toLowerCase());
}

/** Time ranges in one group, [] when it says "closed", null when unreadable. */
function rangesIn(rest: string): HoursGroup['ranges'] | null {
  if (/closed/i.test(rest)) return [];
  const ranges: HoursGroup['ranges'] = [];
  for (const m of rest.matchAll(RANGE)) {
    // "5:30 - 11 AM": the first time borrows the second time's AM/PM
    const close = toMinutes(m[4], m[5], m[6]);
    let open = toMinutes(m[1], m[2], m[3], m[6]);
    if (open === null || close === null) return null;
    if (!m[3] && open > close) open -= 12 * 60;
    const closeAdj = close <= open ? close + 24 * 60 : close; // e.g. "6 PM – 12 AM"
    ranges.push({ open, close: closeAdj, text: `${fmtMinutes(open)} – ${fmtMinutes(closeAdj)}` });
  }
  return ranges.length ? ranges : null;
}

export function parseHours(text: string | null | undefined): HoursGroup[] | null {
  if (!text?.trim()) return null;
  const groups: HoursGroup[] = [];
  for (const raw of text.split(/[·;|\n]/)) {
    const seg = raw.trim();
    if (!seg) continue;
    const every = seg.match(/^(daily|every\s*day|all\s*days)\b/i);
    if (every) {
      const ranges = rangesIn(seg.slice(every[0].length));
      if (!ranges) return null;
      groups.push({ label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6], ranges });
      continue;
    }
    const dm = seg.match(/^([A-Za-z]{3,9})(?:\s*(?:[–—-]|to)\s*([A-Za-z]{3,9}))?\b/);
    if (!dm) return null;
    const a = dayIndex(dm[1]);
    const b = dm[2] ? dayIndex(dm[2]) : a;
    if (a < 0 || b < 0) return null;
    const days: number[] = [];
    for (let d = a; ; d = (d + 1) % 7) {
      days.push(d);
      if (d === b || days.length > 7) break;
    }
    const ranges = rangesIn(seg.slice(dm[0].length));
    if (!ranges) return null;
    const label = dm[2] ? `${DAY_SHORT[a]}–${DAY_SHORT[b]}` : DAY_SHORT[a];
    groups.push({ label, days, ranges });
  }
  return groups.length ? groups : null;
}

/** Day of week and minutes since midnight in India, whatever the visitor's phone is set to. */
export function nowInIndia(date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: DAY_SHORT.indexOf(get('weekday')), minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export interface OpenStatus {
  open: boolean;
  text: string; // "Open now · until 10 PM" / "Closed · opens 5:30 AM" / "Closed · opens Mon 5:30 AM"
}

export function openStatus(groups: HoursGroup[] | null, date = new Date()): OpenStatus | null {
  if (!groups) return null;
  const { day, minutes } = nowInIndia(date);
  const rangesFor = (d: number) => groups.filter((g) => g.days.includes(d)).flatMap((g) => g.ranges);
  // still open from a late-night range that started yesterday
  for (const r of rangesFor((day + 6) % 7)) {
    if (r.close > 24 * 60 && minutes < r.close - 24 * 60) return { open: true, text: `Open now · until ${fmtMinutes(r.close)}` };
  }
  const today = rangesFor(day).sort((x, y) => x.open - y.open);
  for (const r of today) {
    if (minutes >= r.open && minutes < r.close) return { open: true, text: `Open now · until ${fmtMinutes(r.close)}` };
  }
  const later = today.find((r) => r.open > minutes);
  if (later) return { open: false, text: `Closed · opens ${fmtMinutes(later.open)}` };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const first = rangesFor(d).sort((x, y) => x.open - y.open)[0];
    if (first) return { open: false, text: `Closed · opens ${i === 1 ? 'tomorrow' : DAY_SHORT[d]} ${fmtMinutes(first.open)}` };
  }
  return null;
}

/** Today's hours as text, e.g. "5:30 AM – 10 PM", or null when closed or unknown. */
export function todayText(groups: HoursGroup[] | null, date = new Date()): string | null {
  if (!groups) return null;
  const { day } = nowInIndia(date);
  const ranges = groups.filter((g) => g.days.includes(day)).flatMap((g) => g.ranges);
  return ranges.length ? ranges.map((r) => r.text).join(', ') : null;
}
