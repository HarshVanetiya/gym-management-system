import { useId } from 'react';
import { cld } from '../lib/cld';

/**
 * The Medilife mark: a blue 20 kg bumper plate (blue is the colour of a 20 kg plate in competition
 * weightlifting) with the club name embossed around the rim, the way brands are moulded into real plates.
 */
export function Plate({ className, rim = 'Medilife Fitness Club', place = 'Udaipur · Rajasthan' }: { className?: string; rim?: string; place?: string }) {
  const uid = useId().replace(/:/g, '');
  const ids = { face: `pf${uid}`, hub: `ph${uid}`, top: `pt${uid}`, bottom: `pb${uid}`, hole: `pm${uid}`, emboss: `pe${uid}` };
  // The rim band runs between the face edge (r=193) and the inner ring (r=150), centred on r=171.
  // The club name runs over the top and the place runs under the bottom, both left to right, so both read upright.
  const R = 171;
  const cap = 13; // cap height of the 18px rim lettering
  const rt = R - cap / 2;
  const rb = R + cap / 2;
  const arc = (text: string, r: number) => {
    const natural = text.length * 12; // rough width of the lettering before spacing
    const target = Math.min(Math.PI * r * 0.8, text.length * 17.5);
    return { textLength: Math.round(target), lengthAdjust: natural > target ? 'spacingAndGlyphs' : 'spacing' };
  };
  const top = rim.toUpperCase();
  const bottom = place.toUpperCase();
  const bolts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return { x: 200 + Math.cos(a) * 58, y: 200 + Math.sin(a) * 58 };
  });
  return (
    <svg className={className} viewBox="0 0 400 400" role="img" aria-label={`${rim} plate`}>
      <defs>
        <radialGradient id={ids.face} cx="34%" cy="28%" r="85%">
          <stop offset="0" stopColor="#4b7bff" />
          <stop offset="0.5" stopColor="#1f52dc" />
          <stop offset="1" stopColor="#1236a6" />
        </radialGradient>
        <linearGradient id={ids.hub} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5f7fb" />
          <stop offset="0.45" stopColor="#c3cbd8" />
          <stop offset="1" stopColor="#7a879c" />
        </linearGradient>
        <path id={ids.top} d={`M${200 - rt},200 A${rt},${rt} 0 0 1 ${200 + rt},200`} />
        <path id={ids.bottom} d={`M${200 - rb},200 A${rb},${rb} 0 0 0 ${200 + rb},200`} />
        <mask id={ids.hole}>
          <rect width="400" height="400" fill="#fff" />
          <circle cx="200" cy="200" r="25" fill="#000" />
        </mask>
        <filter id={ids.emboss} x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="0.6" floodColor="#04123d" floodOpacity="0.55" />
        </filter>
      </defs>
      <g mask={`url(#${ids.hole})`}>
        <circle cx="200" cy="200" r="199" fill="#0c2a86" />
        <circle cx="200" cy="200" r="193" fill={`url(#${ids.face})`} />
        <circle cx="200" cy="200" r="150" fill="none" stroke="#0b2777" strokeOpacity="0.55" strokeWidth="4" />
        <circle cx="200" cy="200" r="147" fill="none" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1.5" />
        <g fontFamily="'Archivo Variable', Archivo, Arial, sans-serif" fontSize="18" fontWeight="700" fill="#e9efff" fillOpacity="0.92" textAnchor="middle" filter={`url(#${ids.emboss})`} style={{ fontStretch: '112%' }}>
          <text><textPath href={`#${ids.top}`} startOffset="50%" {...arc(top, rt)}>{top}</textPath></text>
          <text><textPath href={`#${ids.bottom}`} startOffset="50%" {...arc(bottom, rb)}>{bottom}</textPath></text>
          <circle cx={200 - R} cy="200" r="3.2" />
          <circle cx={200 + R} cy="200" r="3.2" />
        </g>
        <g fontFamily="'Archivo Variable', Archivo, Arial, sans-serif" fill="#ffffff" textAnchor="middle" filter={`url(#${ids.emboss})`}>
          <text x="200" y="128" fontSize="44" fontWeight="800" style={{ fontStretch: '70%' }} letterSpacing="1">20 KG</text>
          <text x="200" y="306" fontSize="30" fontWeight="800" style={{ fontStretch: '70%' }} letterSpacing="6" fillOpacity="0.92">MFC</text>
        </g>
        <circle cx="200" cy="200" r="74" fill={`url(#${ids.hub})`} />
        <circle cx="200" cy="200" r="74" fill="none" stroke="#0a1f5e" strokeOpacity="0.35" strokeWidth="2" />
        <circle cx="200" cy="200" r="44" fill="none" stroke="#5b6880" strokeOpacity="0.55" strokeWidth="2" />
        {bolts.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="4.2" fill="#8a96aa" stroke="#eef2f8" strokeWidth="1" />
        ))}
        <circle cx="200" cy="200" r="27" fill="none" stroke="#4d596e" strokeWidth="3" />
      </g>
    </svg>
  );
}

/**
 * Club wordmark: condensed "MEDILIFE" over an expanded "FITNESS CLUB", both set to the same width.
 * When the gym uploads its real logo (Website → Logo), that image is shown instead.
 */
export function Wordmark({ name = 'Medilife Fitness Club', logoUrl, className }: { name?: string; logoUrl?: string | null; className?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`wm wm-img ${className ?? ''}`} src={cld(logoUrl, { w: 480 })} alt={name} />;
  }
  const [first, ...rest] = name.trim().split(/\s+/);
  const second = rest.join(' ') || 'Fitness Club';
  return (
    <svg className={`wm ${className ?? ''}`} viewBox="0 0 300 86" role="img" aria-label={name}>
      <text x="0" y="58" fontFamily="'Archivo Variable', Archivo, 'Arial Narrow', sans-serif" fontSize="80" fontWeight="800" fill="currentColor" textLength="300" lengthAdjust="spacingAndGlyphs" style={{ fontStretch: '64%' }}>
        {first.toUpperCase()}
      </text>
      <text x="1" y="84" fontFamily="'Archivo Variable', Archivo, Arial, sans-serif" fontSize="22" fontWeight="700" fill="currentColor" textLength="298" lengthAdjust="spacing" style={{ fontStretch: '125%' }} className="wm-sub">
        {second.toUpperCase()}
      </text>
    </svg>
  );
}
