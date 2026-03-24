'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  UploadCloud, FileText, X, AlertCircle, CheckCircle2,
  Circle, Loader2, Download, ChevronDown, ChevronUp,
  AlertTriangle, Clock, Info, Bot,
} from 'lucide-react';
import Link from 'next/link';
import ChatBot from '@/components/visura/ChatBot';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// ── Types ─────────────────────────────────────────────────────────────── //

type Phase = 'upload' | 'loading' | 'results';
type Status = 'uploaded' | 'parsing' | 'parsed' | 'advising' | 'complete' | 'error';

interface FAQ { domanda: string; risposta: string; }
interface Bando {
  id: string; titolo: string; ente_erogatore: string;
  importo_max_eur: number; scadenza: string; score_compatibilita: number;
  motivazione: string; difficolta: string; scadenza_urgenza: 'ALTA' | 'MEDIA' | 'BASSA';
  documenti_necessari: string[]; documenti_da_raccogliere: string[];
  requisiti_mancanti: string[]; azioni_preparatorie: string[];
  timeline_candidatura_giorni: number; faq: FAQ[];
}
interface NuovoAteco {
  codice: string; descrizione: string; motivazione: string;
  bandi_sbloccati: string[]; valore_potenziale_eur: number;
  difficolta_apertura: string; procedura_apertura: string;
}
interface AltraStrategia {
  tipo: string; descrizione: string;
  bandi_sbloccati: string[]; valore_potenziale_eur: number;
}
interface AdvisoryReport {
  sintesi_azienda: {
    descrizione: string; punti_di_forza: string[]; criticita: string[];
    ragione_sociale?: string; forma_giuridica?: string;
    ateco_primario?: string; comune?: string; provincia?: string; dimensione?: string;
  };
  bandi_prioritari: Bando[];
  nuovi_ateco_consigliati: NuovoAteco[];
  altre_strategie: AltraStrategia[];
  piano_azione: { immediato_30gg: string[]; breve_termine_90gg: string[]; medio_termine_6mesi: string[]; };
  stima_valore_totale_eur: number;
  nota_disclaimer: string;
}

// ── Helpers ────────────────────────────────────────────────────────────── //

const eur = (n: number) =>
  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const dateIt = (s: string) => {
  try { return new Date(s).toLocaleDateString('it-IT'); } catch { return s; }
};

const addDays = (d: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + d);
  return dt.toLocaleDateString('it-IT');
};

const scoreColor = (s: number) =>
  s >= 70 ? 'text-green-400 bg-green-400/10 border-green-400/30' :
  s >= 40 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' :
            'text-orange-400 bg-orange-400/10 border-orange-400/30';

const scoreBarColor = (s: number) =>
  s >= 70 ? 'bg-green-400' : s >= 40 ? 'bg-yellow-400' : 'bg-orange-400';

const urgencyBadge = (u: string) =>
  u === 'ALTA' ? 'bg-red-500/15 text-red-400 border-red-400/30' :
  u === 'MEDIA' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-400/30' :
                  'bg-green-500/15 text-green-400 border-green-400/30';

// ── LOADING STEPS ────────────────────────────────────────────────────── //

const STEPS = ['Visura caricata', 'Estrazione dati aziendali', 'Ricerca bandi compatibili', 'Generazione report'];

const STATUS_STEP: Record<Status, number> = {
  uploaded: 0, parsing: 1, parsed: 2, advising: 3, complete: 4, error: -1,
};

