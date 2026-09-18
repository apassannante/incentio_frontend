'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Download, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  Clock, FileText, Bot, AlertCircle, Loader2, Info,
} from 'lucide-react';
import Link from 'next/link';
import ChatBot from '@/components/visura/ChatBot';
import { fetchAuth } from '@/lib/fetchAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ── Types ─────────────────────────────────────────────────────────────── //

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

const eur = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const dateIt = (s: string) => {
  if (!s || s === 'Invalid Date') return 'Da definire';
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(s)) {
    return s.replace(/-/g, '/');
  }
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('it-IT');
    }
  } catch {}
  return s;
};
const addDays = (d: number) => {
  if (isNaN(d) || typeof d !== 'number') return 'Da definire';
  const dt = new Date(); dt.setDate(dt.getDate() + d);
  return dt.toLocaleDateString('it-IT');
};

const scoreColor = (s: number) =>
  s >= 70 ? 'text-green-400 bg-green-400/10 border-green-400/30' :
  s >= 40 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' :
            'text-orange-400 bg-orange-400/10 border-orange-400/30';

const scoreBar = (s: number) =>
  s >= 70 ? 'bg-green-400' : s >= 40 ? 'bg-yellow-400' : 'bg-orange-400';

const urgencyBadge = (u: 'ALTA' | 'MEDIA' | 'BASSA') =>
  u === 'ALTA' ? 'bg-red-500/15 text-red-400 border-red-400/30' :
  u === 'MEDIA' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-400/30' :
                  'bg-green-500/15 text-green-400 border-green-400/30';

