'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import ApplicationCard, { Application, SkeletonCard } from '@/components/ApplicationCard';
import LogoutButton from '@/components/LogoutButton';

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CandidaturePage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
          setError('Devi essere autenticato per vedere le candidature.');
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const { data, error: dbErr } = await supabase
          .from('applications')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false });

        if (dbErr) throw dbErr;
        setApplications((data as Application[]) ?? []);
      } catch (e) {
        console.error(e);
        setError('Errore nel caricamento delle candidature.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={userId ? `/risultati?id=${userId}` : '/risultati'}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Bandi
            </Link>
            <span className="text-xl">
              <span className="font-extrabold text-white">Incent</span><span className="font-extrabold text-zinc-400">io</span>
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <Link href={userId ? `/risultati?id=${userId}` : '/risultati'} className="hover:text-white transition-colors">Bandi</Link>
            <Link href="/candidature" className="text-white font-semibold border-b-2 border-white pb-0.5">
              Candidature
            </Link>
            <button onClick={() => router.push('/visura')} className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-zinc-300 border border-zinc-800 rounded-lg hover:border-zinc-700 hover:bg-zinc-900/50 transition-all bg-zinc-900/20">
              📄 Analizza con visura
            </button>
            <LogoutButton />
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-white">Le tue candidature</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Monitora lo stato di ogni pacchetto candidatura avviato.
          </p>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <AlertCircle size={36} className="text-red-400" />
            <p className="text-zinc-400">{error}</p>
            <Link href="/auth" className="text-sm text-zinc-300 font-semibold hover:underline hover:text-white">
              Accedi
            </Link>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && applications.length === 0 && (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <FileText size={28} className="text-zinc-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nessuna candidatura ancora</h2>
              <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
                Non hai ancora avviato nessuna candidatura. Esplora i bandi compatibili con la tua azienda e inizia.
              </p>
            </div>
            <Link
              href={userId ? `/risultati?id=${userId}` : '/risultati'}
              className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-950 font-bold px-6 py-3 rounded-xl hover:bg-zinc-200 transition-all border border-zinc-200/50 shadow-lg shadow-zinc-900/50"
            >
              Esplora i bandi <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Card list */}
        {!loading && !error && applications.length > 0 && (
          <>
            <p className="text-sm text-zinc-550 mb-4" style={{ color: '#71717a' }}>{applications.length} candidatura{applications.length !== 1 ? 'e' : ''}</p>
            <div className="flex flex-col gap-4">
              {applications.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
