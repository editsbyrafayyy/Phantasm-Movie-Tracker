import { VaultSkeleton } from '@/components/vault/VaultSkeleton';

export default function Loading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 60px' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 140, height: 16, borderRadius: 4, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: 280, height: 38, borderRadius: 8 }} />
      </div>
      <VaultSkeleton count={12} />
    </div>
  );
}
