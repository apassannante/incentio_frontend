'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, Clock, AlertCircle, Plus, FileText, Euro, ChevronLeft, ChevronRight, Brain } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Milestone = { id: string; nome: string; descrizione: string | null; status: string; data_scadenza: string | null };
type RendicontazioneItem = {
  id: string; tipo: string; titolo: string; descrizione: string | null;
  importo: number | null; data: string | null; fornitore: string | null;
  numero_fattura: string | null; categoria: string | null; status: string;
};
type Document = { id: string; tipo: string; titolo: string; versione: number; created_at: string };
type Project = {
  id: string; nome: string; status: string; bando_id: string | null; descrizione: string | null;
  importo_richiesto: number | null; importo_approvato: number | null;
  data_presentazione: string | null; data_approvazione: string | null;
  data_inizio: string | null; data_fine: string | null; note: string | null;
  project_milestones: Milestone[]; rendicontazione: RendicontazioneItem[];
};

const MILESTONE_STATUSES = ['da_fare', 'in_corso', 'completato', 'in_ritardo'] as const;
const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  da_fare: <Clock size={12} className="text-zinc-500" />,
  in_corso: <Clock size={12} className="text-indigo-400" />,
  completato: <CheckCircle size={12} className="text-emerald-400" />,
  in_ritardo: <AlertCircle size={12} className="text-red-400" />,
};
const PROJECT_STATUSES = ['bozza', 'attivo', 'presentato', 'approvato', 'rifiutato', 'rendicontazione', 'chiuso'];
const REND_TIPI = ['spesa', 'SAL', 'documento', 'nota'];
const DOC_TIPI = ['business_plan', 'relazione_tecnica', 'rendiconto', 'lettera_intenti', 'piano_investimenti', 'SAL', 'altro'];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rendicontazione' | 'documenti'>('overview');
  const [loading, setLoading] = useState(true);
  const [genDocForm, setGenDocForm] = useState({ tipo: 'business_plan', titolo: '', istruzioni: '' });
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [newRend, setNewRend] = useState({ tipo: 'spesa', titolo: '', importo: '', data: '', fornitore: '', categoria: '', descrizione: '' });
  const [addingRend, setAddingRend] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) return;
      setToken(session.access_token);
      const pid = localStorage.getItem('incentio_profile_id');
      if (pid) setProfileId(pid);
      loadProject(session.access_token);
      loadDocuments(session.access_token, pid || '');
    });
  }, [id]);

  async function loadProject(tok: string) {
    setLoading(true);
    const r = await fetch(`${API}/api/consulting/project/${id}`, { headers: { Authorization: `Bearer ${tok}` } });
    if (r.ok) setProject(await r.json());
    setLoading(false);
  }

  async function loadDocuments(tok: string, pid: string) {
    if (!pid) return;
    const r = await fetch(`${API}/api/consulting/documents/${pid}?projectId=${id}`, { headers: { Authorization: `Bearer ${tok}` } });
    if (r.ok) setDocuments(await r.json());
  }

  async function updateMilestoneStatus(milestoneId: string, status: string) {
    await fetch(`${API}/api/consulting/milestone/${milestoneId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setProject(p => p ? { ...p, project_milestones: p.project_milestones.map(m => m.id === milestoneId ? { ...m, status } : m) } : p);
  }

  async function updateProjectStatus(status: string) {
    await fetch(`${API}/api/consulting/project/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setProject(p => p ? { ...p, status } : p);
  }

  async function generateDoc() {
    if (!profileId || !genDocForm.titolo) return;
    setGeneratingDoc(true);
    const r = await fetch(`${API}/api/consulting/documents/${profileId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...genDocForm, project_id: id }),
    });
    if (r.ok) {
      loadDocuments(token!, profileId);
      setGenDocForm({ tipo: 'business_plan', titolo: '', istruzioni: '' });
    }
    setGeneratingDoc(false);
  }

  async function addRendicontazione() {
    if (!newRend.titolo) return;
    setAddingRend(true);
    const r = await fetch(`${API}/api/consulting/rendicontazione/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newRend, importo: newRend.importo ? Number(newRend.importo) : undefined }),
    });
    if (r.ok) {
      loadProject(token!);
      setNewRend({ tipo: 'spesa', titolo: '', importo: '', data: '', fornitore: '', categoria: '', descrizione: '' });
    }
    setAddingRend(false);
  }

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#09090b] text-zinc-500 text-xs font-semibold">Caricamento progetto...</div>;
  if (!project) return <div className="flex items-center justify-center h-screen bg-[#09090b] text-zinc-500 text-xs font-semibold">Progetto non trovato.</div>;

  const totaleSpese = project.rendicontazione?.filter(r => r.tipo === 'spesa').reduce((s, r) => s + (r.importo || 0), 0) || 0;
  const milestonesDone = project.project_milestones?.filter(m => m.status === 'completato').length || 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8 pb-6 border-b border-zinc-900">
          <Link href="/projects" className="text-zinc-550 hover:text-white mt-1 transition-colors"><ChevronLeft size={20} /></Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-lg font-bold text-white truncate">{project.nome}</h1>
              <select value={project.status} onChange={e => updateProjectStatus(e.target.value)}
                className="text-[10px] font-bold uppercase tracking-wider border border-zinc-800 rounded-full px-3 py-1 bg-zinc-950 text-zinc-350 focus:outline-none focus:ring-1 focus:ring-zinc-700">
                {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {project.descrizione && <p className="text-xs text-zinc-400 font-normal leading-relaxed">{project.descrizione}</p>}
            <div className="flex gap-4 mt-3 text-[10px] text-zinc-500 font-semibold flex-wrap">
              {project.importo_richiesto && <span>Richiesto: €{project.importo_richiesto.toLocaleString('it-IT')}</span>}
              {project.importo_approvato && <span className="text-emerald-400 font-semibold">Approvato: €{project.importo_approvato.toLocaleString('it-IT')}</span>}
              {project.data_fine && <span>Scadenza: {new Date(project.data_fine).toLocaleDateString('it-IT')}</span>}
            </div>
          </div>
          <Link href="/consulting"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 px-3 py-1.5 rounded-lg transition-colors">
            <Brain size={14} strokeWidth={1.5} className="text-zinc-400" />
            <span>Consulting</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/20 rounded-xl border border-zinc-800 p-4 shadow-sm">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Milestone</div>
            <div className="text-xl font-bold text-white">{milestonesDone}/{project.project_milestones?.length || 0}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">completate</div>
          </div>
          <div className="bg-zinc-900/20 rounded-xl border border-zinc-800 p-4 shadow-sm">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Spese rendicontate</div>
            <div className="text-xl font-bold text-white">€{totaleSpese.toLocaleString('it-IT')}</div>
            {project.importo_approvato && <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">su €{project.importo_approvato.toLocaleString('it-IT')} approvati</div>}
          </div>
          <div className="bg-zinc-900/20 rounded-xl border border-zinc-800 p-4 shadow-sm">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Documenti</div>
            <div className="text-xl font-bold text-white">{documents.length}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">generati con AI</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-900 mb-8 text-xs font-bold">
          {(['overview', 'rendicontazione', 'documenti'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 capitalize transition-all border-b-2 ${activeTab === tab ? 'border-zinc-100 text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-350'}`}>
              {tab === 'overview' ? 'Milestone' : tab}
            </button>
          ))}
        </div>

        {/* Overview tab — Milestones */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Checklist Milestone</h2>
            {(!project.project_milestones || project.project_milestones.length === 0) && (
              <p className="text-xs text-zinc-500 py-6 text-center border border-dashed border-zinc-850 rounded-xl">Nessuna milestone. Chiedi al Consulting Agent di creare le milestone per questo progetto.</p>
            )}
            {project.project_milestones?.map(m => (
              <div key={m.id} className="bg-zinc-900/10 rounded-xl border border-zinc-800/80 p-4 flex items-start gap-3 justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">{MILESTONE_ICONS[m.status]}</div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white">{m.nome}</div>
                    {m.descrizione && <div className="text-[11px] text-zinc-400 mt-1 leading-normal font-normal">{m.descrizione}</div>}
                    {m.data_scadenza && <div className="text-[10px] text-zinc-550 mt-1.5 font-semibold">Scadenza: {new Date(m.data_scadenza).toLocaleDateString('it-IT')}</div>}
                  </div>
                </div>
                <select value={m.status} onChange={e => updateMilestoneStatus(m.id, e.target.value)}
                  className="text-[10px] font-bold border border-zinc-850 rounded-lg px-2 py-1 bg-zinc-950 text-zinc-300 focus:outline-none shrink-0 ml-4">
                  {MILESTONE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            ))}
            {project.note && (
              <div className="bg-amber-950/10 border border-amber-900/20 rounded-xl p-4 mt-6 text-xs">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">Note Interne</div>
                <div className="text-amber-300 whitespace-pre-wrap leading-normal font-normal">{project.note}</div>
              </div>
            )}
          </div>
        )}

        {/* Rendicontazione tab */}
        {activeTab === 'rendicontazione' && (
          <div className="space-y-6">
            {/* Add form */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-xs text-white mb-4 uppercase tracking-wider flex items-center gap-1.5"><Euro size={14} className="text-zinc-450" /> Registra Voce di Spesa</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Tipo</label>
                  <select value={newRend.tipo} onChange={e => setNewRend(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-150 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500">
                    {REND_TIPI.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Titolo *</label>
                  <input value={newRend.titolo} onChange={e => setNewRend(f => ({ ...f, titolo: e.target.value }))}
                    className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" placeholder="Es: Acquisto tornio CNC" />
                </div>
                {newRend.tipo === 'spesa' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Importo (€)</label>
                      <input type="number" value={newRend.importo} onChange={e => setNewRend(f => ({ ...f, importo: e.target.value }))}
                        className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Data fattura/pagamento</label>
                      <input type="date" value={newRend.data} onChange={e => setNewRend(f => ({ ...f, data: e.target.value }))}
                        className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Fornitore</label>
                      <input value={newRend.fornitore} onChange={e => setNewRend(f => ({ ...f, fornitore: e.target.value }))}
                        className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Categoria spesa</label>
                      <input value={newRend.categoria} onChange={e => setNewRend(f => ({ ...f, categoria: e.target.value }))}
                        className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" placeholder="macchinari, software, consulenze…" />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Descrizione</label>
                  <textarea value={newRend.descrizione} onChange={e => setNewRend(f => ({ ...f, descrizione: e.target.value }))}
                    rows={2} className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={addRendicontazione} disabled={addingRend || !newRend.titolo}
                  className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-200 disabled:opacity-40 flex items-center gap-1.5 transition-colors">
                  <Plus size={14} /> {addingRend ? 'Registrazione...' : 'Registra Voce'}
                </button>
              </div>
            </div>

            {/* Lista voci */}
            <div className="space-y-3">
              {(!project.rendicontazione || project.rendicontazione.length === 0) && (
                <p className="text-xs text-zinc-550 text-center py-8 border border-dashed border-zinc-850 rounded-xl">Nessuna voce di rendicontazione inserita.</p>
              )}
              {project.rendicontazione?.map(r => (
                <div key={r.id} className="bg-zinc-900/20 rounded-xl border border-zinc-800 p-4 flex items-start gap-3 justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold shrink-0 mt-0.5 border ${
                      r.tipo === 'spesa' ? 'bg-red-500/10 text-red-400 border-red-500/15' : r.tipo === 'SAL' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15' : 'bg-zinc-900 text-zinc-450 border-zinc-800'
                    }`}>{r.tipo}</div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white">{r.titolo}</div>
                      {r.descrizione && <div className="text-[11px] text-zinc-400 mt-1 leading-normal font-normal">{r.descrizione}</div>}
                      <div className="flex gap-3 mt-1.5 text-[10px] text-zinc-500 font-semibold flex-wrap">
                        {r.fornitore && <span>Fornitore: {r.fornitore}</span>}
                        {r.data && <span>Data: {new Date(r.data).toLocaleDateString('it-IT')}</span>}
                        {r.categoria && <span className="bg-zinc-900 border border-zinc-850 text-zinc-450 px-2 py-0.5 rounded text-[9px] font-mono">{r.categoria}</span>}
                      </div>
                    </div>
                  </div>
                  {r.importo != null && (
                    <div className="text-xs font-bold text-white shrink-0 ml-4">
                      €{r.importo.toLocaleString('it-IT')}
                    </div>
                  )}
                </div>
              ))}
              {totaleSpese > 0 && (
                <div className="bg-zinc-950/40 rounded-xl border border-zinc-800 p-4 flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400">Totale spese registrate</span>
                  <span className="font-bold text-white text-base">€{totaleSpese.toLocaleString('it-IT')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documenti tab */}
        {activeTab === 'documenti' && (
          <div className="space-y-6">
            {/* Generate form */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-xs text-white mb-4 uppercase tracking-wider flex items-center gap-1.5"><FileText size={14} className="text-zinc-450" /> Genera Documento Progetto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Tipo documento</label>
                  <select value={genDocForm.tipo} onChange={e => setGenDocForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-150 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500">
                    {DOC_TIPI.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Titolo *</label>
                  <input value={genDocForm.titolo} onChange={e => setGenDocForm(f => ({ ...f, titolo: e.target.value }))}
                    className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" placeholder="Es: Business Plan Bando 4.0" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Istruzioni specifiche</label>
                  <textarea value={genDocForm.istruzioni} onChange={e => setGenDocForm(f => ({ ...f, istruzioni: e.target.value }))}
                    rows={2} placeholder="Es: Focus sull'acquisto del tornio CNC da €80k, fornitore Mazak…"
                    className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={generateDoc} disabled={generatingDoc || !genDocForm.titolo}
                  className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-200 disabled:opacity-40 flex items-center gap-1.5 transition-colors">
                  <Plus size={14} /> {generatingDoc ? 'Generazione in corso...' : 'Genera con AI'}
                </button>
              </div>
            </div>

            {/* Doc list */}
            <div className="space-y-3">
              {documents.length === 0 && <p className="text-xs text-zinc-550 text-center py-8 border border-dashed border-zinc-850 rounded-xl">Nessun documento generato per questo progetto.</p>}
              {documents.map(d => (
                <Link key={d.id} href={`/document/${d.id}`}
                  className="bg-zinc-900/20 rounded-xl border border-zinc-800 hover:border-zinc-750 p-4 flex items-center gap-3 transition-all hover:bg-zinc-900/35 group">
                  <FileText size={16} strokeWidth={1.5} className="text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-white group-hover:text-white truncate">{d.titolo}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 font-semibold capitalize">{d.tipo.replace('_', ' ')} · v{d.versione} · {new Date(d.created_at).toLocaleDateString('it-IT')}</div>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
