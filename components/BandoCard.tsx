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
    if (tipo === 'tech') return <Cpu size={12} />;
    if (tipo === 'green') return <Leaf size={12} />;
    return <Users size={12} />;
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
        <Card hover className="flex flex-col gap-4 font-sans">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge color={tipoColor(bando.tipo_bando)}>
                        <span className="flex items-center gap-1.5">
                            {tipoIcon(bando.tipo_bando)}
                            {tipoLabel(bando.tipo_bando)}
                        </span>
                    </Badge>
                    <Badge color={complessitaColor(bando.complessita_candidatura)}>
                        Complessità {bando.complessita_candidatura}
                    </Badge>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    <span>Match {score}%</span>
                </div>
            </div>

            {/* Title + Ente */}
            <div>
                <h3 className="font-bold text-white text-sm leading-snug">{bando.titolo}</h3>
                <p className="text-[10px] text-zinc-500 font-semibold mt-1">{bando.ente_erogatore}</p>
            </div>

            {/* Key numbers */}
            <div className="flex gap-6 flex-wrap">
                <div>
                    <div className="text-xl font-bold text-white">
                        {bando.percentuale_fondo_perduto}%
                    </div>
                    <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-0.5">fondo perduto</div>
                </div>
                <div>
                    <div className="text-xl font-bold text-white">
                        {formatEuro(bando.importo_max_euro)}
                    </div>
                    <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-0.5">importo massimo</div>
                </div>
            </div>

            {/* Motivo match */}
            <p className="text-xs text-zinc-300 bg-zinc-950/40 rounded-lg px-3.5 py-2.5 border border-zinc-850 leading-relaxed font-normal">
                💡 {motivo_match}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-3.5 border-t border-zinc-900">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <Calendar size={13} className="text-zinc-500" />
                    <span className={giorni <= 14 ? 'text-red-450 text-red-400 font-semibold' : 'text-zinc-400'}>
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
                        className="gap-1.5"
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
                <p className="text-[10px] font-semibold text-red-400 text-right">{applyError}</p>
            )}
        </Card>
    );
}
