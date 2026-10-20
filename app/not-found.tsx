import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty-state app-status-page">
      <p className="app-status-code" aria-hidden="true">404</p>
      <h1 className="empty-state-title app-status-title">Film not found</h1>
      <p className="empty-state-body">
        This reel doesn&apos;t exist — or it was too scary to make it into the vault.
      </p>
      <div className="app-status-actions">
        <Link href="/" className="btn-primary">Go home</Link>
        <Link href="/vault" className="btn-secondary">Open the vault</Link>
      </div>
    </div>
  );
}
