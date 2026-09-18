'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { getBandiCompatibili } from '@/lib/api';
import type { MatchResult } from '@/lib/types';
import BandoCard from '@/components/BandoCard';
import FontiAttive from '@/components/FontiAttive';
import LogoutButton from '@/components/LogoutButton';
import { createClient } from '@/lib/supabase/client';

function RisultatiContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const profileId = searchParams.get('id');

    const [results, setResults] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hasVisura, setHasVisura] = useState(true);

    useEffect(() => {
        if (!profileId) {
            router.replace('/profilo');
            return;
        }
        getBandiCompatibili(profileId)
            .then((data) => setResults(Array.isArray(data) ? data : []))
            .catch(() => setError('Errore nel caricamento dei bandi. Riprova.'))
            .finally(() => setLoading(false));

        // Check se ha una visura completata
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            supabase.from('visura_sessions')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'complete')
                .limit(1)
                .then(({ data }) => setHasVisura((data?.length ?? 0) > 0));
        });
    }, [profileId, router]);

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            {loading && (
                <div className="flex flex-col items-center gap-4 py-24">
                    <Loader2 className="animate-spin text-zinc-400" size={36} />
                    <p className="text-zinc-400">Analisi bandi in corso...</p>
                </div>
            )}

            {error && !loading && (
                <div className="flex flex-col items-center gap-3 py-24 text-center">
                    <AlertCircle size={36} className="text-red-400" />
                    <p className="text-zinc-400">{error}</p>
                    <Link href="/profilo" className="text-sm text-zinc-300 font-semibold hover:underline hover:text-white">
                        ← Torna al profilo
                    </Link>
                </div>
            )}

            {!loading && !hasVisura && (
                <div className="mb-6 flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                    <AlertTriangle size={20} className="text-yellow-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-yellow-300 text-sm font-semibold">Risultati limitati</p>
                        <p className="text-yellow-400/80 text-sm mt-0.5">
                            Senza visura camerale i risultati sono limitati. <Link href="/visura" className="underline hover:text-yellow-300 font-bold">Caricala</Link> per sbloccare il matching completo.
                        </p>
                    </div>
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-white">
                            {results.length > 0
                                ? `${results.length} bandi compatibili`
                                : 'Nessun bando compatibile'}
                        </h1>
                        <p className="text-zinc-400 mt-1 mb-6">
                            {results.length > 0
                                ? 'ordinati per percentuale di compatibilità con il tuo profilo'
                                : 'Prova a modificare il tuo profilo per ampliare i risultati'}
                        </p>
                        
                        <FontiAttive />
                    </div>

                    {results.length === 0 && (
                        <div className="bg-zinc-900/20 rounded-2xl p-10 text-center border border-zinc-800">
                            <p className="text-zinc-400 text-sm">
                                Nessun bando attivo corrisponde al tuo profilo in questo momento.
                                <br />
                                Aggiorna il profilo o torna più tardi.
                            </p>
                            <Link href="/profilo" className="inline-block mt-4 text-sm text-zinc-300 font-semibold hover:underline hover:text-white">
                                ← Modifica profilo
                            </Link>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {results.map((match) => (
                            <BandoCard key={match.bando.id} match={match} profileId={profileId!} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function RisultatiPage() {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased">
            <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur border-b border-zinc-800 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/profilo" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
                            <ArrowLeft size={16} />
                            Modifica profilo
                        </Link>
                        <span className="text-xl font-bold">
                            <span className="text-white">Incent</span>
                            <span className="text-zinc-400">io</span>
                        </span>
                    </div>
                    <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-400">
                        <Link href="/risultati" className="text-white font-semibold border-b-2 border-white pb-0.5">
                            Bandi
                        </Link>
                        <Link href="/candidature" className="hover:text-white transition-colors">
                            Candidature
                        </Link>
                        <button onClick={() => router.push('/visura')} className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-zinc-300 border border-zinc-800 rounded-lg hover:border-zinc-700 hover:bg-zinc-900/50 transition-all bg-zinc-900/20">
                            📄 Analizza con visura
                        </button>
                        <LogoutButton />
                    </nav>
                </div>
            </header>
            <Suspense fallback={
                <div className="flex items-center justify-center py-24 bg-[#09090b]">
                    <Loader2 className="animate-spin text-zinc-400" size={36} />
                </div>
            }>
                <RisultatiContent />
            </Suspense>
        </div>
    );
}
