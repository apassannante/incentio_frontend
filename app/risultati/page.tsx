'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { getBandiCompatibili } from '@/lib/api';
import type { MatchResult } from '@/lib/types';
import BandoCard from '@/components/BandoCard';
import FontiAttive from '@/components/FontiAttive';
import LogoutButton from '@/components/LogoutButton';

function RisultatiContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const profileId = searchParams.get('id');

    const [results, setResults] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!profileId) {
            router.replace('/profilo');
            return;
        }
        getBandiCompatibili(profileId)
            .then((data) => setResults(Array.isArray(data) ? data : []))
            .catch(() => setError('Errore nel caricamento dei bandi. Riprova.'))
            .finally(() => setLoading(false));
    }, [profileId, router]);

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            {loading && (
                <div className="flex flex-col items-center gap-4 py-24">
                    <Loader2 className="animate-spin text-[#38BDF8]" size={36} />
                    <p className="text-gray-400">Analisi bandi in corso...</p>
                </div>
            )}

            {error && !loading && (
                <div className="flex flex-col items-center gap-3 py-24 text-center">
                    <AlertCircle size={36} className="text-red-400" />
                    <p className="text-gray-400">{error}</p>
                    <Link href="/profilo" className="text-sm text-[#38BDF8] font-semibold hover:underline">
                        ← Torna al profilo
                    </Link>
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white">
                            {results.length > 0
                                ? `${results.length} bandi compatibili trovati`
                                : 'Nessun bando compatibile'}
                        </h1>
                        <p className="text-gray-400 mt-1 mb-6">
                            {results.length > 0
                                ? 'Ordinati per percentuale di compatibilità'
                                : 'Prova a modificare il tuo profilo per ampliare i risultati'}
                        </p>
                        
                        <FontiAttive />
                    </div>

                    {results.length === 0 && (
                        <div className="bg-[#0F1F3D] rounded-2xl p-10 text-center border border-[#38BDF8]/20">
                            <p className="text-gray-400 text-sm">
                                Nessun bando attivo corrisponde al tuo profilo in questo momento.
                                <br />
                                Aggiorna il profilo o torna più tardi.
                            </p>
                            <Link href="/profilo" className="inline-block mt-4 text-sm text-[#38BDF8] font-semibold hover:underline">
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
        <div className="min-h-screen bg-[#0A0F1E] text-white">
            <header className="sticky top-0 z-50 bg-[#0A0F1E]/90 backdrop-blur border-b border-[#38BDF8]/20 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/profilo" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#38BDF8] transition-colors">
                            <ArrowLeft size={16} />
                            Modifica profilo
                        </Link>
                        <span className="text-xl font-bold">
                            <span className="text-white">Incent</span>
                            <span className="text-[#38BDF8]">io</span>
                        </span>
                    </div>
                    <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-400">
                        <Link href="/risultati" className="text-[#38BDF8] font-semibold border-b-2 border-[#38BDF8] pb-0.5">
                            Bandi
                        </Link>
                        <Link href="/candidature" className="hover:text-white transition-colors">
                            Candidature
                        </Link>
                        <button onClick={() => router.push('/visura')} className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-cyan-400 border border-cyan-400/40 rounded-lg hover:border-cyan-400 hover:bg-cyan-400/10 transition-all">
                            📄 Analizza con visura
                        </button>
                        <LogoutButton />
                    </nav>
                </div>
            </header>
            <Suspense fallback={
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="animate-spin text-[#38BDF8]" size={36} />
                </div>
            }>
                <RisultatiContent />
            </Suspense>
        </div>
    );
}
