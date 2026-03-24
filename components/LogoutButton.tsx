'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-red-400 transition-colors"
      title="Esci"
    >
      <LogOut size={15} />
      <span className="hidden sm:inline">Esci</span>
    </button>
  );
}
