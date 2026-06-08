'use client';

import { useAuth } from '@/components/layout/AuthProvider';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button 
      onClick={handleSignOut} 
      className="btn-logout" 
      style={{ width: '100%', marginTop: '24px' }}
    >
      <LogOut size={18} />
      Sign Out
    </button>
  );
}
