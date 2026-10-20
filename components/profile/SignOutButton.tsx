'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/AuthProvider';

export default function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button type="button" onClick={handleSignOut} className="btn-outline-danger settings-signout">
      <LogOut size={16} aria-hidden="true" />
      Sign out
    </button>
  );
}
