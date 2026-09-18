'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FolderOpen, Plus, ChevronRight, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Milestone = { id: string; nome: string; status: string; data_scadenza: string | null };
type Project = {
  id: string; nome: string; status: string; bando_id: string | null;
  descrizione: string | null; importo_richiesto: number | null;
  data_fine: string | null; created_at: string;
  project_milestones: Milestone[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  bozza:           { label: 'Bozza',           color: 'bg-zinc-900 text-zinc-400 border border-zinc-800',   icon: <FileText size={12} /> },
  attivo:          { label: 'Attivo',           color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',   icon: <Clock size={12} /> },
  presentato:      { label: 'Presentato',       color: 'bg-amber-400/15 text-amber-300 border border-amber-400/25', icon: <Clock size={12} /> },
  approvato:       { label: 'Approvato',        color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25', icon: <CheckCircle size={12} /> },
  rifiutato:       { label: 'Rifiutato',        color: 'bg-red-400/15 text-red-300 border border-red-400/25',     icon: <AlertCircle size={12} /> },
  rendicontazione: { label: 'Rendicontazione',  color: 'bg-purple-500/15 text-purple-400 border border-purple-500/25', icon: <FileText size={12} /> },
  chiuso:          { label: 'Chiuso',           color: 'bg-zinc-900 text-zinc-500 border border-zinc-850',   icon: <CheckCircle size={12} /> },
};

const MILESTONE_STATUS: Record<string, string> = {
  da_fare: '⬜', in_corso: '🔵', completato: '✅', in_ritardo: '🔴',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ nome: '', descrizione: '', importo_richiesto: '', data_fine: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) { setLoading(false); return; }
      setToken(session.access_token);
      const pid = localStorage.getItem('incentio_profile_id');
      if (pid) { setProfileId(pid); loadProjects(pid, session.access_token); }
      else setLoading(false);
    });
  }, []);

  async function loadProjects(pid: string, tok: string) {
    setLoading(true);
    const r = await fetch(`${API}/api/consulting/projects/${pid}`, { headers: { Authorization: `Bearer ${tok}` } });
    if (r.ok) setProjects(await r.json());
    setLoading(false);
  }

  async function createProject() {
    if (!profileId || !token || !newForm.nome) return;
    const r = await fetch(`${API}/api/consulting/projects`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        nome: newForm.nome,
        descrizione: newForm.descrizione || undefined,
        importo_richiesto: newForm.importo_richiesto ? Number(newForm.importo_richiesto) : undefined,
        data_fine: newForm.data_fine || undefined,
      }),
    });
    if (r.ok) {
      setShowNew(false);
      setNewForm({ nome: '', descrizione: '', importo_richiesto: '', data_fine: '' });
      loadProjects(profileId, token);
    }
  }

  const grouped = projects.reduce<Record<string, Project[]>>((acc, p) => {
    const g = p.status === 'rendicontazione' || p.status === 'approvato' ? 'In corso' : p.status === 'chiuso' || p.status === 'rifiutato' ? 'Conclusi' : 'Aperti';
    (acc[g] = acc[g] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-900">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderOpen size={20} className="text-zinc-300" /> Progetti
            </h1>
            <p className="text-xs text-zinc-550 text-zinc-500 mt-1 font-medium">Gestisci candidature, milestone e rendicontazione</p>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/consulting" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
              ← Consulting Agent
            </Link>
            <button onClick={() => setShowNew(true)}
              className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 shadow-sm">
              <Plus size={14} /> Nuovo progetto
            </button>
          </div>
        </div>

        {/* New project form */}
        {showNew && (
          <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 p-6 mb-8 shadow-xl backdrop-blur-md">
            <h3 className="font-semibold text-sm text-white mb-4">Nuovo progetto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Nome progetto *</label>
                <input value={newForm.nome} onChange={e => setNewForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" placeholder="Es: Bando 4.0 Regione Lombardia 2025" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Descrizione</label>
                <textarea value={newForm.descrizione} onChange={e => setNewForm(f => ({ ...f, descrizione: e.target.value }))}
                  rows={2} className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Importo richiesto (€)</label>
                <input type="number" value={newForm.importo_richiesto} onChange={e => setNewForm(f => ({ ...f, importo_richiesto: e.target.value }))}
                  className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Scadenza progetto</label>
                <input type="date" value={newForm.data_fine} onChange={e => setNewForm(f => ({ ...f, data_fine: e.target.value }))}
                  className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowNew(false)} className="text-zinc-400 text-xs font-semibold px-4 py-2 hover:bg-zinc-900/50 hover:text-white rounded-lg transition-colors">Annulla</button>
              <button onClick={createProject} className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors">Crea Progetto</button>
            </div>
          </div>
        )}

        {loading && <div className="text-center text-zinc-500 py-24 text-xs font-semibold">Caricamento progetti...</div>}

        {!loading && projects.length === 0 && (
          <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/10">
            <FolderOpen size={36} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-xs text-zinc-400 font-semibold">Nessun progetto ancora.</p>
            <p className="text-[11px] text-zinc-550 mt-1 font-medium">Crea un progetto manualmente o chiedilo al Consulting Agent.</p>
          </div>
        )}

        {/* Projects grouped */}
        {!loading && Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-8">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">{group}</h2>
            <div className="space-y-3">
              {items.map(p => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.bozza;
                const milestones = p.project_milestones || [];
                const done = milestones.filter(m => m.status === 'completato').length;
                return (
                  <Link key={p.id} href={`/project/${p.id}`}
                    className="bg-zinc-900/20 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 hover:shadow-[0_0_24px_rgba(255,255,255,0.01)] hover:-translate-y-0.5 transition-all duration-200 p-5 flex items-center gap-4 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${cfg.color}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                        {p.bando_id && <span className="text-[10px] text-zinc-500 font-mono">Bando: {p.bando_id.slice(0, 8)}…</span>}
                      </div>
                      <div className="font-bold text-sm text-white truncate">{p.nome}</div>
                      {p.descrizione && <div className="text-xs text-zinc-400 truncate mt-1 leading-normal font-normal">{p.descrizione}</div>}
                      <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500 font-semibold flex-wrap">
                        {p.importo_richiesto && <span>Richiesto: €{p.importo_richiesto.toLocaleString('it-IT')}</span>}
                        {p.data_fine && <span>Scadenza: {new Date(p.data_fine).toLocaleDateString('it-IT')}</span>}
                        {milestones.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                            {milestones.slice(0, 4).map(m => MILESTONE_STATUS[m.status] || '⬜')}
                            {milestones.length > 4 && `+${milestones.length - 4}`} milestone ({done}/{milestones.length})
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-indigo-400 shrink-0 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
