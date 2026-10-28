import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty-state app-status-page">
      <p className="app-status-code" aria-hidden="true">404</p>
      <h1 className="empty-state-title app-status-title">This page is dead</h1>
      <p className="empty-state-body">
        Either the link is wrong, or I deleted whatever used to be here. Probably the second one.
      </p>
      <div className="app-status-actions">
        <Link href="/" className="btn-primary">Go home</Link>
        <Link href="/vault" className="btn-secondary">Open the vault</Link>
      </div>
    </div>
  );
}
