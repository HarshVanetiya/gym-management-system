import { cld } from '../lib/cld';

/**
 * Club name lockup: "MEDILIFE" in a spaced serif over a small, widely spaced "FITNESS CLUB".
 * When the gym uploads its real logo (Dashboard → Website → Logo), that image is shown instead.
 */
export function Lockup({ name = 'Medilife Fitness Club', logoUrl, className }: { name?: string; logoUrl?: string | null; className?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`lockup-img ${className ?? ''}`} src={cld(logoUrl, { w: 480 })} alt={name} />;
  }
  const [first, ...rest] = name.trim().split(/\s+/);
  const second = rest.join(' ') || 'Fitness Club';
  return (
    <span className={`lockup ${className ?? ''}`} aria-label={name} role="img">
      <span className="lockup-main" aria-hidden="true">{first}</span>
      <span className="lockup-sub" aria-hidden="true">{second}</span>
    </span>
  );
}
