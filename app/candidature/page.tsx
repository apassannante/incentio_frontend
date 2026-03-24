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
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0F1E]/90 backdrop-blur border-b border-[#38BDF8]/15 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={userId ? `/risultati?id=${userId}` : '/risultati'}
              className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Bandi
            </Link>
            <span className="text-xl">
              <span className="font-extrabold text-white">Incent</span><span className="font-extrabold text-[#38BDF8]">io</span>
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-white/60">
            <Link href={userId ? `/risultati?id=${userId}` : '/risultati'} className="hover:text-white transition-colors">Bandi</Link>
            <Link href="/candidature" className="text-[#38BDF8] font-semibold border-b-2 border-[#38BDF8] pb-0.5">
              Candidature
            </Link>
            <button onClick={() => router.push('/visura')} className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-cyan-400 border border-cyan-400/40 rounded-lg hover:border-cyan-400 hover:bg-cyan-400/10 transition-all">
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
          <h1 className="text-2xl font-bold text-white">Le tue candidature</h1>
          <p className="text-sm text-white/50 mt-1">
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
            <p className="text-white/60">{error}</p>
            <Link href="/auth" className="text-sm text-[#38BDF8] font-semibold hover:underline">
              Accedi
            </Link>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && applications.length === 0 && (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#38BDF8]/10 flex items-center justify-center">
              <FileText size={28} className="text-[#38BDF8]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nessuna candidatura ancora</h2>
              <p className="text-sm text-white/50 mt-1 max-w-sm mx-auto">
                Non hai ancora avviato nessuna candidatura. Esplora i bandi compatibili con la tua azienda e inizia.
              </p>
            </div>
            <Link
              href={userId ? `/risultati?id=${userId}` : '/risultati'}
              className="inline-flex items-center gap-2 bg-[#38BDF8] text-[#0A0F1E] font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#38BDF8]/15"
            >
              Esplora i bandi <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Card list */}
        {!loading && !error && applications.length > 0 && (
          <>
            <p className="text-sm text-white/40 mb-4">{applications.length} candidatura{applications.length !== 1 ? 'e' : ''}</p>
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