// ── Accordion wrapper ──────────────────────────────────────────────────── //

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean; }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors"
      >
        {title}
        {open ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ── Tab system ────────────────────────────────────────────────────────── //

const TABS = ['Documenti', 'Timeline', 'FAQ', 'Azioni'] as const;
type Tab = typeof TABS[number];

function BandoCard({ bando, sessionId, profileId }: { bando: Bando; sessionId: string; profileId: string | null }) {
  const [activeTab, setActiveTab] = useState<Tab>('Documenti');
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const router = useRouter();

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

  const generateChecklist = () => {
    const lines = [
      'CHECKLIST DOCUMENTI\n',
      '✅ Documenti già in tuo possesso:',
      ...bando.documenti_necessari.map((d) => `  - ${d}`),
      '',
      '⚠️ Documenti da raccogliere:',
      ...bando.documenti_da_raccogliere.map((d) => `  - ${d}`),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `checklist_${bando.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCandidati = async () => {
    if (!profileId) {
      setApplyError('Accedi o registrati per poterti candidare.');
      return;
    }
    setApplying(true);
    setApplyError('');
    try {
      const res = await fetchAuth(`${API_BASE}/api/application/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bandoId: bando.id, profileId }),
      });
      if (!res.ok) throw new Error('Candidatura failed');
      const data = await res.json();
      router.push(`/application/${data.id}?profileId=${profileId}`);
    } catch (err) {
      setApplyError('Errore durante il salvataggio. Riprova.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base leading-tight line-clamp-2">{bando.titolo}</h3>
            <p className="text-zinc-500 text-sm mt-0.5">{bando.ente_erogatore}</p>
          </div>
          <div className={`shrink-0 px-3 py-1.5 rounded-lg border text-sm font-bold ${scoreColor(bando.score_compatibilita)}`}>
            {bando.score_compatibilita}%
          </div>
        </div>
 
        {/* Score bar */}
        <div className="h-1.5 rounded-full bg-zinc-800 mb-4 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${scoreBar(bando.score_compatibilita)}`} style={{ width: `${bando.score_compatibilita}%` }} />
        </div>
 
        {/* Meta row */}
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="text-zinc-400">
            <span className="text-white font-semibold">{eur(bando.importo_max_eur)}</span> max
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-400">
            Scadenza: <span className="text-white font-semibold">{dateIt(bando.scadenza)}</span>
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${urgencyBadge(bando.scadenza_urgenza)}`}>
            {bando.scadenza_urgenza}
          </span>
        </div>
 
        <p className="text-zinc-400 text-sm mt-3 leading-relaxed">{bando.motivazione}</p>
 
        <div className="flex items-center justify-between flex-wrap gap-2 mt-4 pt-3 border-t border-zinc-800">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Meno dettagli' : 'Più dettagli'}
          </button>
          <button
            onClick={handleCandidati}
            disabled={applying}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-200/50"
          >
            {applying ? (
              <><Loader2 size={12} className="animate-spin" /> In corso...</>
            ) : (
              'Candidati Ora →'
            )}
          </button>
        </div>
        {applyError && (
          <p className="text-xs text-red-400 text-right mt-1.5">
            {applyError.includes('Accedi') ? (
              <span>
                Devi <Link href="/auth" className="underline font-bold hover:text-red-350">accedere o registrarti</Link> per candidarti.
              </span>
            ) : (
              applyError
            )}
          </p>
        )}
      </div>
 
      {/* Accordion tabs */}
      {expanded && (
        <div className="border-t border-zinc-800">
          {/* Tab list */}
          <div className="flex border-b border-zinc-800 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium shrink-0 transition-colors
                  ${activeTab === tab
                    ? 'text-white border-b-2 border-white -mb-px'
                    : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
 
          <div className="p-5">
            {/* DOCUMENTI */}
            {activeTab === 'Documenti' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
                  <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">Hai già ✓</p>
                  <ul className="flex flex-col gap-1.5">
                    {bando.documenti_necessari.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                        <CheckCircle2 size={14} className="text-green-400 mt-0.5 shrink-0" />
                        {d}
                      </li>
                    ))}
                    {bando.documenti_necessari.length === 0 && <li className="text-zinc-600 text-sm">—</li>}
                  </ul>
                </div>
                <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4">
                  <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-3">Da raccogliere ⚠</p>
                  <ul className="flex flex-col gap-1.5">
                    {bando.documenti_da_raccogliere.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                        <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                        {d}
                      </li>
                    ))}
                    {bando.documenti_da_raccogliere.length === 0 && <li className="text-zinc-600 text-sm">—</li>}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={generateChecklist}
                    className="text-sm font-semibold px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all flex items-center gap-2"
                  >
                    <Download size={14} /> Genera checklist
                  </button>
                </div>
              </div>
            )}
 
            {/* TIMELINE */}
            {activeTab === 'Timeline' && (
              <div className="relative">
                <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-zinc-800 rounded-full" />
                {[
                  { label: 'Oggi', date: new Date().toLocaleDateString('it-IT'), color: 'bg-zinc-400' },
                  { label: 'Raccolta documenti', date: addDays(Math.round(bando.timeline_candidatura_giorni / 3)), color: 'bg-yellow-400' },
                  { label: 'Invio candidatura', date: addDays(Math.round(bando.timeline_candidatura_giorni * 0.8)), color: 'bg-orange-400' },
                  { label: 'Risposta ente', date: addDays(bando.timeline_candidatura_giorni), color: 'bg-green-400' },
                ].map((m, i) => (
                  <div key={i} className="flex items-start gap-4 mb-5 last:mb-0 relative">
                    <div className={`w-6 h-6 rounded-full ${m.color} shrink-0 z-10 mt-0.5`} />
                    <div>
                      <p className="text-zinc-100 text-sm font-semibold">{m.label}</p>
                      <p className="text-zinc-500 text-xs">{m.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
 
            {/* FAQ */}
            {activeTab === 'FAQ' && (
              <div className="flex flex-col gap-3">
                {bando.faq.length === 0 && <p className="text-zinc-600 text-sm">Nessuna FAQ disponibile.</p>}
                {bando.faq.map((f, i) => (
                  <Accordion key={i} title={f.domanda}>
                    <p className="text-zinc-300 text-sm leading-relaxed pt-1">{f.risposta}</p>
                  </Accordion>
                ))}
              </div>
            )}
 
            {/* AZIONI */}
            {activeTab === 'Azioni' && (
              <ul className="flex flex-col gap-3">
                {bando.azioni_preparatorie.length === 0 && <li className="text-zinc-600 text-sm">Nessuna azione.</li>}
                {bando.azioni_preparatorie.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`${bando.id}-${i}`}
                      checked={!!checked[a]}
                      onChange={() => toggleAction(a)}
                      className="w-4 h-4 rounded accent-zinc-100 mt-0.5 cursor-pointer shrink-0"
                    />
                    <label htmlFor={`${bando.id}-${i}`} className={`text-sm cursor-pointer leading-relaxed ${checked[a] ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
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

// ── Skeleton ──────────────────────────────────────────────────────────── //

function Skeleton() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="text-zinc-500 animate-spin" />
        <p className="text-zinc-500 text-sm">Caricamento risultati…</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────── //

export default function VisuraResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = (params?.sessionId as string)
    ?? (typeof window !== 'undefined' ? localStorage.getItem('visura_session_id') ?? '' : '');

  const [report, setReport] = useState<AdvisoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const sb = createClient();
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user?.id) {
          setProfileId(session.user.id);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (!sessionId) { router.push('/visura/upload'); return; }

    const cacheKey = `incentio_advisory_${sessionId}`;
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        setReport(JSON.parse(cached));
        setLoading(false);
        return;
      } catch { /* fall through */ }
    }

    fetchAuth(`${API_BASE}/api/visura/advise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then((r) => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then((data: { advisory: AdvisoryReport }) => {
        localStorage.setItem(cacheKey, JSON.stringify(data.advisory));
        setReport(data.advisory);
      })
      .catch(() => setError('Errore nel caricamento del report. Riprova.'))
      .finally(() => setLoading(false));
  }, [sessionId, router]);

  const downloadReport = async () => {
    try {
      const res = await fetchAuth(`${API_BASE}/api/visura/report/${sessionId}`);
      if (!res.ok) throw new Error(`Errore server (Stato: ${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `report_visura_${sessionId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF Download Error:', err);
      alert(`Impossibile scaricare il report PDF: ${err?.message || 'errore sconosciuto'}`);
    }
  };

  if (loading) return <Skeleton />;

  if (error || !report) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-6">
      <div className="max-w-sm text-center flex flex-col items-center gap-4">
        <AlertCircle size={40} className="text-red-450" />
        <p className="text-white font-bold text-lg">Errore nel caricamento</p>
        <p className="text-zinc-500 text-sm">{error || 'Report non disponibile.'}</p>
        <button
          onClick={() => { setError(''); setLoading(true); setReport(null); }}
          className="px-6 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border border-zinc-200/50 font-bold text-sm"
        >
          Riprova
        </button>
        <Link href="/visura/upload" className="text-sm text-zinc-500 hover:text-zinc-300">← Torna all&apos;upload</Link>
      </div>
    </div>
  );

  const s = report.sintesi_azienda;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl">
            <span className="font-extrabold text-white">Incent</span>
            <span className="font-extrabold text-zinc-400">io</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <Link href="/candidature" className="hover:text-white transition-colors">Candidature</Link>
            <Link href="/visura/upload" className="hover:text-white transition-colors">Nuova Visura</Link>
            {profileId ? (
              <Link href={`/risultati?id=${profileId}`} className="hover:text-white transition-colors">I tuoi bandi</Link>
            ) : (
              <Link href="/auth" className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors">Accedi</Link>
            )}
          </nav>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">

        {/* ── LEFT: ChatBot ─────────────────────────────────────────────── */}
        <aside className="md:w-[35%] md:sticky md:top-[65px] md:h-[calc(100vh-65px)] order-2 md:order-1 border-t md:border-t-0 border-zinc-800">
          <ChatBot sessionId={sessionId} />
        </aside>

        {/* ── RIGHT: Content ────────────────────────────────────────────── */}
        <main className="md:w-[65%] overflow-y-auto order-1 md:order-2 px-6 py-8 space-y-10">

          {/* ── SEZIONE A: Header Azienda ─────────────────────────────── */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-extrabold text-white leading-tight">
                  {s.ragione_sociale ?? 'La tua azienda'}
                </h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  {s.forma_giuridica && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium">{s.forma_giuridica}</span>
                  )}
                  {s.ateco_primario && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono font-semibold">{s.ateco_primario}</span>
                  )}
                  {s.dimensione && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium">{s.dimensione}</span>
                  )}
                  {(s.comune ?? s.provincia) && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium">
                      {[s.comune, s.provincia].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed mt-3">{s.descrizione}</p>
                {/* Strengths & Weaknesses */}
                {(s.punti_di_forza.length > 0 || s.criticita.length > 0) && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    {s.punti_di_forza.length > 0 && (
                      <div>
                        <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Punti di forza</p>
                        <ul className="space-y-1">
                          {s.punti_di_forza.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-350">
                              <CheckCircle2 size={13} className="text-green-400 mt-0.5 shrink-0" />
                              {p}
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
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-350">
                              <AlertTriangle size={13} className="text-yellow-400 mt-0.5 shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={downloadReport}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 font-bold text-sm hover:bg-zinc-200 shadow-lg shadow-zinc-900/50 transition-all self-start border border-zinc-200/50"
              >
                <Download size={16} /> Scarica report PDF
              </button>
            </div>
          </section>

          {/* ── SEZIONE B: Bandi compatibili ──────────────────────────── */}
          <section>
            <h2 className="text-xl font-extrabold text-white mb-1">I tuoi bandi</h2>
            <p className="text-zinc-500 text-sm mb-5">compatibili ora con la tua visura</p>
            {report.bandi_prioritari.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center rounded-xl border border-zinc-800">
                <FileText size={32} className="text-zinc-650" />
                <p className="text-zinc-500 text-sm">Nessun bando trovato.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {report.bandi_prioritari.slice(0, 5).map((bando) => (
                  <BandoCard key={bando.id} bando={bando} sessionId={sessionId} profileId={profileId} />
                ))}
              </div>
            )}
          </section>

          {/* ── SEZIONE C: Come accedere ad ancora più fondi ───────────────── */}
          <section>
            <h2 className="text-xl font-extrabold text-white mb-1">Come accedere ad ancora più fondi</h2>
            <p className="text-zinc-500 text-sm mb-6">Strategie per ampliare il tuo acesso ai finanziamenti pubblici</p>

            {/* C1 — ATECO */}
            {report.nuovi_ateco_consigliati.length > 0 && (
              <div className="mb-8">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Bot size={13} className="text-zinc-400" />
                  </span>
                  Nuovi codici ATECO consigliati
                </h3>
                <div className="flex flex-col gap-4">
                  {report.nuovi_ateco_consigliati.map((a, i) => (
                    <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-850 text-zinc-300 font-mono font-bold text-sm mr-2">
                            {a.codice}
                          </span>
                          <span className="text-white font-semibold text-sm">{a.descrizione}</span>
                        </div>
                        <span className="text-green-400 font-bold text-lg whitespace-nowrap shrink-0">{eur(a.valore_potenziale_eur)}</span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-3 leading-relaxed">{a.motivazione}</p>
                      {a.bandi_sbloccati.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {a.bandi_sbloccati.map((b, j) => (
                            <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">{b}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-zinc-500">Difficoltà apertura:</span>
                        <span className="text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">{a.difficolta_apertura}</span>
                      </div>
                      <Accordion title="Come aprire questo codice ATECO">
                        <p className="text-zinc-300 text-sm leading-relaxed pt-1">{a.procedura_apertura}</p>
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
                  <span className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Info size={13} className="text-zinc-400" />
                  </span>
                  Altre strategie
                </h3>
                <div className="flex flex-col gap-4">
                  {report.altre_strategie.map((str, i) => (
                    <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="text-white font-bold text-sm">{str.tipo}</h4>
                        <span className="text-green-400 font-bold text-base whitespace-nowrap shrink-0">{eur(str.valore_potenziale_eur)}</span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-3 leading-relaxed">{str.descrizione}</p>
                      {str.bandi_sbloccati.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {str.bandi_sbloccati.map((b, j) => (
                            <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">{b}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── SEZIONE D: Piano di azione ───────────────────────────── */}
          <section>
            <h2 className="text-xl font-extrabold text-white mb-5">Piano di azione consigliato</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Nei prossimi 30 giorni', items: report.piano_azione.immediato_30gg, bg: 'bg-blue-950/10 border-blue-900/30', accent: 'text-blue-400' },
                { label: '30–90 giorni', items: report.piano_azione.breve_termine_90gg, bg: 'bg-indigo-950/10 border-indigo-900/30', accent: 'text-indigo-400' },
                { label: '3–6 mesi', items: report.piano_azione.medio_termine_6mesi, bg: 'bg-purple-950/10 border-purple-900/30', accent: 'text-purple-400' },
              ].map(({ label, items, bg, accent }, i) => (
                <div key={i} className={`rounded-xl border p-5 ${bg}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={14} className={accent} />
                    <p className={`text-xs font-bold uppercase tracking-wider ${accent}`}>{label}</p>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-zinc-500 text-sm">—</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((item, j) => (
                        <li key={j} className="text-sm text-zinc-300 flex items-start gap-2 leading-relaxed">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${accent.replace('text-', 'bg-')}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Valore totale */}
            <div className="rounded-xl border border-green-900/20 bg-green-950/10 p-6 text-center">
              <p className="text-zinc-400 text-sm mb-1">Valore totale fondi potenzialmente accessibili</p>
              <p className="text-4xl font-extrabold text-green-400">{eur(report.stima_valore_totale_eur)}</p>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-zinc-600 mt-4 leading-relaxed text-center px-4">
              {report.nota_disclaimer}
            </p>
          </section>

        </main>
      </div>
    </div>
  );
}
