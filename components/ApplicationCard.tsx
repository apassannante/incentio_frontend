'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, AlertCircle, FileText, ArrowRight, Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export interface BandoInfo {
  titolo: string;
  scadenza: string;
  importo_max_euro: number;
}

export interface GapAnalysis {
  score_ammissibilita: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Application {
  id: string;
  bando_id: string;
  profile_id: string;
  stato: string;
  created_at: string;
  gap_analysis: GapAnalysis | null;
  scheda_operativa?: unknown;
  checklist?: ChecklistItem[] | null;
  // Campi bando denormalizzati (non più join su tabella bandi)
  bando_titolo: string | null;
  bando_scadenza: string | null;
  bando_importo_max_euro: number | null;
  /** @deprecated usare i campi flat bando_* */
  bandi?: BandoInfo | null;
}

export function giorniAllaScadenza(scadenza: string): number {
  const now = new Date();
  const end = new Date(scadenza);
  return Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatEuro(n: number): string {
  if (!n) return '—';
  return n >= 1_000_000
    ? `€${(n / 1_000_000).toFixed(1)}M`
    : `€${(n / 1_000).toFixed(0)}k`;
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export type StatoBadge = 'Salvato' | 'In corso' | 'Completato' | 'Scadenza vicina' | 'Scaduta';

export function computeStato(app: Application): StatoBadge {
  const scadenza = app.bando_scadenza ?? app.bandi?.scadenza;
  const giorni = scadenza ? giorniAllaScadenza(scadenza) : 999;
  if (giorni < 0) return 'Scaduta';
  if (giorni <= 14) return 'Scadenza vicina';
  if (app.stato === 'completed' || app.stato === 'pronto') return 'Completato';
  if (app.stato === 'in_corso' || app.scheda_operativa) return 'In corso';
  return 'Salvato';
}

export function statoBadgeStyle(stato: StatoBadge): string {
  switch (stato) {
    case 'Completato':         return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
    case 'In corso':           return 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/25';
    case 'Scadenza vicina':    return 'bg-amber-400/15 text-amber-300 border border-amber-400/25';
    case 'Scaduta':            return 'bg-red-400/15 text-red-300 border border-red-400/25';
    default:                   return 'bg-white/10 text-white/60 border border-white/15'; // Salvato
  }
}

export function statoIcon(stato: StatoBadge) {
  switch (stato) {
    case 'Completato':        return <CheckCircle2 size={13} className="text-emerald-400" />;
    case 'In corso':          return <Loader2 size={13} className="text-[#38BDF8] animate-spin" />;
    case 'Scadenza vicina':   return <AlertCircle size={13} className="text-amber-300" />;
    case 'Scaduta':           return <AlertCircle size={13} className="text-red-300" />;
    default:                  return <FileText size={13} className="text-white/40" />; // Salvato
  }
}

export function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 60) return 'bg-amber-400';
  return 'bg-red-400';
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-[#0F1F3D] rounded-2xl border border-[#38BDF8]/10 p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="h-5 bg-white/10 rounded w-2/3" />
        <div className="h-6 w-24 bg-white/10 rounded-full" />
      </div>
      <div className="h-4 bg-white/5 rounded w-1/3" />
      <div className="h-3 bg-white/5 rounded w-full" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-4 bg-white/5 rounded w-24" />
        <div className="h-8 w-28 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}

function ChecklistSection({ appId, items }: { appId: string; items: ChecklistItem[] }) {
  const storageKey = `checklist-${appId}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setChecked(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [storageKey]);

  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
  }

  const doneCount = items.filter(i => checked[i.id]).length;
  const total = items.length;

  return (
    <div className="border border-[#38BDF8]/15 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/8 transition-colors text-sm"
      >
        <span className="font-semibold text-white/80">
          Documenti richiesti
          <span className={`ml-2 text-xs font-normal ${doneCount === total ? 'text-[#38BDF8]' : 'text-white/40'}`}>
            {doneCount}/{total} completati
          </span>
        </span>
        {open ? <ChevronUp size={15} className="text-white/40" /> : <ChevronDown size={15} className="text-white/40" />}
      </button>

      {open && (
        <ul className="divide-y divide-white/5">
          {items.map(item => (
            <li key={item.id}>
              <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={!!checked[item.id]}
                  onChange={() => toggle(item.id)}
                  className="w-4 h-4 accent-[#38BDF8] rounded"
                />
                <span className={`text-sm ${checked[item.id] ? 'line-through text-white/30' : 'text-white/70'}`}>
                  {item.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-[#38BDF8] transition-all duration-300"
          style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

export default function ApplicationCard({ app }: { app: Application }) {
  const stato = computeStato(app);
  const score = app.gap_analysis?.score_ammissibilita ?? null;
  const scadenza = app.bando_scadenza ?? app.bandi?.scadenza ?? null;
  const titolo = app.bando_titolo ?? app.bandi?.titolo ?? 'Bando senza titolo';
  const importo = app.bando_importo_max_euro ?? app.bandi?.importo_max_euro ?? null;
  const giorni = scadenza ? giorniAllaScadenza(scadenza) : null;

  return (
    <div className="bg-[#0F1F3D] rounded-2xl border border-[#38BDF8]/20 hover:border-[#38BDF8]/50 hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
            {titolo}
          </h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statoBadgeStyle(stato)}`}>
          {statoIcon(stato)}
          {stato}
        </span>
      </div>

      <div className="flex items-center gap-4 flex-wrap text-sm text-white/50">
        {importo && (
          <span className="font-semibold text-[#38BDF8]">{formatEuro(importo)}</span>
        )}
        {scadenza && (
          <span className="flex items-center gap-1">
            <Calendar size={13} className="text-white/40" />
            Scadenza {formatDate(scadenza)}
            {giorni !== null && giorni >= 0 && giorni <= 14 && (
              <span className="text-amber-300 font-semibold ml-1">({giorni} gg)</span>
            )}
          </span>
        )}
      </div>

      {score !== null && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Ammissibilità</span>
            <span className="font-semibold text-white">{score}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      {app.checklist && app.checklist.length > 0 && (
        <ChecklistSection appId={app.id} items={app.checklist} />
      )}

      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#38BDF8]/10">
        <span className="text-xs text-white/40">
          <FileText size={12} className="inline mr-1" />
          Avviata il {formatDate(app.created_at)}
        </span>
        <Link
          href={`/bando/${app.bando_id}?tab=candidatura`}
          className="inline-flex items-center gap-1.5 bg-[#38BDF8] text-[#0A0F1E] text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-all"
        >
          Vedi pacchetto <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
