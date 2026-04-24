'use client';

import { useState, useEffect, use } from 'react';
import { CheckCircle, Clock, AlertCircle, Plus, FileText, Euro, ChevronLeft, Brain } from 'lucide-react';
import Link from 'next/link';
import { getDemoProfileId } from '@/lib/demoProfile';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  da_fare: <Clock size={14} className="text-gray-400" />,
  in_corso: <Clock size={14} className="text-blue-500" />,
  completato: <CheckCircle size={14} className="text-green-500" />,
  in_ritardo: <AlertCircle size={14} className="text-red-500" />,
};
const PROJECT_STATUSES = ['bozza', 'attivo', 'presentato', 'approvato', 'rifiutato', 'rendicontazione', 'chiuso'];
const REND_TIPI = ['spesa', 'SAL', 'documento', 'nota'];
const DOC_TIPI = ['business_plan', 'relazione_tecnica', 'rendiconto', 'lettera_intenti', 'piano_investimenti', 'SAL', 'altro'];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rendicontazione' | 'documenti'>('overview');
  const [loading, setLoading] = useState(true);
  const [genDoc, setGenDoc] = useState({ tipo: 'business_plan', titolo: '', istruzioni: '' });
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [newRend, setNewRend] = useState({ tipo: 'spesa', titolo: '', importo: '', data: '', fornitore: '', categoria: '', descrizione: '' });
  const [addingRend, setAddingRend] = useState(false);

  useEffect(() => {
    const pid = getDemoProfileId();
    setProfileId(pid);
    loadProject();
    loadDocuments(pid);
  }, [id]);

  async function loadProject() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/consulting/project/${id}`);
      if (r.ok) setProject(await r.json());
    } catch { /* silent */ }
    setLoading(false);
  }

  async function loadDocuments(pid: string) {
    if (!pid) return;
    try {
      const r = await fetch(`${API}/api/consulting/documents/${pid}?projectId=${id}`);
      if (r.ok) setDocuments(await r.json());
    } catch { /* silent */ }
  }

  async function updateMilestoneStatus(milestoneId: string, status: string) {
    await fetch(`${API}/api/consulting/milestone/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setProject(p => p ? { ...p, project_milestones: p.project_milestones.map(m => m.id === milestoneId ? { ...m, status } : m) } : p);
  }

  async function updateProjectStatus(status: string) {
    await fetch(`${API}/api/consulting/project/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setProject(p => p ? { ...p, status } : p);
  }

  async function generateDoc() {
    if (!profileId || !genDoc.titolo) return;
    setGeneratingDoc(true);
    const r = await fetch(`${API}/api/consulting/documents/${profileId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...genDoc, project_id: id }),
    });
    if (r.ok && profileId) {
      loadDocuments(profileId);
      setGenDoc({ tipo: 'business_plan', titolo: '', istruzioni: '' });
    }
    setGeneratingDoc(false);
  }

  async function addRendicontazione() {
    if (!newRend.titolo) return;
    setAddingRend(true);
    const r = await fetch(`${API}/api/consulting/rendicontazione/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newRend, importo: newRend.importo ? Number(newRend.importo) : undefined }),
    });
    if (r.ok) {
      loadProject();
      setNewRend({ tipo: 'spesa', titolo: '', importo: '', data: '', fornitore: '', categoria: '', descrizione: '' });
    }
    setAddingRend(false);
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Caricamento...</div>;
  if (!project) return <div className="flex items-center justify-center h-screen text-gray-400">Progetto non trovato.</div>;

  const totaleSpese = project.rendicontazione?.filter(r => r.tipo === 'spesa').reduce((s, r) => s + (r.importo || 0), 0) || 0;
  const milestonesDone = project.project_milestones?.filter(m => m.status === 'completato').length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <Link href="/projects" className="text-gray-400 hover:text-gray-600 mt-1"><ChevronLeft size={20} /></Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{project.nome}</h1>
              <select value={project.status} onChange={e => updateProjectStatus(e.target.value)}
                className="text-xs border rounded-full px-2 py-0.5 bg-white focus:outline-none">
                {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {project.descrizione && <p className="text-sm text-gray-500">{project.descrizione}</p>}
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              {project.importo_richiesto && <span>Richiesto: €{project.importo_richiesto.toLocaleString('it-IT')}</span>}
              {project.importo_approvato && <span className="text-green-600 font-medium">Approvato: €{project.importo_approvato.toLocaleString('it-IT')}</span>}
              {project.data_fine && <span>Scadenza: {new Date(project.data_fine).toLocaleDateString('it-IT')}</span>}
            </div>
          </div>
          <Link href="/consulting"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
            <Brain size={15} /> Apri in Consulting
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4">
            <div className="text-xs text-gray-500 mb-1">Milestone</div>
            <div className="text-2xl font-bold text-gray-900">{milestonesDone}/{project.project_milestones?.length || 0}</div>
            <div className="text-xs text-gray-400 mt-0.5">completate</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-xs text-gray-500 mb-1">Spese rendicontate</div>
            <div className="text-2xl font-bold text-gray-900">€{totaleSpese.toLocaleString('it-IT')}</div>
            {project.importo_approvato && <div className="text-xs text-gray-400 mt-0.5">su €{project.importo_approvato.toLocaleString('it-IT')} approvati</div>}
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-xs text-gray-500 mb-1">Documenti</div>
            <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
            <div className="text-xs text-gray-400 mt-0.5">generati</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          {(['overview', 'rendicontazione', 'documenti'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview tab — Milestones */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">Milestone</h2>
            {(!project.project_milestones || project.project_milestones.length === 0) && (
              <p className="text-sm text-gray-400">Nessuna milestone. Chiedi al Consulting Agent di creare le milestone per questo progetto.</p>
            )}
            {project.project_milestones?.map(m => (
              <div key={m.id} className="bg-white rounded-xl border p-4 flex items-start gap-3">
                <div className="mt-0.5">{MILESTONE_ICONS[m.status]}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{m.nome}</div>
                  {m.descrizione && <div className="text-xs text-gray-500 mt-0.5">{m.descrizione}</div>}
                  {m.data_scadenza && <div className="text-xs text-gray-400 mt-1">Scadenza: {new Date(m.data_scadenza).toLocaleDateString('it-IT')}</div>}
                </div>
                <select value={m.status} onChange={e => updateMilestoneStatus(m.id, e.target.value)}
                  className="text-xs border rounded-lg px-2 py-1 bg-white focus:outline-none shrink-0">
                  {MILESTONE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            ))}
            {project.note && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                <div className="text-xs font-semibold text-amber-700 mb-1">Note</div>
                <div className="text-sm text-amber-800 whitespace-pre-wrap">{project.note}</div>
              </div>
            )}
          </div>
        )}

        {/* Rendicontazione tab */}
        {activeTab === 'rendicontazione' && (
          <div className="space-y-4">
            {/* Add form */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Euro size={16} /> Aggiungi voce</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                  <select value={newRend.tipo} onChange={e => setNewRend(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {REND_TIPI.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Titolo *</label>
                  <input value={newRend.titolo} onChange={e => setNewRend(f => ({ ...f, titolo: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Es: Acquisto tornio CNC" />
                </div>
                {newRend.tipo === 'spesa' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Importo (€)</label>
                      <input type="number" value={newRend.importo} onChange={e => setNewRend(f => ({ ...f, importo: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Data</label>
                      <input type="date" value={newRend.data} onChange={e => setNewRend(f => ({ ...f, data: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fornitore</label>
                      <input value={newRend.fornitore} onChange={e => setNewRend(f => ({ ...f, fornitore: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                      <input value={newRend.categoria} onChange={e => setNewRend(f => ({ ...f, categoria: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="macchinari, software, consulenze…" />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Descrizione</label>
                  <textarea value={newRend.descrizione} onChange={e => setNewRend(f => ({ ...f, descrizione: e.target.value }))}
                    rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button onClick={addRendicontazione} disabled={addingRend || !newRend.titolo}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2">
                <Plus size={15} /> {addingRend ? 'Salvataggio...' : 'Aggiungi'}
              </button>
            </div>

            {/* Lista voci */}
            <div className="space-y-2">
              {(!project.rendicontazione || project.rendicontazione.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">Nessuna voce di rendicontazione ancora.</p>
              )}
              {project.rendicontazione?.map(r => (
                <div key={r.id} className="bg-white rounded-xl border p-4 flex items-start gap-3">
                  <div className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${
                    r.tipo === 'spesa' ? 'bg-red-100 text-red-600' : r.tipo === 'SAL' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>{r.tipo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{r.titolo}</div>
                    {r.descrizione && <div className="text-xs text-gray-500 mt-0.5">{r.descrizione}</div>}
                    <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      {r.fornitore && <span>{r.fornitore}</span>}
                      {r.data && <span>{new Date(r.data).toLocaleDateString('it-IT')}</span>}
                      {r.categoria && <span className="bg-gray-100 px-1.5 rounded">{r.categoria}</span>}
                    </div>
                  </div>
                  {r.importo != null && (
                    <div className="text-sm font-semibold text-gray-900 shrink-0">
                      €{r.importo.toLocaleString('it-IT')}
                    </div>
                  )}
                </div>
              ))}
              {totaleSpese > 0 && (
                <div className="bg-gray-50 rounded-xl border p-4 flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Totale spese</span>
                  <span className="font-bold text-gray-900 text-lg">€{totaleSpese.toLocaleString('it-IT')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documenti tab */}
        {activeTab === 'documenti' && (
          <div className="space-y-4">
            {/* Generate form */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><FileText size={16} /> Genera documento</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tipo documento</label>
                  <select value={genDoc.tipo} onChange={e => setGenDoc(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {DOC_TIPI.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Titolo *</label>
                  <input value={genDoc.titolo} onChange={e => setGenDoc(f => ({ ...f, titolo: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Es: Business Plan Bando 4.0" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Istruzioni specifiche</label>
                  <textarea value={genDoc.istruzioni} onChange={e => setGenDoc(f => ({ ...f, istruzioni: e.target.value }))}
                    rows={2} placeholder="Es: Focus sull'acquisto del tornio CNC da €80k, fornitore Mazak…"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button onClick={generateDoc} disabled={generatingDoc || !genDoc.titolo}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2">
                <Plus size={15} /> {generatingDoc ? 'Generazione in corso...' : 'Genera con AI'}
              </button>
            </div>

            {/* Doc list */}
            <div className="space-y-2">
              {documents.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nessun documento ancora.</p>}
              {documents.map(d => (
                <Link key={d.id} href={`/document/${d.id}`}
                  className="bg-white rounded-xl border hover:border-blue-300 p-4 flex items-center gap-3 transition-all group">
                  <FileText size={18} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{d.titolo}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{d.tipo.replace('_', ' ')} · v{d.versione} · {new Date(d.created_at).toLocaleDateString('it-IT')}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