// ── Sub-components ────────────────────────────────────────────────────── //

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors">
        {title}
        {open ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

const TABS = ['Documenti', 'Timeline', 'FAQ', 'Azioni'] as const;
type Tab = typeof TABS[number];

function BandoCard({ bando, sessionId }: { bando: Bando; sessionId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('Documenti');
  const [expanded, setExpanded] = useState(false);
  const actionsKey = `incentio_azioni_${sessionId}_${bando.id}`;
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(actionsKey) ?? '{}'); } catch { return {}; }
  });

  const toggleAction = (action: string) => {
    const next = { ...checked, [action]: !checked[action] };
    setChecked(next);
    localStorage.setItem(actionsKey, JSON.stringify(next));
  };

  const downloadChecklist = () => {
    const lines = [
      `CHECKLIST DOCUMENTI — ${bando.titolo}\n`,
      '✅ Documenti già in tuo possesso:',
      ...bando.documenti_necessari.map((d) => `  - ${d}`),
      '',
      '⚠️ Documenti da raccogliere:',
      ...bando.documenti_da_raccogliere.map((d) => `  - ${d}`),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `checklist_${bando.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0F1F3D]/60 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base leading-tight">{bando.titolo}</h3>
            <p className="text-white/50 text-sm mt-0.5">{bando.ente_erogatore}</p>
          </div>
          <div className={`shrink-0 px-3 py-1.5 rounded-lg border text-sm font-bold ${scoreColor(bando.score_compatibilita)}`}>
            {bando.score_compatibilita}%
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 mb-4 overflow-hidden">
          <div className={`h-full rounded-full ${scoreBarColor(bando.score_compatibilita)}`} style={{ width: `${bando.score_compatibilita}%` }} />
        </div>
        <div className="flex flex-wrap gap-3 text-sm mb-3">
          <span className="text-white/60">
            <span className="text-white font-semibold">{eur(bando.importo_max_eur)}</span> max
          </span>
          <span className="text-white/30">·</span>
          <span className="text-white/60">Scadenza: <span className="text-white font-semibold">{dateIt(bando.scadenza)}</span></span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${urgencyBadge(bando.scadenza_urgenza)}`}>
            {bando.scadenza_urgenza}
          </span>
        </div>
        <p className="text-white/60 text-sm leading-relaxed">{bando.motivazione}</p>
        <button onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#38BDF8] hover:text-[#38BDF8]/80 transition-colors">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Meno dettagli' : 'Più dettagli'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/10">
          <div className="flex border-b border-white/10 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium shrink-0 transition-colors
                  ${activeTab === tab ? 'text-[#38BDF8] border-b-2 border-[#38BDF8] -mb-px' : 'text-white/40 hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="p-5">
            {activeTab === 'Documenti' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
                    <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">Hai già ✓</p>
                    <ul className="space-y-1.5">
                      {bando.documenti_necessari.length === 0 && <li className="text-white/30 text-sm">—</li>}
                      {bando.documenti_necessari.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                          <CheckCircle2 size={14} className="text-green-400 mt-0.5 shrink-0" />{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4">
                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-3">Da raccogliere ⚠</p>
                    <ul className="space-y-1.5">
                      {bando.documenti_da_raccogliere.length === 0 && <li className="text-white/30 text-sm">—</li>}
                      {bando.documenti_da_raccogliere.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                          <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0" />{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button onClick={downloadChecklist}
                  className="text-sm font-semibold px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 hover:text-white transition-all flex items-center gap-2">
                  <Download size={14} /> Genera checklist
                </button>
              </div>
            )}

            {activeTab === 'Timeline' && (
              <div className="relative pl-2">
                <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-white/10 rounded-full" />
                {[
                  { label: 'Oggi', date: new Date().toLocaleDateString('it-IT'), color: 'bg-[#38BDF8]' },
                  { label: 'Raccolta documenti', date: addDays(Math.round(bando.timeline_candidatura_giorni / 3)), color: 'bg-yellow-400' },
                  { label: 'Invio candidatura', date: addDays(Math.round(bando.timeline_candidatura_giorni * 0.8)), color: 'bg-orange-400' },
                  { label: 'Risposta ente', date: addDays(bando.timeline_candidatura_giorni), color: 'bg-green-400' },
                ].map((m, i) => (
                  <div key={i} className="flex items-start gap-4 mb-5 last:mb-0">
                    <div className={`w-6 h-6 rounded-full ${m.color} shrink-0 z-10 mt-0.5`} />
                    <div>
                      <p className="text-white text-sm font-semibold">{m.label}</p>
                      <p className="text-white/40 text-xs">{m.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'FAQ' && (
              <div className="space-y-3">
                {bando.faq.length === 0 && <p className="text-white/30 text-sm">Nessuna FAQ disponibile.</p>}
                {bando.faq.map((f, i) => (
                  <Accordion key={i} title={f.domanda}>
                    <p className="text-white/70 text-sm leading-relaxed pt-1">{f.risposta}</p>
                  </Accordion>
                ))}
              </div>
            )}

            {activeTab === 'Azioni' && (
              <ul className="space-y-3">
                {bando.azioni_preparatorie.length === 0 && <li className="text-white/30 text-sm">Nessuna azione.</li>}
                {bando.azioni_preparatorie.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <input type="checkbox" id={`${bando.id}-action-${i}`}
                      checked={!!checked[a]} onChange={() => toggleAction(a)}
                      className="w-4 h-4 rounded accent-[#38BDF8] mt-0.5 cursor-pointer shrink-0" />
                    <label htmlFor={`${bando.id}-action-${i}`}
                      className={`text-sm cursor-pointer leading-relaxed ${checked[a] ? 'line-through text-white/30' : 'text-white/80'}`}>
                      {a}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── UPLOAD PHASE ──────────────────────────────────────────────────────── //

function UploadPhase({ onSuccess, isNew }: { onSuccess: (sessionId: string) => void; isNew: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const validate = (f: File): string => {
    if (f.type !== 'application/pdf') return 'Il file deve essere un PDF.';
    if (f.size > 10 * 1024 * 1024) return 'Il file non può superare 10 MB.';
    return '';
  };

  const pick = (f: File) => {
    const err = validate(f);
    if (err) { setError(err); return; }
    setError(''); setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pick(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = () => {
    if (!file) return;
    setError(''); setUploading(true); setProgress(0);
    const fd = new FormData();
    fd.append('visura', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/visura/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          localStorage.setItem('visura_session_id', data.session_id);
          onSuccess(data.session_id);
        } catch {
          setError('Risposta non valida dal server. Riprova.');
          setUploading(false);
        }
      } else {
        setError(`Errore upload (${xhr.status}). Riprova.`);
        setUploading(false);
      }
    };
    xhr.onerror = () => { setError('Errore di rete. Controlla la connessione.'); setUploading(false); };
    xhr.send(fd);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl">
        {isNew && (
          <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-cyan-400/30 bg-[#0F1F3D] px-5 py-4">
            <div>
              <p className="text-white font-semibold text-sm">
                👋 Benvenuto in Incentio · Carica la tua visura camerale per ricevere subito i bandi compatibili
              </p>
              <Link href="/onboarding" className="text-cyan-400 text-xs hover:underline mt-1 inline-block">
                Preferisci inserire i dati manualmente? →
              </Link>
            </div>
          </div>
        )}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-white mb-2">Visura Camerale</h1>
          <p className="text-white/50 text-sm">
            Carica la visura in PDF. Analizziamo i tuoi dati e troviamo i bandi compatibili.
          </p>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !file && !uploading && fileInputRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed transition-all duration-200 p-10 flex flex-col items-center gap-4 text-center
            ${dragging ? 'border-[#38BDF8] bg-[#38BDF8]/10 cursor-copy' : 'border-white/20 hover:border-[#38BDF8]/50 hover:bg-white/5 cursor-pointer'}
            ${file ? 'cursor-default' : ''}`}
        >
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }} disabled={uploading} />

          {!file ? (
            <>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${dragging ? 'bg-[#38BDF8]/20' : 'bg-white/5'}`}>
                <UploadCloud size={32} className={dragging ? 'text-[#38BDF8]' : 'text-white/40'} />
              </div>
              <div>
                <p className="text-white font-semibold">Trascina qui il tuo PDF</p>
                <p className="text-white/40 text-sm mt-1">oppure clicca per selezionarlo</p>
              </div>
              <p className="text-xs text-white/25">Solo PDF · max 10 MB</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#38BDF8]/10 flex items-center justify-center">
                <FileText size={28} className="text-[#38BDF8]" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold max-w-xs mx-auto truncate">{file.name}</p>
                <p className="text-white/40 text-sm mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!uploading && (
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              )}
            </>
          )}
        </div>

        {uploading && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-white/50 mb-1.5">
              <span>Upload in corso…</span><span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-[#38BDF8] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-300 text-sm font-semibold">Errore</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <button onClick={handleUpload} disabled={!file || uploading}
          className={`mt-6 w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
            ${file && !uploading
              ? 'bg-[#38BDF8] text-[#0A0F1E] hover:opacity-90 shadow-lg shadow-[#38BDF8]/20 cursor-pointer'
              : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
          <UploadCloud size={18} />
          {uploading ? 'Upload in corso…' : 'Analizza la Visura'}
        </button>

        <p className="text-center text-xs text-white/25 mt-4">
          I dati vengono elaborati in modo sicuro e non condivisi con terze parti.
        </p>
      </div>
    </div>
  );
}

// ── LOADING PHASE ─────────────────────────────────────────────────────── //

function LoadingPhase({ sessionId, onComplete }: { sessionId: string; onComplete: (report: AdvisoryReport) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseDone = useRef({ parse: false, advise: false });

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/visura/status/${sessionId}`);
        if (!res.ok) throw new Error();
        const data: { status: Status } = await res.json();
        const step = STATUS_STEP[data.status];
        if (step >= 0) setCurrentStep(step);
        if (data.status === 'complete') {
          stopPolling();
          // Fetch the advisory report
          const cacheKey = `incentio_advisory_${sessionId}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) { onComplete(JSON.parse(cached)); return; }
          const rpt = await fetch(`${API_BASE}/api/visura/advise`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (!rpt.ok) throw new Error();
          const rptData: { advisory: AdvisoryReport } = await rpt.json();
          localStorage.setItem(cacheKey, JSON.stringify(rptData.advisory));
          onComplete(rptData.advisory);
        }
        if (data.status === 'error') { stopPolling(); setError('Errore durante l\'elaborazione.'); }
      } catch {
        stopPolling(); setError('Errore di connessione durante il polling.');
      }
    };

    const run = async () => {
      try {
        if (!phaseDone.current.parse) {
          setCurrentStep(1);
          const r = await fetch(`${API_BASE}/api/visura/parse`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (!r.ok) throw new Error('Parse failed');
          phaseDone.current.parse = true;
        }
        if (!phaseDone.current.advise) {
          setCurrentStep(2);
          const r = await fetch(`${API_BASE}/api/visura/advise`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (!r.ok) throw new Error('Advise failed');
          phaseDone.current.advise = true;
        }
        setCurrentStep(3);
        pollingRef.current = setInterval(poll, 2000);
      } catch {
        setError('Errore durante l\'elaborazione. Ricarica la pagina e riprova.');
      }
    };

    run();
    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#38BDF8]/10 mb-4">
            <Loader2 size={32} className="text-[#38BDF8] animate-spin" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Analisi in corso…</h1>
          <p className="text-white/50 text-sm">Stiamo elaborando la visura e cercando i bandi più compatibili.</p>
        </div>

        <div className="space-y-3">
          {STEPS.map((label, i) => {
            const done = currentStep > i;
            const active = currentStep === i;
            return (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                ${done ? 'border-[#38BDF8]/30 bg-[#38BDF8]/5' : active ? 'border-[#38BDF8]/50 bg-[#38BDF8]/10' : 'border-white/10 bg-white/2'}`}>
                <div className="shrink-0">
                  {done ? <CheckCircle2 size={24} className="text-[#38BDF8]" /> :
                   active ? <Loader2 size={24} className="text-[#38BDF8] animate-spin" /> :
                   <Circle size={24} className="text-white/20" />}
                </div>
                <span className={`text-sm font-medium ${done || active ? 'text-white' : 'text-white/30'}`}>{label}</span>
                {done && <span className="ml-auto text-xs text-[#38BDF8] font-semibold">Completato</span>}
                {active && <span className="ml-auto text-xs text-[#38BDF8]/60 font-medium">In corso…</span>}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <p className="text-center text-xs text-white/25 mt-8">L&apos;analisi può richiedere da 30 secondi a qualche minuto.</p>
      </div>
    </div>
  );
}

// ── RESULTS PHASE ─────────────────────────────────────────────────────── //

function ResultsPhase({ report, sessionId }: { report: AdvisoryReport; sessionId: string }) {
  const s = report.sintesi_azienda;

  const downloadReport = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/visura/report/${sessionId}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `report_visura_${sessionId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0">
      {/* ── LEFT: ChatBot ─────────────────────────────────────────────── */}
      <aside className="md:w-[35%] md:sticky md:top-[65px] md:h-[calc(100vh-65px)] order-2 md:order-1 shrink-0 border-t md:border-t-0 border-white/10">
        <ChatBot sessionId={sessionId} />
      </aside>

      {/* ── RIGHT: Content ────────────────────────────────────────────── */}
      <main className="md:w-[65%] overflow-y-auto order-1 md:order-2 px-6 py-8 space-y-10">

        {/* ── A: Header Azienda ─────────────────────────────────────── */}
        <section className="rounded-xl border border-white/10 bg-[#0F1F3D]/60 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-white leading-tight">
                {s.ragione_sociale ?? 'La tua azienda'}
              </h1>
              <div className="flex flex-wrap gap-2 mt-3">
                {s.forma_giuridica && <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60 font-medium">{s.forma_giuridica}</span>}
                {s.ateco_primario && <span className="text-xs px-2.5 py-1 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 font-mono font-semibold">{s.ateco_primario}</span>}
                {s.dimensione && <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60 font-medium">{s.dimensione}</span>}
                {(s.comune ?? s.provincia) && <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60 font-medium">{[s.comune, s.provincia].filter(Boolean).join(', ')}</span>}
              </div>
              <p className="text-white/60 text-sm leading-relaxed mt-3">{s.descrizione}</p>
              {(s.punti_di_forza.length > 0 || s.criticita.length > 0) && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  {s.punti_di_forza.length > 0 && (
                    <div>
                      <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Punti di forza</p>
                      <ul className="space-y-1">
                        {s.punti_di_forza.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                            <CheckCircle2 size={13} className="text-green-400 mt-0.5 shrink-0" />{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {s.criticita.length > 0 && (
                    <div>
                      <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">Criticità</p>
                      <ul className="space-y-1">
                        {s.criticita.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                            <AlertTriangle size={13} className="text-yellow-400 mt-0.5 shrink-0" />{c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={downloadReport}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38BDF8] text-[#0A0F1E] font-bold text-sm hover:opacity-90 shadow-lg shadow-[#38BDF8]/20 transition-all self-start">
              <Download size={16} /> Scarica report PDF
            </button>
          </div>
        </section>

        {/* ── B: Bandi compatibili ──────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-1">I tuoi bandi</h2>
          <p className="text-white/50 text-sm mb-5">compatibili ora con la tua visura</p>
          {report.bandi_prioritari.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center rounded-xl border border-white/10">
              <FileText size={32} className="text-white/20" />
              <p className="text-white/40 text-sm">Nessun bando trovato.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {report.bandi_prioritari.slice(0, 5).map((bando) => (
                <BandoCard key={bando.id} bando={bando} sessionId={sessionId} />
              ))}
            </div>
          )}
        </section>

        {/* ── C: Come accedere ad altri fondi ──────────────────────── */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-1">Come accedere ad ancora più fondi</h2>
          <p className="text-white/50 text-sm mb-6">Strategie per ampliare il tuo accesso ai finanziamenti pubblici</p>

          {/* C1 — ATECO consigliati */}
          {report.nuovi_ateco_consigliati.length > 0 && (
            <div className="mb-8">
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#38BDF8]/10 flex items-center justify-center">
                  <Bot size={13} className="text-[#38BDF8]" />
                </span>
                Nuovi codici ATECO consigliati
              </h3>
              <div className="space-y-4">
                {report.nuovi_ateco_consigliati.map((a, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-[#0F1F3D]/60 p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#38BDF8] font-mono font-bold text-sm mr-2">{a.codice}</span>
                        <span className="text-white font-semibold text-sm">{a.descrizione}</span>
                      </div>
                      <span className="text-green-400 font-bold text-lg whitespace-nowrap shrink-0">{eur(a.valore_potenziale_eur)}</span>
                    </div>
                    <p className="text-white/60 text-sm mb-3 leading-relaxed">{a.motivazione}</p>
                    {a.bandi_sbloccati.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {a.bandi_sbloccati.map((b, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-white/60">{b}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-white/40">Difficoltà apertura:</span>
                      <span className="text-xs font-semibold text-white/80 bg-white/10 px-2 py-0.5 rounded-full">{a.difficolta_apertura}</span>
                    </div>
                    <Accordion title="Come aprire questo codice ATECO">
                      <p className="text-white/70 text-sm leading-relaxed pt-1">{a.procedura_apertura}</p>
                    </Accordion>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* C2 — Altre strategie */}
          {report.altre_strategie.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center">
                  <Info size={13} className="text-purple-400" />
                </span>
                Altre strategie
              </h3>
              <div className="space-y-4">
                {report.altre_strategie.map((str, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-[#0F1F3D]/60 p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-white font-bold text-sm">{str.tipo}</h4>
                      <span className="text-green-400 font-bold text-base whitespace-nowrap shrink-0">{eur(str.valore_potenziale_eur)}</span>
                    </div>
                    <p className="text-white/60 text-sm mb-3 leading-relaxed">{str.descrizione}</p>
                    {str.bandi_sbloccati.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {str.bandi_sbloccati.map((b, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-white/60">{b}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── D: Piano di azione ───────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-5">Piano di azione consigliato</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Nei prossimi 30 giorni', items: report.piano_azione.immediato_30gg, bg: 'bg-blue-500/5 border-blue-500/20', accent: 'text-blue-400', dot: 'bg-blue-400' },
              { label: '30–90 giorni', items: report.piano_azione.breve_termine_90gg, bg: 'bg-indigo-500/5 border-indigo-500/20', accent: 'text-indigo-400', dot: 'bg-indigo-400' },
              { label: '3–6 mesi', items: report.piano_azione.medio_termine_6mesi, bg: 'bg-purple-500/5 border-purple-500/20', accent: 'text-purple-400', dot: 'bg-purple-400' },
            ].map(({ label, items, bg, accent, dot }, i) => (
              <div key={i} className={`rounded-xl border p-5 ${bg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className={accent} />
                  <p className={`text-xs font-bold uppercase tracking-wider ${accent}`}>{label}</p>
                </div>
                {items.length === 0 ? (<p className="text-white/30 text-sm">—</p>) : (
                  <ul className="space-y-2">
                    {items.map((item, j) => (
                      <li key={j} className="text-sm text-white/80 flex items-start gap-2 leading-relaxed">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />{item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
            <p className="text-white/60 text-sm mb-1">Valore totale fondi potenzialmente accessibili</p>
            <p className="text-4xl font-extrabold text-green-400">{eur(report.stima_valore_totale_eur)}</p>
          </div>
          <p className="text-xs text-white/25 mt-4 leading-relaxed text-center px-4">{report.nota_disclaimer}</p>
        </section>
      </main>
    </div>
  );
}

// ── ROOT PAGE ─────────────────────────────────────────────────────────── //

export default function VisuraPage() {
  const searchParams = useSearchParams();
  const isNew = searchParams.get('nuovo') === 'true';
  const [phase, setPhase] = useState<Phase>('upload');
  const [sessionId, setSessionId] = useState<string>('');
  const [report, setReport] = useState<AdvisoryReport | null>(null);

  // Restore session on mount
  useEffect(() => {
    const sid = localStorage.getItem('visura_session_id');
    const cacheKey = sid ? `incentio_advisory_${sid}` : null;
    const cached = cacheKey ? localStorage.getItem(cacheKey) : null;
    if (sid && cached) {
      try {
        setSessionId(sid);
        setReport(JSON.parse(cached));
        setPhase('results');
      } catch { /* fresh start */ }
    }
  }, []);

  const handleUploadSuccess = (sid: string) => {
    setSessionId(sid);
    setPhase('loading');
  };

  const handleAnalysisComplete = (rpt: AdvisoryReport) => {
    setReport(rpt);
    setPhase('results');
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0F1E]/90 backdrop-blur border-b border-[#38BDF8]/15 px-6 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl">
              <span className="font-extrabold text-white">Incent</span>
              <span className="font-extrabold text-[#38BDF8]">io</span>
            </Link>
            {phase !== 'upload' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#38BDF8] font-medium">
                {phase === 'loading' ? 'Elaborazione…' : 'Report pronto'}
              </span>
            )}
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-white/60">
            <Link href="/candidature" className="hover:text-white transition-colors">Candidature</Link>
            {phase !== 'upload' && (
              <button
                onClick={() => { setPhase('upload'); setSessionId(''); setReport(null); localStorage.removeItem('visura_session_id'); }}
                className="hover:text-white transition-colors">
                Nuova Visura
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Phase content */}
      {phase === 'upload' && <UploadPhase onSuccess={handleUploadSuccess} isNew={isNew} />}
      {phase === 'loading' && <LoadingPhase sessionId={sessionId} onComplete={handleAnalysisComplete} />}
      {phase === 'results' && report && <ResultsPhase report={report} sessionId={sessionId} />}
    </div>
  );
}
