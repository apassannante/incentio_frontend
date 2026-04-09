'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cpu, Leaf, Users, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import type { MatchResult, TipoBando, Complessita } from '@/lib/types';
import Badge from './ui/Badge';
import Card from './ui/Card';
import Button from './ui/Button';

function tipoColor(tipo: TipoBando): 'blue' | 'green' | 'orange' {
    return tipo === 'tech' ? 'blue' : tipo === 'green' ? 'green' : 'orange';
}

function tipoIcon(tipo: TipoBando) {
    if (tipo === 'tech') return <Cpu size={14} />;
    if (tipo === 'green') return <Leaf size={14} />;
    return <Users size={14} />;
}

function tipoLabel(tipo: TipoBando) {
    return tipo === 'tech' ? 'Tech' : tipo === 'green' ? 'Green' : 'People';
}

function complessitaColor(c: Complessita): 'green' | 'yellow' | 'red' {
    return c === 'bassa' ? 'green' : c === 'media' ? 'yellow' : 'red';
}

function giorniAllaScadenza(scadenza: string): number {
    const now = new Date();
    const end = new Date(scadenza);
    return Math.max(0, Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatEuro(n: number): string {
    return n >= 1_000_000
        ? `€${(n / 1_000_000).toFixed(1)}M`
        : `€${(n / 1_000).toFixed(0)}k`;
}

interface BandoCardProps {
    match: MatchResult;
    profileId: string;
}

export default function BandoCard({ match, profileId }: BandoCardProps) {
    const router = useRouter();
    const { bando, score, motivo_match } = match;
    const giorni = giorniAllaScadenza(bando.scadenza);
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState('');

    async function handleCandidati() {
        setApplying(true);
        setApplyError('');
        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const { authHeaders } = await import('@/lib/api');
            const headers = await authHeaders();
            const res = await fetch(`${API_BASE}/api/application/save`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ bandoId: bando.id, profileId }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { id } = await res.json();
            router.push(`/application/${id}?profileId=${profileId}`);
        } catch {
            setApplyError('Errore nel salvataggio. Riprova.');
        } finally {
            setApplying(false);
        }
    }

    return (
        <Card hover className="flex flex-col gap-4">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge color={tipoColor(bando.tipo_bando)}>
                        <span className="flex items-center gap-1">
                            {tipoIcon(bando.tipo_bando)}
                            {tipoLabel(bando.tipo_bando)}
                        </span>
                    </Badge>
                    <Badge color={complessitaColor(bando.complessita_candidatura)}>
                        Complessità {bando.complessita_candidatura}
                    </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-1 rounded-full border border-[#38BDF8]/25">
                    <span>Match {score}%</span>
                </div>
            </div>

            {/* Title + ente */}
            <div>
                <h3 className="font-bold text-white text-base leading-snug">{bando.titolo}</h3>
                <p className="text-xs text-white/50 mt-0.5">{bando.ente_erogatore}</p>
            </div>

            {/* Key numbers */}
            <div className="flex gap-4 flex-wrap">
                <div>
                    <div className="text-2xl font-black text-[#38BDF8]">
                        {bando.percentuale_fondo_perduto}%
                    </div>
                    <div className="text-xs text-white/40">fondo perduto</div>
                </div>
                <div>
                    <div className="text-2xl font-black text-[#38BDF8]">
                        {formatEuro(bando.importo_max_euro)}
                    </div>
                    <div className="text-xs text-white/40">importo massimo</div>
                </div>
            </div>

            {/* Motivo match */}
            <p className="text-xs text-white/60 bg-white/5 rounded-lg px-3 py-2 border border-[#38BDF8]/10">
                💡 {motivo_match}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#38BDF8]/10">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Calendar size={12} className="text-[#38BDF8]" />
                    <span className={giorni <= 14 ? 'text-red-400 font-semibold' : 'text-[#38BDF8]'}>
                        {giorni <= 0
                            ? 'Scaduto'
                            : giorni === 1
                                ? 'Scade domani'
                                : `${giorni} giorni alla scadenza`}
                    </span>
                    {giorni <= 14 && giorni > 0 && <AlertCircle size={12} className="text-red-400" />}
                </div>
                <div className="flex gap-2">
                    <Link href={`/bando/${bando.id}?profileId=${profileId}`}>
                        <Button size="sm" variant="secondary">Vedi scheda</Button>
                    </Link>
                    <Button
                        size="sm"
                        onClick={handleCandidati}
                        disabled={applying}
                        className="gap-1"
                    >
                        {applying ? (
                            <><Loader2 size={12} className="animate-spin" /> Avvio...</>
                        ) : (
                            'Candidati →'
                        )}
                    </Button>
                </div>
            </div>
            {applyError && (
                <p className="text-xs text-red-400 text-right">{applyError}</p>
            )}
        </Card>
    );
}
