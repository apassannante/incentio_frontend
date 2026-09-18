import { ExternalLink, Calendar, Building2, Percent, CircleDollarSign, Zap } from 'lucide-react';
import type { Bando, Complessita, TipoBando } from '@/lib/types';
import Badge from './ui/Badge';
import Button from './ui/Button';

function tipoColor(tipo: TipoBando): 'blue' | 'green' | 'orange' {
    return tipo === 'tech' ? 'blue' : tipo === 'green' ? 'green' : 'orange';
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
        : `€${(n / 1_000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}k`;
}

interface BandoSchedaProps {
    bando: Bando;
    checklist: string[];
    template_progetto: string;
    giorni_preparazione: number;
}

export default function BandoScheda({
    bando,
    checklist,
    template_progetto,
    giorni_preparazione,
}: BandoSchedaProps) {
    const giorni = giorniAllaScadenza(bando.scadenza);

    return (
        <div className="max-w-3xl mx-auto space-y-6 font-sans text-zinc-200">
            {/* Header card */}
            <div className="bg-zinc-900/20 rounded-2xl p-6 border border-zinc-800 space-y-4 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    <Badge color={tipoColor(bando.tipo_bando)}>{bando.tipo_bando.toUpperCase()}</Badge>
                    <Badge color={complessitaColor(bando.complessita_candidatura)}>
                        Complessità {bando.complessita_candidatura}
                    </Badge>
                    {bando.compatibilita_manifattura_lombarda === 'sì' && (
                        <Badge color="green">✓ Manifattura Lombarda</Badge>
                    )}
                </div>

                <h1 className="text-xl font-bold text-white tracking-tight leading-snug">{bando.titolo}</h1>

                <div className="flex flex-wrap gap-6 pt-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-450 text-zinc-400">
                        <Building2 size={14} className="text-zinc-500" />
                        {bando.ente_erogatore}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-450 text-zinc-400">
                        <Calendar size={14} className="text-zinc-500" />
                        {giorni <= 0 ? 'Scaduto' : `${giorni} giorni alla scadenza`}
                    </div>
                </div>

                {/* Key numbers */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-900">
                    <div className="bg-zinc-950/40 rounded-xl p-4 border border-zinc-850 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1 text-zinc-500">
                            <Percent size={13} strokeWidth={1.5} className="text-indigo-400" />
                        </div>
                        <div className="text-2xl font-bold text-indigo-400">
                            {bando.percentuale_fondo_perduto}%
                        </div>
                        <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-0.5">Fondo perduto</div>
                    </div>
                    <div className="bg-zinc-950/40 rounded-xl p-4 border border-zinc-850 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1 text-zinc-500">
                            <CircleDollarSign size={13} strokeWidth={1.5} />
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {formatEuro(bando.importo_max_euro)}
                        </div>
                        <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-0.5">Importo massimo</div>
                    </div>
                    <div className="bg-zinc-950/40 rounded-xl p-4 border border-zinc-850 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1 text-zinc-500">
                            <Zap size={13} strokeWidth={1.5} className="text-amber-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">{giorni_preparazione}</div>
                        <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-0.5">Giorni prep. stimati</div>
                    </div>
                </div>
            </div>

            {/* Sintesi */}
            <div className="bg-zinc-900/20 rounded-2xl p-6 border border-zinc-800 shadow-sm">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Sintesi del bando</h2>
                <p className="text-xs text-zinc-300 leading-relaxed font-normal">{bando.sintesi_100_parole}</p>
            </div>

            {/* Requisiti */}
            <div className="bg-zinc-900/20 rounded-2xl p-6 border border-zinc-800 shadow-sm">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Requisiti azienda</h2>
                <div className="space-y-3 text-xs leading-normal font-normal text-zinc-300">
                    <div className="flex gap-2">
                        <span className="font-semibold text-zinc-450 text-zinc-500 w-32 shrink-0">Dimensione:</span>
                        <span className="capitalize">{bando.requisiti_azienda.dimensione}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-semibold text-zinc-450 text-zinc-500 w-32 shrink-0">Settori ATECO:</span>
                        <span>
                            {bando.requisiti_azienda.settori_ateco.length > 0
                                ? bando.requisiti_azienda.settori_ateco.join(', ')
                                : 'Tutti'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-semibold text-zinc-450 text-zinc-500 w-32 shrink-0">Anzianità min.:</span>
                        <span>{bando.requisiti_azienda.anzianita_minima_anni} anni</span>
                    </div>
                </div>
            </div>

            {/* Template progetto */}
            {template_progetto && (
                <div className="bg-indigo-950/10 rounded-2xl p-6 border border-indigo-900/20 shadow-sm">
                    <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">📝 Template progetto consigliato</h2>
                    <p className="text-xs text-zinc-350 leading-relaxed font-mono whitespace-pre-line bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">{template_progetto}</p>
                </div>
            )}

            {/* CTA */}
            <div className="flex flex-wrap gap-3 pb-6 justify-end">
                <a href={bando.url_originale} target="_blank" rel="noopener noreferrer">
                    <Button className="gap-1.5 text-xs font-bold">
                        Vai al bando ufficiale <ExternalLink size={13} />
                    </Button>
                </a>
            </div>
        </div>
    );
}
