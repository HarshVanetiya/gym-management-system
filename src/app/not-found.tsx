import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="card auth-card center">
          <h2>Page not found</h2>
          <p className="muted">That page doesn’t exist.</p>
          <Link href="/" className="btn">Go to the website</Link>
        </div>
      </div>
    </div>
  );
}
