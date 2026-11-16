import type { SVGProps } from 'react';

/** Minimal 24px stroke icons (no icon library needed, works offline). */
const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...props,
});

export const Icon = {
  Home: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
  Tag: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>,
  Star: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>,
  Pin: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>,
  Bolt: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>,
  Grid: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>,
  Users: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.5 3.5 5.2" /></svg>,
  Wallet: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 7a2 2 0 0 1 2-2h13v4" /><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 13.5h2" /></svg>,
  Clipboard: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" /></svg>,
  Inbox: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 13h5l1.5 3h5l1.5-3h5" /><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" /></svg>,
  Globe: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></svg>,
  More: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></svg>,
  Logout: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" /></svg>,
  Dumbbell: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" /></svg>,
  Leaf: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19 13 11" /></svg>,
  Chart: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 19h16" /><path d="m5 15 4-5 4 3 6-7" /></svg>,
  Receipt: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></svg>,
  ArrowUpRight: (p: SVGProps<SVGSVGElement>) => <svg {...base({ strokeWidth: 2, ...p })}><path d="M7 17 17 7M8 7h9v9" /></svg>,
  ArrowRight: (p: SVGProps<SVGSVGElement>) => <svg {...base({ strokeWidth: 2, ...p })}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  Phone: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>,
  Chat: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" /></svg>,
  Camera: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></svg>,
  Download: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>,
  Clock: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  Trash: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>,
  Close: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  Check: (p: SVGProps<SVGSVGElement>) => <svg {...base({ strokeWidth: 2, ...p })}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>,
  Alert: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17.2v.1" /></svg>,
  Plus: (p: SVGProps<SVGSVGElement>) => <svg {...base({ strokeWidth: 2, ...p })}><path d="M12 5v14M5 12h14" /></svg>,
  Search: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  Edit: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>,
  Upload: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>,
  Database: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>,
  Calendar: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  Refresh: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4" /></svg>,
  ExternalLink: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>,
  Hand: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L4 15.2a1.5 1.5 0 0 1 2.3-1.9L7 14" /></svg>,
  Sun: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  Moon: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>,
  User: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6" /></svg>,
};

/** Medilife mark: a heartbeat line that turns into a barbell. */
export function PulseBarbell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 140" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path className="pulse" strokeWidth="3" d="M4 70h58l12-30 16 62 14-50 9 18h33" />
      <g strokeWidth="3">
        <path d="M150 70h120" />
        <rect x="160" y="38" width="14" height="64" rx="4" />
        <rect x="178" y="48" width="10" height="44" rx="3" />
        <rect x="246" y="38" width="14" height="64" rx="4" />
        <rect x="232" y="48" width="10" height="44" rx="3" />
        <path d="M270 70h44" />
      </g>
    </svg>
  );
}
