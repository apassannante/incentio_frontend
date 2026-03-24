'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Notifica {
  id: string;
  bando_id: string;
  match_score: number;
  letta: boolean;
  created_at: string;
  bandi?: { titolo: string }[] | { titolo: string } | null;
}

export default function NotificationBadge({ profileId }: { profileId?: string }) {
  const [notifiche, setNotifiche] = useState<Notifica[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    supabase
      .from('notifiche')
      .select('id, bando_id, match_score, letta, created_at, bandi(titolo)')
      .eq('user_id', userId)
      .eq('letta', false)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setNotifiche(data || []));

    // Realtime subscription
    const channel = supabase
      .channel('notifiche-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifiche',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifiche((prev) => [payload.new as Notifica, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const unread = notifiche.filter((n) => !n.letta).length;

  async function markAsRead(id: string) {
    await supabase.from('notifiche').update({ letta: true }).eq('id', id);
    setNotifiche((prev) => prev.filter((n) => n.id !== id));
  }

  // Don't render if not logged in
  if (!userId) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Notifiche"
      >
        <Bell size={20} className="text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1C1C1C]">Nuovi bandi trovati</h3>
              {unread > 0 && (
                <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                  {unread} nuov{unread === 1 ? 'o' : 'i'}
                </span>
              )}
            </div>

            {notifiche.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Nessuna nuova notifica
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifiche.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-[#1A7A4A] mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/bando/${n.bando_id}${profileId ? `?profileId=${profileId}` : ''}`}
                        className="text-sm font-medium text-[#1C1C1C] hover:text-[#1A7A4A] line-clamp-2 block"
                        onClick={() => markAsRead(n.id)}
                      >
                        {(Array.isArray(n.bandi) ? n.bandi[0]?.titolo : (n.bandi as { titolo?: string } | null)?.titolo) || 'Nuovo bando trovato'}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Match score: {n.match_score}/4 · {new Date(n.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-gray-300 hover:text-gray-500 text-xs shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 py-2.5 border-t border-gray-100">
              <Link href="/notifiche" className="text-xs text-[#1A7A4A] font-medium hover:underline" onClick={() => setOpen(false)}>
                Vedi tutte le notifiche →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
