import { VaultSkeleton } from '@/components/vault/VaultSkeleton';

export default function VaultLoading() {
  return (
    <div className="vault-page">
      <header className="vault-header">
        <div className="vault-header-inner">
          <h1 className="vault-heading">
            <span className="vault-heading-light">The</span>{' '}
            <em className="vault-heading-serif">Vault</em>
          </h1>
        </div>
      </header>
      <VaultSkeleton count={12} />
    </div>
  );
}
