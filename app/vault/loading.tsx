import { VaultSkeleton } from '@/components/vault/VaultSkeleton';

export default function VaultLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <div className="skeleton" style={{ width: 180, height: 38, borderRadius: 8 }} />
      </div>
      <VaultSkeleton count={12} />
    </div>
  );
}
