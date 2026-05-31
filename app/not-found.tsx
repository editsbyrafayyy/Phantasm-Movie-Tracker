import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">Film Not Found</h1>
      <p className="not-found-sub">
        This reel doesn&apos;t exist — or it was too scary to make it into the vault.
      </p>
      <Link href="/" className="not-found-link">
        ← Go Home
      </Link>
    </div>
  );
}
