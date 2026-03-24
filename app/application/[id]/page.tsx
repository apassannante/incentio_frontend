'use client';

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
        <div className="bg-[#0F1F3D] rounded-2xl border border-[#38BDF8]/20 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon size={18} className="text-[#38BDF8]" />
                    <span className="font-bold text-white">{title}</span>
                </div>
                {open ? (
                    <ChevronUp size={18} className="text-white/40" />
                ) : (
                    <ChevronDown size={18} className="text-white/40" />
                )}
            </button>
            {open && <div className="px-6 pb-6">{children}</div>}
        </div>
    );
}

// ── Document item ──────────────────────────────────────────────────────────
function DocItem({ doc }: { doc: DocumentoStatus }) {
    const config = {
        gia_pronto: {
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            label: 'Pronto',
        },
        da_preparare: {
            icon: Clock,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            label: 'Da preparare',
        },
        da_verificare: {
            icon: XCircle,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            label: 'Da verificare',
        },
    }[doc.stato];

    const Icon = config.icon;
    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl border ${config.bg} ${config.border}`}
        >
            <Icon size={18} className={`${config.color} shrink-0`} />
            <span className="text-sm text-white/80 flex-1">{doc.nome}</span>
            <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
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
                                    ? 'bg-[#38BDF8] border-[#38BDF8]'
                                    : 'bg-[#0A0F1E] border-white/20'
                                }`}
                        >
                            {step.completato && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0A0F1E]" />
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
                <div key={i} className="border border-[#38BDF8]/20 rounded-xl overflow-hidden">
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

