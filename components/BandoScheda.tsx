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
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header card */}
            <div className="bg-[#F5F7FA] rounded-2xl p-6 border border-gray-100 space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Badge color={tipoColor(bando.tipo_bando)}>{bando.tipo_bando.toUpperCase()}</Badge>
                    <Badge color={complessitaColor(bando.complessita_candidatura)}>
                        Complessità {bando.complessita_candidatura}
                    </Badge>
                    {bando.compatibilita_manifattura_lombarda === 'sì' && (
                        <Badge color="green">✓ Manifattura Lombarda</Badge>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-[#1C1C1C]">{bando.titolo}</h1>

                <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 size={16} className="text-[#1A7A4A]" />
                        {bando.ente_erogatore}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} className="text-[#1A7A4A]" />
                        {giorni <= 0 ? 'Scaduto' : `${giorni} giorni alla scadenza`}
                    </div>
                </div>

                {/* Key numbers */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Percent size={14} className="text-[#1A7A4A]" />
                        </div>
                        <div className="text-3xl font-black text-[#1A7A4A]">
                            {bando.percentuale_fondo_perduto}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Fondo perduto</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <CircleDollarSign size={14} className="text-gray-400" />
                        </div>
                        <div className="text-3xl font-black text-[#1C1C1C]">
                            {formatEuro(bando.importo_max_euro)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Importo massimo</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Zap size={14} className="text-orange-400" />
                        </div>
                        <div className="text-3xl font-black text-[#1C1C1C]">{giorni_preparazione}</div>
                        <div className="text-xs text-gray-400 mt-1">Giorni stimati prep.</div>
                    </div>
                </div>
            </div>

            {/* Sintesi */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-base font-bold text-[#1C1C1C] mb-3">Descrizione</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{bando.sintesi_100_parole}</p>
            </div>

            {/* Requisiti */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-base font-bold text-[#1C1C1C] mb-3">Requisiti azienda</h2>
                <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex gap-2">
                        <span className="font-medium text-[#1C1C1C] w-32 shrink-0">Dimensione:</span>
                        <span className="capitalize">{bando.requisiti_azienda.dimensione}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-medium text-[#1C1C1C] w-32 shrink-0">Settori ATECO:</span>
                        <span>
                            {bando.requisiti_azienda.settori_ateco.length > 0
                                ? bando.requisiti_azienda.settori_ateco.join(', ')
                                : 'Tutti'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-medium text-[#1C1C1C] w-32 shrink-0">Anzianità min.:</span>
                        <span>{bando.requisiti_azienda.anzianita_minima_anni} anni</span>
                    </div>
                </div>
            </div>

            {/* Template progetto */}
            {template_progetto && (
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <h2 className="text-base font-bold text-[#1A7A4A] mb-3">📝 Template progetto</h2>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{template_progetto}</p>
                </div>
            )}

            {/* CTA */}
            <div className="flex flex-wrap gap-3 pb-6">
                <a href={bando.url_originale} target="_blank" rel="noopener noreferrer">
                    <Button className="gap-1.5">
                        Vai al bando ufficiale <ExternalLink size={14} />
                    </Button>
                </a>
            </div>
        </div>
    );
}
