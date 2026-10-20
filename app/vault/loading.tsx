import { VaultSkeleton } from '@/components/vault/VaultSkeleton';

export default function VaultLoading() {
  return (
    <div className="vault-page">
      <VaultSkeleton count={15} />
    </div>
  );
}
