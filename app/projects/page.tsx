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
  bozza:           { label: 'Bozza',           color: 'bg-gray-100 text-gray-600',   icon: <FileText size={14} /> },
  attivo:          { label: 'Attivo',           color: 'bg-blue-100 text-blue-700',   icon: <Clock size={14} /> },
  presentato:      { label: 'Presentato',       color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14} /> },
  approvato:       { label: 'Approvato',        color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
  rifiutato:       { label: 'Rifiutato',        color: 'bg-red-100 text-red-700',     icon: <AlertCircle size={14} /> },
  rendicontazione: { label: 'Rendicontazione',  color: 'bg-purple-100 text-purple-700', icon: <FileText size={14} /> },
  chiuso:          { label: 'Chiuso',           color: 'bg-gray-100 text-gray-500',   icon: <CheckCircle size={14} /> },
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen className="text-blue-600" /> Progetti
            </h1>
            <p className="text-sm text-gray-500 mt-1">Gestisci candidature, milestone e rendicontazione</p>
          </div>
          <div className="flex gap-3">
            <Link href="/consulting" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              ← Consulting Agent
            </Link>
            <button onClick={() => setShowNew(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus size={16} /> Nuovo progetto
            </button>
          </div>
        </div>

        {/* New project form */}
        {showNew && (
          <div className="bg-white rounded-xl border p-6 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Nuovo progetto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Nome progetto *</label>
                <input value={newForm.nome} onChange={e => setNewForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Es: Bando 4.0 Regione Lombardia 2025" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Descrizione</label>
                <textarea value={newForm.descrizione} onChange={e => setNewForm(f => ({ ...f, descrizione: e.target.value }))}
                  rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Importo richiesto (€)</label>
                <input type="number" value={newForm.importo_richiesto} onChange={e => setNewForm(f => ({ ...f, importo_richiesto: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Scadenza progetto</label>
                <input type="date" value={newForm.data_fine} onChange={e => setNewForm(f => ({ ...f, data_fine: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={createProject} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Crea</button>
              <button onClick={() => setShowNew(false)} className="text-gray-500 text-sm px-4 py-2 hover:bg-gray-100 rounded-lg">Annulla</button>
            </div>
          </div>
        )}

        {loading && <div className="text-center text-gray-400 py-16">Caricamento...</div>}

        {!loading && projects.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FolderOpen size={48} className="mx-auto mb-3 text-gray-200" />
            <p>Nessun progetto ancora.</p>
            <p className="text-sm mt-1">Crea un progetto manualmente o chiedilo al Consulting Agent.</p>
          </div>
        )}

        {/* Projects grouped */}
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{group}</h2>
            <div className="space-y-3">
              {items.map(p => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.bozza;
                const milestones = p.project_milestones || [];
                const done = milestones.filter(m => m.status === 'completato').length;
                return (
                  <Link key={p.id} href={`/project/${p.id}`}
                    className="bg-white rounded-xl border hover:border-blue-300 hover:shadow-sm transition-all p-5 flex items-center gap-4 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                        {p.bando_id && <span className="text-xs text-gray-400">Bando: {p.bando_id.slice(0, 8)}…</span>}
                      </div>
                      <div className="font-medium text-gray-900 truncate">{p.nome}</div>
                      {p.descrizione && <div className="text-sm text-gray-500 truncate mt-0.5">{p.descrizione}</div>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        {p.importo_richiesto && <span>€{p.importo_richiesto.toLocaleString('it-IT')}</span>}
                        {p.data_fine && <span>Scadenza: {new Date(p.data_fine).toLocaleDateString('it-IT')}</span>}
                        {milestones.length > 0 && (
                          <span className="flex items-center gap-1">
                            {milestones.slice(0, 4).map(m => MILESTONE_STATUS[m.status] || '⬜')}
                            {milestones.length > 4 && `+${milestones.length - 4}`} milestone ({done}/{milestones.length})
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 shrink-0 transition-colors" />
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
