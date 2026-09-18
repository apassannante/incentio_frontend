'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    FileText,
    CheckCircle2,
    Clock,
    XCircle,
    Download,
    Bell,
    Calendar,
    Building2,
    Percent,
    CircleDollarSign,
} from 'lucide-react';
import { getApplicationData } from '@/lib/api';
import { fetchAuth } from '@/lib/fetchAuth';
import type { ApplicationData, DocumentoStatus, TimelineStep, FaqItem } from '@/lib/api';

// ── Collapsible Section ────────────────────────────────────────────────────
function Section({
    title,
    icon: Icon,
    defaultOpen = true,
    children,
}: {
    title: string;
    icon: React.ElementType;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-[#121214] rounded-xl border border-zinc-800 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-zinc-800/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={1.5} className="text-zinc-400" />
                    <span className="font-semibold text-zinc-100 text-sm tracking-tight">{title}</span>
                </div>
                {open ? (
                    <ChevronUp size={16} className="text-zinc-500" />
                ) : (
                    <ChevronDown size={16} className="text-zinc-500" />
                )}
            </button>
            {open && <div className="px-6 pb-6 border-t border-zinc-800/40 pt-4">{children}</div>}
        </div>
    );
}

// ── Document item ──────────────────────────────────────────────────────────
function DocItem({
    doc,
    onView,
    onGenerate,
    generatingSlug
}: {
    doc: DocumentoStatus;
    onView: (doc: DocumentoStatus) => void;
    onGenerate: (doc: DocumentoStatus) => void;
    generatingSlug: string | null;
}) {
    const config = {
        gia_pronto: {
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-950/20',
            border: 'border-emerald-900/30',
            label: 'Pronto',
        },
        da_preparare: {
            icon: Clock,
            color: 'text-zinc-400',
            bg: 'bg-zinc-900/20',
            border: 'border-zinc-800/40',
            label: 'Da preparare',
        },
        da_verificare: {
            icon: Clock,
            color: 'text-amber-400',
            bg: 'bg-amber-950/20',
            border: 'border-amber-900/30',
            label: 'Da verificare',
        },
    }[doc.stato];

    const Icon = config.icon;
    const isClickable = doc.stato !== 'gia_pronto';
    const isGenerating = generatingSlug === doc.slug;

    return (
        <div
            className={`flex items-center gap-3 p-3.5 rounded-lg border ${config.bg} ${config.border} transition-colors`}
        >
            <Icon size={16} strokeWidth={1.5} className={`${config.color} shrink-0`} />
            <span className="text-xs font-medium text-zinc-200 flex-1">{doc.nome}</span>
            {isClickable && (
                <div className="flex gap-2">
                    {doc.generato ? (
                        <button
                            type="button"
                            onClick={() => onView(doc)}
                            className="text-xs bg-zinc-800 text-zinc-200 border border-zinc-700 px-3 py-1 rounded-md hover:bg-zinc-700 transition-all font-medium"
                        >
                            Modifica
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onGenerate(doc)}
                            disabled={isGenerating || !!generatingSlug}
                            className="text-xs bg-white text-black px-3 py-1 rounded-md hover:bg-zinc-200 disabled:opacity-45 disabled:hover:bg-white transition-all font-medium flex items-center gap-1"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={12} className="animate-spin" />
                                    Genera...
                                </>
                            ) : (
                                'Genera Bozza'
                            )}
                        </button>
                    )}
                </div>
            )}
            <span className={`text-xs font-medium ${config.color} ${isClickable ? 'hidden sm:inline' : ''}`}>{config.label}</span>
        </div>
    );
}


