'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { salvaProfilo } from '@/lib/api';
import type { ProfiloAzienda, DimensioneAzienda } from '@/lib/types';
import Button from './ui/Button';
import Input from './ui/Input';

const PROVINCE_LOMBARDE = [
    'Bergamo', 'Brescia', 'Como', 'Cremona', 'Lecco', 'Lodi',
    'Mantova', 'Milano', 'Monza-Brianza', 'Pavia', 'Sondrio', 'Varese', 'Altra',
];

type SettoreGroup = { sezione: string; voci: { value: string; label: string }[] };

const SETTORI_ATECO_GROUPS: SettoreGroup[] = [
    {
        sezione: 'Sezione C — Manifattura',
        voci: [
            { value: '10', label: '10 — Industria alimentare' },
            { value: '13', label: '13 — Industria tessile' },
            { value: '22', label: '22 — Materie plastiche e gomma' },
            { value: '25', label: '25 — Lavorazione metalli' },
            { value: '28', label: '28 — Fabbricazione macchinari' },
            { value: '29', label: '29 — Automotive' },
            { value: '30', label: '30 — Altri mezzi di trasporto' },
            { value: '32', label: '32 — Altre industrie manifatturiere' },
        ],
    },
    {
        sezione: 'Sezione J — IT e Software',
        voci: [
            { value: '62', label: '62 — Sviluppo software e consulenza IT' },
            { value: '62.01', label: '62.01 — Produzione di software' },
            { value: '62.02', label: '62.02 — Consulenza IT' },
            { value: '63.11', label: '63.11 — Data center e hosting' },
            { value: '63.12', label: '63.12 — Portali web' },
        ],
    },
    {
        sezione: 'Sezione M — Ricerca e Ingegneria',
        voci: [
            { value: '71.12', label: '71.12 — Studi di ingegneria' },
            { value: '71.20', label: '71.20 — Collaudi e analisi tecniche' },
            { value: '72', label: '72 — Ricerca e sviluppo' },
            { value: '72.19', label: '72.19 — R&D scienze naturali e ingegneria' },
            { value: '72.20', label: '72.20 — R&D scienze sociali' },
        ],
    },
    {
        sezione: 'Sezione D — Energia',
        voci: [
            { value: '35', label: '35 — Fornitura energia elettrica e gas' },
            { value: '35.11', label: '35.11 — Produzione di energia elettrica' },
            { value: '35.13', label: '35.13 — Distribuzione di energia' },
            { value: '35.30', label: '35.30 — Vapore e aria condizionata' },
        ],
    },
    {
        sezione: 'Sezione E — Ambiente e Rifiuti',
        voci: [
            { value: '38.21', label: '38.21 — Trattamento rifiuti non pericolosi' },
            { value: '38.32', label: '38.32 — Recupero e riciclo materiali' },
            { value: '39.00', label: '39.00 — Risanamento ambientale' },
        ],
    },
    {
        sezione: 'Sezione H — Logistica e Trasporti',
        voci: [
            { value: '49.41', label: '49.41 — Trasporto merci su strada' },
            { value: '52.10', label: '52.10 — Magazzinaggio e custodia' },
            { value: '52.21', label: '52.21 — Servizi connessi ai trasporti' },
        ],
    },
    {
        sezione: 'Sezione P/Q — Istruzione e Sanità',
        voci: [
            { value: '85.42', label: '85.42 — Università e ricerca' },
            { value: '85.59', label: '85.59 — Altri tipi di istruzione' },
            { value: '85.60', label: '85.60 — Supporto all\'istruzione' },
            { value: '86.10', label: '86.10 — Ospedali e cliniche' },
            { value: '86.22', label: '86.22 — Studi medici specialistici' },
        ],
    },
];

// Lista piatta per ricerca
const SETTORI_ATECO_FLAT = SETTORI_ATECO_GROUPS.flatMap(g => g.voci);

const OBIETTIVI = [
    { value: 'digitalizzazione', label: 'Digitalizzazione e AI' },
    { value: 'energia', label: 'Efficienza energetica' },
    { value: 'formazione', label: 'Formazione personale' },
    { value: 'macchinari', label: 'Nuovi macchinari' },
    { value: 'ricerca', label: 'Ricerca e sviluppo' },
] as const;

type Obiettivo = (typeof OBIETTIVI)[number]['value'];

type FormData = {
    settore_ateco: string;
    dimensione: DimensioneAzienda | '';
    anno_fondazione: string;
    provincia: string;
    obiettivi: Obiettivo[];
    budget_coinvestimento: ProfiloAzienda['budget_coinvestimento'] | '';
    fatturato_range: ProfiloAzienda['fatturato_range'] | '';
    de_minimis: boolean | null;
    email: string;
};

const initialForm: FormData = {
    settore_ateco: '',
    dimensione: '',
    anno_fondazione: '',
    provincia: '',
    obiettivi: [],
    budget_coinvestimento: '',
    fatturato_range: '',
    de_minimis: null,
    email: '',
};

