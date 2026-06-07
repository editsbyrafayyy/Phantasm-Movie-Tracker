import { VaultSkeleton } from '@/components/vault/VaultSkeleton';

export default function Loading() {
  return (
    <div className="vault-page" style={{ paddingTop: 20 }}>
      <header className="vault-header">
        <div className="vault-header-inner">
          <div className="skeleton h-10 w-48 rounded" />
        </div>
      </header>
      <VaultSkeleton count={12} />
    </div>
  );
}