// ── Timeline ───────────────────────────────────────────────────────────────
function Timeline({ steps }: { steps: TimelineStep[] | null | undefined }) {
    if (!steps || steps.length === 0) return (
        <p className="text-sm text-white/40">Timeline non ancora disponibile.</p>
    );
    return (
        <div className="relative pl-8">
            {/* Vertical line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-white/10" />
            <div className="space-y-6">
                {steps.map((step, i) => (
                    <div key={i} className="relative">
                        {/* Dot */}
                        <div
                            className={`absolute -left-5 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${step.completato
                                    ? 'bg-indigo-500 border-indigo-500'
                                    : 'bg-[#09090b] border-zinc-800'
                                }`}
                        >
                            {step.completato && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#09090b]" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-bold text-white">{step.titolo}</span>
                                <span className="text-xs bg-white/5 text-white/40 px-2 py-0.5 rounded-full border border-white/10">
                                    {step.giorni} {step.giorni === 1 ? 'giorno' : 'giorni'}
                                </span>
                            </div>
                            <p className="text-xs text-white/50 leading-relaxed">{step.descrizione}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── FAQ Accordion ──────────────────────────────────────────────────────────
function FaqAccordion({ faq }: { faq: FaqItem[] | null | undefined }) {
    const [openIdx, setOpenIdx] = useState<number | null>(null);
    if (!faq || faq.length === 0) return (
        <p className="text-sm text-white/40">FAQ non ancora disponibili.</p>
    );
    return (
        <div className="space-y-2">
            {faq.map((item, i) => (
                <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setOpenIdx(openIdx === i ? null : i)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/5 transition-colors"
                    >
                        <span className="text-sm font-semibold text-white pr-4">{item.domanda}</span>
                        {openIdx === i ? (
                            <ChevronUp size={16} className="text-white/40 shrink-0" />
                        ) : (
                            <ChevronDown size={16} className="text-white/40 shrink-0" />
                        )}
                    </button>
                    {openIdx === i && (
                        <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">
                            {item.risposta}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}



// ── Mock fallback data (used when backend is offline) ─────────────────────
function getMockData(id: string): ApplicationData {
    return {
        id,
        bando_titolo: 'Bando Industria 4.0 — Regione Lombardia',
        ente_erogatore: 'Regione Lombardia',
        scadenza: new Date(Date.now() + 60 * 86400000).toISOString(),
        importo_max_euro: 200000,
        percentuale_fondo_perduto: 40,
        scheda_operativa: `Il bando sostiene investimenti in digitalizzazione, automazione e Industry 4.0 per PMI lombarde.
Sono finanziabili macchinari interconnessi, software gestionali, sistemi di automazione e formazione del personale.
Il progetto deve prevedere un investimento minimo di €20.000 e dimostrare l'impatto sull'organizzazione.
Le spese ammissibili includono acquisto macchinari, licenze software, consulenza specialistica e formazione.`,
        documenti: [
            { nome: 'Visura camerale aggiornata', stato: 'gia_pronto' },
            { nome: 'Bilancio ultimo anno approvato', stato: 'gia_pronto' },
            { nome: 'Piano tecnico-operativo', stato: 'da_preparare' },
            { nome: 'Preventivi fornitori (min. 3)', stato: 'da_preparare' },
            { nome: 'DURC aggiornato', stato: 'da_verificare' },
            { nome: 'Dichiarazione antimafia', stato: 'da_verificare' },
            { nome: 'Modulo de minimis compilato', stato: 'da_preparare' },
            { nome: 'Estratto conto ultimi 6 mesi', stato: 'gia_pronto' },
        ],
        business_plan_template: `## Executive Summary
Descrivere brevemente il progetto, gli obiettivi e il valore atteso dall'investimento.

## Descrizione dell'investimento
- Tipologia di macchinari/tecnologie acquistate
- Fornitori selezionati e motivazione della scelta
- Impatto previsto su produttività e qualità

## Piano finanziario
- Costo totale dell'investimento: €___
- Contributo richiesto (40%): €___
- Quota aziendale (60%): €___
- Fonte della quota aziendale: ___ (liquidità/finanziamento bancario)

## Indicatori di risultato attesi
- Riduzione tempi di produzione: ___%
- Aumento capacità produttiva: ___%
- Riduzione errori/scarti: ___%`,
        timeline: [
            { titolo: 'Raccolta documenti', descrizione: 'Raccogliere tutta la documentazione richiesta dal bando.', giorni: 7, completato: false },
            { titolo: 'Redazione piano tecnico', descrizione: 'Preparare il piano tecnico-operativo del progetto con fornitori e preventivi.', giorni: 14, completato: false },
            { titolo: 'Business plan', descrizione: 'Completare il piano di business con proiezioni economico-finanziarie.', giorni: 5, completato: false },
            { titolo: 'Revisione interna', descrizione: 'Far revisionare la domanda da un consulente o commercialista.', giorni: 3, completato: false },
            { titolo: 'Invio domanda', descrizione: 'Caricare tutta la documentazione sul portale del bando e inviare.', giorni: 1, completato: false },
        ],
        faq: [
            { domanda: 'Chi può candidarsi a questo bando?', risposta: 'Possono candidarsi le PMI lombarde con sede operativa in Lombardia, attive da almeno 2 anni, in regola con gli obblighi fiscali e contributivi.' },
            { domanda: 'Quali spese sono ammissibili?', risposta: "Sono ammissibili: acquisto di macchinari interconnessi, software gestionali (ERP, MES), consulenza per l'implementazione, e formazione del personale. Non sono ammissibili spese di gestione ordinaria, IVA recuperabile, e acquisti da parti correlate." },
            { domanda: 'Come funziona il rimborso?', risposta: 'Il contributo viene erogato a SAL (stato avanzamento lavori) o a saldo finale. Sarà necessario rendicontare le spese sostenute con fatture quietanzate.' },
            { domanda: 'Quanto tempo ci vuole per avere la risposta?', risposta: 'I tempi di istruttoria variano tra 60 e 120 giorni dalla chiusura dello sportello. Le domande vengono esaminate in ordine cronologico di invio.' },
            { domanda: 'Posso cumulare questo bando con altri contributi?', risposta: 'Il cumulo è possibile fino al limite di de minimis (€300.000 in 3 anni) e nel rispetto della normativa sugli aiuti di Stato. Specifico cumulo con Super/Iper ammortamento ammesso.' },
        ],
    };
}

// ── Main Page ──────────────────────────────────────────────────────────────
interface PageProps {
    params: Promise<{ id: string }>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ApplicationPage({ params }: PageProps) {
    const searchParams = useSearchParams();
    const profileId = searchParams.get('profileId') || '';

    const [id, setId] = useState('');
    const [data, setData] = useState<ApplicationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showReminder, setShowReminder] = useState(false);
    
    const [selectedDoc, setSelectedDoc] = useState<DocumentoStatus | null>(null);
    const [generatingSlug, setGeneratingSlug] = useState<string | null>(null);

    function handleViewDoc(doc: DocumentoStatus) {
        setSelectedDoc(doc);
    }

    async function handleGenerateDoc(doc: DocumentoStatus) {
        const docSlug = doc.slug || doc.nome.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
        if (!id) return;
        setGeneratingSlug(docSlug);
        try {
            const res = await fetchAuth(`${API_BASE}/api/application/${id}/genera-documento`, {
                method: 'POST',
                body: JSON.stringify({ docName: doc.nome, docSlug: docSlug }),
            });
            if (!res.ok) throw new Error('Errore di generazione');
            const result = await res.json();
            if (result.success && result.contenuto) {
                // Update local documents list
                setData(prev => {
                    if (!prev || !prev.documenti) return prev;
                    const updated = prev.documenti.map(d => {
                        const currentSlug = d.slug || d.nome.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
                        if (currentSlug === docSlug) {
                            return { ...d, slug: docSlug, generato: true, contenuto: result.contenuto };
                        }
                        return d;
                    });
                    return { ...prev, documenti: updated };
                });
                
                // Open modal immediately with content
                setSelectedDoc({ ...doc, slug: docSlug, generato: true, contenuto: result.contenuto });
            }
        } catch (err) {
            alert('Errore durante la generazione automatica della bozza. Riprova più tardi.');
            console.error(err);
        } finally {
            setGeneratingSlug(null);
        }
    }


    function handleDownloadDoc(doc: DocumentoStatus) {
        if (!doc.contenuto) return;
        const blob = new Blob([doc.contenuto], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${doc.slug || 'documento'}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }


    useEffect(() => {
        params.then((p) => {
            setId(p.id);
            getApplicationData(p.id)
                .then((res) => {
                    // Se i campi AI non sono ancora stati generati, usa mock per la demo
                    if (!res.scheda_operativa) {
                        const mock = getMockData(p.id);
                        setData({
                            ...mock,
                            id: res.id,
                            bando_titolo: res.bando_titolo || mock.bando_titolo,
                            ente_erogatore: res.ente_erogatore || mock.ente_erogatore,
                            scadenza: res.scadenza || mock.scadenza,
                            importo_max_euro: res.importo_max_euro || mock.importo_max_euro,
                            percentuale_fondo_perduto: res.percentuale_fondo_perduto ?? mock.percentuale_fondo_perduto,
                        });
                    } else {
                        setData(res);
                    }
                })
                .catch(() => setData(getMockData(p.id)))
                .finally(() => setLoading(false));
        });
    }, [params]);

    const backHref = profileId ? `/risultati?id=${profileId}` : '/risultati';

    function formatEuro(n: number) {
        return n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(1)}M` : `€${(n / 1000).toFixed(0)}k`;
    }

    function giorni(scadenza: string) {
        return Math.max(0, Math.round((new Date(scadenza).getTime() - Date.now()) / 86400000));
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-900 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <Link
                        href={backHref}
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Risultati
                    </Link>
                    <span className="text-sm font-semibold tracking-tight text-white">
                        Incentio <span className="text-zinc-500 font-normal">| Candidatura</span>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowReminder(true)}
                            className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors"
                        >
                            <Bell size={12} strokeWidth={1.5} />
                            Reminder
                        </button>
                        <button
                            onClick={() => alert('Generazione PDF in sviluppo — disponibile nella prossima versione.')}
                            className="flex items-center gap-1.5 text-xs font-medium bg-white text-black px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors"
                        >
                            <Download size={12} strokeWidth={1.5} />
                            Scarica PDF
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-8">
                {loading && (
                    <div className="flex flex-col items-center gap-4 py-24">
                        <Loader2 className="animate-spin text-zinc-400" size={32} />
                        <p className="text-zinc-400 text-sm font-medium">Preparazione candidatura...</p>
                    </div>
                )}

                {!loading && !data && (
                    <div className="flex flex-col items-center gap-3 py-24 text-center">
                        <AlertCircle size={32} className="text-zinc-550" />
                        <p className="text-zinc-400 text-sm">Candidatura non trovata.</p>
                    </div>
                )}

                {!loading && data && (
                    <div className="space-y-4">
                        {/* Top summary card */}
                        <div className="bg-[#121214] rounded-xl border border-zinc-850 p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="flex-1">
                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">
                                        Candidatura attiva
                                    </p>
                                    <h1 className="text-lg font-bold text-white tracking-tight leading-snug">{data.bando_titolo}</h1>
                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400 font-medium">
                                        <Building2 size={12} className="text-zinc-500" />
                                        {data.ente_erogatore}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-3.5 text-center">
                                    <div className="flex justify-center mb-1 text-zinc-400">
                                        <Percent size={14} strokeWidth={1.5} />
                                    </div>
                                    <div className="text-xl font-bold text-white">
                                        {data.percentuale_fondo_perduto != null ? `${data.percentuale_fondo_perduto}%` : '—'}
                                    </div>
                                    <div className="text-[10px] font-semibold text-zinc-500 uppercase mt-0.5 tracking-wider">Fondo perduto</div>
                                </div>
                                <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-3.5 text-center">
                                    <div className="flex justify-center mb-1 text-zinc-400">
                                        <CircleDollarSign size={14} strokeWidth={1.5} />
                                    </div>
                                    <div className="text-xl font-bold text-white">
                                        {data.importo_max_euro ? formatEuro(data.importo_max_euro) : '—'}
                                    </div>
                                    <div className="text-[10px] font-semibold text-zinc-500 uppercase mt-0.5 tracking-wider">Importo max</div>
                                </div>
                                <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-3.5 text-center">
                                    <div className="flex justify-center mb-1 text-zinc-400">
                                        <Calendar size={14} strokeWidth={1.5} />
                                    </div>
                                    <div className="text-xl font-bold text-white">
                                        {data.scadenza ? giorni(data.scadenza) : '—'}
                                    </div>
                                    <div className="text-[10px] font-semibold text-zinc-500 uppercase mt-0.5 tracking-wider">Giorni rimasti</div>
                                </div>
                            </div>
                        </div>

                        {/* Scheda Operativa */}
                        <Section title="Scheda Operativa" icon={FileText} defaultOpen={true}>
                            {data.scheda_operativa ? (
                                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                                    {data.scheda_operativa}
                                </p>
                            ) : (
                                <div className="bg-zinc-900/10 border border-zinc-800 rounded-lg p-6 text-center">
                                    <p className="text-zinc-500 text-xs font-medium">Pacchetto candidatura non ancora generato.</p>
                                    <p className="text-zinc-600 text-[10px] mt-0.5">Disponibile dopo la generazione AI.</p>
                                </div>
                            )}
                        </Section>

                        {/* Documenti */}
                        <Section title="Documenti Necessari" icon={CheckCircle2} defaultOpen={true}>
                            <div className="space-y-3">
                                {data.documenti && data.documenti.length > 0 ? (
                                    <>
                                        {/* Progress Dashboard */}
                                        {(() => {
                                            const total = data.documenti.length;
                                            const ready = data.documenti.filter(d => d.stato === 'gia_pronto' || d.generato).length;
                                            const pct = total > 0 ? Math.round((ready / total) * 100) : 0;
                                            return (
                                                <div className="mb-4">
                                                    <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 mb-1.5">
                                                        <span>Avanzamento Checklist</span>
                                                        <span className="text-white">{ready} su {total} ({pct}%)</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-900 border border-zinc-850 h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-white h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="flex gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex-wrap border-b border-zinc-850 pb-2">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                                {data.documenti.filter((d) => d.stato === 'gia_pronto').length} pronti
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-zinc-400" />
                                                {data.documenti.filter((d) => d.stato === 'da_preparare').length} da preparare
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                                {data.documenti.filter((d) => d.stato === 'da_verificare').length} da verificare
                                            </span>
                                        </div>

                                        <div className="space-y-1.5">
                                            {data.documenti.map((doc, i) => (
                                                <DocItem 
                                                    key={i} 
                                                    doc={doc} 
                                                    onView={handleViewDoc} 
                                                    onGenerate={handleGenerateDoc} 
                                                    generatingSlug={generatingSlug} 
                                                />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-zinc-500">Nessun documento specificato.</p>
                                )}
                            </div>
                        </Section>

                        {/* Business Plan */}
                        <Section title="Business Plan" icon={FileText} defaultOpen={false}>
                            {data.business_plan_template ? (
                                <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-850">
                                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-mono">
                                        {data.business_plan_template}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-zinc-900/10 border border-zinc-800 rounded-lg p-6 text-center">
                                    <p className="text-zinc-500 text-xs font-medium">Template non ancora disponibile.</p>
                                    <p className="text-zinc-650 text-[10px] mt-0.5">Disponibile dopo la generazione AI.</p>
                                </div>
                            )}
                        </Section>

                        {/* Timeline */}
                        <Section title="Timeline Candidatura" icon={Calendar} defaultOpen={true}>
                            <Timeline steps={data.timeline} />
                            {data.timeline && data.timeline.length > 0 && (
                                <div className="mt-4 text-[10px] font-bold tracking-wider text-zinc-500 uppercase pl-3">
                                    Durata stimata:{' '}
                                    <span className="font-bold text-zinc-300">
                                        {data.timeline.reduce((acc, s) => acc + s.giorni, 0)} giorni
                                    </span>
                                </div>
                            )}
                        </Section>

                        {/* FAQ */}
                        <Section title="FAQ" icon={AlertCircle} defaultOpen={false}>
                            <FaqAccordion faq={data.faq} />
                        </Section>

                        {/* Actions bar */}
                        <div className="flex flex-wrap gap-3 py-3 border-t border-zinc-900 mt-6 justify-end">
                            <button
                                onClick={() => setShowReminder(true)}
                                className="flex items-center gap-1.5 border border-zinc-850 text-zinc-300 font-medium text-xs px-4 py-2.5 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors"
                            >
                                <Bell size={13} strokeWidth={1.5} />
                                Imposta reminder email
                            </button>
                            <button
                                onClick={() => alert('Generazione PDF in sviluppo — disponibile nella prossima versione.')}
                                className="flex items-center gap-1.5 bg-white text-black font-medium text-xs px-4 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors"
                            >
                                <Download size={13} strokeWidth={1.5} />
                                Scarica pacchetto PDF
                            </button>
                        </div>
                    </div>
                )}
                {id && null}
            </div>

            {showReminder && <ReminderModal onClose={() => setShowReminder(false)} />}
            {selectedDoc && (
                <DocModal
                    doc={selectedDoc}
                    onClose={() => setSelectedDoc(null)}
                    onDownload={handleDownloadDoc}
                    onSave={async (newContent) => {
                        if (!id || !selectedDoc) return false;
                        try {
                            const res = await fetchAuth(`${API_BASE}/api/application/${id}/salva-documento`, {
                                method: 'POST',
                                body: JSON.stringify({ docName: selectedDoc.nome, contenuto: newContent }),
                            });
                            if (!res.ok) throw new Error('Errore di salvataggio');
                            const result = await res.json();
                            if (result.success) {
                                setData(prev => {
                                    if (!prev || !prev.documenti) return prev;
                                    const updated = prev.documenti.map(d => {
                                        if (d.slug === selectedDoc.slug) {
                                            return { ...d, generato: true, contenuto: newContent };
                                        }
                                        return d;
                                    });
                                    return { ...prev, documenti: updated };
                                });
                                setSelectedDoc(prev => prev ? { ...prev, contenuto: newContent } : null);
                                return true;
                            }
                        } catch (err) {
                            alert('Errore durante il salvataggio del documento.');
                            console.error(err);
                        }
                        return false;
                    }}
                />
            )}
        </div>
    );
}

// ── Email Reminder Modal ───────────────────────────────────────────────────
function ReminderModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#121214] rounded-xl shadow-xl border border-zinc-850 w-full max-w-sm p-6 space-y-4">
                {submitted ? (
                    <div className="text-center py-4 space-y-3">
                        <CheckCircle2 size={32} strokeWidth={1.5} className="text-emerald-400 mx-auto" />
                        <div>
                            <h3 className="font-semibold text-white text-sm">Reminder impostato!</h3>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                Ti invieremo un promemoria all&apos;indirizzo <span className="font-medium text-white">{email}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full py-2 bg-white text-black text-xs font-semibold rounded-md hover:bg-zinc-200 transition-colors focus:outline-none"
                        >
                            Chiudi
                        </button>
                    </div>
                ) : (
                    <>
                        <div>
                            <h3 className="font-semibold text-white text-sm">Imposta reminder email</h3>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                Ti avviseremo 7 giorni prima della scadenza del bando per finalizzare l&apos;invio.
                            </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="reminder-email" className="text-xs font-medium text-zinc-300">
                                Email aziendale
                            </label>
                            <input
                                id="reminder-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nome@azienda.it"
                                className="w-full px-3 py-2 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2 border border-zinc-800 text-zinc-400 text-xs font-medium rounded-md hover:bg-zinc-900 transition-colors focus:outline-none"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={() => email.trim() && setSubmitted(true)}
                                disabled={!email.trim()}
                                className="flex-1 py-2 bg-white text-black text-xs font-medium rounded-md hover:bg-zinc-200 disabled:opacity-40 transition-colors focus:outline-none"
                            >
                                Imposta reminder
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Doc Modal with inline editing ──────────────────────────────────────────
function DocModal({
    doc,
    onClose,
    onDownload,
    onSave
}: {
    doc: DocumentoStatus;
    onClose: () => void;
    onDownload: (doc: DocumentoStatus) => void;
    onSave: (newContent: string) => Promise<boolean>;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(doc.contenuto || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setEditContent(doc.contenuto || '');
        setIsEditing(false);
    }, [doc]);

    async function handleSave() {
        setSaving(true);
        const ok = await onSave(editContent);
        setSaving(false);
        if (ok) {
            setIsEditing(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#121214] rounded-xl shadow-xl border border-zinc-800 w-full max-w-2xl max-h-[85vh] flex flex-col p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                        <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                            <FileText size={16} strokeWidth={1.5} className="text-zinc-400" />
                            {doc.nome}
                        </h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                            {isEditing ? 'Modifica della bozza locale (file sul Desktop)' : 'Bozza generata per la candidatura'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white text-xl font-bold p-1 focus:outline-none"
                    >
                        &times;
                    </button>
                </div>
                
                {isEditing ? (
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        disabled={saving}
                        className="flex-1 min-h-[50vh] bg-zinc-950 border border-zinc-900 rounded-lg p-4 font-mono text-xs leading-relaxed text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none"
                    />
                ) : (
                    <div className="flex-1 overflow-y-auto bg-zinc-950 rounded-lg p-4 border border-zinc-900 font-mono text-xs leading-relaxed whitespace-pre-line text-zinc-300 max-h-[50vh]">
                        {doc.contenuto || "Nessun contenuto disponibile."}
                    </div>
                )}
                
                <div className="flex gap-3 pt-2 border-t border-zinc-900 justify-end">
                    {isEditing ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditContent(doc.contenuto || '');
                                    setIsEditing(false);
                                }}
                                disabled={saving}
                                className="px-4 py-2 border border-zinc-800 text-zinc-400 text-xs font-medium rounded-md hover:bg-zinc-900 transition-colors focus:outline-none"
                            >
                                Annulla
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-white text-black text-xs font-medium rounded-md hover:bg-zinc-200 transition-colors flex items-center gap-1.5 focus:outline-none"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Salvataggio...
                                    </>
                                ) : (
                                    'Salva Modifiche'
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-zinc-850 text-zinc-450 text-xs font-medium rounded-md hover:bg-zinc-900 transition-colors focus:outline-none"
                            >
                                Chiudi
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 border border-zinc-800 text-zinc-200 text-xs font-medium rounded-md hover:bg-zinc-800 transition-colors focus:outline-none"
                            >
                                Modifica testo
                            </button>
                            <button
                                type="button"
                                onClick={() => onDownload(doc)}
                                className="px-4 py-2 bg-white text-black text-xs font-medium rounded-md hover:bg-zinc-200 transition-colors flex items-center gap-1.5 focus:outline-none"
                            >
                                <Download size={12} strokeWidth={1.5} />
                                Scarica
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