// ── Email Reminder Modal ───────────────────────────────────────────────────
function ReminderModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-[#0F1F3D] rounded-2xl shadow-xl border border-[#38BDF8]/20 w-full max-w-md p-6 space-y-4">
                {submitted ? (
                    <div className="text-center py-4">
                        <CheckCircle2 size={40} className="text-[#38BDF8] mx-auto mb-3" />
                        <h3 className="font-bold text-white">Reminder impostato!</h3>
                        <p className="text-sm text-white/50 mt-1">
                            Ti invieremo un promemoria all&apos;indirizzo {email}
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-6 py-2.5 bg-[#38BDF8] text-[#0A0F1E] text-sm font-semibold rounded-lg hover:bg-[#2fa3d6] transition-colors"
                        >
                            Chiudi
                        </button>
                    </div>
                ) : (
                    <>
                        <div>
                            <h3 className="font-bold text-white text-lg">Imposta reminder email</h3>
                            <p className="text-sm text-white/50 mt-1">
                                Ti avviseremo 7 giorni prima della scadenza del bando.
                            </p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="reminder-email" className="text-sm font-medium text-white/80">
                                Email aziendale
                            </label>
                            <input
                                id="reminder-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nome@azienda.it"
                                className="w-full px-4 py-2.5 rounded-lg border border-[#38BDF8]/20 bg-white/5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                            />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-white/10 text-white/70 text-sm font-semibold rounded-lg hover:bg-white/5 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={() => email.trim() && setSubmitted(true)}
                                disabled={!email.trim()}
                                className="flex-1 px-4 py-2.5 bg-[#38BDF8] text-[#0A0F1E] text-sm font-semibold rounded-lg hover:bg-[#2fa3d6] disabled:opacity-40 transition-colors"
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

export default function ApplicationPage({ params }: PageProps) {
    const searchParams = useSearchParams();
    const profileId = searchParams.get('profileId') || '';

    const [id, setId] = useState('');
    const [data, setData] = useState<ApplicationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showReminder, setShowReminder] = useState(false);

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
        <div className="min-h-screen bg-[#0A0F1E] text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#0A0F1E]/90 backdrop-blur border-b border-[#38BDF8]/10 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <Link
                        href={backHref}
                        className="flex items-center gap-1.5 text-sm text-white/50 hover:text-[#38BDF8] transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Risultati
                    </Link>
                    <span className="text-xl font-bold">
                        <span className="text-white">Incent</span><span className="text-[#38BDF8]">io</span>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowReminder(true)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#38BDF8] border border-[#38BDF8]/40 px-3 py-1.5 rounded-lg hover:bg-[#38BDF8]/10 transition-colors"
                        >
                            <Bell size={13} />
                            Reminder
                        </button>
                        <button
                            onClick={() => alert('Generazione PDF in sviluppo — disponibile nella prossima versione.')}
                            className="flex items-center gap-1.5 text-xs font-semibold bg-[#38BDF8] text-[#0A0F1E] px-3 py-1.5 rounded-lg hover:bg-[#2fa3d6] transition-colors"
                        >
                            <Download size={13} />
                            Scarica PDF
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-8">
                {loading && (
                    <div className="flex flex-col items-center gap-4 py-24">
                        <Loader2 className="animate-spin text-[#38BDF8]" size={36} />
                        <p className="text-white/50">Preparazione candidatura...</p>
                    </div>
                )}

                {!loading && !data && (
                    <div className="flex flex-col items-center gap-3 py-24 text-center">
                        <AlertCircle size={36} className="text-red-400" />
                        <p className="text-white/60">Candidatura non trovata.</p>
                    </div>
                )}

                {!loading && data && (
                    <div className="space-y-4">
                        {/* Top summary card */}
                        <div className="bg-[#0F1F3D] rounded-2xl border border-[#38BDF8]/20 p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="flex-1">
                                    <p className="text-xs text-[#38BDF8] font-semibold uppercase tracking-wide mb-1">
                                        Candidatura attiva
                                    </p>
                                    <h1 className="text-xl font-bold text-white leading-snug">{data.bando_titolo}</h1>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                                        <Building2 size={12} />
                                        {data.ente_erogatore}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <div className="flex justify-center mb-1">
                                        <Percent size={14} className="text-[#38BDF8]" />
                                    </div>
                                    <div className="text-2xl font-black text-[#38BDF8]">
                                        {data.percentuale_fondo_perduto != null ? `${data.percentuale_fondo_perduto}%` : '—'}
                                    </div>
                                    <div className="text-xs text-white/40 mt-0.5">Fondo perduto</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <div className="flex justify-center mb-1">
                                        <CircleDollarSign size={14} className="text-white/40" />
                                    </div>
                                    <div className="text-2xl font-black text-white">
                                        {data.importo_max_euro ? formatEuro(data.importo_max_euro) : '—'}
                                    </div>
                                    <div className="text-xs text-white/40 mt-0.5">Importo max</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <div className="flex justify-center mb-1">
                                        <Calendar size={14} className="text-white/40" />
                                    </div>
                                    <div className="text-2xl font-black text-white">
                                        {data.scadenza ? giorni(data.scadenza) : '—'}
                                    </div>
                                    <div className="text-xs text-white/40 mt-0.5">Giorni rimasti</div>
                                </div>
                            </div>
                        </div>

                        {/* Scheda Operativa */}
                        <Section title="Scheda Operativa" icon={FileText} defaultOpen={true}>
                            {data.scheda_operativa ? (
                                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                                    {data.scheda_operativa}
                                </p>
                            ) : (
                                <div className="bg-[#0F1F3D] border border-[#38BDF8]/20 rounded-xl p-6 text-center">
                                    <p className="text-white/60 text-sm">Pacchetto candidatura non ancora generato.</p>
                                    <p className="text-white/40 text-xs mt-1">Disponibile dopo la generazione AI.</p>
                                </div>
                            )}
                        </Section>

                        {/* Documenti */}
                        <Section title="Documenti Necessari" icon={CheckCircle2} defaultOpen={true}>
                            <div className="space-y-2">
                                {data.documenti && data.documenti.length > 0 ? (
                                    <>
                                        <div className="flex gap-4 text-xs text-white/40 mb-3 flex-wrap">
                                            <span className="flex items-center gap-1.5">
                                                <CheckCircle2 size={12} className="text-emerald-400" />
                                                {data.documenti.filter((d) => d.stato === 'gia_pronto').length} già pronti
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={12} className="text-yellow-400" />
                                                {data.documenti.filter((d) => d.stato === 'da_preparare').length} da preparare
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <XCircle size={12} className="text-red-400" />
                                                {data.documenti.filter((d) => d.stato === 'da_verificare').length} da verificare
                                            </span>
                                        </div>
                                        {data.documenti.map((doc, i) => (
                                            <DocItem key={i} doc={doc} />
                                        ))}
                                    </>
                                ) : (
                                    <p className="text-sm text-white/40">Nessun documento specificato.</p>
                                )}
                            </div>
                        </Section>

                        {/* Business Plan */}
                        <Section title="Business Plan" icon={FileText} defaultOpen={false}>
                            {data.business_plan_template ? (
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line font-mono">
                                        {data.business_plan_template}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-[#0F1F3D] border border-[#38BDF8]/20 rounded-xl p-6 text-center">
                                    <p className="text-white/60 text-sm">Template non ancora disponibile.</p>
                                    <p className="text-white/40 text-xs mt-1">Disponibile dopo la generazione AI.</p>
                                </div>
                            )}
                        </Section>

                        {/* Timeline */}
                        <Section title="Timeline Candidatura" icon={Calendar} defaultOpen={true}>
                            <Timeline steps={data.timeline} />
                            {data.timeline && data.timeline.length > 0 && (
                                <div className="mt-4 text-xs text-white/40 pl-3">
                                    Totale stimato:{' '}
                                    <span className="font-semibold text-white">
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
                        <div className="flex flex-wrap gap-3 py-2">
                            <button
                                onClick={() => setShowReminder(true)}
                                className="flex items-center gap-2 border border-[#38BDF8]/40 text-[#38BDF8] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#38BDF8]/10 transition-colors"
                            >
                                <Bell size={16} />
                                Imposta reminder email
                            </button>
                            <button
                                onClick={() => alert('Generazione PDF in sviluppo — disponibile nella prossima versione.')}
                                className="flex items-center gap-2 bg-[#38BDF8] text-[#0A0F1E] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#2fa3d6] transition-colors"
                            >
                                <Download size={16} />
                                Scarica pacchetto PDF
                            </button>
                        </div>
                    </div>
                )}
                {/* suppress unused id */}
                {id && null}
            </div>

            {showReminder && <ReminderModal onClose={() => setShowReminder(false)} />}
        </div>
    );
}
