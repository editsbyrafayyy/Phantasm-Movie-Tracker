import { VaultSkeleton } from '@/components/vault/VaultSkeleton';

export default function VaultLoading() {
  return (
    <div className="vault-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 60px' }}>
      <header className="vault-header" style={{ marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 180, height: 42, borderRadius: 8 }} />
      </header>
      <VaultSkeleton count={12} />
    </div>
  );
}