const STEP_LABELS = ['La tua azienda', 'I tuoi obiettivi', 'Ultima domanda'];

export default function ProfiloForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormData>(initialForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [settoreSearch, setSettoreSearch] = useState('');

    const progress = (step / 3) * 100;

    const toggleObiettivo = (val: Obiettivo) => {
        setForm((f) => ({
            ...f,
            obiettivi: f.obiettivi.includes(val)
                ? f.obiettivi.filter((o) => o !== val)
                : [...f.obiettivi, val],
        }));
    };

    const validateStep = (s: number): string => {
        if (s === 1) {
            if (!form.settore_ateco) return 'Seleziona il settore ATECO.';
            if (!form.dimensione) return 'Seleziona la dimensione aziendale.';
        }
        if (s === 2) {
            if (!form.fatturato_range) return 'Seleziona il fatturato annuo.';
            if (!form.budget_coinvestimento) return 'Seleziona il budget per co-investimento.';
        }
        return '';
    };

    const handleNext = () => {
        const err = validateStep(step);
        if (err) { setError(err); return; }
        setError('');
        setStep((s) => s + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const profilo: ProfiloAzienda = {
                settore_ateco: form.settore_ateco,
                dimensione: form.dimensione as DimensioneAzienda,
                fatturato_range: form.fatturato_range as ProfiloAzienda['fatturato_range'],
                provincia: form.provincia,
                anno_fondazione: parseInt(form.anno_fondazione) || new Date().getFullYear() - 10,
                obiettivi: form.obiettivi,
                budget_coinvestimento: form.budget_coinvestimento as ProfiloAzienda['budget_coinvestimento'],
                de_minimis: form.de_minimis,
            };
            const { id } = await salvaProfilo(profilo);
            router.push(`/risultati?id=${id}`);
        } catch {
            setError('Si è verificato un errore. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto font-sans text-zinc-100">
            {/* Progress */}
            <div className="mb-8">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
                    {STEP_LABELS.map((label, i) => (
                        <span key={label} className={i + 1 <= step ? 'text-indigo-400' : ''}>
                            {label}
                        </span>
                    ))}
                </div>
                <div className="h-1.5 bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Step 1 */}
            {step === 1 && (
                <div className="space-y-5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">La tua azienda</h2>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Settore ATECO</label>

                        {/* Ricerca */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Cerca settore..."
                                value={settoreSearch}
                                onChange={(e) => setSettoreSearch(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950/40 text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500"
                            />
                        </div>

                        {/* Lista filtrata */}
                        <div className="max-h-52 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950">
                            {(() => {
                                const q = settoreSearch.toLowerCase();
                                const gruppi = q
                                    ? [{ sezione: 'Risultati', voci: SETTORI_ATECO_FLAT.filter(v => v.label.toLowerCase().includes(q) || v.value.includes(q)) }]
                                    : SETTORI_ATECO_GROUPS;
                                return gruppi.map((g) => (
                                    g.voci.length === 0 ? null :
                                    <div key={g.sezione}>
                                        <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900 sticky top-0 border-b border-zinc-850">
                                            {g.sezione}
                                        </div>
                                        {g.voci.map((s) => (
                                            <button
                                                key={s.value}
                                                type="button"
                                                onClick={() => { setForm((f) => ({ ...f, settore_ateco: s.value })); setSettoreSearch(''); }}
                                                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                                    form.settore_ateco === s.value
                                                        ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                                                        : 'text-zinc-300 hover:bg-zinc-900/50'
                                                }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Selezione corrente */}
                        {form.settore_ateco && (
                            <p className="text-xs text-indigo-400 font-semibold mt-1">
                                ✓ {SETTORI_ATECO_FLAT.find(s => s.value === form.settore_ateco)?.label ?? form.settore_ateco}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Dimensione azienda</label>
                        <div className="grid grid-cols-2 gap-2">
                            {([
                                { value: 'micro', label: 'Micro', sub: '<10 dipendenti' },
                                { value: 'piccola', label: 'Piccola', sub: '10–49 dip.' },
                                { value: 'media', label: 'Media', sub: '50–249 dip.' },
                                { value: 'grande', label: 'Grande', sub: '250+ dip.' },
                            ] as const).map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, dimensione: opt.value }))}
                                    className={`p-3.5 rounded-lg border text-left transition-all ${form.dimensione === opt.value
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                                        }`}
                                >
                                    <div className={`font-semibold text-xs ${form.dimensione === opt.value ? 'text-indigo-400' : 'text-zinc-200'}`}>{opt.label}</div>
                                    <div className="text-[10px] text-zinc-500 font-medium mt-0.5">{opt.sub}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Input
                        label="Anno di fondazione"
                        id="anno"
                        type="number"
                        min={1900}
                        max={new Date().getFullYear()}
                        placeholder="es. 2005"
                        value={form.anno_fondazione}
                        onChange={(e) => setForm((f) => ({ ...f, anno_fondazione: e.target.value }))}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Provincia</label>
                        <select
                            value={form.provincia}
                            onChange={(e) => setForm((f) => ({ ...f, provincia: e.target.value }))}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950/40 text-zinc-150 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500"
                        >
                            <option value="">Seleziona provincia...</option>
                            {PROVINCE_LOMBARDE.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
                <div className="space-y-5">
                    <h2 className="text-lg font-bold text-white">I tuoi obiettivi</h2>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                            Cosa vuoi finanziare? <span className="text-zinc-500 font-normal lowercase">(scegli tutti)</span>
                        </label>
                        {OBIETTIVI.map((ob) => (
                          <CheckboxPrimitive.Root
                              key={ob.value}
                              id={ob.value}
                              checked={form.obiettivi.includes(ob.value)}
                              onCheckedChange={() => toggleObiettivo(ob.value)}
                              className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all text-left ${
                                  form.obiettivi.includes(ob.value)
                                      ? 'border-indigo-500 bg-indigo-500/10'
                                      : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                              }`}
                          >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                                  form.obiettivi.includes(ob.value) ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-750 bg-zinc-950'
                              }`}>
                                  <CheckboxPrimitive.Indicator>
                                      <Check size={11} className="text-white" />
                                  </CheckboxPrimitive.Indicator>
                              </div>
                              <label htmlFor={ob.value} className={`text-xs font-semibold cursor-pointer ${form.obiettivi.includes(ob.value) ? 'text-indigo-400' : 'text-zinc-200'}`}>
                                  {ob.label}
                              </label>
                          </CheckboxPrimitive.Root>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Budget per co-investimento</label>
                        {([
                            { value: '<10k', label: 'Meno di €10.000' },
                            { value: '10k-50k', label: '€10.000 – €50.000' },
                            { value: '50k-200k', label: '€50.000 – €200.000' },
                            { value: '>200k', label: 'Più di €200.000' },
                        ] as const).map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, budget_coinvestimento: opt.value }))}
                                className={`p-3.5 rounded-lg border text-left text-xs font-semibold transition-all ${form.budget_coinvestimento === opt.value
                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                        : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 text-zinc-300'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Fatturato annuo</label>
                        {([
                            { value: '<500k', label: 'Meno di €500.000' },
                            { value: '500k-2M', label: '€500k – €2 milioni' },
                            { value: '2M-10M', label: '€2M – €10 milioni' },
                            { value: '>10M', label: 'Più di €10 milioni' },
                        ] as const).map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, fatturato_range: opt.value }))}
                                className={`p-3.5 rounded-lg border text-left text-xs font-semibold transition-all ${form.fatturato_range === opt.value
                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                        : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 text-zinc-300'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
                <div className="space-y-5">
                    <h2 className="text-lg font-bold text-white">Ultima domanda</h2>

                    <div className="flex flex-col gap-3">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                            Avete già ricevuto contributi pubblici negli ultimi 3 anni?
                        </label>
                        <div className="bg-indigo-950/10 border border-indigo-900/20 rounded-lg p-3 text-xs text-indigo-400 leading-relaxed font-medium">
                            <strong>Cos'è il de minimis?</strong> La normativa UE prevede un limite massimo di €300.000
                            in 3 anni per aiuti &quot;de minimis&quot; a impresa. Sapere se avete già ricevuto contributi
                            ci aiuta a filtrare i bandi più adatti.
                        </div>
                        {([
                            { value: true, label: 'Sì, abbiamo ricevuto contributi' },
                            { value: false, label: 'No, non abbiamo ricevuto contributi' },
                            { value: null, label: 'Non so / Da verificare' },
                        ] as const).map((opt) => (
                            <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, de_minimis: opt.value }))}
                                className={`p-3.5 rounded-lg border text-left text-xs font-semibold transition-all ${form.de_minimis === opt.value
                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                        : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 text-zinc-300'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <Input
                        label="Email aziendale (per ricevere la lista bandi)"
                        id="email"
                        type="email"
                        placeholder="nome@azienda.it"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />

                    {error && <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3.5 py-2.5 font-medium">{error}</p>}
                </div>
            )}

            {/* Error (steps 1 & 2) */}
            {step < 3 && error && <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3.5 py-2.5 font-medium mt-4">{error}</p>}

            {/* Nav */}
            <div className="flex gap-3 mt-8">
                {step > 1 && (
                    <Button
                        variant="secondary"
                        onClick={() => { setError(''); setStep((s) => s - 1); }}
                        className="flex-1 gap-1 text-xs py-2.5"
                    >
                        <ChevronLeft size={14} /> Indietro
                    </Button>
                )}
                {step < 3 ? (
                    <Button onClick={handleNext} className="flex-1 gap-1 text-xs py-2.5">
                        Avanti <ChevronRight size={14} />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={loading} className="flex-1 text-xs py-2.5">
                        {loading ? 'Ricerca bandi...' : 'Trova i miei bandi →'}
                    </Button>
                )}
            </div>
        </div>
    );
}
